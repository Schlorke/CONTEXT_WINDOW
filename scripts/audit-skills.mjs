import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const libraryRoot = path.join(repoRoot, "saas-skills");
const evalMatrixPath = path.join(
  libraryRoot,
  "evals",
  "skill-trigger-matrix.json",
);

function walk(dir, matcher) {
  const results = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...walk(fullPath, matcher));
      continue;
    }

    if (matcher(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

function trimReferenceToken(token) {
  return token.replace(/[.*)\],;:]+$/g, "");
}

function countLines(content) {
  const lines = content.split(/\r?\n/);
  if (lines.length > 0 && lines.at(-1) === "") {
    lines.pop();
  }
  return lines.length;
}

function parseFrontmatter(rawContent) {
  const match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) return null;

  const yamlText = match[1];
  const name = yamlText.match(/^name:\s*(.+)$/m)?.[1]?.trim() ?? null;
  const description =
    yamlText.match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? null;
  const hasMetadata = /^metadata:\s*$/m.test(yamlText);

  return { yamlText, name, description, hasMetadata };
}

function hasSection(rawContent, sectionName) {
  return new RegExp(`^##?\\s+${sectionName}`, "im").test(rawContent);
}

const skillFiles = walk(
  libraryRoot,
  (file) => path.basename(file) === "SKILL.md",
);
const evalMatrix = JSON.parse(fs.readFileSync(evalMatrixPath, "utf8"));
const minimums = evalMatrix.minimum_case_counts ?? {
  should_trigger: 3,
  should_not_trigger: 3,
  conflicts: 1,
};
const evalEntries = new Map(
  evalMatrix.skills.map((entry) => [entry.skill, entry]),
);

const issues = [];
const summaries = [];

for (const skillFile of skillFiles) {
  const rawContent = fs.readFileSync(skillFile, "utf8");
  const lines = countLines(rawContent);
  const frontmatter = parseFrontmatter(rawContent);
  const skillDir = path.dirname(skillFile);
  const skillName = path.basename(skillDir);
  const collectionName = path.basename(path.dirname(skillDir));

  if (!frontmatter) {
    issues.push(`${skillName}: missing or malformed YAML frontmatter`);
    continue;
  }

  if (frontmatter.name !== skillName) {
    issues.push(`${skillName}: frontmatter name does not match directory name`);
  }

  if (!frontmatter.description) {
    issues.push(`${skillName}: missing frontmatter description`);
  }

  if (!frontmatter.hasMetadata) {
    issues.push(`${skillName}: missing metadata block in frontmatter`);
  }

  if (lines > 500) {
    issues.push(`${skillName}: exceeds 500 lines (${lines})`);
  }

  if (
    !hasSection(rawContent, "Anti-Patterns") &&
    !hasSection(rawContent, "Common Anti-Patterns")
  ) {
    issues.push(`${skillName}: missing anti-patterns section`);
  }

  if (!/fallback/i.test(rawContent)) {
    issues.push(`${skillName}: missing fallback clause`);
  }

  if (
    !hasSection(rawContent, "Enforcement") &&
    !/MANDATORY/i.test(rawContent)
  ) {
    issues.push(`${skillName}: missing enforcement section`);
  }

  if (!hasSection(rawContent, "Source References")) {
    issues.push(`${skillName}: missing source references section`);
  }

  const referenceMatches = [
    ...rawContent.matchAll(/(?:references|assets)\/[^\s)`"'`]+/g),
  ];
  for (const match of referenceMatches) {
    const relativePath = trimReferenceToken(match[0]);
    const resolvedPath = path.join(skillDir, relativePath);
    if (!fs.existsSync(resolvedPath)) {
      issues.push(`${skillName}: broken reference path ${relativePath}`);
    }
  }

  const evalEntry = evalEntries.get(skillName);
  if (!evalEntry) {
    issues.push(`${skillName}: missing entry in eval matrix`);
  } else {
    if ((evalEntry.should_trigger?.length ?? 0) < minimums.should_trigger) {
      issues.push(
        `${skillName}: should_trigger count below minimum (${evalEntry.should_trigger?.length ?? 0}/${minimums.should_trigger})`,
      );
    }

    if (
      (evalEntry.should_not_trigger?.length ?? 0) < minimums.should_not_trigger
    ) {
      issues.push(
        `${skillName}: should_not_trigger count below minimum (${evalEntry.should_not_trigger?.length ?? 0}/${minimums.should_not_trigger})`,
      );
    }

    if ((evalEntry.conflicts?.length ?? 0) < minimums.conflicts) {
      issues.push(
        `${skillName}: conflicts count below minimum (${evalEntry.conflicts?.length ?? 0}/${minimums.conflicts})`,
      );
    }

    if ((evalEntry.minimum_output?.length ?? 0) < 3) {
      issues.push(
        `${skillName}: minimum_output should list at least 3 expectations`,
      );
    }

    for (const testCase of evalEntry.should_trigger ?? []) {
      if (testCase.expected_primary_skill !== skillName) {
        issues.push(
          `${skillName}: trigger case ${testCase.id} points to ${testCase.expected_primary_skill}`,
        );
      }
    }

    for (const testCase of evalEntry.should_not_trigger ?? []) {
      if (testCase.expected_primary_skill === skillName) {
        issues.push(
          `${skillName}: anti-trigger case ${testCase.id} incorrectly points back to the same skill`,
        );
      }
    }
  }

  summaries.push({
    skill: skillName,
    collection: collectionName,
    lines,
    shouldTrigger: evalEntry?.should_trigger?.length ?? 0,
    shouldNotTrigger: evalEntry?.should_not_trigger?.length ?? 0,
    conflicts: evalEntry?.conflicts?.length ?? 0,
  });
}

for (const evalSkillName of evalEntries.keys()) {
  if (
    !skillFiles.some(
      (file) => path.basename(path.dirname(file)) === evalSkillName,
    )
  ) {
    issues.push(
      `${evalSkillName}: present in eval matrix but missing from library`,
    );
  }
}

if (issues.length > 0) {
  console.error("SKILL AUDIT FAILED");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

const totals = summaries.reduce(
  (acc, item) => {
    acc.shouldTrigger += item.shouldTrigger;
    acc.shouldNotTrigger += item.shouldNotTrigger;
    acc.conflicts += item.conflicts;
    return acc;
  },
  { shouldTrigger: 0, shouldNotTrigger: 0, conflicts: 0 },
);

console.log("SKILL AUDIT PASSED");
console.log(`- Skills audited: ${summaries.length}`);
console.log(`- Trigger evals: ${totals.shouldTrigger}`);
console.log(`- Anti-trigger evals: ${totals.shouldNotTrigger}`);
console.log(`- Conflict evals: ${totals.conflicts}`);
console.log(
  `- Max skill length: ${Math.max(...summaries.map((item) => item.lines))}`,
);
