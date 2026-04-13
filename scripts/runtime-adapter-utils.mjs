import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const repoRoot = path.resolve(__dirname, "..");
export const libraryRoot = path.join(repoRoot, "saas-skills");
export const cursorProfilesPath = path.join(
  libraryRoot,
  "integrations",
  "cursor-rule-profiles.json",
);

export function findSkillDirs(dir = libraryRoot) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const skillDirs = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(dir, entry.name);
    const skillFile = path.join(fullPath, "SKILL.md");

    if (fs.existsSync(skillFile)) {
      skillDirs.push(fullPath);
      continue;
    }

    skillDirs.push(...findSkillDirs(fullPath));
  }

  return skillDirs;
}

export function parseSkill(skillDir) {
  const skillFile = path.join(skillDir, "SKILL.md");
  const raw = fs.readFileSync(skillFile, "utf8");
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

  if (!match) {
    throw new Error(`Missing YAML frontmatter in ${skillFile}`);
  }

  const frontmatter = match[1];
  const body = raw.slice(match[0].length).trimStart();
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim() ?? path.basename(skillDir);
  const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? "";
  const collection = path.basename(path.dirname(skillDir));

  return {
    skillDir,
    skillFile,
    name,
    description,
    collection,
    body,
    sourceRelativePath: path.relative(repoRoot, skillFile).replaceAll("\\", "/"),
  };
}

export function loadCursorProfiles() {
  const raw = JSON.parse(fs.readFileSync(cursorProfilesPath, "utf8"));
  return new Map(raw.rules.map((entry) => [entry.skill, entry]));
}

export function buildCursorRule(skill, profile) {
  const lines = [
    "---",
    `description: ${yamlQuote(profile.description || skill.description)}`,
    "alwaysApply: false",
  ];

  if (profile.globs?.length) {
    lines.push("globs:");
    for (const glob of profile.globs) {
      lines.push(`  - ${yamlQuote(glob)}`);
    }
  }

  lines.push("---", "");
  lines.push(`<!-- Generated from ${skill.sourceRelativePath} -->`);
  lines.push(`<!-- Source skill: ${skill.name} (${skill.collection}) -->`, "");
  lines.push(skill.body.trimEnd(), "");

  return `${lines.join("\n")}`;
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function resolveCodexHome(override) {
  if (override?.trim()) {
    return path.resolve(override);
  }

  if (process.env.CODEX_HOME?.trim()) {
    return path.resolve(process.env.CODEX_HOME);
  }

  return path.join(os.homedir(), ".codex");
}

export function resolveCodexSkillsDir(override) {
  return path.join(resolveCodexHome(override), "skills");
}

export function resolveClaudeHome(override) {
  if (override?.trim()) {
    return path.resolve(override);
  }

  return path.join(os.homedir(), ".claude");
}

export function resolveClaudeSkillsDir(override) {
  return path.join(resolveClaudeHome(override), "skills");
}

export function resolveCursorHome(override) {
  if (override?.trim()) {
    return path.resolve(override);
  }

  return path.join(os.homedir(), ".cursor");
}

export function resolveCursorRulesDir(override) {
  return path.join(resolveCursorHome(override), "rules");
}

export function parseRuntimeCliArgs(args) {
  const flags = new Set();
  let targetArg = ".";
  let targetSeen = false;
  let dryRun = false;
  let codexHome;
  let claudeHome;
  let cursorHome;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--") {
      continue;
    }

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--codex-home") {
      const nextValue = args[index + 1];

      if (!nextValue || nextValue.startsWith("--")) {
        throw new Error("Missing value for --codex-home");
      }

      codexHome = nextValue;
      index += 1;
      continue;
    }

    if (arg.startsWith("--codex-home=")) {
      codexHome = arg.slice("--codex-home=".length);
      continue;
    }

    if (arg === "--claude-home") {
      const nextValue = args[index + 1];

      if (!nextValue || nextValue.startsWith("--")) {
        throw new Error("Missing value for --claude-home");
      }

      claudeHome = nextValue;
      index += 1;
      continue;
    }

    if (arg.startsWith("--claude-home=")) {
      claudeHome = arg.slice("--claude-home=".length);
      continue;
    }

    if (arg === "--cursor-home") {
      const nextValue = args[index + 1];

      if (!nextValue || nextValue.startsWith("--")) {
        throw new Error("Missing value for --cursor-home");
      }

      cursorHome = nextValue;
      index += 1;
      continue;
    }

    if (arg.startsWith("--cursor-home=")) {
      cursorHome = arg.slice("--cursor-home=".length);
      continue;
    }

    if (arg.startsWith("--")) {
      flags.add(arg);
      continue;
    }

    if (!targetSeen) {
      targetArg = arg;
      targetSeen = true;
    }
  }

  return {
    claudeHomeOverride: claudeHome ? path.resolve(claudeHome) : undefined,
    codexHomeOverride: codexHome ? path.resolve(codexHome) : undefined,
    cursorHomeOverride: cursorHome ? path.resolve(cursorHome) : undefined,
    dryRun,
    flags,
    targetRoot: path.resolve(targetArg),
  };
}

function yamlQuote(value) {
  const stringValue = `${value ?? ""}`;
  return JSON.stringify(stringValue);
}
