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

let verifyClaude = true;
let verifyCursor = true;
let verifyCodex = true;
let verifyClaudeGlobal = false;
let verifyCursorGlobal = false;

if (cli.flags.has("--project-only")) {
  verifyCodex = false;
}

if (cli.flags.has("--codex-only")) {
  verifyClaude = false;
  verifyCursor = false;
}

if (cli.flags.has("--claude-only")) {
  verifyCursor = false;
  verifyCodex = false;
}

if (cli.flags.has("--cursor-only")) {
  verifyClaude = false;
  verifyCodex = false;
}

if (cli.flags.has("--global-only")) {
  verifyClaude = false;
  verifyCursor = false;
}

if (cli.flags.has("--global-all")) {
  verifyClaudeGlobal = true;
  verifyCursorGlobal = true;
}

if (cli.flags.has("--global-claude")) {
  verifyClaudeGlobal = true;
}

if (cli.flags.has("--global-cursor")) {
  verifyCursorGlobal = true;
}

if (cli.flags.has("--skip-codex")) {
  verifyCodex = false;
}

if (cli.flags.has("--skip-claude")) {
  verifyClaude = false;
}

if (cli.flags.has("--skip-cursor")) {
  verifyCursor = false;
  verifyCursorGlobal = false;
}

if (cli.flags.has("--skip-claude-global")) {
  verifyClaudeGlobal = false;
}

if (cli.flags.has("--skip-cursor-global")) {
  verifyCursorGlobal = false;
}

if (
  !verifyClaude &&
  !verifyCursor &&
  !verifyCodex &&
  !verifyClaudeGlobal &&
  !verifyCursorGlobal
) {
  console.error("No runtime selected for verification.");
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
const issues = [];

const runtimeChecks = [];
if (verifyClaude) {
  runtimeChecks.push({
    dir: path.join(targetRoot, ".claude", "skills"),
    expectedArtifacts: skills.map((skill) => skill.name),
    label: "Claude project runtime",
  });
}
if (verifyCursor) {
  runtimeChecks.push({
    dir: path.join(targetRoot, ".cursor", "rules"),
    expectedArtifacts: getCursorArtifactNames(skills, profiles),
    label: "Cursor project runtime",
  });
}
if (verifyClaudeGlobal) {
  runtimeChecks.push({
    dir: claudeSkillsDir,
    expectedArtifacts: skills.map((skill) => skill.name),
    label: "Claude global runtime",
  });
}
if (verifyCursorGlobal) {
  runtimeChecks.push({
    dir: cursorRulesDirGlobal,
    expectedArtifacts: getCursorArtifactNames(skills, profiles, {
      includeUserRulesBootstrap: true,
    }),
    label: "Cursor global runtime",
  });
}
if (verifyCodex) {
  runtimeChecks.push({
    dir: codexSkillsDir,
    expectedArtifacts: skills.map((skill) => skill.name),
    label: "Codex runtime",
  });
}

for (const runtimeCheck of runtimeChecks) {
  const manifest = readRuntimeManifest(runtimeCheck.dir);

  if (!manifest) {
    issues.push(
      `Missing runtime manifest for ${runtimeCheck.label}: ${path.join(runtimeCheck.dir, ".saas-skills-manifest.json")}`,
    );
    continue;
  }

  if (manifest.library !== managedLibraryId) {
    issues.push(
      `Unexpected runtime manifest library for ${runtimeCheck.label}: ${runtimeCheck.dir}`,
    );
  }

  if (manifest.version !== currentVersion) {
    issues.push(
      `Outdated runtime manifest for ${runtimeCheck.label}: installed=${manifest.version ?? "unknown"}, source=${currentVersion}. Re-run sync.`,
    );
  }

  if (!Array.isArray(manifest.artifacts)) {
    issues.push(
      `Invalid runtime manifest artifacts list for ${runtimeCheck.label}: ${runtimeCheck.dir}`,
    );
    continue;
  }

  for (const artifact of runtimeCheck.expectedArtifacts) {
    if (!manifest.artifacts.includes(artifact)) {
      issues.push(
        `Runtime manifest missing artifact ${artifact} for ${runtimeCheck.label}: ${runtimeCheck.dir}`,
      );
    }
  }
}

for (const skill of skills) {
  if (verifyClaude) {
    const claudeSkillFile = path.join(
      targetRoot,
      ".claude",
      "skills",
      skill.name,
      "SKILL.md",
    );
    if (!fs.existsSync(claudeSkillFile)) {
      issues.push(
        `Missing Claude skill install for ${skill.name}: ${claudeSkillFile}`,
      );
    }
  }

  if (verifyCursor) {
    const profile = profiles.get(skill.name);
    if (!profile) {
      issues.push(`Missing Cursor profile for ${skill.name}`);
    } else {
      const cursorRuleFile = path.join(
        targetRoot,
        ".cursor",
        "rules",
        profile.file,
      );
      if (!fs.existsSync(cursorRuleFile)) {
        issues.push(
          `Missing Cursor rule install for ${skill.name}: ${cursorRuleFile}`,
        );
      }
    }
  }

  if (verifyClaudeGlobal) {
    const globalClaudeSkillFile = path.join(
      claudeSkillsDir,
      skill.name,
      "SKILL.md",
    );
    if (!fs.existsSync(globalClaudeSkillFile)) {
      issues.push(
        `Missing global Claude skill install for ${skill.name}: ${globalClaudeSkillFile}`,
      );
    }
  }

  if (verifyCursorGlobal) {
    const profile = profiles.get(skill.name);
    if (!profile) {
      issues.push(`Missing Cursor profile for ${skill.name}`);
    } else {
      const globalCursorRuleFile = path.join(
        cursorRulesDirGlobal,
        profile.file,
      );
      if (!fs.existsSync(globalCursorRuleFile)) {
        issues.push(
          `Missing global Cursor rule install for ${skill.name}: ${globalCursorRuleFile}`,
        );
      }
    }
  }

  if (verifyCodex) {
    const codexSkillFile = path.join(codexSkillsDir, skill.name, "SKILL.md");
    if (!fs.existsSync(codexSkillFile)) {
      issues.push(
        `Missing Codex skill install for ${skill.name}: ${codexSkillFile}`,
      );
    }
  }
}

if (issues.length > 0) {
  console.error("AGENT RUNTIME VERIFICATION FAILED");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log("AGENT RUNTIME VERIFICATION PASSED");
console.log(`- Target: ${targetRoot}`);
console.log(`- Source version: ${currentVersion}`);
console.log(`- Claude home: ${claudeHome}`);
console.log(`- Codex home: ${codexHome}`);
console.log(`- Cursor home: ${cursorHome}`);
if (verifyClaude) {
  console.log(`- Claude skills installed: ${skills.length}`);
}
if (verifyCursor) {
  console.log(`- Cursor rules installed: ${skills.length}`);
}
if (verifyClaudeGlobal) {
  console.log(`- Global Claude skills installed: ${skills.length}`);
}
if (verifyCursorGlobal) {
  console.log(`- Global Cursor rules installed: ${skills.length}`);
  console.log(
    "- Global Cursor note: compatibility files in ~/.cursor/rules were verified. Cursor Settings > Rules remains the officially documented global surface; use CURSOR_USER_RULES.md for the paste-ready bootstrap.",
  );
}
if (verifyCodex) {
  console.log(`- Codex skills installed: ${skills.length}`);
}
