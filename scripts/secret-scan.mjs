#!/usr/bin/env node
// Scans a directory for credentials and fails on any finding: files git would publish (tracked, or
// untracked and not ignored) and local copies that git ignores (for example old dist/ smoke folders)
// are both errors, because a local copy still leaves a live credential on disk. Directories that are
// not git work trees (snapshots, bundles) are scanned as fully publishable.
// Output names the file, line and pattern — never the matched value.
//   node scripts/secret-scan.mjs [--root <dir>] [--json]
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDirectRun } from "./lib/cli.mjs";
import { credentialFileKind, findSecrets } from "./lib/secrets.mjs";

const SKIP_DIRS = new Set(["node_modules", ".git"]);
const MAX_BYTES = 2 * 1024 * 1024;

function walk(root, dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isSymbolicLink()) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(root, full, acc);
    } else if (e.isFile())
      acc.push(path.relative(root, full).split(path.sep).join("/"));
  }
  return acc;
}

/** Files git would publish, or null when `root` is not the top of a git work tree. */
function publishableFiles(root) {
  const top = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    cwd: root,
    encoding: "utf8",
  });
  if (
    top.status !== 0 ||
    path.resolve(top.stdout.trim()).toLowerCase() !==
      path.resolve(root).toLowerCase()
  )
    return null;
  const r = spawnSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    { cwd: root, encoding: "utf8" },
  );
  if (r.status !== 0)
    throw new Error(`git ls-files failed: ${r.stderr.trim()}`);
  return new Set(r.stdout.split("\0").filter(Boolean));
}

export function scan(root) {
  const publishable = publishableFiles(root);
  const findings = [];
  for (const rel of walk(root, root, [])) {
    const abs = path.join(root, ...rel.split("/"));
    const size = fs.statSync(abs).size;
    if (size === 0 || size > MAX_BYTES) continue;
    const buf = fs.readFileSync(abs);
    if (buf.includes(0)) continue;
    const text = buf.toString("utf8");
    const isPublishable = publishable === null || publishable.has(rel);
    const kind = credentialFileKind(path.basename(rel), text);
    if (kind)
      findings.push({
        file: rel,
        line: 1,
        pattern: kind,
        publishable: isPublishable,
      });
    for (const hit of findSecrets(text))
      findings.push({
        file: rel,
        line: hit.line,
        pattern: hit.pattern,
        publishable: isPublishable,
      });
  }
  return {
    root,
    gitWorkTree: publishable !== null,
    findings,
    publishableFindings: findings.filter((f) => f.publishable).length,
    localCopyFindings: findings.filter((f) => !f.publishable).length,
  };
}

if (isDirectRun(import.meta.url)) {
  const args = process.argv.slice(2);
  const rootIndex = args.indexOf("--root");
  const root = path.resolve(
    rootIndex === -1
      ? path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
      : args[rootIndex + 1],
  );
  const report = scan(root);
  if (args.includes("--json"))
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  else {
    for (const f of report.findings)
      process.stdout.write(
        `${f.publishable ? "ERROR publishable" : "ERROR local copy "}  ${f.file}:${f.line}  ${f.pattern}\n`,
      );
    process.stdout.write(
      `${report.publishableFindings} publishable finding(s), ${report.localCopyFindings} in git-ignored local files. Remove the files and revoke the credentials; deleting a copy does not revoke it.\n`,
    );
  }
  process.exitCode = report.findings.length ? 1 : 0;
}
