import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildRuntimeManifest,
  buildClaudeSkillContent,
  buildClaudeSkillRouting,
  buildCursorProjectStub,
  buildCursorRule,
  buildCursorUserRulesBootstrap,
  cursorUserRulesBootstrapFileName,
  detectDuplicateClaudeInstall,
  ensureDir,
  findSkillDirs,
  getCursorArtifactNames,
  getLibraryVersion,
  loadCursorProfiles,
  removeManagedRuntimeArtifacts,
  parseRuntimeCliArgs,
  parseSkill,
  resolveClaudeHome,
  resolveClaudeSkillsDir,
  resolveCodexHome,
  resolveCodexSkillsDir,
  resolveCursorHome,
  resolveCursorRulesDir,
} from "./runtime-adapter-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const claudeRouterTemplatePath = path.join(
  __dirname,
  "templates",
  "claude-skill-router.mjs",
);
const claudeRouterMarker = "Context Window — Claude Code Skill Router Hook";

const cli = parseRuntimeCliArgs(process.argv.slice(2));
const useCursorProjectStubs = cli.flags.has("--cursor-project-stubs");
const modeFlags = [
  "--project-only",
  "--codex-only",
  "--claude-only",
  "--cursor-only",
  "--global-only",
];
const enabledModes = modeFlags.filter((flag) => cli.flags.has(flag));

if (enabledModes.length > 1) {
  console.error(`Use only one mode flag at a time: ${modeFlags.join(", ")}`);
  process.exit(1);
}

let installClaude = true;
let installCursor = true;
let installCodex = true;
let installClaudeGlobal = false;
let installCursorGlobal = false;

if (cli.flags.has("--project-only")) {
  installCodex = false;
}

if (cli.flags.has("--codex-only")) {
  installClaude = false;
  installCursor = false;
}

if (cli.flags.has("--claude-only")) {
  installCursor = false;
  installCodex = false;
}

if (cli.flags.has("--cursor-only")) {
  installClaude = false;
  installCodex = false;
}

if (cli.flags.has("--global-only")) {
  installClaude = false;
  installCursor = false;
}

if (cli.flags.has("--global-all")) {
  installClaudeGlobal = true;
  installCursorGlobal = true;
}

if (cli.flags.has("--global-claude")) {
  installClaudeGlobal = true;
}

if (cli.flags.has("--global-cursor")) {
  installCursorGlobal = true;
}

if (cli.flags.has("--skip-codex")) {
  installCodex = false;
}

if (cli.flags.has("--skip-claude")) {
  installClaude = false;
}

if (cli.flags.has("--skip-cursor")) {
  installCursor = false;
  installCursorGlobal = false;
}

if (cli.flags.has("--skip-claude-global")) {
  installClaudeGlobal = false;
}

if (cli.flags.has("--skip-cursor-global")) {
  installCursorGlobal = false;
}

// --hook-only: install just the Claude skill-router hook into the target
// project (used when the generic library lives at GLOBAL scope and the
// project only needs the deterministic routing layer).
if (cli.flags.has("--hook-only")) {
  installClaude = false;
  installCursor = false;
  installCodex = false;
  installClaudeGlobal = false;
  installCursorGlobal = false;
}

if (
  !installClaude &&
  !installCursor &&
  !installCodex &&
  !installClaudeGlobal &&
  !installCursorGlobal &&
  !cli.flags.has("--claude-hook")
) {
  console.error(
    "No runtime selected. Remove skip flags or choose a specific mode.",
  );
  process.exit(1);
}

const targetRoot = cli.targetRoot;
const claudeHome = resolveClaudeHome(cli.claudeHomeOverride);
const claudeSkillsDir = resolveClaudeSkillsDir(cli.claudeHomeOverride);
const codexHome = resolveCodexHome(cli.codexHomeOverride);
const codexSkillsDir = resolveCodexSkillsDir(cli.codexHomeOverride);
const cursorHome = resolveCursorHome(cli.cursorHomeOverride);
const cursorRulesDirGlobal = resolveCursorRulesDir(cli.cursorHomeOverride);
const profiles = loadCursorProfiles();
const skillDirs = findSkillDirs();
const skills = skillDirs.map((skillDir) => parseSkill(skillDir));
const sourceVersion = getLibraryVersion();

// Claude/Agent Skills spec: `name` must be lowercase [a-z0-9-] and match the
// directory. Warn (non-fatal) so malformed names surface during sync.
for (const skill of skills) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skill.name)) {
    console.warn(
      `Warning: skill name "${skill.name}" is not lowercase kebab-case ([a-z0-9-]); Claude may not register it correctly.`,
    );
  }
}
const plannedWrites = [];
const cleanupSummary = [];

if (installClaude) {
  const claudeSkillsDir = path.join(targetRoot, ".claude", "skills");
  ensureDirIfNeeded(claudeSkillsDir);
  const artifactNames = skills.map((skill) => skill.name);

  if (!cli.dryRun) {
    cleanupSummary.push({
      runtime: "claude-project",
      removed: removeManagedRuntimeArtifacts(claudeSkillsDir),
    });
  }

  for (const skill of skills) {
    const targetDir = path.join(claudeSkillsDir, skill.name);
    plannedWrites.push(
      path.relative(targetRoot, targetDir).replaceAll("\\", "/"),
    );

    if (cli.dryRun) continue;

    fs.rmSync(targetDir, { recursive: true, force: true });
    fs.cpSync(skill.skillDir, targetDir, { recursive: true });
    // Re-emit SKILL.md with Claude-native auto-detection fields (paths /
    // when_to_use). Bundled files (references/, scripts/) stay from the copy.
    fs.writeFileSync(
      path.join(targetDir, "SKILL.md"),
      buildClaudeSkillContent(skill, profiles.get(skill.name)),
      "utf8",
    );
  }

  plannedWrites.push(
    path
      .relative(
        targetRoot,
        path.join(claudeSkillsDir, ".saas-skills-manifest.json"),
      )
      .replaceAll("\\", "/"),
  );

  if (!cli.dryRun) {
    writeManifest(claudeSkillsDir, "claude-project", artifactNames, "project");
  }
}

if (installCursor) {
  const cursorRulesDir = path.join(targetRoot, ".cursor", "rules");
  ensureDirIfNeeded(cursorRulesDir);
  const artifactNames = getCursorArtifactNames(skills, profiles);

  if (!cli.dryRun) {
    cleanupSummary.push({
      runtime: "cursor-project",
      removed: removeManagedRuntimeArtifacts(cursorRulesDir),
    });
  }

  for (const skill of skills) {
    const profile = profiles.get(skill.name);

    if (!profile) {
      throw new Error(`Missing Cursor rule profile for skill ${skill.name}`);
    }

    const targetFile = path.join(cursorRulesDir, profile.file);
    plannedWrites.push(
      path.relative(targetRoot, targetFile).replaceAll("\\", "/"),
    );

    if (cli.dryRun) continue;

    const cursorRule = useCursorProjectStubs
      ? buildCursorProjectStub(skill, profile)
      : buildCursorRule(skill, profile);
    fs.writeFileSync(targetFile, cursorRule, "utf8");
  }

  plannedWrites.push(
    path
      .relative(
        targetRoot,
        path.join(cursorRulesDir, ".saas-skills-manifest.json"),
      )
      .replaceAll("\\", "/"),
  );

  if (!cli.dryRun) {
    writeManifest(cursorRulesDir, "cursor-project", artifactNames, "project");
  }
}

if (installClaudeGlobal) {
  ensureDirIfNeeded(claudeSkillsDir);
  const artifactNames = skills.map((skill) => skill.name);

  if (!cli.dryRun) {
    cleanupSummary.push({
      runtime: "claude-global",
      removed: removeManagedRuntimeArtifacts(claudeSkillsDir),
    });
  }

  for (const skill of skills) {
    const targetDir = path.join(claudeSkillsDir, skill.name);
    plannedWrites.push(targetDir);

    if (cli.dryRun) continue;

    fs.rmSync(targetDir, { recursive: true, force: true });
    fs.cpSync(skill.skillDir, targetDir, { recursive: true });
    // Same Claude-native frontmatter enrichment as the project install above.
    fs.writeFileSync(
      path.join(targetDir, "SKILL.md"),
      buildClaudeSkillContent(skill, profiles.get(skill.name)),
      "utf8",
    );
  }

  plannedWrites.push(path.join(claudeSkillsDir, ".saas-skills-manifest.json"));

  if (!cli.dryRun) {
    writeManifest(claudeSkillsDir, "claude-global", artifactNames, "global");
  }
}

if (installCursorGlobal) {
  ensureDirIfNeeded(cursorRulesDirGlobal);
  const artifactNames = getCursorArtifactNames(skills, profiles, {
    includeUserRulesBootstrap: true,
  });

  if (!cli.dryRun) {
    cleanupSummary.push({
      runtime: "cursor-global",
      removed: removeManagedRuntimeArtifacts(cursorRulesDirGlobal),
    });
  }

  for (const skill of skills) {
    const profile = profiles.get(skill.name);

    if (!profile) {
      throw new Error(`Missing Cursor rule profile for skill ${skill.name}`);
    }

    const targetFile = path.join(cursorRulesDirGlobal, profile.file);
    plannedWrites.push(targetFile);

    if (cli.dryRun) continue;

    fs.writeFileSync(targetFile, buildCursorRule(skill, profile), "utf8");
  }

  const cursorBootstrapPath = path.join(
    cursorRulesDirGlobal,
    cursorUserRulesBootstrapFileName,
  );
  plannedWrites.push(cursorBootstrapPath);

  if (!cli.dryRun) {
    fs.writeFileSync(
      cursorBootstrapPath,
      buildCursorUserRulesBootstrap(skills, profiles),
      "utf8",
    );
  }

  plannedWrites.push(
    path.join(cursorRulesDirGlobal, ".saas-skills-manifest.json"),
  );

  if (!cli.dryRun) {
    writeManifest(
      cursorRulesDirGlobal,
      "cursor-global",
      artifactNames,
      "global",
    );
  }
}

if (cli.flags.has("--claude-hook")) {
  installClaudeSkillRouterHook();
}

if (installCodex) {
  ensureDirIfNeeded(codexSkillsDir);
  const artifactNames = skills.map((skill) => skill.name);

  if (!cli.dryRun) {
    cleanupSummary.push({
      runtime: "codex-global",
      removed: removeManagedRuntimeArtifacts(codexSkillsDir),
    });
  }

  for (const skill of skills) {
    const targetDir = path.join(codexSkillsDir, skill.name);
    plannedWrites.push(targetDir);

    if (cli.dryRun) continue;

    fs.rmSync(targetDir, { recursive: true, force: true });
    fs.cpSync(skill.skillDir, targetDir, { recursive: true });
  }

  plannedWrites.push(path.join(codexSkillsDir, ".saas-skills-manifest.json"));

  if (!cli.dryRun) {
    writeManifest(codexSkillsDir, "codex-global", artifactNames, "global");
  }
}

console.log(`Target root: ${targetRoot}`);
console.log(`Source version: ${sourceVersion}`);
console.log(`Claude home: ${claudeHome}`);
console.log(`Codex home: ${codexHome}`);
console.log(`Cursor home: ${cursorHome}`);
console.log(`Claude global skills dir: ${claudeSkillsDir}`);
console.log(`Codex skills dir: ${codexSkillsDir}`);
console.log(`Cursor global rules dir: ${cursorRulesDirGlobal}`);
console.log(`Claude runtime: ${installClaude ? "enabled" : "skipped"}`);
console.log(`Cursor runtime: ${installCursor ? "enabled" : "skipped"}`);
if (installCursor) {
  console.log(
    `Cursor project rule mode: ${useCursorProjectStubs ? "stub" : "full"}`,
  );
}
console.log(`Codex runtime: ${installCodex ? "enabled" : "skipped"}`);
console.log(
  `Claude global runtime: ${installClaudeGlobal ? "enabled" : "skipped"}`,
);
console.log(
  `Cursor global runtime: ${installCursorGlobal ? "enabled" : "skipped"}`,
);
if (installCursorGlobal) {
  console.log(
    "Cursor global note: ~/.cursor/rules is treated as a compatibility export. For the officially documented global surface, paste CURSOR_USER_RULES.md into Cursor Settings > Rules.",
  );
}
console.log(`Mode: ${cli.dryRun ? "dry-run" : "write"}`);
console.log(`Planned artifacts: ${plannedWrites.length}`);
if (!cli.dryRun) {
  const removedCount = cleanupSummary.reduce(
    (total, entry) => total + entry.removed.length,
    0,
  );
  console.log(`Managed artifacts removed before sync: ${removedCount}`);
}

for (const item of plannedWrites) {
  console.log(`- ${item}`);
}

const duplicateWarning = detectDuplicateClaudeInstall(
  path.join(targetRoot, ".claude", "skills"),
  claudeSkillsDir,
);
if (duplicateWarning) {
  console.warn(`\nWARNING: ${duplicateWarning}`);
}

function ensureDirIfNeeded(dir) {
  if (!cli.dryRun) {
    ensureDir(dir);
  }
}

/**
 * Installs the deterministic Claude skill-router hook into the target project:
 *   - .claude/hooks/skill-router.mjs   (copied from scripts/templates/)
 *   - .claude/skill-routing.json      (generated from the runtime profiles)
 *   - .claude/settings.json           (hooks merged in, never clobbered)
 * Existing user-authored files are preserved: a routing table or hook script
 * not generated by Context Window is left untouched (warning printed).
 */
function installClaudeSkillRouterHook() {
  const claudeDir = path.join(targetRoot, ".claude");
  const hooksDir = path.join(claudeDir, "hooks");
  const hookPath = path.join(hooksDir, "skill-router.mjs");
  const routingPath = path.join(claudeDir, "skill-routing.json");
  const settingsPath = path.join(claudeDir, "settings.json");
  // When the generic library is installed at project scope the hint should
  // point there; otherwise point at the global skills dir.
  const skillsBaseLabel = installClaude ? ".claude/skills" : "~/.claude/skills";

  plannedWrites.push(
    path.relative(targetRoot, hookPath).replaceAll("\\", "/"),
    path.relative(targetRoot, routingPath).replaceAll("\\", "/"),
    path.relative(targetRoot, settingsPath).replaceAll("\\", "/"),
  );

  if (cli.dryRun) return;

  ensureDir(hooksDir);

  const templateContent = fs.readFileSync(claudeRouterTemplatePath, "utf8");
  if (fs.existsSync(hookPath)) {
    const existing = fs.readFileSync(hookPath, "utf8");
    if (existing.includes(claudeRouterMarker)) {
      fs.writeFileSync(hookPath, templateContent, "utf8");
    } else {
      console.warn(
        `Skipping hook script (custom file already present, not Context Window-managed): ${hookPath}`,
      );
    }
  } else {
    fs.writeFileSync(hookPath, templateContent, "utf8");
  }

  const routing = buildClaudeSkillRouting(skills, profiles, {
    skillsBaseLabel,
  });
  if (fs.existsSync(routingPath)) {
    let existingRouting = null;
    try {
      existingRouting = JSON.parse(fs.readFileSync(routingPath, "utf8"));
    } catch {
      existingRouting = null;
    }
    const generatedByUs =
      typeof existingRouting?.$comment === "string" &&
      existingRouting.$comment.includes("Generated by Context Window");
    if (generatedByUs) {
      fs.writeFileSync(
        routingPath,
        `${JSON.stringify(routing, null, 2)}\n`,
        "utf8",
      );
    } else {
      console.warn(
        `Skipping skill-routing.json (custom table already present, not Context Window-managed): ${routingPath}`,
      );
    }
  } else {
    fs.writeFileSync(
      routingPath,
      `${JSON.stringify(routing, null, 2)}\n`,
      "utf8",
    );
  }

  mergeClaudeHookSettings(settingsPath);
}

/**
 * Merges the skill-router hook registration into .claude/settings.json,
 * preserving all existing settings and hooks. Idempotent: entries whose
 * command already references skill-router.mjs are not duplicated.
 * @param {string} settingsPath
 */
function mergeClaudeHookSettings(settingsPath) {
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    } catch {
      console.warn(
        `Skipping settings merge (could not parse existing file): ${settingsPath}`,
      );
      return;
    }
  }

  settings.hooks = settings.hooks ?? {};

  const wanted = [
    {
      event: "UserPromptSubmit",
      entry: {
        hooks: [
          {
            type: "command",
            command: "node .claude/hooks/skill-router.mjs UserPromptSubmit",
            timeout: 15,
          },
        ],
      },
    },
    {
      event: "PreToolUse",
      entry: {
        matcher: "Edit|Write|MultiEdit",
        hooks: [
          {
            type: "command",
            command: "node .claude/hooks/skill-router.mjs PreToolUse",
            timeout: 15,
          },
        ],
      },
    },
  ];

  let changed = false;
  for (const { event, entry } of wanted) {
    const existing = Array.isArray(settings.hooks[event])
      ? settings.hooks[event]
      : [];
    const alreadyRegistered = existing.some((candidate) =>
      (candidate?.hooks || []).some((hook) =>
        String(hook?.command || "").includes("skill-router.mjs"),
      ),
    );
    if (!alreadyRegistered) {
      settings.hooks[event] = [...existing, entry];
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(
      settingsPath,
      `${JSON.stringify(settings, null, 2)}\n`,
      "utf8",
    );
  }
}

function writeManifest(runtimeDir, runtime, artifacts, installScope) {
  const targetLabel = installScope === "project" ? targetRoot : runtimeDir;
  const manifest = buildRuntimeManifest({
    runtime,
    artifacts,
    installScope,
    targetRoot: targetLabel,
  });
  const manifestPath = path.join(runtimeDir, ".saas-skills-manifest.json");
  fs.writeFileSync(
    manifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}
