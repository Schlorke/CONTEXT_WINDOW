import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const libraryRoot = path.join(repoRoot, "saas-skills");
const outputDir = path.resolve(
  process.argv[2] ?? path.join(repoRoot, "dist", "flat-skills"),
);

function findSkillDirs(dir) {
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

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

const manifest = [];

for (const skillDir of findSkillDirs(libraryRoot)) {
  const skillName = path.basename(skillDir);
  const targetDir = path.join(outputDir, skillName);

  if (fs.existsSync(targetDir)) {
    throw new Error(
      `Duplicate skill name detected while flattening: ${skillName}`,
    );
  }

  fs.cpSync(skillDir, targetDir, { recursive: true });
  manifest.push({
    skill: skillName,
    source: path.relative(repoRoot, skillDir).replaceAll("\\", "/"),
  });
}

manifest.sort((a, b) => a.skill.localeCompare(b.skill));
fs.writeFileSync(
  path.join(outputDir, "manifest.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), skills: manifest }, null, 2)}\n`,
  "utf8",
);

console.log(`Exported ${manifest.length} skills to ${outputDir}`);
