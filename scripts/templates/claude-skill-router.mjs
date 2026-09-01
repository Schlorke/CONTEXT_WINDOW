#!/usr/bin/env node
// (no @ts-check on purpose: this script runs standalone via Node, outside the
// target project's tsconfig — with @ts-check, VS Code type-checks it without
// Node's type definitions and floods the Problems panel with false
// "Cannot find name 'process'" alerts.)
/**
 * Context Window — Claude Code Skill Router Hook (generic template)
 *
 * Gives Claude Code the native equivalent of Cursor's `alwaysApply` + `globs`:
 * a DETERMINISTIC layer that detects when a task matches a skill and injects a
 * reminder into the model context so Claude applies the skill via the `Skill`
 * tool (or by reading the SKILL.md path included in the hint). It never blocks
 * actions — it only injects `additionalContext`.
 *
 * Design rules (learned from production usage):
 *   - Diacritics are stripped on BOTH sides before matching, so triggers
 *     written unaccented ("seguranca") match real Portuguese ("segurança").
 *   - Suggestions are CAPPED (default 3) and ranked: mandatory skills first,
 *     then by number of matched triggers. A router that suggests 10 skills
 *     per prompt trains the model to ignore it (alarm fatigue).
 *   - Each skill is suggested at most once per session (marker files), for
 *     both prompt and file-path matches.
 *   - Hints include the SKILL.md path as a fallback: skills gated by `paths:`
 *     frontmatter may not be visible to the Skill tool at prompt time.
 *
 * Events (argv[2]):
 *   - UserPromptSubmit : matches the prompt text against `promptTriggers`.
 *   - PreToolUse       : matches the edited file_path against `pathGlobs`.
 *
 * Input: hook JSON on stdin. Output: JSON on stdout in the format
 *   { "hookSpecificOutput": { "hookEventName": <event>, "additionalContext": <text> } }
 * No match => empty stdout (no-op). Any error => silent no-op (a hook must
 * never break the user's flow).
 *
 * Data source: .claude/skill-routing.json (same directory layout as this hook).
 * Entry shape: { skill, mandatory?, hint?, skillPath?, promptTriggers?, pathGlobs? }
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const EVENT = process.argv[2] || "";
const MAX_SUGGESTIONS = 3;

/** Reads and parses stdin as JSON; {} on error. */
function readInput() {
  try {
    const raw = fs.readFileSync(0, "utf8");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Emits the output JSON with additionalContext (or no-op) and exits.
 * @param {string | null | undefined} additionalContext
 */
function emit(additionalContext) {
  if (additionalContext) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: EVENT,
          additionalContext,
        },
      }),
    );
  }
  process.exit(0);
}

/**
 * Strips diacritics and lowercases, so "segurança" === "seguranca".
 * @param {string} text
 * @returns {string}
 */
function normalize(text) {
  return String(text)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Converts a simple glob (`*`, `**`, `?`) into an anchored RegExp (^...$).
 * @param {string} glob
 * @returns {RegExp}
 */
function globToRegex(glob) {
  const g = String(glob).replace(/\\/g, "/");
  let re = "^";
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === "*") {
      if (g[i + 1] === "*") {
        re += ".*";
        i++;
        if (g[i + 1] === "/") i++;
      } else {
        re += "[^/]*";
      }
    } else if (c === "?") {
      re += "[^/]";
    } else if (".+^${}()|[]\\".includes(c)) {
      re += "\\" + c;
    } else {
      re += c;
    }
  }
  return new RegExp(re + "$");
}

/**
 * Loads the routing table next to this hook (.claude/skill-routing.json).
 * @param {string} projectDir
 * @returns {Array<{skill: string, mandatory?: boolean, hint?: string, skillPath?: string, promptTriggers?: string[], pathGlobs?: string[]}>}
 */
function loadRouting(projectDir) {
  const here = path.dirname(
    new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"),
  );
  const candidates = [
    path.join(projectDir, ".claude", "skill-routing.json"),
    path.join(here, "..", "skill-routing.json"),
  ];
  for (const file of candidates) {
    try {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      if (Array.isArray(data.skills)) return data.skills;
    } catch {
      /* try the next candidate */
    }
  }
  return [];
}

/**
 * Counts how many triggers match the normalized prompt (0 = no match).
 * @param {{promptTriggers?: string[]}} entry
 * @param {string} normalizedPrompt
 * @returns {number}
 */
function countTriggerMatches(entry, normalizedPrompt) {
  let hits = 0;
  for (const trigger of entry.promptTriggers || []) {
    const normalizedTrigger = normalize(trigger);
    try {
      if (new RegExp(normalizedTrigger, "i").test(normalizedPrompt)) hits += 1;
    } catch {
      if (normalizedPrompt.includes(normalizedTrigger)) hits += 1;
    }
  }
  return hits;
}

/**
 * Ranks matches (mandatory first, then most trigger hits) and caps the list.
 * @param {Array<{entry: any, hits: number}>} matches
 * @returns {any[]}
 */
function rankAndCap(matches) {
  const ranked = [...matches].sort((a, b) => {
    const mandatoryDelta =
      Number(Boolean(b.entry.mandatory)) - Number(Boolean(a.entry.mandatory));
    if (mandatoryDelta !== 0) return mandatoryDelta;
    return b.hits - a.hits;
  });
  return ranked.slice(0, MAX_SUGGESTIONS).map((m) => m.entry);
}

/**
 * @param {any[]} matched
 * @returns {string}
 */
function formatLines(matched) {
  return matched
    .map((r) => {
      const flag = r.mandatory ? " (OBRIGATORIA)" : "";
      const where = r.skillPath ? ` [${r.skillPath}]` : "";
      return `- **${r.skill}**${flag}: ${r.hint || ""}${where}`;
    })
    .join("\n");
}

/**
 * Session-level dedup: each skill is suggested at most once per session.
 * @param {any[]} matched
 * @param {string} sessionId
 * @returns {any[]}
 */
function dedupBySession(matched, sessionId) {
  const safeSession = String(sessionId || "nosession").replace(
    /[^a-zA-Z0-9_-]/g,
    "_",
  );
  const markerDir = path.join(os.tmpdir(), "claude-skill-router");
  try {
    fs.mkdirSync(markerDir, { recursive: true });
  } catch {
    /* ignore */
  }
  const fresh = [];
  for (const r of matched) {
    const marker = path.join(markerDir, `${safeSession}__${r.skill}`);
    try {
      if (!fs.existsSync(marker)) {
        fs.writeFileSync(marker, "1");
        fresh.push(r);
      }
    } catch {
      fresh.push(r);
    }
  }
  return fresh;
}

function main() {
  const input = readInput();
  const projectDir = input.cwd || process.cwd();
  const routing = loadRouting(projectDir);
  if (!routing.length) emit(null);

  if (EVENT === "UserPromptSubmit") {
    const prompt = normalize(String(input.prompt || ""));
    if (!prompt.trim()) emit(null);
    const matches = routing
      .map((entry) => ({ entry, hits: countTriggerMatches(entry, prompt) }))
      .filter((m) => m.hits > 0);
    if (!matches.length) emit(null);
    const fresh = dedupBySession(rankAndCap(matches), input.session_id);
    if (!fresh.length) emit(null);
    emit(
      "Auto-deteccao de skills: esta tarefa casa com a(s) skill(s) abaixo. " +
        "Use a ferramenta Skill para carrega-la(s) (ou leia o SKILL.md indicado) antes de prosseguir, salvo se claramente irrelevante:\n" +
        formatLines(fresh),
    );
  }

  if (EVENT === "PreToolUse") {
    const ti = input.tool_input || {};
    const filePath = ti.file_path || ti.path || "";
    if (!filePath) emit(null);
    let rel = String(filePath).replace(/\\/g, "/");
    const proj = projectDir.replace(/\\/g, "/");
    if (rel.startsWith(proj)) rel = rel.slice(proj.length).replace(/^\/+/, "");

    const matches = routing
      .map((entry) => ({
        entry,
        hits: (entry.pathGlobs || []).some((glob) =>
          globToRegex(glob).test(rel),
        )
          ? 1
          : 0,
      }))
      .filter((m) => m.hits > 0);
    if (!matches.length) emit(null);
    const fresh = dedupBySession(rankAndCap(matches), input.session_id);
    if (!fresh.length) emit(null);
    emit(
      `Auto-deteccao de skills: a edicao em \`${rel}\` esta no escopo da(s) skill(s) abaixo. ` +
        "Siga-a(s) (use a ferramenta Skill ou leia o SKILL.md indicado se ainda nao carregou):\n" +
        formatLines(fresh),
    );
  }

  emit(null);
}

main();
