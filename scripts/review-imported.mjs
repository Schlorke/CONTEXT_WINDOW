#!/usr/bin/env node
// Per-item review evidence for catalog items that are not active (imported-unreviewed, quarantined).
// It never changes the registry: it records what a reviewer needs and derives a status by explicit
// rules. "revisado" and "ativo" require a human reading of the instructions and are never derived.
//   node scripts/review-imported.mjs [--out <file.json>]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDirectRun, parseArgs } from "./lib/cli.mjs";
import {
  inspectSkill,
  loadRegistry,
  parseFrontmatter,
} from "./lib/catalog.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SCRIPT_EXT = /\.(m?js|cjs|ts|tsx|py|sh|ps1|bat|cmd)$/i;
const TEXT_EXT =
  /\.(md|mdx|txt|json|ya?ml|m?js|cjs|ts|tsx|py|sh|ps1|toml|geojson|svg|html|css)$/i;
const TOOLS = {
  "davinci-resolve": /\b(davinci|resolve)\b/i,
  blender: /\bblender\b/i,
  spline: /\bspline\b/i,
  rive: /\brive\b/i,
  remotion: /\bremotion\b/i,
  figma: /\bfigma\b/i,
  ffmpeg: /\bff(mpeg|probe)\b/i,
  cesium: /\bcesium\b/i,
  mapbox: /\bmapbox\b/i,
  maptiler: /\bmaptiler\b/i,
  prisma: /\bprisma\b/i,
  supabase: /\bsupabase\b/i,
  expo: /\bexpo\b/i,
  "mcp-server": /\bMCP\b/,
  python: /\bpython3?\b|\bpip install\b/i,
  npx: /\bnpx\s/,
};
const RISKY = {
  "recursive delete":
    /\brm\s+-rf\b|Remove-Item\b[^\n]*-Recurse|\brmdir\s+\/s\b|\bdel\s+\/s\b/i,
  "history rewrite or force push":
    /git\s+push\s+[^\n]*--force|git\s+reset\s+--hard|git\s+filter-(branch|repo)/i,
  "destructive SQL": /\bDROP\s+(TABLE|DATABASE|SCHEMA)\b|\bTRUNCATE\s+TABLE\b/i,
  "disables safety":
    /--dangerously|dangerouslyAllowAllBuilds|--no-verify\b|--yolo\b/i,
  "pipes remote script to a shell":
    /(curl|wget|iwr|Invoke-WebRequest)[^\n|]*\|\s*(sh|bash|iex|pwsh|powershell)\b/i,
  "credential handling":
    /\b(api[_ -]?key|access[_ -]?token|secret[_ -]?key|password)\b/i,
};
const LICENSE_FILE = /^(LICEN[CS]E|COPYING|NOTICE)(\.(md|txt))?$/i;

function walk(dir, base = dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, base, out);
    else if (e.isFile())
      out.push({
        rel: path.relative(base, full).split(path.sep).join("/"),
        size: fs.statSync(full).size,
      });
  }
  return out;
}

function evalEntries() {
  const file = path.join(
    repo,
    "saas-skills",
    "evals",
    "skill-trigger-matrix.json",
  );
  const matrix = JSON.parse(fs.readFileSync(file, "utf8"));
  return new Map(matrix.skills.map((s) => [s.skill, s]));
}

export function reviewItem(entry, { activeIds, evals }) {
  const dir = path.join(repo, ...entry.path.split("/"));
  const files = fs.existsSync(dir) ? walk(dir) : [];
  const gate = inspectSkill(repo, { ...entry, status: "active" }, evals);
  const text = files
    .filter((f) => TEXT_EXT.test(f.rel))
    .map((f) => ({
      rel: f.rel,
      body: fs.readFileSync(path.join(dir, ...f.rel.split("/")), "utf8"),
    }));
  const all = text.map((t) => t.body).join("\n");
  const skillMd = text.find((t) => t.rel === "SKILL.md")?.body ?? "";
  const fm = parseFrontmatter(skillMd);
  const tools = Object.entries(TOOLS)
    .filter(([, re]) => re.test(all))
    .map(([k]) => k);
  const risky = Object.entries(RISKY).flatMap(([label, re]) =>
    text.filter((t) => re.test(t.body)).map((t) => ({ label, file: t.rel })),
  );
  const hosts = [
    ...new Set(
      [...all.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map((m) =>
        m[1].toLowerCase(),
      ),
    ),
  ].sort();
  const imports = [
    ...new Set(
      text
        .filter((t) => SCRIPT_EXT.test(t.rel))
        .flatMap((t) =>
          [
            ...t.body.matchAll(
              /(?:from\s+|require\()\s*["']([^"'./][^"']*)["']/g,
            ),
          ].map((m) =>
            m[1]
              .split("/")
              .slice(0, m[1].startsWith("@") ? 2 : 1)
              .join("/"),
          ),
        ),
    ),
  ].sort();
  const mentionedSkills = [
    ...new Set(
      [...skillMd.matchAll(/`([a-z0-9]+(?:-[a-z0-9]+)+)`/g)].map((m) => m[1]),
    ),
  ].filter((id) => id !== entry.id && (activeIds.has(id) || id.includes("-")));
  const licenseFiles = files
    .filter((f) => LICENSE_FILE.test(path.basename(f.rel)))
    .map((f) => f.rel);
  const copyright = /copyright\s+(\(c\)|©)?\s*\d{4}/i.test(all);
  const declared = entry.origin?.license ?? null;
  const licenseEvidence = licenseFiles.length
    ? "license file in package"
    : fm.data?.license
      ? `frontmatter license: ${fm.data.license}`
      : copyright
        ? "copyright notice in package"
        : "none in package";
  const thirdPartyWithoutNotice =
    Boolean(fm.data?.license) && !licenseFiles.length && !copyright;
  const hardIssues = gate.issues.filter((i) =>
    /secret-like|private file|symbolic links|special files/.test(i),
  );
  const promotionGaps = gate.issues.filter((i) => !hardIssues.includes(i));

  let status;
  const reasons = [];
  if (activeIds.has(entry.id)) {
    status = "depreciado";
    reasons.push("an active canonical skill has the same id");
  } else if (
    /unknown/i.test(declared ?? "") ||
    thirdPartyWithoutNotice ||
    hardIssues.length
  ) {
    status = "bloqueado";
    if (/unknown/i.test(declared ?? "")) reasons.push(`license: ${declared}`);
    if (thirdPartyWithoutNotice)
      reasons.push(
        `the package declares ${fm.data.license} but carries no copyright notice or upstream attribution`,
      );
    reasons.push(...hardIssues);
  } else {
    status = "não verificado";
    if (licenseEvidence === "none in package")
      reasons.push(
        `no license evidence in the package (registry: "${declared}")`,
      );
    if (promotionGaps.length)
      reasons.push(
        `${promotionGaps.length} catalog gate issue(s) to fix before promotion`,
      );
    if (tools.length)
      reasons.push(
        `behavior depends on external tools not exercised here: ${tools.join(", ")}`,
      );
    reasons.push("instructions not read by a human reviewer in this round");
  }
  return {
    id: entry.id,
    family: entry.family,
    path: entry.path,
    registryStatus: entry.status,
    origin: entry.origin,
    license: { declared, evidence: licenseEvidence, files: licenseFiles },
    package: {
      files: files.length,
      bytes: files.reduce((a, f) => a + f.size, 0),
      scripts: files.filter((f) => SCRIPT_EXT.test(f.rel)).map((f) => f.rel),
      references: files.filter(
        (f) => /\.mdx?$/i.test(f.rel) && f.rel !== "SKILL.md",
      ).length,
      assets: files.filter((f) => !TEXT_EXT.test(f.rel)).length,
      skillHash: gate.skillHash ?? null,
    },
    frontmatter: {
      name: fm.data?.name ?? null,
      descriptionChars:
        typeof fm.data?.description === "string"
          ? fm.data.description.length
          : 0,
      error: fm.error ?? null,
    },
    dependencies: {
      tools,
      scriptImports: imports,
      networkHosts: hosts,
      mentionedSkills,
    },
    instructionsRisk: risky,
    gate: { hardIssues, promotionGaps },
    testCriteria: evals.has(entry.id)
      ? "trigger cases present"
      : "no trigger cases in skill-trigger-matrix.json; behavior tests need the external tools above",
    review: { status, reasons },
  };
}

export function reviewImported() {
  const registry = loadRegistry(repo);
  const activeIds = new Set(
    registry.skills.filter((s) => s.status === "active").map((s) => s.id),
  );
  const evals = evalEntries();
  const items = registry.skills
    .filter((s) => s.status !== "active")
    .map((entry) => reviewItem(entry, { activeIds, evals }));
  const count = (key) =>
    items.reduce((a, i) => ({ ...a, [key(i)]: (a[key(i)] ?? 0) + 1 }), {});
  return {
    schema: "context-window/imported-review@1",
    rules: {
      depreciado: "an active canonical skill has the same id",
      bloqueado:
        "declared license unknown, a third-party license without copyright notice or attribution, or secret-like content, private files, links or special files in the package",
      "não verificado":
        "everything else: license evidence, gate gaps, external tools and a human reading are still missing",
      revisado:
        "never derived: requires a human reading of the instructions, a passing gate and license evidence",
      ativo:
        "never derived: requires revisado, trigger cases and a registry change with justification",
    },
    total: items.length,
    byStatus: count((i) => i.review.status),
    byFamily: count((i) => i.family),
    items,
  };
}

if (isDirectRun(import.meta.url)) {
  const { values } = parseArgs(process.argv.slice(2), {
    out: { type: "string" },
  });
  const report = reviewImported();
  const json = `${JSON.stringify(report, null, 2)}\n`;
  if (values.out) {
    fs.mkdirSync(path.dirname(path.resolve(values.out)), { recursive: true });
    fs.writeFileSync(values.out, json);
  } else process.stdout.write(json);
  process.stderr.write(
    `${report.total} items: ${JSON.stringify(report.byStatus)}\n`,
  );
}
