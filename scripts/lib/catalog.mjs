// Catalog: registry (hand-maintained) + discovered SKILL.md packages + validation + lock.
import fs from "node:fs";
import path from "node:path";
import yaml from "./vendor/js-yaml.mjs";
import {
  hashTree,
  packageHash,
  readJsonOrNull,
  scanTree,
  sha256Canonical,
  toPosix,
} from "./fsx.mjs";
import { findSecrets, isPrivateFile } from "./secrets.mjs";

export const SKILL_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const STATUSES = [
  "active",
  "imported-unreviewed",
  "quarantined",
  "deprecated",
];
export const OPERATIONAL_KEYS = [
  "Objective",
  "Use when",
  "Do not use when",
  "Inputs",
  "Preconditions",
  "Tools",
  "Procedure",
  "Output",
  "Validation",
  "Known failures",
];
const MACHINE_PATH =
  /(?:[A-Za-z]:[\\/](?:Users|Projetos)[\\/])|(?:(?<![\w.~-])\/(?:Users|home)\/[a-z])/;
const TEXT_EXT = /\.(md|mdc|txt|json|ya?ml|mjs|cjs|js|ts|tsx|py|sh|ps1|toml)$/i;

export function loadRegistry(repoRoot) {
  const file = path.join(repoRoot, "catalog", "registry.json");
  const registry = readJsonOrNull(file);
  if (!registry)
    throw new Error(`Missing catalog/registry.json in ${repoRoot}`);
  return registry;
}

export function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { error: "missing frontmatter" };
  try {
    // Failsafe schema: every scalar stays a string, so `version: 1.0` is not turned into 1 and
    // dates or booleans are not reinterpreted (Agent Skills metadata is string → string).
    const data = yaml.load(match[1], { schema: yaml.FAILSAFE_SCHEMA });
    if (!data || typeof data !== "object" || Array.isArray(data))
      return { error: "frontmatter is not a mapping" };
    return { data, body: raw.slice(match[0].length), rawFrontmatter: match[1] };
  } catch (error) {
    return { error: `invalid YAML: ${error.message.split("\n")[0]}` };
  }
}

function discoverSkillDirs(root) {
  const found = [];
  if (!fs.existsSync(root)) return found;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      const full = path.join(dir, entry.name);
      if (fs.existsSync(path.join(full, "SKILL.md"))) found.push(full);
      walk(full);
    }
  };
  walk(root);
  return found;
}

function operationalSection(body) {
  const m = body.match(
    /^## Operational Contract[ \t]*\r?$([\s\S]*?)(?=^## |(?![\s\S]))/m,
  );
  return m ? m[1] : null;
}

function relativeRefs(body) {
  const noFences = body.replace(/```[\s\S]*?```/g, "");
  const refs = new Set();
  for (const m of noFences.matchAll(/\]\(([^)\s]+)\)/g)) refs.add(m[1]);
  for (const m of noFences.matchAll(
    /`((?:\.\.?\/)?(?:references|assets|scripts|agents)\/[^`\s]+)`/g,
  ))
    refs.add(m[1]);
  return [...refs]
    .filter((r) => !/^(?:[a-z]+:|#|mailto:)/i.test(r))
    .map((r) => r.split("#")[0].replace(/[.,;:]+$/, ""));
}

/** Validates one skill package; returns {issues, warnings, meta}. */
export function inspectSkill(repoRoot, entry, evalEntries) {
  const dir = path.join(repoRoot, ...entry.path.split("/"));
  const issues = [];
  const warnings = [];
  const skillFile = path.join(dir, "SKILL.md");
  if (!fs.existsSync(skillFile))
    return {
      issues: [`SKILL.md not found at ${entry.path}`],
      warnings,
      files: {},
    };
  const tree = scanTree(dir);
  if (tree.links.length)
    issues.push(`symbolic links inside package: ${tree.links.join(", ")}`);
  if (tree.others.length)
    issues.push(`special files inside package: ${tree.others.join(", ")}`);
  const { hashes } = hashTree(dir);
  const raw = fs.readFileSync(skillFile, "utf8");
  const fm = parseFrontmatter(raw);
  const meta = {};
  if (fm.error) issues.push(`frontmatter: ${fm.error}`);
  else {
    meta.name = fm.data.name;
    meta.description = fm.data.description;
    meta.version =
      fm.data.metadata?.version != null
        ? String(fm.data.metadata.version)
        : null;
    if (fm.data.name !== entry.id)
      issues.push(
        `frontmatter name "${fm.data.name}" differs from id "${entry.id}"`,
      );
    if (typeof fm.data.description !== "string" || !fm.data.description.trim())
      issues.push("description missing");
    else if (fm.data.description.length > 1024)
      issues.push(
        `description has ${fm.data.description.length} chars (max 1024)`,
      );
    const lines = raw.split(/\r?\n/).length;
    if (lines > 500) issues.push(`SKILL.md has ${lines} lines (max 500)`);
    const section = operationalSection(fm.body);
    if (!section) issues.push('missing "## Operational Contract" section');
    else {
      for (const key of OPERATIONAL_KEYS) {
        if (
          !new RegExp(`\\*\\*${key}\\b`, "i").test(section) &&
          !new RegExp(`\\|\\s*${key}\\s*\\|`, "i").test(section)
        ) {
          issues.push(`Operational Contract lacks "${key}"`);
        }
      }
    }
    for (const ref of relativeRefs(fm.body)) {
      const resolved = path.resolve(dir, ref);
      const rel = path.relative(dir, resolved);
      if (rel.startsWith("..") || path.isAbsolute(rel))
        issues.push(`reference escapes the package: ${ref}`);
      else if (!fs.existsSync(resolved))
        issues.push(`broken reference: ${ref}`);
    }
  }
  for (const rel of Object.keys(hashes)) {
    if (isPrivateFile(rel)) issues.push(`private file in package: ${rel}`);
    if (!TEXT_EXT.test(rel)) continue;
    const text = fs.readFileSync(path.join(dir, ...rel.split("/")), "utf8");
    if (MACHINE_PATH.test(text))
      issues.push(`machine-specific absolute path in ${rel}`);
    if (findSecrets(text).length) issues.push(`secret-like content in ${rel}`);
  }
  if (entry.status === "active") {
    const ev = evalEntries.get(entry.id);
    if (!ev)
      issues.push(
        "missing entry in saas-skills/evals/skill-trigger-matrix.json",
      );
    else {
      if ((ev.should_trigger?.length ?? 0) < 3)
        issues.push("fewer than 3 should_trigger cases");
      if ((ev.should_not_trigger?.length ?? 0) < 3)
        issues.push("fewer than 3 should_not_trigger cases");
      if ((ev.minimum_output?.length ?? 0) < 3)
        issues.push("fewer than 3 minimum_output expectations");
    }
  }
  return {
    issues,
    warnings,
    files: hashes,
    meta,
    skillHash: sha256Canonical(raw),
  };
}

/**
 * Builds the full catalog view. Errors are fatal only for active skills and for
 * registry/identity problems; non-active items keep their issues as diagnostics.
 */
export function buildCatalog(repoRoot) {
  const registry = loadRegistry(repoRoot);
  const errors = [];
  const matrix = readJsonOrNull(
    path.join(repoRoot, "saas-skills", "evals", "skill-trigger-matrix.json"),
  ) ?? { skills: [] };
  const evalEntries = new Map(matrix.skills.map((s) => [s.skill, s]));
  const ids = new Map();
  for (const entry of registry.skills) {
    if (!SKILL_ID.test(entry.id) || entry.id.length > 64)
      errors.push(`invalid skill id "${entry.id}"`);
    if (ids.has(entry.id))
      errors.push(
        `duplicate skill id "${entry.id}" (${ids.get(entry.id)} and ${entry.path})`,
      );
    ids.set(entry.id, entry.path);
    if (!STATUSES.includes(entry.status))
      errors.push(`${entry.id}: unknown status "${entry.status}"`);
    if (path.posix.basename(entry.path) !== entry.id)
      errors.push(
        `${entry.id}: directory name differs from id (${entry.path})`,
      );
    if (entry.status === "deprecated" && !entry.replacedBy)
      errors.push(`${entry.id}: deprecated without replacedBy`);
    if (entry.invocation && !["auto", "explicit"].includes(entry.invocation))
      errors.push(`${entry.id}: invalid invocation`);
    for (const profile of entry.profiles ?? []) {
      if (!registry.profiles?.[profile])
        errors.push(`${entry.id}: unknown profile "${profile}"`);
    }
  }
  const registered = new Set(registry.skills.map((s) => s.path));
  for (const rootKey of Object.keys(registry.roots)) {
    for (const dir of discoverSkillDirs(
      path.join(repoRoot, registry.roots[rootKey]),
    )) {
      const rel = toPosix(path.relative(repoRoot, dir));
      if (!registered.has(rel))
        errors.push(`unregistered SKILL.md package: ${rel}`);
    }
  }
  const skills = [];
  for (const entry of registry.skills) {
    const inspected = inspectSkill(repoRoot, entry, evalEntries);
    const item = {
      ...entry,
      ...inspected,
      packageHash: packageHash(inspected.files),
    };
    if (entry.status === "active" && inspected.issues.length) {
      for (const issue of inspected.issues)
        errors.push(`${entry.id}: ${issue}`);
    }
    skills.push(item);
  }
  for (const entry of registry.skills.filter(
    (s) => s.status === "deprecated",
  )) {
    const target = registry.skills.find((s) => s.id === entry.replacedBy);
    if (!target || target.status !== "active")
      errors.push(
        `${entry.id}: replacedBy "${entry.replacedBy}" is not an active skill`,
      );
  }
  return {
    registry,
    skills,
    errors,
    duplicates: findDuplicates(repoRoot, skills),
    matrix,
  };
}

function findDuplicates(repoRoot, skills) {
  const bySkillHash = new Map();
  const byFileHash = new Map();
  for (const s of skills) {
    if (s.skillHash) {
      if (!bySkillHash.has(s.skillHash)) bySkillHash.set(s.skillHash, []);
      bySkillHash.get(s.skillHash).push(s.id);
    }
    for (const [rel, hash] of Object.entries(s.files ?? {})) {
      if (!byFileHash.has(hash)) byFileHash.set(hash, []);
      byFileHash.get(hash).push(`${s.path}/${rel}`);
    }
  }
  const identicalSkillMd = [...bySkillHash.values()].filter(
    (v) => v.length > 1,
  );
  const fileGroups = [...byFileHash.values()].filter((v) => v.length > 1);
  return {
    identicalSkillMd,
    duplicateFileGroups: fileGroups.length,
    redundantFiles: fileGroups.reduce((n, g) => n + g.length - 1, 0),
    sample: fileGroups.slice(0, 5),
  };
}

export function lockFromCatalog(catalog, libraryVersion) {
  const counts = {};
  for (const s of catalog.skills) {
    const key = `${s.origin?.kind ?? "unknown"}:${s.status}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return {
    schema: "context-window/catalog-lock@1",
    library: catalog.registry.library,
    libraryVersion,
    counts,
    duplicates: {
      identicalSkillMd: catalog.duplicates.identicalSkillMd,
      duplicateFileGroups: catalog.duplicates.duplicateFileGroups,
      redundantFiles: catalog.duplicates.redundantFiles,
    },
    skills: catalog.skills.map((s) => ({
      id: s.id,
      path: s.path,
      status: s.status,
      origin: s.origin,
      family: s.family,
      profiles: s.profiles ?? [],
      invocation: s.invocation ?? "auto",
      version: s.meta?.version ?? null,
      packageHash: s.packageHash,
      files: s.files,
      issues: s.status === "active" ? [] : s.issues,
    })),
  };
}

export function selectSkills(catalog, profile) {
  const def = catalog.registry.profiles?.[profile];
  if (!def)
    throw new Error(
      `Unknown profile "${profile}". Known: ${Object.keys(catalog.registry.profiles ?? {}).join(", ")}`,
    );
  return catalog.skills.filter(
    (s) => s.status === "active" && (s.profiles ?? []).includes(profile),
  );
}
