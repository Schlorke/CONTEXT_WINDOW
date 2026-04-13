import fs from "node:fs";
import path from "node:path";

export const usagePolicyBlockStart = "<!-- BEGIN: SAAS_SKILLS_USAGE_REPORTING -->";
export const usagePolicyBlockEnd = "<!-- END: SAAS_SKILLS_USAGE_REPORTING -->";
export const cursorUsageRulePath = path.join(".cursor", "rules", "skill-usage-reporting.mdc");

export function buildUsagePolicyBlock() {
  return [
    usagePolicyBlockStart,
    "## Skill Usage Reporting",
    "",
    "At the end of every completed task, include a section named `Skills Used`.",
    "",
    "Required format:",
    "",
    "- if one or more skills were used, list each skill once as `- <skill-name>: <short reason>`",
    "- if no skill was used, write `Skills Used: none`",
    "",
    "Rules:",
    "",
    "- report only skills actually used during the task",
    "- use canonical skill names when known",
    "- do not list skills that were merely available but unused",
    "- do not omit a skill that materially influenced the result",
    "- keep each reason short and factual",
    "- if the task was partial, blocked, or exploratory, still report the skills used so far",
    "",
    "This disclosure is mandatory for analysis, implementation, review, debugging, and documentation tasks.",
    usagePolicyBlockEnd,
    "",
  ].join("\n");
}

export function buildCursorUsageRule() {
  const body = [
    "---",
    'description: "Always require the assistant to disclose which skills were actually used at the end of the task."',
    "alwaysApply: true",
    "---",
    "",
    "At the end of every completed task, include a section named `Skills Used`.",
    "",
    "Required format:",
    "",
    "- if one or more skills were used, list each skill once as `- <skill-name>: <short reason>`",
    "- if no skill was used, write `Skills Used: none`",
    "",
    "Rules:",
    "",
    "- report only skills actually used during the task",
    "- use canonical skill names when known",
    "- do not list skills that were merely available but unused",
    "- do not omit a skill that materially influenced the result",
    "- keep each reason short and factual",
    "- if the task was partial, blocked, or exploratory, still report the skills used so far",
    "",
    "This rule exists for observability and skill adoption control.",
    "",
  ];

  return body.join("\n");
}

export function upsertManagedBlock(filePath, block) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const start = usagePolicyBlockStart;
  const end = usagePolicyBlockEnd;

  if (existing.includes(start) && existing.includes(end)) {
    const pattern = new RegExp(
      `${escapeForRegExp(start)}[\\s\\S]*?${escapeForRegExp(end)}\\r?\\n?`,
      "m",
    );
    const updated = existing.replace(pattern, block);
    return updated === existing ? null : updated;
  }

  const normalized = existing.trimEnd();
  if (!normalized) {
    return block;
  }

  return `${normalized}\n\n${block}`;
}

export function hasManagedBlock(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  return raw.includes(usagePolicyBlockStart) && raw.includes(usagePolicyBlockEnd);
}

function escapeForRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
