import fs from "node:fs";
import path from "node:path";
import {
  findSkillDirs,
  getLibraryVersion,
  getCursorArtifactNames,
  loadCursorProfiles,
  managedLibraryId,
  parseRuntimeCliArgs,
  parseSkill,
  readRuntimeManifest,
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

let checkClaude = true;
let checkCursor = true;
let checkCodex = true;
let checkClaudeGlobal = false;
let checkCursorGlobal = false;

if (cli.flags.has("--project-only")) {
  checkCodex = false;
}

if (cli.flags.has("--codex-only")) {
  checkClaude = false;
  checkCursor = false;
}

if (cli.flags.has("--claude-only")) {
  checkCursor = false;
  checkCodex = false;
}

if (cli.flags.has("--cursor-only")) {
  checkClaude = false;
  checkCodex = false;
}

if (cli.flags.has("--global-only")) {
  checkClaude = false;
  checkCursor = false;
}

if (cli.flags.has("--global-all")) {
  checkClaudeGlobal = true;
  checkCursorGlobal = true;
}

if (cli.flags.has("--global-claude")) {
  checkClaudeGlobal = true;
}

if (cli.flags.has("--global-cursor")) {
  checkCursorGlobal = true;
}

if (cli.flags.has("--skip-codex")) {
  checkCodex = false;
}

if (cli.flags.has("--skip-claude")) {
  checkClaude = false;
}

if (cli.flags.has("--skip-cursor")) {
  checkCursor = false;
  checkCursorGlobal = false;
}

if (cli.flags.has("--skip-claude-global")) {
  checkClaudeGlobal = false;
}

if (cli.flags.has("--skip-cursor-global")) {
  checkCursorGlobal = false;
}

if (
  !checkClaude &&
  !checkCursor &&
  !checkCodex &&
  !checkClaudeGlobal &&
  !checkCursorGlobal
) {
  console.error("No runtime selected for status.");
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
const skills = findSkillDirs().map((skillDir) => parseSkill(skillDir));
const currentVersion = getLibraryVersion();

const runtimeChecks = [];

if (checkClaude) {
  runtimeChecks.push({
    dir: path.join(targetRoot, ".claude", "skills"),
    expectedArtifacts: skills.map((skill) => skill.name),
    label: "Claude project",
  });
}

if (checkCursor) {
  runtimeChecks.push({
    dir: path.join(targetRoot, ".cursor", "rules"),
    expectedArtifacts: getCursorArtifactNames(skills, profiles),
    label: "Cursor project",
  });
}

if (checkClaudeGlobal) {
  runtimeChecks.push({
    dir: claudeSkillsDir,
    expectedArtifacts: skills.map((skill) => skill.name),
    label: "Claude global",
  });
}

if (checkCursorGlobal) {
  runtimeChecks.push({
    dir: cursorRulesDirGlobal,
    expectedArtifacts: getCursorArtifactNames(skills, profiles, {
      includeUserRulesBootstrap: true,
    }),
    label: "Cursor global",
  });
}

if (checkCodex) {
  runtimeChecks.push({
    dir: codexSkillsDir,
    expectedArtifacts: skills.map((skill) => skill.name),
    label: "Codex global",
  });
}

console.log(`Source version: ${currentVersion}`);
console.log(`Target root: ${targetRoot}`);
console.log(`Codex home: ${codexHome}`);
console.log(`Claude home: ${claudeHome}`);
console.log(`Cursor home: ${cursorHome}`);

for (const runtimeCheck of runtimeChecks) {
  const manifest = readRuntimeManifest(runtimeCheck.dir);
  let status = "missing";
  let details = "No managed runtime manifest found.";

  if (manifest) {
    const missingArtifacts = runtimeCheck.expectedArtifacts.filter(
      (artifact) => {
        if (!manifest.artifacts?.includes(artifact)) {
          return true;
        }

        const artifactPath = path.join(runtimeCheck.dir, artifact);
        return !fs.existsSync(artifactPath);
      },
    );

    if (manifest.library !== managedLibraryId) {
      status = "foreign";
      details = `Manifest library is ${manifest.library ?? "unknown"}, expected ${managedLibraryId}.`;
    } else if (manifest.version !== currentVersion) {
      status = "outdated";
      details = `Installed ${manifest.version ?? "unknown"}; source is ${currentVersion}. Re-run sync.`;
    } else if (missingArtifacts.length > 0) {
      status = "incomplete";
      details = `Missing ${missingArtifacts.length} generated artifacts. Re-run sync.`;
    } else {
      status = "current";
      details = `Installed ${manifest.version} with ${manifest.skillCount ?? manifest.artifacts?.length ?? 0} artifacts.`;
      if (runtimeCheck.label === "Cursor global") {
        details =
          "Compatibility export is current in ~/.cursor/rules and includes a paste-ready CURSOR_USER_RULES.md bootstrap. Cursor Settings > Rules remains the officially documented global surface.";
      }
    }
  } else if (fs.existsSync(runtimeCheck.dir)) {
    details =
      "Runtime directory exists but is not managed by this library yet.";
  }

  console.log(`- ${runtimeCheck.label}: ${status}`);
  console.log(`  Path: ${runtimeCheck.dir}`);
  console.log(`  ${details}`);
}
