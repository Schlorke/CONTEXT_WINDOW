import fs from "node:fs";
import path from "node:path";
import {
  buildRuntimeManifest,
  buildCursorRule,
  ensureDir,
  findSkillDirs,
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

const cli = parseRuntimeCliArgs(process.argv.slice(2));
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

if (
  !installClaude &&
  !installCursor &&
  !installCodex &&
  !installClaudeGlobal &&
  !installCursorGlobal
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
  const artifactNames = [];

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
    artifactNames.push(profile.file);
    plannedWrites.push(
      path.relative(targetRoot, targetFile).replaceAll("\\", "/"),
    );

    if (cli.dryRun) continue;

    fs.writeFileSync(targetFile, buildCursorRule(skill, profile), "utf8");
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
  }

  plannedWrites.push(path.join(claudeSkillsDir, ".saas-skills-manifest.json"));

  if (!cli.dryRun) {
    writeManifest(claudeSkillsDir, "claude-global", artifactNames, "global");
  }
}

if (installCursorGlobal) {
  ensureDirIfNeeded(cursorRulesDirGlobal);
  const artifactNames = [];

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
    artifactNames.push(profile.file);
    plannedWrites.push(targetFile);

    if (cli.dryRun) continue;

    fs.writeFileSync(targetFile, buildCursorRule(skill, profile), "utf8");
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
console.log(`Codex runtime: ${installCodex ? "enabled" : "skipped"}`);
console.log(
  `Claude global runtime: ${installClaudeGlobal ? "enabled" : "skipped"}`,
);
console.log(
  `Cursor global runtime: ${installCursorGlobal ? "enabled" : "skipped"}`,
);
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

function ensureDirIfNeeded(dir) {
  if (!cli.dryRun) {
    ensureDir(dir);
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
