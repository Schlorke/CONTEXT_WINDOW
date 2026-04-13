import fs from "node:fs";
import path from "node:path";
import {
  buildCursorUsageRule,
  buildUsagePolicyBlock,
  cursorUsageRulePath,
  upsertManagedBlock,
} from "./skill-usage-reporting-utils.mjs";

const args = process.argv.slice(2);
let targetArg = ".";
let dryRun = false;
let targetSeen = false;

for (const arg of args) {
  if (arg === "--") {
    continue;
  }

  if (arg === "--dry-run") {
    dryRun = true;
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
const block = buildUsagePolicyBlock();
const cursorRule = buildCursorUsageRule();

const plannedWrites = [];

const agentsContent = upsertManagedBlock(agentsPath, block);
if (agentsContent !== null) {
  plannedWrites.push(agentsPath);
}

const claudeContent = upsertManagedBlock(claudePath, block);
if (claudeContent !== null) {
  plannedWrites.push(claudePath);
}

const currentCursorRule = fs.existsSync(cursorRuleFile)
  ? fs.readFileSync(cursorRuleFile, "utf8")
  : null;
if (currentCursorRule !== cursorRule) {
  plannedWrites.push(cursorRuleFile);
}

console.log(`Target root: ${targetRoot}`);
console.log(`Mode: ${dryRun ? "dry-run" : "write"}`);
console.log(`Planned artifacts: ${plannedWrites.length}`);

for (const item of plannedWrites) {
  console.log(`- ${item}`);
}

if (dryRun) {
  process.exit(0);
}

fs.mkdirSync(targetRoot, { recursive: true });

if (agentsContent !== null) {
  fs.writeFileSync(agentsPath, agentsContent, "utf8");
}

if (claudeContent !== null) {
  fs.writeFileSync(claudePath, claudeContent, "utf8");
}

if (currentCursorRule !== cursorRule) {
  fs.mkdirSync(path.dirname(cursorRuleFile), { recursive: true });
  fs.writeFileSync(cursorRuleFile, cursorRule, "utf8");
}

console.log("SKILL USAGE REPORTING POLICY INSTALLED");
