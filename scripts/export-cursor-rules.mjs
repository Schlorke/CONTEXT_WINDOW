import fs from "node:fs";
import path from "node:path";
import {
  buildCursorRule,
  ensureDir,
  findSkillDirs,
  loadCursorProfiles,
  parseSkill,
  repoRoot,
} from "./runtime-adapter-utils.mjs";

const outputDir = path.resolve(
  process.argv[2] ?? path.join(repoRoot, "dist", "cursor-rules"),
);

const profiles = loadCursorProfiles();
const skillDirs = findSkillDirs();

fs.rmSync(outputDir, { recursive: true, force: true });
ensureDir(outputDir);

const manifest = [];

for (const skillDir of skillDirs) {
  const skill = parseSkill(skillDir);
  const profile = profiles.get(skill.name);

  if (!profile) {
    throw new Error(`Missing Cursor rule profile for skill ${skill.name}`);
  }

  const filePath = path.join(outputDir, profile.file);
  fs.writeFileSync(filePath, buildCursorRule(skill, profile), "utf8");

  manifest.push({
    skill: skill.name,
    file: profile.file,
    globs: profile.globs ?? [],
    source: skill.sourceRelativePath,
  });
}

manifest.sort((a, b) => a.skill.localeCompare(b.skill));
fs.writeFileSync(
  path.join(outputDir, "manifest.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), rules: manifest }, null, 2)}\n`,
  "utf8",
);

console.log(`Exported ${manifest.length} Cursor rules to ${outputDir}`);
