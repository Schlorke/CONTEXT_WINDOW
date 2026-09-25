// Plan: classify every destination entry BEFORE any write. Conflicts stop the whole sink.
import fs from "node:fs";
import path from "node:path";
import {
  hashTree,
  isInside,
  lstatOrNull,
  packageHash,
  realpathOrSelf,
  resolveThroughLinks,
} from "./fsx.mjs";
import { readLegacyManifest, readManifest } from "./manifest.mjs";

function sameHashes(a, b) {
  const ka = Object.keys(a).sort();
  const kb = Object.keys(b).sort();
  return (
    ka.length === kb.length && ka.every((k, i) => k === kb[i] && a[k] === b[k])
  );
}

function diffHashes(expected, actual) {
  const changed = [];
  for (const [rel, hash] of Object.entries(expected))
    if (actual[rel] !== hash) changed.push(actual[rel] ? `~${rel}` : `-${rel}`);
  for (const rel of Object.keys(actual))
    if (!(rel in expected)) changed.push(`+${rel}`);
  return changed;
}

function inspectEntry(sinkDir, id, names) {
  const full = path.join(sinkDir, id);
  const st = lstatOrNull(full);
  if (!st) return { state: "absent" };
  if (!names.includes(id))
    return {
      state: "case-mismatch",
      actual: names.find((n) => n.toLowerCase() === id),
    };
  if (st.isSymbolicLink()) return { state: "link" };
  if (!st.isDirectory()) return { state: "not-directory" };
  const { hashes, links, others } = hashTree(full);
  if (links.length || others.length)
    return { state: "unsupported-content", detail: [...links, ...others] };
  return { state: "directory", hashes, packageHash: packageHash(hashes) };
}

/**
 * @param {object} p
 * @param {string} p.sinkDir
 * @param {"project"|"user"} p.scope
 * @param {string} [p.containRoot] project root that the sink must resolve inside
 * @param {Map<string, {hashes: Record<string,string>, packageHash: string}>} p.desired
 * @param {{adopt?: Set<string>|"all", forceLocal?: boolean, migrateLegacy?: boolean}} p.options
 */
export function planSink({ sinkDir, scope, containRoot, desired, options }) {
  const plan = {
    sinkDir,
    scope,
    ops: [],
    conflicts: [],
    unchanged: [],
    legacy: null,
    manifest: null,
  };
  if (containRoot) {
    const resolved = resolveThroughLinks(sinkDir);
    const root = realpathOrSelf(containRoot);
    if (!isInside(root, resolved)) {
      plan.conflicts.push({
        id: "*",
        type: "unsafe-root",
        detail: `${sinkDir} resolves to ${resolved}, outside ${root}`,
      });
      return plan;
    }
  }
  const sinkStat = lstatOrNull(sinkDir);
  if (sinkStat && !sinkStat.isDirectory() && !sinkStat.isSymbolicLink()) {
    plan.conflicts.push({ id: "*", type: "not-directory", detail: sinkDir });
    return plan;
  }
  let manifest = null;
  try {
    manifest = sinkStat ? readManifest(sinkDir) : null;
  } catch (error) {
    plan.conflicts.push({
      id: "*",
      type: "invalid-manifest",
      detail: error.message,
    });
    return plan;
  }
  plan.manifest = manifest;
  const legacy = sinkStat ? readLegacyManifest(sinkDir) : null;
  plan.legacy = legacy;
  const names = sinkStat ? fs.readdirSync(sinkDir) : [];
  const managed = new Map((manifest?.entries ?? []).map((e) => [e.id, e]));
  const legacyNames = new Set(legacy?.safeArtifacts ?? []);
  const adopt = options.adopt ?? new Set();
  const adopts = (id) => adopt === "all" || adopt.has?.(id);

  for (const [id, pkg] of desired) {
    const disk = inspectEntry(sinkDir, id, names);
    const entry = managed.get(id);
    if (disk.state === "absent") {
      plan.ops.push({ op: "create", id });
      continue;
    }
    if (disk.state !== "directory") {
      plan.conflicts.push({
        id,
        type: disk.state,
        detail: disk.actual ?? disk.detail ?? path.join(sinkDir, id),
      });
      continue;
    }
    if (entry) {
      const intact = sameHashes(entry.files, disk.hashes);
      if (intact) {
        if (entry.packageHash === pkg.packageHash) plan.unchanged.push(id);
        else plan.ops.push({ op: "update", id });
      } else if (options.forceLocal) {
        plan.ops.push({
          op: "replace",
          id,
          backup: true,
          reason: "force-local",
          changes: diffHashes(entry.files, disk.hashes),
        });
      } else {
        plan.conflicts.push({
          id,
          type: "locally-modified",
          detail: diffHashes(entry.files, disk.hashes).join(" "),
        });
      }
      continue;
    }
    if (disk.packageHash === pkg.packageHash) {
      plan.ops.push({ op: "adopt-identical", id });
    } else if (legacyNames.has(id)) {
      if (options.migrateLegacy)
        plan.ops.push({ op: "replace", id, backup: true, reason: "legacy" });
      else
        plan.conflicts.push({
          id,
          type: "legacy-managed",
          detail: `listed in ${legacy.file} (v${legacy.version}); content unverifiable`,
        });
    } else if (adopts(id)) {
      plan.ops.push({ op: "replace", id, backup: true, reason: "adopt" });
    } else {
      plan.conflicts.push({
        id,
        type: "unmanaged-collision",
        detail: path.join(sinkDir, id),
      });
    }
  }

  for (const [id, entry] of managed) {
    if (desired.has(id)) continue;
    const disk = inspectEntry(sinkDir, id, names);
    if (disk.state === "absent") {
      plan.ops.push({ op: "drop", id });
    } else if (disk.state !== "directory") {
      plan.conflicts.push({
        id,
        type: disk.state,
        detail: path.join(sinkDir, id),
      });
    } else if (sameHashes(entry.files, disk.hashes)) {
      plan.ops.push({ op: "remove", id, backup: false });
    } else if (options.forceLocal) {
      plan.ops.push({ op: "remove", id, backup: true, reason: "force-local" });
    } else {
      plan.conflicts.push({
        id,
        type: "orphan-locally-modified",
        detail: diffHashes(entry.files, disk.hashes).join(" "),
      });
    }
  }

  if (legacy) {
    for (const name of legacy.safeArtifacts) {
      if (desired.has(name) || managed.has(name)) continue;
      if (!lstatOrNull(path.join(sinkDir, name))) continue;
      if (options.migrateLegacy)
        plan.ops.push({ op: "legacy-remove", id: name, backup: true });
      else
        plan.conflicts.push({
          id: name,
          type: "legacy-managed",
          detail: `listed in ${legacy.file}; remove with --migrate-legacy`,
        });
    }
    if (options.migrateLegacy)
      plan.ops.push({
        op: "legacy-manifest-remove",
        id: path.basename(legacy.file),
        backup: true,
      });
    else if (!plan.conflicts.some((c) => c.type === "legacy-managed")) {
      plan.conflicts.push({
        id: path.basename(legacy.file),
        type: "legacy-manifest",
        detail: `${legacy.file} (v${legacy.version}); rerun with --migrate-legacy`,
      });
    }
  }
  return plan;
}

/** Legacy-only locations (e.g. ~/.cursor/rules, .cursor/rules) that 2.x no longer writes. */
export function planLegacyCleanup(dir, options) {
  const legacy = readLegacyManifest(dir);
  const plan = {
    sinkDir: dir,
    scope: "legacy",
    ops: [],
    conflicts: [],
    unchanged: [],
    legacy,
    manifest: null,
  };
  if (!legacy) return plan;
  for (const name of legacy.safeArtifacts) {
    if (!lstatOrNull(path.join(dir, name))) continue;
    if (options.migrateLegacy)
      plan.ops.push({ op: "legacy-remove", id: name, backup: true });
    else
      plan.conflicts.push({
        id: name,
        type: "legacy-managed",
        detail: `listed in ${legacy.file}; remove with --migrate-legacy`,
      });
  }
  if (options.migrateLegacy)
    plan.ops.push({
      op: "legacy-manifest-remove",
      id: path.basename(legacy.file),
      backup: true,
    });
  else if (!plan.conflicts.length)
    plan.conflicts.push({
      id: path.basename(legacy.file),
      type: "legacy-manifest",
      detail: legacy.file,
    });
  return plan;
}
