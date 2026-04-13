import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const repoRoot = path.resolve(__dirname, "..");
export const libraryRoot = path.join(repoRoot, "saas-skills");
export const evalMatrixPath = path.join(
  libraryRoot,
  "evals",
  "skill-trigger-matrix.json",
);
export const evalResultsDir = path.join(libraryRoot, "evals", "results");

export function loadEvalMatrix() {
  return JSON.parse(fs.readFileSync(evalMatrixPath, "utf8"));
}

export function buildReplayCases(evalMatrix) {
  const skillLookup = new Map(
    evalMatrix.skills.map((entry) => [entry.skill, entry]),
  );
  const cases = [];

  for (const entry of evalMatrix.skills) {
    for (const testCase of entry.should_trigger ?? []) {
      cases.push(
        createReplayCase({
          entry,
          testCase,
          caseType: "should_trigger",
          skillLookup,
        }),
      );
    }

    for (const testCase of entry.should_not_trigger ?? []) {
      cases.push(
        createReplayCase({
          entry,
          testCase,
          caseType: "should_not_trigger",
          skillLookup,
        }),
      );
    }

    for (const testCase of entry.conflicts ?? []) {
      cases.push(
        createReplayCase({
          entry,
          testCase,
          caseType: "conflict",
          skillLookup,
        }),
      );
    }
  }

  return cases.sort((a, b) => a.id.localeCompare(b.id));
}

function createReplayCase({ entry, testCase, caseType, skillLookup }) {
  const expectedSkill = skillLookup.get(testCase.expected_primary_skill);

  if (!expectedSkill) {
    throw new Error(
      `Case ${testCase.id} points to missing expected skill ${testCase.expected_primary_skill}`,
    );
  }

  return {
    id: testCase.id,
    source_skill: entry.skill,
    collection: entry.collection,
    case_type: caseType,
    prompt: testCase.prompt,
    reason: testCase.reason ?? null,
    expected_primary_skill: testCase.expected_primary_skill,
    expected_secondary_skills: testCase.expected_secondary_skills ?? [],
    expected_minimum_output: expectedSkill.minimum_output ?? [],
    resolution: testCase.resolution ?? null,
  };
}

export function buildReplayTemplate(evalMatrix, environment) {
  const cases = buildReplayCases(evalMatrix);

  return {
    matrix_version: evalMatrix.version ?? "unknown",
    generated_at: new Date().toISOString(),
    environment,
    summary: {
      total_cases: cases.length,
      should_trigger: cases.filter(
        (item) => item.case_type === "should_trigger",
      ).length,
      should_not_trigger: cases.filter(
        (item) => item.case_type === "should_not_trigger",
      ).length,
      conflicts: cases.filter((item) => item.case_type === "conflict").length,
    },
    instructions: {
      status_values: ["pending", "passed", "failed", "partial", "not-run"],
      minimum_output_rule:
        "Mark each covered expected_minimum_output item verbatim in result.minimum_output_covered.",
      transcript_rule:
        "Use result.transcript_ref to point to the log, screenshot, or thread that recorded the replay.",
    },
    cases: cases.map((item) => ({
      ...item,
      result: {
        status: "pending",
        observed_primary_skill: null,
        observed_secondary_skills: [],
        minimum_output_covered: [],
        notes: "",
        transcript_ref: "",
      },
    })),
  };
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function normalizeList(list) {
  return [
    ...new Set((list ?? []).map((item) => `${item}`.trim()).filter(Boolean)),
  ].sort();
}

export function toPercent(numerator, denominator) {
  if (denominator === 0) return "0.0%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}
