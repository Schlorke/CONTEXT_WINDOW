// Filesystem primitives used by the distribution engine.
//
// fs.cpSync / fs.rmSync are deliberately NOT used: on Node 25.2.1 for Windows they
// silently mis-handle non-ASCII paths (nodejs/node#61878). Everything here is built on
// mkdirSync/copyFileSync/renameSync/unlinkSync/rmdirSync/readdirSync, which are
// Unicode-safe, and never follows symbolic links or junctions when deleting.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Canonical bytes for content-addressed skill hashing.
 * UTF-8 text: CRLF/CR → LF so catalog locks match across checkouts with
 * core.autocrlf (Windows) vs LF-native (Linux). Buffers with NUL or invalid
 * UTF-8 are left unchanged (treated as binary).
 */
export function canonicalBytes(data) {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  if (buf.includes(0)) return buf;
  const text = buf.toString("utf8");
  if (!Buffer.from(text, "utf8").equals(buf)) return buf;
  if (!text.includes("\r")) return buf;
  return Buffer.from(text.replace(/\r\n/g, "\n").replace(/\r/g, "\n"), "utf8");
}

export function sha256Canonical(data) {
  return sha256(canonicalBytes(data));
}

export function sha256File(file) {
  return sha256Canonical(fs.readFileSync(file));
}

export function toPosix(p) {
  return p.split(path.sep).join("/");
}

export function exists(p) {
  try {
    fs.lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

export function lstatOrNull(p) {
  try {
    return fs.lstatSync(p);
  } catch {
    return null;
  }
}

export function ensureDir(dir) {
  if (!exists(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** Recursively lists entries under `root` without following links. */
export function scanTree(root) {
  const files = [];
  const links = [];
  const others = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = toPosix(path.relative(root, full));
      const st = fs.lstatSync(full);
      if (st.isSymbolicLink()) links.push(rel);
      else if (st.isDirectory()) walk(full);
      else if (st.isFile()) files.push(rel);
      else others.push(rel);
    }
  };
  walk(root);
  files.sort();
  return { files, links, others };
}

/** Map relPath -> sha256 for every regular file under root. */
export function hashTree(root) {
  const { files, links, others } = scanTree(root);
  const hashes = {};
  for (const rel of files) hashes[rel] = sha256File(path.join(root, rel));
  return { hashes, links, others };
}

/** Stable hash of a {relPath: sha256} map. */
export function packageHash(fileHashes) {
  const lines = Object.keys(fileHashes)
    .sort()
    .map((rel) => `${rel}\0${fileHashes[rel]}\n`);
  return sha256(lines.join(""));
}

/** Deletes a tree without following links; links themselves are removed. */
export function removeTree(target) {
  const st = lstatOrNull(target);
  if (!st) return;
  if (st.isSymbolicLink()) {
    removeLink(target);
    return;
  }
  if (st.isDirectory()) {
    for (const name of fs.readdirSync(target))
      removeTree(path.join(target, name));
    retry(() => fs.rmdirSync(target));
    return;
  }
  retry(() => fs.unlinkSync(target));
}

function removeLink(target) {
  try {
    fs.unlinkSync(target);
  } catch (error) {
    if (error.code === "EPERM" || error.code === "EISDIR") fs.rmdirSync(target);
    else throw error;
  }
}

export function writeFileAtomic(file, data) {
  ensureDir(path.dirname(file));
  const tmp = `${file}.cw-tmp-${process.pid}-${crypto.randomBytes(4).toString("hex")}`;
  fs.writeFileSync(tmp, data);
  renameWithRetry(tmp, file);
}

/** Windows may briefly lock files (indexers, antivirus); retry transient errors. */
export function renameWithRetry(from, to) {
  retry(() => fs.renameSync(from, to));
}

function retry(fn, attempts = 6) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return fn();
    } catch (error) {
      lastError = error;
      if (!["EPERM", "EBUSY", "EACCES", "ENOTEMPTY"].includes(error.code))
        throw error;
      const until = Date.now() + 40 * (i + 1);
      while (Date.now() < until) {
        /* short synchronous backoff */
      }
    }
  }
  throw lastError;
}

/** Writes a {relPath: Buffer|string} map into dir (dir must not exist yet). */
export function writeTree(dir, files) {
  fs.mkdirSync(dir, { recursive: true });
  for (const [rel, content] of Object.entries(files)) {
    const dest = path.join(dir, ...rel.split("/"));
    ensureDir(path.dirname(dest));
    fs.writeFileSync(dest, content);
  }
}

export function isInside(parent, child) {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

export function realpathOrSelf(p) {
  try {
    return fs.realpathSync.native(p);
  } catch {
    return path.resolve(p);
  }
}

/**
 * Resolves the deepest existing ancestor through realpath and re-appends the missing tail.
 * Used to check that a destination that may not exist yet stays inside an allowed root.
 */
export function resolveThroughLinks(p) {
  const abs = path.resolve(p);
  const missing = [];
  let current = abs;
  while (!exists(current)) {
    const parent = path.dirname(current);
    if (parent === current) break;
    missing.unshift(path.basename(current));
    current = parent;
  }
  return path.join(realpathOrSelf(current), ...missing);
}

export function readJsonOrNull(file) {
  if (!exists(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}
