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
export const packageJsonPath = path.join(repoRoot, "package.json");
export const runtimeManifestFileName = ".saas-skills-manifest.json";
export const managedLibraryId = "context-window/saas-skills";
export const cursorUserRulesBootstrapFileName = "CURSOR_USER_RULES.md";

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
  const name =
    frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim() ??
    path.basename(skillDir);
  const description =
    frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? "";
  const collection = path.basename(path.dirname(skillDir));

  return {
    skillDir,
    skillFile,
    name,
    description,
    frontmatter,
    collection,
    body,
    sourceRelativePath: path
      .relative(repoRoot, skillFile)
      .replaceAll("\\", "/"),
  };
}

export function loadCursorProfiles() {
  const raw = JSON.parse(fs.readFileSync(cursorProfilesPath, "utf8"));
  return new Map(raw.rules.map((entry) => [entry.skill, entry]));
}

export function loadPackageMetadata() {
  return JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
}

export function getLibraryVersion() {
  return loadPackageMetadata().version ?? "0.0.0";
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

export function buildCursorProjectStub(skill, profile) {
  const lines = [
    "---",
    `description: ${yamlQuote(profile.description || skill.description)}`,
    "alwaysApply: false",
    "globs: []",
    "---",
    "",
    `# ${skill.name} - Cursor Stub`,
    "",
    "This file is intentionally short so generic guidance does not dilute",
    "project rules or consume unrelated Cursor context.",
    "",
    "Use it only as a trigger:",
    "",
    "- Read the repository entrypoint, current code, tests, and local rules first.",
    "- Load the full skill only when the task needs it:",
    `  \`~/.claude/skills/${skill.name}/SKILL.md\` (fallback:`,
    `  \`~/.codex/skills/${skill.name}/SKILL.md\`).`,
    "- Project-local rules and automated gates take precedence.",
    "- Keep changes scoped, testable, and documented.",
    "",
    `<!-- Generated from ${skill.sourceRelativePath} -->`,
    "",
  ];

  return lines.join("\n");
}

/**
 * Builds the SKILL.md content for the Claude runtime.
 *
 * Claude auto-detects a skill from `description` + `when_to_use`, and file-based
 * auto-load comes from the official `paths:` frontmatter field (the native
 * equivalent of Cursor's `globs`). The installer used to copy SKILL.md verbatim,
 * so Claude never received those signals while Cursor did. This re-emits the
 * source frontmatter and ADDS, when missing:
 *   - `when_to_use:` from `profile.whenToUse` (optional, purely additive).
 *   - `paths:`       from `profile.claudePaths` (falls back to the same
 *                    `profile.globs` Cursor already uses), so file-scoped skills
 *                    get the same auto-attach the Cursor rule has.
 *
 * Existing `paths:`/`when_to_use:` in the source frontmatter are preserved as-is
 * (never overwritten). Skills with no globs/claudePaths stay always-on via their
 * description, which is the correct behavior for topic-oriented skills.
 */
export function buildClaudeSkillContent(skill, profile) {
  const frontmatter = skill.frontmatter.replace(/\s+$/, "");
  const additions = [];

  const whenToUse = profile?.whenToUse;
  if (whenToUse && !/^when_to_use\s*:/m.test(frontmatter)) {
    additions.push(`when_to_use: ${yamlQuote(whenToUse)}`);
  }

  const claudePaths = profile?.claudePaths ?? profile?.globs;
  if (
    Array.isArray(claudePaths) &&
    claudePaths.length > 0 &&
    !/^paths\s*:/m.test(frontmatter)
  ) {
    additions.push(`paths: ${yamlQuote(claudePaths.join(", "))}`);
  }

  const mergedFrontmatter = additions.length
    ? `${frontmatter}\n${additions.join("\n")}`
    : frontmatter;

  return `---\n${mergedFrontmatter}\n---\n\n${skill.body.trimEnd()}\n`;
}

/**
 * Expands one level of `{a,b}` brace alternation in a glob into plain globs
 * (the Claude skill-router hook and `paths:` matching do not support braces).
 * `**\/*.{ts,tsx}` -> [`**\/*.ts`, `**\/*.tsx`]. Globs without braces pass through.
 * @param {string} glob
 * @returns {string[]}
 */
export function expandGlobBraces(glob) {
  const match = String(glob).match(/^(.*)\{([^}]+)\}(.*)$/);
  if (!match) return [glob];
  const [, prefix, alternatives, suffix] = match;
  return alternatives
    .split(",")
    .flatMap((alt) => expandGlobBraces(`${prefix}${alt.trim()}${suffix}`));
}

/**
 * Builds the `.claude/skill-routing.json` payload consumed by the generic
 * skill-router hook (scripts/templates/claude-skill-router.mjs). Only skills
 * with `promptTriggers` and/or file globs get an entry. `skillPath` points to
 * where the SKILL.md will live so the hint works even when the skill is gated
 * by `paths:` frontmatter and invisible to the Skill tool at prompt time.
 * @param {Array<ReturnType<typeof parseSkill>>} skills
 * @param {Map<string, any>} profiles
 * @param {{skillsBaseLabel?: string}} [options] e.g. ".claude/skills" or "~/.claude/skills"
 */
export function buildClaudeSkillRouting(skills, profiles, options = {}) {
  const skillsBaseLabel = options.skillsBaseLabel ?? "~/.claude/skills";
  const entries = [];

  for (const skill of skills) {
    const profile = profiles.get(skill.name);
    if (!profile) continue;

    const promptTriggers = Array.isArray(profile.promptTriggers)
      ? profile.promptTriggers
      : [];
    const rawGlobs = Array.isArray(profile.claudePaths)
      ? profile.claudePaths
      : Array.isArray(profile.globs)
        ? profile.globs
        : [];
    const pathGlobs = rawGlobs.flatMap((glob) => expandGlobBraces(glob));

    if (!promptTriggers.length && !pathGlobs.length) continue;

    const entry = {
      skill: skill.name,
      hint: profile.description || skill.description,
      skillPath: `${skillsBaseLabel}/${skill.name}/SKILL.md`,
    };
    if (promptTriggers.length) entry.promptTriggers = promptTriggers;
    if (pathGlobs.length) entry.pathGlobs = pathGlobs;
    entries.push(entry);
  }

  return {
    $comment:
      "Generated by Context Window (scripts/install-agent-runtimes.mjs --claude-hook) from saas-skills/integrations/cursor-rule-profiles.json. Consumed by .claude/hooks/skill-router.mjs. Project-specific skills may be appended manually; regeneration preserves only generated entries listed in the runtime manifest.",
    skills: entries,
  };
}

/**
 * Detects a duplicate Claude install of this library (project AND global at
 * the same time), which doubles the skill listing shown to the model and
 * degrades automatic skill triggering. Returns a warning string or null.
 * @param {string} projectClaudeSkillsDir
 * @param {string} globalClaudeSkillsDir
 * @returns {string | null}
 */
export function detectDuplicateClaudeInstall(
  projectClaudeSkillsDir,
  globalClaudeSkillsDir,
) {
  const projectManifest = readRuntimeManifest(projectClaudeSkillsDir);
  const globalManifest = readRuntimeManifest(globalClaudeSkillsDir);
  if (
    projectManifest?.library === managedLibraryId &&
    globalManifest?.library === managedLibraryId
  ) {
    return (
      "Duplicate Claude install detected: the library is installed BOTH at " +
      `project scope (${projectClaudeSkillsDir}) and global scope (${globalClaudeSkillsDir}). ` +
      "This doubles the skill list Claude sees and degrades automatic triggering. " +
      "Recommended: keep the generic library GLOBAL-only and reserve project scope for project-specific skills. " +
      "Remove one of the copies (delete the project .claude/skills library folders or the global ones) and re-run verify."
    );
  }
  return null;
}

export function getCursorArtifactNames(skills, profiles, options = {}) {
  const artifacts = skills.map((skill) => {
    const profile = profiles.get(skill.name);

    if (!profile) {
      throw new Error(`Missing Cursor rule profile for skill ${skill.name}`);
    }

    return profile.file;
  });

  if (options.includeUserRulesBootstrap) {
    artifacts.push(cursorUserRulesBootstrapFileName);
  }

  return artifacts;
}

export function buildCursorUserRulesBootstrap(skills, profiles) {
  const entries = skills
    .map((skill) => {
      const profile = profiles.get(skill.name);

      if (!profile) {
        throw new Error(`Missing Cursor rule profile for skill ${skill.name}`);
      }

      return {
        name: skill.name,
        description: profile.description || skill.description,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const lines = [
    "Use Context Window as a lightweight global router for Cursor.",
    "",
    "- Treat project `.cursor/rules/*.mdc` as the authoritative runtime when present.",
    "- Treat this global text as bootstrap guidance, not as a replacement for project rules.",
    "- Do not use `.cursor/skills/` as runtime.",
    "- If a repository also has `.claude/skills/`, those files are for Claude integrations, not Cursor native rules.",
    "- If a request clearly matches one of the domains below and the repository does not have Context Window project rules installed yet, recommend installing or syncing the library instead of improvising from stale copies.",
    "- If the repository installs a mandatory skill-usage disclosure policy, end the final response with the required `Skills Used` section.",
    "",
    "Context Window routing domains:",
  ];

  for (const entry of entries) {
    lines.push(`- \`${entry.name}\`: ${entry.description}`);
  }

  lines.push(
    "",
    "When global and project guidance conflict, prefer the project-local `.cursor/rules` for that repository.",
  );

  return `${lines.join("\n")}\n`;
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function readRuntimeManifest(runtimeDir) {
  const manifestPath = path.join(runtimeDir, runtimeManifestFileName);

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

export function buildRuntimeManifest({
  runtime,
  artifacts,
  installScope,
  targetRoot,
}) {
  return {
    library: managedLibraryId,
    version: getLibraryVersion(),
    runtime,
    installScope,
    installedAt: new Date().toISOString(),
    sourceRepoRoot: repoRoot,
    targetRoot,
    skillCount: artifacts.length,
    artifacts,
    generatedBy: "scripts/install-agent-runtimes.mjs",
    updatePolicy:
      "Edit saas-skills/ and rerun sync. Do not edit runtime copies directly.",
  };
}

export function writeRuntimeManifest(runtimeDir, manifest) {
  const manifestPath = path.join(runtimeDir, runtimeManifestFileName);
  fs.writeFileSync(
    manifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}

export function removeManagedRuntimeArtifacts(runtimeDir) {
  const manifest = readRuntimeManifest(runtimeDir);
  const removedPaths = [];

  if (
    !manifest ||
    manifest.library !== managedLibraryId ||
    !Array.isArray(manifest.artifacts)
  ) {
    return removedPaths;
  }

  for (const artifact of manifest.artifacts) {
    if (typeof artifact !== "string" || artifact.includes("..")) {
      continue;
    }

    const artifactPath = path.join(runtimeDir, artifact);

    if (!fs.existsSync(artifactPath)) {
      continue;
    }

    fs.rmSync(artifactPath, { recursive: true, force: true });
    removedPaths.push(artifactPath);
  }

  const manifestPath = path.join(runtimeDir, runtimeManifestFileName);
  if (fs.existsSync(manifestPath)) {
    fs.rmSync(manifestPath, { force: true });
  }

  return removedPaths;
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
