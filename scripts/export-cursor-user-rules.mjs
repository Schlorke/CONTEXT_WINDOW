import fs from "node:fs";
import path from "node:path";
import {
  buildCursorUserRulesBootstrap,
  cursorUserRulesBootstrapFileName,
  ensureDir,
  findSkillDirs,
  getLibraryVersion,
  loadCursorProfiles,
  parseSkill,
  repoRoot,
} from "./runtime-adapter-utils.mjs";

const outputDir = path.resolve(
  process.argv[2] ?? path.join(repoRoot, "dist", "cursor-user-rules"),
);

const profiles = loadCursorProfiles();
const skills = findSkillDirs().map((skillDir) => parseSkill(skillDir));
const version = getLibraryVersion();
const bootstrap = buildCursorUserRulesBootstrap(skills, profiles);
const manifest = skills
  .map((skill) => ({
    skill: skill.name,
    description: profiles.get(skill.name)?.description || skill.description,
    source: skill.sourceRelativePath,
  }))
  .sort((a, b) => a.skill.localeCompare(b.skill));

fs.rmSync(outputDir, { recursive: true, force: true });
ensureDir(outputDir);

fs.writeFileSync(
  path.join(outputDir, cursorUserRulesBootstrapFileName),
  bootstrap,
  "utf8",
);

const readme = `# Cursor User Rules Export

Este diretório contém o bootstrap global recomendado para o Cursor.

## O Que Este Export Faz

- gera um texto curto para colar em \`Cursor Settings > Rules\`
- preserva a biblioteca canônica fora das \`User Rules\`
- mantém \`.cursor/rules/*.mdc\` como runtime oficial por projeto
- evita despejar o corpo completo das \`17\` skills em uma regra global sempre ativa

## Como Usar

1. Instale o runtime de compatibilidade com:

\`\`\`bash
pnpm install:cursor-global
\`\`\`

2. Abra:

\`\`\`text
${path.join(outputDir, cursorUserRulesBootstrapFileName).replaceAll("\\", "/")}
\`\`\`

3. Copie o conteúdo e cole em:

\`\`\`text
Cursor Settings > Rules
\`\`\`

4. Para repositórios específicos, continue preferindo:

\`\`\`text
.cursor/rules/*.mdc
\`\`\`

## Limite Importante

Este bootstrap global melhora a orientação do Cursor, mas não substitui as \`Project Rules\` do repositório quando você precisa de comportamento confiável por projeto.
`;

fs.writeFileSync(path.join(outputDir, "README.md"), `${readme}\n`, "utf8");
fs.writeFileSync(
  path.join(outputDir, "manifest.json"),
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      version,
      file: cursorUserRulesBootstrapFileName,
      skills: manifest,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Exported Cursor User Rules bootstrap to ${outputDir}`);
