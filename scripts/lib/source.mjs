// Source identity (library version + commit) without spawning git.
import fs from "node:fs";
import path from "node:path";
import { readJsonOrNull } from "./fsx.mjs";

export const BUILD_MARKER = ".cw-build.json";

function readCommit(repoRoot) {
  let gitDir = path.join(repoRoot, ".git");
  try {
    const st = fs.statSync(gitDir);
    if (st.isFile()) {
      const m = fs.readFileSync(gitDir, "utf8").match(/^gitdir:\s*(.+)$/m);
      if (!m) return null;
      gitDir = path.resolve(repoRoot, m[1].trim());
    }
    const head = fs.readFileSync(path.join(gitDir, "HEAD"), "utf8").trim();
    if (/^[0-9a-f]{40}$/.test(head)) return head;
    const ref = head.match(/^ref:\s*(.+)$/)?.[1];
    if (!ref) return null;
    const refFile = path.join(gitDir, ...ref.split("/"));
    if (fs.existsSync(refFile)) return fs.readFileSync(refFile, "utf8").trim();
    const packed = path.join(gitDir, "packed-refs");
    if (fs.existsSync(packed)) {
      const line = fs
        .readFileSync(packed, "utf8")
        .split(/\r?\n/)
        .find((l) => l.endsWith(` ${ref}`));
      if (line) return line.split(" ")[0];
    }
  } catch {
    return null;
  }
  return null;
}

export function sourceIdentity(repoRoot) {
  const pkg = readJsonOrNull(path.join(repoRoot, "package.json")) ?? {};
  const build = readJsonOrNull(path.join(repoRoot, BUILD_MARKER));
  return {
    libraryVersion: pkg.version ?? build?.libraryVersion ?? "0.0.0",
    commit: readCommit(repoRoot) ?? build?.commit ?? null,
    distribution: build ? "bundle" : "checkout",
  };
}
