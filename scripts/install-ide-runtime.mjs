import fs from "node:fs";
import path from "node:path";
import {
  buildCursorRule,
  ensureDir,
  findSkillDirs,
  loadCursorProfiles,
  parseRuntimeCliArgs,
  parseSkill,
} from "./runtime-adapter-utils.mjs";

const cli = parseRuntimeCliArgs(process.argv.slice(2));
const targetRoot = cli.targetRoot;
const claudeOnly = cli.flags.has("--claude-only");
const cursorOnly = cli.flags.has("--cursor-only");
const dryRun = cli.dryRun;

if (claudeOnly && cursorOnly) {
  console.error("Use either --claude-only or --cursor-only, not both.");
  process.exit(1);
}

const installClaude = !cursorOnly;
const installCursor = !claudeOnly;
const profiles = loadCursorProfiles();
const skillDirs = findSkillDirs();
const plannedWrites = [];

if (installClaude) {
  const claudeSkillsDir = path.join(targetRoot, ".claude", "skills");
  ensureDirIfNeeded(claudeSkillsDir);

  for (const skillDir of skillDirs) {
    const skill = parseSkill(skillDir);
    const targetDir = path.join(claudeSkillsDir, skill.name);
    plannedWrites.push(
      path.relative(targetRoot, targetDir).replaceAll("\\", "/"),
    );

    if (dryRun) continue;

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
    plannedWrites.push(
      path.relative(targetRoot, targetFile).replaceAll("\\", "/"),
    );

    if (dryRun) continue;

    fs.writeFileSync(targetFile, buildCursorRule(skill, profile), "utf8");
  }
}

console.log(`Target root: ${targetRoot}`);
console.log(`Claude runtime: ${installClaude ? "enabled" : "skipped"}`);
console.log(`Cursor runtime: ${installCursor ? "enabled" : "skipped"}`);
console.log(`Mode: ${dryRun ? "dry-run" : "write"}`);
console.log(`Planned artifacts: ${plannedWrites.length}`);

for (const item of plannedWrites) {
  console.log(`- ${item}`);
}

function ensureDirIfNeeded(dir) {
  if (!dryRun) {
    ensureDir(dir);
  }
}
