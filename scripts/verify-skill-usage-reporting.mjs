import fs from "node:fs";
import path from "node:path";
import {
  buildCursorUsageRule,
  cursorUsageRulePath,
  hasManagedBlock,
} from "./skill-usage-reporting-utils.mjs";

const args = process.argv.slice(2);
let targetArg = ".";
let targetSeen = false;

for (const arg of args) {
  if (arg === "--") {
    continue;
  }

  if (!arg.startsWith("--") && !targetSeen) {
    targetArg = arg;
    targetSeen = true;
  }
}

const targetRoot = path.resolve(targetArg);
const agentsPath = path.join(targetRoot, "AGENTS.md");
const claudePath = path.join(targetRoot, "CLAUDE.md");
const cursorRuleFile = path.join(targetRoot, cursorUsageRulePath);
const issues = [];

if (!hasManagedBlock(agentsPath)) {
  issues.push(`Missing managed skill usage block in ${agentsPath}`);
}

if (!hasManagedBlock(claudePath)) {
  issues.push(`Missing managed skill usage block in ${claudePath}`);
}

if (!fs.existsSync(cursorRuleFile)) {
  issues.push(`Missing Cursor skill usage rule: ${cursorRuleFile}`);
} else {
  const expected = buildCursorUsageRule();
  const actual = fs.readFileSync(cursorRuleFile, "utf8");
  if (actual !== expected) {
    issues.push(`Unexpected Cursor skill usage rule contents: ${cursorRuleFile}`);
  }
}

if (issues.length > 0) {
  console.error("SKILL USAGE REPORTING VERIFICATION FAILED");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log("SKILL USAGE REPORTING VERIFICATION PASSED");
console.log(`- Target: ${targetRoot}`);
console.log(`- AGENTS.md policy: ${agentsPath}`);
console.log(`- CLAUDE.md policy: ${claudePath}`);
console.log(`- Cursor rule: ${cursorRuleFile}`);
