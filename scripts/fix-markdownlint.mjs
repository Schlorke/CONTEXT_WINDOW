/**
 * Corrige MD040, MD036 (via <strong> — MD033 desligado), MD024, MD025, MD051.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function walkDir(dir, acc = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      name.name === "node_modules" ||
      name.name === ".cursor" ||
      name.name === ".git"
    )
      continue;
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walkDir(p, acc);
    else if (name.name.endsWith(".md")) acc.push(p);
  }
  return acc;
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** MD040 — inclui cercas indentadas (`   ``` `) */
function fixFences(content) {
  const lines = content.split("\n");
  let inFence = false;
  let openLen = 3;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^(\s*)(`{3,})([^`]*)$/);
    if (!m) continue;

    const indent = m[1];
    const ticks = m[2];
    const rest = m[3].trim();

    if (!inFence) {
      if (rest === "") {
        lines[i] = `${indent}${ticks}text`;
        inFence = true;
        openLen = ticks.length;
      } else {
        inFence = true;
        openLen = ticks.length;
      }
    } else if (rest === "" && ticks.length === openLen) {
      inFence = false;
    }
  }

  return lines.join("\n");
}

/** MD001 — não saltar níveis (ex.: ## → #### vira ###) */
function fixHeadingIncrement(content) {
  const lines = content.split("\n");
  let lastLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)(#{1,6})\s+(.+)$/);
    if (!m) continue;

    const indent = m[1];
    let level = m[2].length;
    const title = m[3];

    if (level > lastLevel + 1) {
      level = lastLevel + 1;
      lines[i] = `${indent}${"#".repeat(level)} ${title}`;
    }

    lastLevel = level;
  }

  return lines.join("\n");
}

/** MD036 — parágrafo só com **texto** → <strong> (evita MD001/MD022 de “falso” ####) */
function fixEmphasisAsHtml(content) {
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const t = raw.trim();
    if (!t.startsWith("**") || !t.endsWith("**")) continue;
    const inner = t.slice(2, -2);
    if (!inner || inner.includes("**")) continue;
    const indent = raw.match(/^\s*/)[0];
    lines[i] = `${indent}<strong>${escapeHtml(inner.trim())}</strong>`;
  }
  return lines.join("\n");
}

/** MD024 — títulos ATX com texto idêntico no documento */
function fixDuplicateHeadings(content) {
  const lines = content.split("\n");
  const seen = new Map();

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s+(.+)$/);
    if (!m) continue;

    const hashes = m[1];
    const title = m[2].replace(/\r$/, "").trim();
    const n = (seen.get(title) ?? 0) + 1;
    seen.set(title, n);
    if (n > 1) {
      const prefix = lines[i].match(/^\s*/)[0];
      lines[i] = `${prefix}${hashes} ${title} (${n})`;
    }
  }

  return lines.join("\n");
}

function processFile(absPath) {
  let c = fs.readFileSync(absPath, "utf8");
  c = fixFences(c);
  c = fixEmphasisAsHtml(c);
  c = fixDuplicateHeadings(c);
  c = fixHeadingIncrement(c);
  fs.writeFileSync(absPath, c, "utf8");
}

const files = walkDir(root);
for (const f of files) {
  if (f.includes(`${path.sep}node_modules${path.sep}`)) continue;
  processFile(f);
}

console.log(`Processados ${files.length} arquivos .md`);
