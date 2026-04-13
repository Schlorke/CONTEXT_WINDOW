import fs from "node:fs";
import path from "node:path";
import {
  findSkillDirs,
  loadCursorProfiles,
  parseRuntimeCliArgs,
  parseSkill,
} from "./runtime-adapter-utils.mjs";

const cli = parseRuntimeCliArgs(process.argv.slice(2));
const targetRoot = cli.targetRoot;
const profiles = loadCursorProfiles();
const skills = findSkillDirs().map((skillDir) => parseSkill(skillDir));
const issues = [];

for (const skill of skills) {
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

  const profile = profiles.get(skill.name);
  if (!profile) {
    issues.push(`Missing Cursor profile for ${skill.name}`);
    continue;
  }

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

if (issues.length > 0) {
  console.error("IDE RUNTIME VERIFICATION FAILED");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log("IDE RUNTIME VERIFICATION PASSED");
console.log(`- Target: ${targetRoot}`);
console.log(`- Claude skills installed: ${skills.length}`);
console.log(`- Cursor rules installed: ${skills.length}`);
