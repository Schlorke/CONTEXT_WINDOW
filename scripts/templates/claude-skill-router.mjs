#!/usr/bin/env node
/**
 * Context Window — Claude Code Skill Router Hook (UserPromptSubmit)
 *
 * Deterministic hint layer: when the prompt matches a skill's triggers, it adds a short
 * `additionalContext` suggesting that skill. It never blocks and never edits files.
 *
 * - Triggers are matched on normalized text (lowercase, diacritics removed) with word
 *   boundaries, so "api" does not match "rapid". Prefix a trigger with "re:" for a regex.
 * - At most 3 suggestions per prompt; each skill is suggested once per session
 *   (marker files under the OS temp dir).
 * - Routing table: <project>/.claude/skill-routing.json (entries with "cw": true are managed by
 *   Context Window; other entries belong to the project and are preserved on regeneration).
 * - Any error => silent no-op (exit 0, no output): a hook must never break the session.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MAX_SUGGESTIONS = 3;

function readInput() {
  try {
    const raw = fs.readFileSync(0, "utf8");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function emit(context) {
  if (context) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "UserPromptSubmit",
          additionalContext: context,
        },
      }),
    );
  }
  process.exit(0);
}

export function normalize(text) {
  return String(text)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function triggerMatches(trigger, normalizedPrompt) {
  const t = String(trigger);
  if (t.startsWith("re:")) {
    try {
      return new RegExp(t.slice(3), "i").test(normalizedPrompt);
    } catch {
      return false;
    }
  }
  const words = normalize(t)
    .trim()
    .split(/\s+/)
    .map((word) => `${escapeRegExp(word)}s?`)
    .join("\\s+");
  return new RegExp(`(?<![a-z0-9])${words}(?![a-z0-9])`).test(normalizedPrompt);
}

function loadRouting(projectDir) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  for (const file of [
    path.join(projectDir, ".claude", "skill-routing.json"),
    path.join(here, "..", "skill-routing.json"),
  ]) {
    try {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      if (Array.isArray(data.skills)) return data.skills;
    } catch {
      /* try the next candidate */
    }
  }
  return [];
}

export function suggest(routing, prompt) {
  const normalized = normalize(prompt);
  return routing
    .map((entry) => ({
      entry,
      hits: (entry.promptTriggers ?? []).filter((t) =>
        triggerMatches(t, normalized),
      ).length,
    }))
    .filter((m) => m.hits > 0)
    .sort(
      (a, b) =>
        Number(Boolean(b.entry.mandatory)) -
          Number(Boolean(a.entry.mandatory)) || b.hits - a.hits,
    )
    .slice(0, MAX_SUGGESTIONS)
    .map((m) => m.entry);
}

function freshForSession(matched, sessionId) {
  const safe = String(sessionId || "nosession").replace(/[^a-zA-Z0-9_-]/g, "_");
  const dir = path.join(os.tmpdir(), "claude-skill-router");
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    /* ignore */
  }
  return matched.filter((entry) => {
    const marker = path.join(dir, `${safe}__${entry.skill}`);
    try {
      fs.writeFileSync(marker, "1", { flag: "wx" });
      return true;
    } catch (error) {
      return error.code !== "EEXIST";
    }
  });
}

function main() {
  const input = readInput();
  const prompt = String(input.prompt || "");
  if (!prompt.trim()) emit(null);
  const projectDir =
    process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const matched = freshForSession(
    suggest(loadRouting(projectDir), prompt),
    input.session_id,
  );
  if (!matched.length) emit(null);
  const lines = matched.map(
    (r) =>
      `- **${r.skill}**${r.mandatory ? " (mandatory)" : ""}: ${r.hint || ""}`,
  );
  emit(
    `Skill hint (Context Window router): this request matches the skill(s) below. Load them with the Skill tool before proceeding unless clearly irrelevant:\n${lines.join("\n")}`,
  );
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
const self = fileURLToPath(import.meta.url);
if (
  process.platform === "win32"
    ? invoked.toLowerCase() === self.toLowerCase()
    : invoked === self
) {
  try {
    main();
  } catch {
    process.exit(0);
  }
}
