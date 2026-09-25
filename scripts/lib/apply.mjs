// Apply a plan to one sink: exclusive lock, journal, staging, per-entry atomic rename,
// rollback on error, manifest written last. Control files live OUTSIDE the skills root
// (clients scan skills roots recursively, so backups inside them would become skills).
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  ensureDir,
  exists,
  pidAlive,
  readJsonOrNull,
  removeTree,
  renameWithRetry,
  writeFileAtomic,
  writeTree,
} from "./fsx.mjs";
import { MANIFEST_FILE, MANIFEST_SCHEMA, writeManifest } from "./manifest.mjs";

export class BusyError extends Error {}
export class InterruptedError extends Error {}

export function controlDir(sinkDir) {
  return path.join(path.dirname(sinkDir), ".cw", path.basename(sinkDir));
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

/** Test-only fault injection: CW_TEST_FAULT=throw-after:N | exit-after:N | exit-mid:N */
function faultPlan() {
  const m = (process.env.CW_TEST_FAULT ?? "").match(
    /^(throw-after|exit-after|exit-mid):(\d+)$/,
  );
  return m ? { kind: m[1], n: Number(m[2]) } : null;
}

/** Test-only fault injection between client adapters: CW_TEST_FAULT=throw-before:<file name>|throw-before:hook */
export function adapterFault(point) {
  if ((process.env.CW_TEST_FAULT ?? "") === `throw-before:${point}`)
    throw new Error(`CW_TEST_FAULT: injected failure before ${point}`);
}

export function acquireLock(sinkDir, command) {
  const ctl = controlDir(sinkDir);
  ensureDir(ctl);
  const lockFile = path.join(ctl, "lock");
  const journal = path.join(ctl, "journal.json");
  // The lock is published with a hard link from a fully written temp file, so another process
  // can never observe an empty lock file and mistake a live holder for a stale one.
  const tmp = path.join(
    ctl,
    `lock.${process.pid}.${crypto.randomBytes(3).toString("hex")}.tmp`,
  );
  fs.writeFileSync(
    tmp,
    JSON.stringify({
      pid: process.pid,
      host: os.hostname(),
      startedAt: new Date().toISOString(),
      command,
    }),
  );
  const publish = () => {
    try {
      fs.linkSync(tmp, lockFile);
    } catch (error) {
      if (error.code !== "EPERM" && error.code !== "ENOTSUP") throw error;
      const fd = fs.openSync(lockFile, "wx");
      fs.writeSync(fd, fs.readFileSync(tmp));
      fs.closeSync(fd);
    }
  };
  try {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        publish();
        return () => {
          try {
            fs.unlinkSync(lockFile);
          } catch {
            /* already released */
          }
        };
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
        const seen = readLock(lockFile);
        // Released between our attempt and the read: the file may already belong to a new holder.
        if (seen.vanished) continue;
        const { holder } = seen;
        if (holder && holder.host === os.hostname() && pidAlive(holder.pid)) {
          throw new BusyError(
            `${sinkDir} is locked by pid ${holder.pid} (${holder.command}) since ${holder.startedAt}`,
          );
        }
        if (exists(journal)) {
          throw new InterruptedError(
            `${sinkDir} has an interrupted operation (${journal}); run "cw recover" first`,
          );
        }
        breakStaleLock(ctl, lockFile, seen.raw);
      }
    }
    throw new BusyError(`could not acquire lock for ${sinkDir}`);
  } finally {
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* already removed */
    }
  }
}

function pause(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Reads a lock file; a partially visible file is re-read before it is judged unreadable. */
function readLock(lockFile) {
  let raw = null;
  for (let i = 0; i < 3; i += 1) {
    try {
      raw = fs.readFileSync(lockFile, "utf8");
      return { holder: JSON.parse(raw), raw };
    } catch (error) {
      if (error.code === "ENOENT") return { vanished: true };
      pause(20);
    }
  }
  return { holder: null, raw };
}

/**
 * Removes a stale lock only while holding the breaker file and only if the lock still has the
 * content judged stale, so a lock published meanwhile by a live process is never deleted.
 */
function breakStaleLock(ctl, lockFile, staleRaw) {
  const breaker = path.join(ctl, "lock.break");
  let fd;
  try {
    fd = fs.openSync(breaker, "wx");
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    try {
      if (Date.now() - fs.statSync(breaker).mtimeMs > 10000)
        fs.unlinkSync(breaker);
    } catch {
      /* the other breaker finished */
    }
    pause(20);
    return;
  }
  try {
    let current;
    try {
      current = fs.readFileSync(lockFile, "utf8");
    } catch {
      return;
    }
    if (current === staleRaw) fs.unlinkSync(lockFile);
  } finally {
    fs.closeSync(fd);
    try {
      fs.unlinkSync(breaker);
    } catch {
      /* already removed */
    }
  }
}

export function journalState(sinkDir) {
  return readJsonOrNull(path.join(controlDir(sinkDir), "journal.json"));
}

function rollback(journal, log) {
  for (const step of [...journal.ops].reverse()) {
    if (step.state !== "done" && step.state !== "partial") continue;
    try {
      const discardNew =
        step.newPath &&
        exists(step.newPath) &&
        (step.op === "create" || step.state === "done");
      if (discardNew) {
        const discard = `${step.newPath}.cw-rollback-${crypto.randomBytes(3).toString("hex")}`;
        renameWithRetry(step.newPath, discard);
        removeTree(discard);
      }
      if (step.oldMovedTo && exists(step.oldMovedTo) && !exists(step.oldPath))
        renameWithRetry(step.oldMovedTo, step.oldPath);
      log.push(`rolled back ${step.op} ${step.id}`);
    } catch (error) {
      log.push(`ROLLBACK FAILED for ${step.op} ${step.id}: ${error.message}`);
    }
  }
}

/**
 * @param {object} plan result of planSink/planLegacyCleanup (must have no conflicts)
 * @param {Map<string, {files: Record<string, Buffer>, hashes: Record<string,string>, packageHash: string}>} desired
 * @param {object|null} meta manifest header fields; null for legacy-only locations
 */
export function lockHolderAlive(sinkDir) {
  const holder = readJsonOrNull(path.join(controlDir(sinkDir), "lock"));
  return Boolean(
    holder &&
    holder.host === os.hostname() &&
    pidAlive(holder.pid) &&
    holder.pid !== process.pid,
  );
}

export function applyPlan(plan, desired, meta, { command, lockHeld = false }) {
  const { sinkDir, ops } = plan;
  const release = lockHeld ? () => {} : acquireLock(sinkDir, command);
  const ctl = controlDir(sinkDir);
  const staging = path.join(ctl, "staging");
  const trash = path.join(ctl, "trash");
  const backupRoot = path.join(ctl, "backups", stamp());
  const journalFile = path.join(ctl, "journal.json");
  const log = [];
  const backups = [];
  const fault = faultPlan();
  let completed = 0;
  const journal = {
    schema: "context-window/journal@1",
    sinkDir,
    startedAt: new Date().toISOString(),
    ops: ops.map((o) => ({ op: o.op, id: o.id, state: "pending" })),
  };
  const saveJournal = () =>
    writeFileAtomic(journalFile, JSON.stringify(journal, null, 2));
  try {
    ensureDir(sinkDir);
    saveJournal();
    ops.forEach((op, index) => {
      const step = journal.ops[index];
      const target = path.join(sinkDir, op.id);
      const oldDest = () => {
        const base = op.backup ? backupRoot : trash;
        ensureDir(base);
        return path.join(
          base,
          `${op.id}-${crypto.randomBytes(3).toString("hex")}`,
        );
      };
      const stage = () => {
        const dir = path.join(
          staging,
          `${op.id}-${crypto.randomBytes(3).toString("hex")}`,
        );
        writeTree(dir, desired.get(op.id).files);
        return dir;
      };
      const mid = () => {
        if (fault?.kind === "exit-mid" && completed + 1 === fault.n)
          process.exit(99);
      };
      switch (op.op) {
        case "create": {
          const staged = stage();
          Object.assign(step, { newPath: target, state: "partial" });
          saveJournal();
          mid();
          renameWithRetry(staged, target);
          break;
        }
        case "update":
        case "replace": {
          const staged = stage();
          const moved = oldDest();
          Object.assign(step, {
            oldPath: target,
            oldMovedTo: moved,
            state: "partial",
          });
          saveJournal();
          renameWithRetry(target, moved);
          mid();
          renameWithRetry(staged, target);
          step.newPath = target;
          if (op.backup) backups.push(moved);
          break;
        }
        case "remove":
        case "legacy-remove":
        case "legacy-manifest-remove": {
          const moved = oldDest();
          Object.assign(step, {
            oldPath: target,
            oldMovedTo: moved,
            state: "partial",
          });
          saveJournal();
          mid();
          renameWithRetry(target, moved);
          if (op.backup) backups.push(moved);
          break;
        }
        case "adopt-identical":
        case "drop":
          break;
        default:
          throw new Error(`unknown op ${op.op}`);
      }
      step.state = "done";
      saveJournal();
      if (op.op === "adopt-identical" || op.op === "drop") return;
      completed += 1;
      if (fault && completed === fault.n) {
        if (fault.kind === "throw-after")
          throw new Error(
            `CW_TEST_FAULT: injected failure after ${completed} operations`,
          );
        if (fault.kind === "exit-after") process.exit(99);
      }
    });
    if (meta) {
      const previous = new Map(
        (plan.manifest?.entries ?? []).map((e) => [e.id, e]),
      );
      const entries = [];
      for (const [id, pkg] of desired) {
        if (plan.conflicts.some((c) => c.id === id)) {
          if (previous.has(id)) entries.push(previous.get(id));
          continue;
        }
        entries.push({ id, packageHash: pkg.packageHash, files: pkg.hashes });
      }
      const manifestPath = path.join(sinkDir, MANIFEST_FILE);
      if (entries.length) {
        writeManifest(sinkDir, {
          schema: MANIFEST_SCHEMA,
          ...meta,
          installedAt: new Date().toISOString(),
          entries: entries.sort((a, b) => a.id.localeCompare(b.id)),
        });
      } else if (exists(manifestPath)) {
        fs.unlinkSync(manifestPath);
      }
    }
    fs.unlinkSync(journalFile);
  } catch (error) {
    rollback(journal, log);
    try {
      fs.unlinkSync(journalFile);
    } catch {
      /* journal may not exist yet */
    }
    for (const dir of [trash, staging]) {
      try {
        if (fs.lstatSync(dir).isDirectory()) removeTree(dir);
      } catch {
        /* absent or not ours */
      }
    }
    release();
    error.rollbackLog = log;
    throw error;
  }
  for (const dir of [trash, staging]) {
    try {
      if (exists(dir) && fs.lstatSync(dir).isDirectory()) removeTree(dir);
    } catch (error) {
      log.push(`could not clean ${dir}: ${error.message}`);
    }
  }
  release();
  return { log, backups };
}

/** Restores the pre-operation state recorded in an interrupted journal. */
export function recoverSink(sinkDir) {
  const ctl = controlDir(sinkDir);
  const journalFile = path.join(ctl, "journal.json");
  const lockFile = path.join(ctl, "lock");
  const log = [];
  const holder = readJsonOrNull(lockFile);
  if (holder && holder.host === os.hostname() && pidAlive(holder.pid)) {
    throw new BusyError(
      `${sinkDir} is locked by a live process (pid ${holder.pid})`,
    );
  }
  const journal = readJsonOrNull(journalFile);
  if (journal) {
    rollback(journal, log);
    fs.unlinkSync(journalFile);
  }
  if (exists(lockFile)) {
    fs.unlinkSync(lockFile);
    log.push("removed stale lock");
  }
  for (const dir of [path.join(ctl, "trash"), path.join(ctl, "staging")]) {
    try {
      removeTree(dir);
    } catch {
      /* best effort */
    }
  }
  return { recovered: Boolean(journal), log };
}
