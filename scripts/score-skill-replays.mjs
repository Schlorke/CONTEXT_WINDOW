import fs from "node:fs";
import path from "node:path";
import {
  buildReplayCases,
  evalResultsDir,
  loadEvalMatrix,
  normalizeList,
  toPercent,
} from "./skill-eval-utils.mjs";

const validStatusValues = new Set([
  "pending",
  "passed",
  "failed",
  "partial",
  "not-run",
]);
const inputArg = process.argv[2];
const inputPath = path.resolve(inputArg ?? evalResultsDir);
const evalMatrix = loadEvalMatrix();
const expectedCases = buildReplayCases(evalMatrix);
const expectedMap = new Map(expectedCases.map((item) => [item.id, item]));

const replayTargets = collectReplayTargets(inputPath);

if (replayTargets.length === 0) {
  console.error(
    "No valid replay result files found. Use pnpm evals:init -- <environment> first.",
  );
  process.exit(1);
}

const reports = [];

for (const { filePath, replay } of replayTargets) {
  const report = scoreReplayFile(replay, filePath);
  const reportPath = filePath.replace(/\.json$/i, ".report.md");

  fs.writeFileSync(reportPath, report.markdown, "utf8");
  reports.push(report);
}

if (reports.length > 1) {
  const summaryPath = path.join(
    path.dirname(replayTargets[0].filePath),
    "SUMMARY.md",
  );
  fs.writeFileSync(summaryPath, buildSummaryMarkdown(reports), "utf8");
  console.log(`Wrote consolidated summary to ${summaryPath}`);
}

for (const report of reports) {
  console.log(
    `[${report.environment}] pass=${report.passed}/${report.total} (${toPercent(report.passed, report.total)}), pending=${report.pending}, fail=${report.failed}`,
  );
  console.log(`Report: ${report.reportPath}`);
}

function scoreReplayFile(replay, filePath) {
  const caseMap = new Map((replay.cases ?? []).map((item) => [item.id, item]));
  const environment = replay.environment ?? path.basename(filePath, ".json");
  const findings = [];
  const perSkill = new Map();
  let passed = 0;
  let failed = 0;
  let pending = 0;

  for (const expectedCase of expectedCases) {
    const replayCase = caseMap.get(expectedCase.id);

    if (!replayCase) {
      findings.push({
        id: expectedCase.id,
        expected_primary_skill: expectedCase.expected_primary_skill,
        observed_primary_skill: null,
        status: "pending",
        selection_pass: false,
        output_pass: false,
        notes: "Case missing from replay file.",
      });
      pending += 1;
      trackPerSkill(perSkill, expectedCase.expected_primary_skill, "pending");
      continue;
    }

    const result = replayCase.result ?? {};
    const status = result.status ?? "pending";

    if (!validStatusValues.has(status)) {
      throw new Error(
        `Replay file ${filePath} contains invalid status "${status}" for case ${expectedCase.id}`,
      );
    }

    const observedPrimary = result.observed_primary_skill ?? null;
    const observedSecondary = normalizeList(result.observed_secondary_skills);
    const coveredOutputs = normalizeList(result.minimum_output_covered);
    const expectedSecondary = normalizeList(
      expectedCase.expected_secondary_skills,
    );
    const expectedOutputs = normalizeList(expectedCase.expected_minimum_output);

    const selectionPass =
      observedPrimary === expectedCase.expected_primary_skill;
    const secondaryPass =
      expectedSecondary.length === 0 ||
      expectedSecondary.every((item) => observedSecondary.includes(item));
    const outputPass =
      expectedOutputs.length === 0 ||
      expectedOutputs.every((item) => coveredOutputs.includes(item));

    const derivedPass = selectionPass && secondaryPass && outputPass;

    findings.push({
      id: expectedCase.id,
      case_type: expectedCase.case_type,
      expected_primary_skill: expectedCase.expected_primary_skill,
      observed_primary_skill: observedPrimary,
      status,
      selection_pass: selectionPass && secondaryPass,
      output_pass: outputPass,
      derived_pass: derivedPass,
      notes: result.notes ?? "",
      transcript_ref: result.transcript_ref ?? "",
    });

    if (status === "pending" || status === "not-run") {
      pending += 1;
      trackPerSkill(perSkill, expectedCase.expected_primary_skill, "pending");
      continue;
    }

    if (status === "passed" && derivedPass) {
      passed += 1;
      trackPerSkill(perSkill, expectedCase.expected_primary_skill, "passed");
    } else {
      failed += 1;
      trackPerSkill(perSkill, expectedCase.expected_primary_skill, "failed");
    }
  }

  for (const replayCaseId of caseMap.keys()) {
    if (!expectedMap.has(replayCaseId)) {
      throw new Error(
        `Replay file ${filePath} contains unknown case id ${replayCaseId}`,
      );
    }
  }

  const markdown = buildReplayMarkdown({
    environment,
    filePath,
    total: expectedCases.length,
    passed,
    failed,
    pending,
    findings,
    perSkill,
  });

  return {
    environment,
    total: expectedCases.length,
    passed,
    failed,
    pending,
    reportPath: filePath.replace(/\.json$/i, ".report.md"),
    markdown,
  };
}

function collectReplayTargets(inputFilePath) {
  if (!fs.existsSync(inputFilePath)) {
    return [];
  }

  if (!fs.statSync(inputFilePath).isDirectory()) {
    return [{ filePath: inputFilePath, replay: readReplayFile(inputFilePath) }];
  }

  const entries = [];

  for (const fileName of fs.readdirSync(inputFilePath)) {
    if (!fileName.endsWith(".json")) continue;

    const filePath = path.join(inputFilePath, fileName);
    const replay = readReplayFile(filePath, { allowSkip: true });

    if (replay) {
      entries.push({ filePath, replay });
    }
  }

  return entries;
}

function readReplayFile(filePath, options = {}) {
  const { allowSkip = false } = options;
  const relativePath = path
    .relative(process.cwd(), filePath)
    .replaceAll("\\", "/");
  let replay;

  try {
    replay = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    if (allowSkip) {
      console.warn(`Skipping ${relativePath}: invalid JSON (${error.message})`);
      return null;
    }
    throw error;
  }

  const validationError = validateReplayShape(replay, filePath);

  if (!validationError) {
    return replay;
  }

  if (allowSkip) {
    console.warn(`Skipping ${relativePath}: ${validationError}`);
    return null;
  }

  throw new Error(validationError);
}

function validateReplayShape(replay, filePath) {
  if (!replay || typeof replay !== "object" || Array.isArray(replay)) {
    return `Replay file ${filePath} must contain a JSON object`;
  }

  if (
    typeof replay.environment !== "string" ||
    replay.environment.trim().length === 0
  ) {
    return `Replay file ${filePath} is missing a valid "environment" field`;
  }

  if (!Array.isArray(replay.cases)) {
    return `Replay file ${filePath} is missing a "cases" array`;
  }

  return null;
}

function trackPerSkill(store, skill, status) {
  const current = store.get(skill) ?? { passed: 0, failed: 0, pending: 0 };
  current[status] += 1;
  store.set(skill, current);
}

function buildReplayMarkdown({
  environment,
  filePath,
  total,
  passed,
  failed,
  pending,
  findings,
  perSkill,
}) {
  const failedCases = findings.filter(
    (item) =>
      item.status !== "pending" &&
      item.status !== "not-run" &&
      !item.derived_pass,
  );
  const pendingCases = findings.filter(
    (item) => item.status === "pending" || item.status === "not-run",
  );
  const skillRows = [...perSkill.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(
      ([skill, stats]) =>
        `| \`${skill}\` | ${stats.passed} | ${stats.failed} | ${stats.pending} | ${toPercent(
          stats.passed,
          stats.passed + stats.failed,
        )} |`,
    )
    .join("\n");

  const failedList =
    failedCases.length === 0
      ? "- Nenhum caso executado falhou."
      : failedCases
          .map(
            (item) =>
              `- \`${item.id}\`: status \`${item.status}\`, esperado \`${item.expected_primary_skill}\`, observado \`${item.observed_primary_skill ?? "null"}\`. ${item.notes || "Sem nota adicional."}`,
          )
          .join("\n");

  const pendingList =
    pendingCases.length === 0
      ? "- Nenhum caso pendente."
      : buildPendingList(pendingCases);

  return `# Replay Report — ${environment}

**Arquivo fonte:** \`${path.relative(process.cwd(), filePath).replaceAll("\\", "/")}\`  
**Casos totais:** ${total}  
**Aprovados:** ${passed} (${toPercent(passed, total)})  
**Falhos:** ${failed} (${toPercent(failed, total)})  
**Pendentes:** ${pending} (${toPercent(pending, total)})

---

## Por Skill

| Skill | Pass | Fail | Pending | Exec pass rate |
| --- | ---: | ---: | ---: | ---: |
${skillRows}

---

## Casos Falhos

${failedList}

---

## Casos Pendentes

${pendingList}
`;
}

function buildPendingList(pendingCases) {
  const maxItems = 25;
  const visibleItems = pendingCases.slice(0, maxItems);
  const lines = visibleItems.map(
    (item) => `- \`${item.id}\`: pendente ou não executado.`,
  );

  if (pendingCases.length > maxItems) {
    lines.push(
      `- ... e mais ${pendingCases.length - maxItems} casos pendentes.`,
    );
  }

  return lines.join("\n");
}

function buildSummaryMarkdown(reports) {
  const rows = reports
    .sort((a, b) => a.environment.localeCompare(b.environment))
    .map(
      (report) =>
        `| \`${report.environment}\` | ${report.passed} | ${report.failed} | ${report.pending} | ${report.total} | ${toPercent(
          report.passed,
          report.total,
        )} |`,
    )
    .join("\n");

  return `# Replay Summary

| Environment | Pass | Fail | Pending | Total | Pass rate |
| --- | ---: | ---: | ---: | ---: | ---: |
${rows}
`;
}
