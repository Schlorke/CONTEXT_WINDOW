import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { buildRoutingEntries } from "../scripts/lib/hook.mjs";
import { suggest } from "../scripts/templates/claude-skill-router.mjs";

const root = path.resolve(import.meta.dirname, "..");
const registry = JSON.parse(
  fs.readFileSync(path.join(root, "catalog", "registry.json"), "utf8"),
);
const matrix = JSON.parse(
  fs.readFileSync(
    path.join(root, "saas-skills", "evals", "skill-trigger-matrix.json"),
    "utf8",
  ),
);
const routing = buildRoutingEntries(
  registry.skills.filter((skill) => skill.status === "active"),
  ".claude/skills",
);

test("every positive eval prompt suggests the expected skill", () => {
  const misses = [];
  for (const row of matrix.skills) {
    for (const caseRow of row.should_trigger ?? []) {
      const expected = caseRow.expected_primary_skill ?? row.skill;
      const names = suggest(routing, caseRow.prompt).map(
        (entry) => entry.skill,
      );
      if (!names.includes(expected))
        misses.push(`${expected} ${caseRow.id} => ${names.join(",")}`);
    }
  }
  assert.deepEqual(misses, []);
});

test("negative eval prompts do not suggest that skill", () => {
  const hits = [];
  for (const row of matrix.skills) {
    for (const caseRow of row.should_not_trigger ?? []) {
      const names = suggest(routing, caseRow.prompt).map(
        (entry) => entry.skill,
      );
      if (names.includes(row.skill)) hits.push(`${row.skill} ${caseRow.id}`);
    }
  }
  assert.deepEqual(hits, []);
});
