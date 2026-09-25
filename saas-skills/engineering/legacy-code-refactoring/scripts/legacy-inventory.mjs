#!/usr/bin/env node
// Read-only inventory of a repository against the mandatory product topology.
//   node legacy-inventory.mjs --root <repo> [--json]
// Reports framework, routes, type-based folders, missing topology parts and a first mapping
// proposal. It never writes to the repository.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TOPOLOGY = ["apps/clients/web", "apps/clients/mobile", "packages/frontend", "packages/ui", "packages/design-tokens"];
const TYPE_FOLDERS = ["components", "hooks", "utils", "helpers", "services", "types", "lib", "containers"];
const SKIP = new Set(["node_modules", ".git", ".next", "dist", "build", ".expo", "coverage"]);
const CODE = /\.(t|j)sx?$/;

function walk(root, dir = root, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(root, full, acc);
    else if (CODE.test(e.name)) acc.push(path.relative(root, full).split(path.sep).join("/"));
  }
  return acc;
}

function suggest(file) {
  const base = path.basename(file).replace(/\.(t|j)sx?$/, "");
  const parts = file.split("/");
  if (/(^|\/)pages\//.test(file) || /(^|\/)app\/.*page\.(t|j)sx?$/.test(file)) {
    const route = base === "index" || base === "page" ? "home" : base;
    return `apps/clients/web route + packages/frontend/src/pages/${route}/ui`;
  }
  if (parts.includes("components")) {
    return /^(Button|Input|Text|Stack|Box|Modal|Card|Icon|Link)$/.test(base) ? "packages/ui (contract + .web + .native)" : `entities/<noun>/ui or widgets/<block>/ui (${base})`;
  }
  if (parts.includes("hooks")) return `features/<action>/model or entities/<noun>/api (${base})`;
  if (parts.includes("utils") || parts.includes("helpers")) return `entities/<noun>/model or shared/lib/<focus> (${base})`;
  if (parts.includes("services")) return `entities/<noun>/api or shared/api (${base})`;
  if (parts.includes("data")) return `pages/<page>/api or entities/<noun>/api (${base})`;
  return "review";
}

export function inventory(root) {
  const pkgFile = path.join(root, "package.json");
  const pkg = fs.existsSync(pkgFile) ? JSON.parse(fs.readFileSync(pkgFile, "utf8")) : {};
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const files = walk(root);
  const typeFolders = [...new Set(files.map((f) => f.split("/")).filter((p) => p.some((s) => TYPE_FOLDERS.includes(s))).map((p) => p.slice(0, p.findIndex((s) => TYPE_FOLDERS.includes(s)) + 1).join("/")))].sort();
  const routes = files.filter((f) => /(^|\/)pages\/(?!api\/)/.test(f) || /(^|\/)app\/(.*\/)?page\.(t|j)sx?$/.test(f));
  const colorLiterals = files.filter((f) => /#[0-9A-Fa-f]{6}\b/.test(fs.readFileSync(path.join(root, f), "utf8")) && !f.includes("design-tokens"));
  return {
    root,
    framework: { next: Boolean(deps.next), expo: Boolean(deps.expo), reactNative: Boolean(deps["react-native"]), react: deps.react ?? null },
    files: files.length,
    routes,
    typeFolders,
    colorLiterals,
    missingTopology: TOPOLOGY.filter((p) => !fs.existsSync(path.join(root, p, "package.json"))),
    mapping: files.filter((f) => !/\.(test|spec)\./.test(f)).map((f) => ({ file: f, proposal: suggest(f) })),
    states: ["inventory", "characterization", "target-skeleton", "incremental-moves", "gate", "retire", "both-clients-proven"],
  };
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
const self = fileURLToPath(import.meta.url);
if (process.platform === "win32" ? invoked.toLowerCase() === self.toLowerCase() : invoked === self) {
  const args = process.argv.slice(2);
  const rootIndex = args.indexOf("--root");
  const root = path.resolve(rootIndex === -1 ? process.cwd() : args[rootIndex + 1]);
  const report = inventory(root);
  if (args.includes("--json")) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  else {
    process.stdout.write(`framework: ${JSON.stringify(report.framework)} · files: ${report.files}\n`);
    process.stdout.write(`missing topology: ${report.missingTopology.join(", ") || "none"}\n`);
    process.stdout.write(`type-based folders: ${report.typeFolders.join(", ") || "none"}\n`);
    process.stdout.write(`routes: ${report.routes.join(", ") || "none"}\n`);
    process.stdout.write(`files with color literals: ${report.colorLiterals.join(", ") || "none"}\n`);
    for (const m of report.mapping) process.stdout.write(`  ${m.file} -> ${m.proposal}\n`);
  }
}
