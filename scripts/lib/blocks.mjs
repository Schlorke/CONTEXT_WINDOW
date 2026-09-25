// Managed text blocks inside user-owned files (AGENTS.md, CLAUDE.md). Only the block is
// owned by this library; the rest of the file is never rewritten. The BEGIN marker stores the
// hash of the inner text, so local edits inside the block are detected instead of overwritten.
import fs from "node:fs";
import path from "node:path";
import { exists, sha256, writeFileAtomic } from "./fsx.mjs";

const LEGACY_USAGE_BEGIN = "<!-- BEGIN: SAAS_SKILLS_USAGE_REPORTING -->";
const LEGACY_USAGE_END = "<!-- END: SAAS_SKILLS_USAGE_REPORTING -->";

export function renderBlock(name, version, inner) {
  const body = inner.replace(/\r\n/g, "\n").trim();
  return `<!-- BEGIN context-window:${name} v${version} sha256=${sha256(body)} -->\n${body}\n<!-- END context-window:${name} -->`;
}

/** Locates a managed block. state ∈ absent | intact | modified | malformed. */
export function findBlock(text, name) {
  const begin = new RegExp(
    `<!-- BEGIN context-window:${name} v([^ ]+) sha256=([0-9a-f]{64}) -->`,
    "g",
  );
  const end = `<!-- END context-window:${name} -->`;
  const begins = [...text.matchAll(begin)];
  const endCount = text.split(end).length - 1;
  if (begins.length === 0 && endCount === 0) return { state: "absent" };
  if (begins.length !== 1 || endCount !== 1)
    return {
      state: "malformed",
      detail: `${begins.length} BEGIN / ${endCount} END markers`,
    };
  const start = begins[0].index;
  const endIndex = text.indexOf(end, start);
  if (endIndex === -1)
    return { state: "malformed", detail: "END before BEGIN" };
  const inner = text
    .slice(start + begins[0][0].length, endIndex)
    .replace(/\r\n/g, "\n")
    .trim();
  return {
    state: sha256(inner) === begins[0][2] ? "intact" : "modified",
    version: begins[0][1],
    start,
    stop: endIndex + end.length,
    inner,
  };
}

function collapse(text, eol) {
  return text.replace(/(?:\r?\n){3,}/g, `${eol}${eol}`);
}

/** Pure: applies one block change to `text`. Returns {text, action, conflict?}. */
export function planBlockText({
  text,
  name,
  version,
  desiredInner,
  forceLocal,
  migrateLegacy,
}) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  let base = text;
  if (name === "usage-policy") {
    const b = base.indexOf(LEGACY_USAGE_BEGIN);
    const e = base.indexOf(LEGACY_USAGE_END);
    if (b !== -1 || e !== -1) {
      if (b === -1 || e === -1 || e < b)
        return {
          text,
          action: "none",
          conflict: "malformed legacy v1 usage-policy block",
        };
      if (!migrateLegacy)
        return {
          text,
          action: "none",
          conflict:
            "legacy v1 usage-policy block present (use --migrate-legacy)",
        };
      base = collapse(
        `${base.slice(0, b)}${base.slice(e + LEGACY_USAGE_END.length)}`,
        eol,
      );
    }
  }
  const current = findBlock(base, name);
  if (current.state === "malformed")
    return {
      text,
      action: "none",
      conflict: `malformed managed block ${name} (${current.detail})`,
    };
  if (current.state === "modified" && !forceLocal)
    return {
      text,
      action: "none",
      conflict: `managed block ${name} was edited locally`,
    };
  if (desiredInner === null) {
    if (current.state === "absent")
      return { text: base, action: base === text ? "none" : "remove" };
    const next = collapse(
      `${base.slice(0, current.start)}${base.slice(current.stop)}`,
      eol,
    );
    return { text: next.trim() === "" ? "" : next, action: "remove" };
  }
  const block = renderBlock(name, version, desiredInner).replace(/\n/g, eol);
  if (current.state === "absent") {
    const trimmed = base.replace(/\s+$/, "");
    return {
      text: trimmed ? `${trimmed}${eol}${eol}${block}${eol}` : `${block}${eol}`,
      action: "create",
    };
  }
  const next = `${base.slice(0, current.start)}${block}${base.slice(current.stop)}`;
  return { text: next, action: next === text ? "none" : "update" };
}

/** Plans all blocks of one file in sequence so they compose. */
export function planFileBlocks(file, specs) {
  const original = exists(file) ? fs.readFileSync(file, "utf8") : null;
  let text = original ?? "";
  const steps = [];
  const conflicts = [];
  for (const spec of specs) {
    const r = planBlockText({ ...spec, text });
    steps.push({ name: spec.name, action: r.action });
    if (r.conflict) conflicts.push(r.conflict);
    else text = r.text;
  }
  let action = "none";
  if (!conflicts.length && text !== (original ?? ""))
    action = text === "" ? (original === null ? "none" : "delete") : "write";
  return { file, original, next: text, action, steps, conflicts };
}

export function applyFileBlocks(planned, backupDir) {
  if (planned.action === "none") return null;
  let backup = null;
  if (planned.original !== null && backupDir) {
    fs.mkdirSync(backupDir, { recursive: true });
    backup = path.join(
      backupDir,
      `${path.basename(planned.file)}.${Date.now()}.bak`,
    );
    fs.writeFileSync(backup, planned.original);
  }
  if (planned.action === "delete") fs.unlinkSync(planned.file);
  else writeFileAtomic(planned.file, planned.next);
  return backup;
}
