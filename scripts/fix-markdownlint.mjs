#!/usr/bin/env node
// Mechanical Markdown fix that is safe to automate: MD040 (fenced code blocks without a language
// get `text`). Content inside fenced blocks is never modified and headings are never renamed or
// re-leveled; markdownlint reports those for a human to fix.
//   node scripts/fix-markdownlint.mjs [--write] [paths...]   (default: --check on canonical docs)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDirectRun } from "./lib/cli.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const DEFAULT_SCOPE = [
  "saas-skills",
  "catalog",
  "acceptance",
  "README.md",
  "AGENTS.md",
  "CHANGELOG.md",
];
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".cursor",
  ".claude",
  ".agents",
  "imported-skills",
  "fixtures",
]);
const FENCE = /^( {0,3}|\s*(?:[-*+]|\d+[.)])?\s+)?(`{3,}|~{3,})(.*)$/;

/** Adds `text` to opening fences without an info string. Returns the fixed text. */
export function fixFenceLanguages(text) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);
  let open = null;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(FENCE);
    if (!m) continue;
    const [, indent = "", marker, rest] = m;
    if (!open) {
      if (marker[0] === "`" && rest.includes("`")) continue;
      open = { char: marker[0], len: marker.length };
      if (rest.trim() === "") lines[i] = `${indent}${marker}text`;
    } else if (
      marker[0] === open.char &&
      marker.length >= open.len &&
      rest.trim() === ""
    ) {
      open = null;
    }
  }
  return lines.join(eol);
}

function collect(target, acc) {
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    if (target.endsWith(".md")) acc.push(target);
    return acc;
  }
  for (const e of fs.readdirSync(target, { withFileTypes: true })) {
    if (e.isDirectory() && SKIP_DIRS.has(e.name)) continue;
    if (e.isSymbolicLink()) continue;
    collect(path.join(target, e.name), acc);
  }
  return acc;
}

if (isDirectRun(import.meta.url)) {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const targets = args.filter((a) => !a.startsWith("--"));
  const roots = (targets.length ? targets : DEFAULT_SCOPE)
    .map((t) => path.resolve(repoRoot, t))
    .filter((t) => fs.existsSync(t));
  const changed = [];
  for (const file of roots.flatMap((r) => collect(r, []))) {
    const before = fs.readFileSync(file, "utf8");
    const after = fixFenceLanguages(before);
    if (after === before) continue;
    changed.push(path.relative(repoRoot, file));
    if (write) fs.writeFileSync(file, after);
  }
  for (const f of changed)
    console.log(`${write ? "fixed" : "needs fix"}: ${f}`);
  console.log(
    `${changed.length} file(s) ${write ? "fixed" : "need MD040 fixes"}`,
  );
  process.exitCode = !write && changed.length ? 1 : 0;
}
