import fs from "node:fs";
import path from "node:path";
import {
  buildCursorRule,
  ensureDir,
  findSkillDirs,
  loadCursorProfiles,
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

if (!installClaude && !installCursor && !installCodex && !installClaudeGlobal && !installCursorGlobal) {
  console.error("No runtime selected. Remove skip flags or choose a specific mode.");
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
const plannedWrites = [];

if (installClaude) {
  const claudeSkillsDir = path.join(targetRoot, ".claude", "skills");
  ensureDirIfNeeded(claudeSkillsDir);

  for (const skillDir of skillDirs) {
    const skill = parseSkill(skillDir);
    const targetDir = path.join(claudeSkillsDir, skill.name);
    plannedWrites.push(path.relative(targetRoot, targetDir).replaceAll("\\", "/"));

    if (cli.dryRun) continue;

    fs.rmSync(targetDir, { recursive: true, force: true });
    fs.cpSync(skillDir, targetDir, { recursive: true });
  }
}

if (installCursor) {
  const cursorRulesDir = path.join(targetRoot, ".cursor", "rules");
  ensureDirIfNeeded(cursorRulesDir);

  for (const skillDir of skillDirs) {
    const skill = parseSkill(skillDir);
    const profile = profiles.get(skill.name);

    if (!profile) {
      throw new Error(`Missing Cursor rule profile for skill ${skill.name}`);
    }

    const targetFile = path.join(cursorRulesDir, profile.file);
    plannedWrites.push(path.relative(targetRoot, targetFile).replaceAll("\\", "/"));

    if (cli.dryRun) continue;

    fs.writeFileSync(targetFile, buildCursorRule(skill, profile), "utf8");
  }
}

if (installClaudeGlobal) {
  ensureDirIfNeeded(claudeSkillsDir);

  for (const skillDir of skillDirs) {
    const skill = parseSkill(skillDir);
    const targetDir = path.join(claudeSkillsDir, skill.name);
    plannedWrites.push(targetDir);

    if (cli.dryRun) continue;

    fs.rmSync(targetDir, { recursive: true, force: true });
    fs.cpSync(skillDir, targetDir, { recursive: true });
  }
}

if (installCursorGlobal) {
  ensureDirIfNeeded(cursorRulesDirGlobal);

  for (const skillDir of skillDirs) {
    const skill = parseSkill(skillDir);
    const profile = profiles.get(skill.name);

    if (!profile) {
      throw new Error(`Missing Cursor rule profile for skill ${skill.name}`);
    }

    const targetFile = path.join(cursorRulesDirGlobal, profile.file);
    plannedWrites.push(targetFile);

    if (cli.dryRun) continue;

    fs.writeFileSync(targetFile, buildCursorRule(skill, profile), "utf8");
  }
}

if (installCodex) {
  ensureDirIfNeeded(codexSkillsDir);

  for (const skillDir of skillDirs) {
    const skill = parseSkill(skillDir);
    const targetDir = path.join(codexSkillsDir, skill.name);
    plannedWrites.push(targetDir);

    if (cli.dryRun) continue;

    fs.rmSync(targetDir, { recursive: true, force: true });
    fs.cpSync(skillDir, targetDir, { recursive: true });
  }
}

console.log(`Target root: ${targetRoot}`);
console.log(`Claude home: ${claudeHome}`);
console.log(`Codex home: ${codexHome}`);
console.log(`Cursor home: ${cursorHome}`);
console.log(`Claude global skills dir: ${claudeSkillsDir}`);
console.log(`Codex skills dir: ${codexSkillsDir}`);
console.log(`Cursor global rules dir: ${cursorRulesDirGlobal}`);
console.log(`Claude runtime: ${installClaude ? "enabled" : "skipped"}`);
console.log(`Cursor runtime: ${installCursor ? "enabled" : "skipped"}`);
console.log(`Codex runtime: ${installCodex ? "enabled" : "skipped"}`);
console.log(`Claude global runtime: ${installClaudeGlobal ? "enabled" : "skipped"}`);
console.log(`Cursor global runtime: ${installCursorGlobal ? "enabled" : "skipped"}`);
console.log(`Mode: ${cli.dryRun ? "dry-run" : "write"}`);
console.log(`Planned artifacts: ${plannedWrites.length}`);

for (const item of plannedWrites) {
  console.log(`- ${item}`);
}

function ensureDirIfNeeded(dir) {
  if (!cli.dryRun) {
    ensureDir(dir);
  }
}
