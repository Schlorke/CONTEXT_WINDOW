#!/usr/bin/env node
// Scaffolds a new product repository from assets/template:
//   node scaffold.mjs --out <new-dir> --scope @company --name "Product Name"
// The output must not exist (or be an empty directory). The architecture and token gates are copied
// from this skill (scripts/arch-check.mjs, scripts/token-check.mjs) into tools/, so the template
// never holds a second copy. Private files (credentials, environment files, keys, session caches)
// are refused: the template must never carry them into a product.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const template = path.join(here, "..", "assets", "template");
const TEXT = /\.(json|ya?ml|md|mjs|cjs|js|ts|tsx|gitignore|npmrc)$|^\.(gitignore|npmrc)$/;
const PRIVATE = [/^\.env(?!\.example$)(\..+)?$/i, /^auth\.json$/i, /^\.credentials\.json$/i, /\.(pem|key|p12|pfx)$/i, /^id_(rsa|ed25519|ecdsa)/i, /^\.npmrc$/i, /^\.netrc$/i, /^(sessions|\.ssh|\.cache)$/i];
const GATES = ["arch-check.mjs", "token-check.mjs"];

function parse(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!["--out", "--scope", "--name"].includes(key)) throw new Error(`unknown argument ${key}`);
    opts[key.slice(2)] = argv[++i];
  }
  if (!opts.out || !opts.scope || !opts.name) throw new Error("usage: scaffold.mjs --out <dir> --scope @company --name \"Product\"");
  if (!/^@[a-z0-9][a-z0-9-]*$/.test(opts.scope)) throw new Error("--scope must look like @company");
  return opts;
}

/** Files of `dir` that must never be copied into a product. */
export function privateFilesIn(dir, base = dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (PRIVATE.some((re) => re.test(e.name))) acc.push(path.relative(base, full).split(path.sep).join("/"));
    else if (e.isDirectory()) privateFilesIn(full, base, acc);
  }
  return acc;
}

export function scaffold({ out, scope, name, source = template }) {
  const dest = path.resolve(out);
  if (fs.existsSync(dest) && fs.readdirSync(dest).length) throw new Error(`${dest} is not empty; scaffold only creates new projects (use legacy-code-refactoring to adopt existing ones)`);
  const leaked = privateFilesIn(source);
  if (leaked.length) throw new Error(`the template contains private files that must not reach a product: ${leaked.join(", ")}`);
  const slug = name.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const copy = (src, dst) => {
    fs.mkdirSync(dst, { recursive: true });
    for (const e of fs.readdirSync(src, { withFileTypes: true })) {
      if (e.isSymbolicLink()) throw new Error(`the template must not contain links: ${path.join(src, e.name)}`);
      const s = path.join(src, e.name);
      const d = path.join(dst, e.name);
      if (e.isDirectory()) copy(s, d);
      else if (TEXT.test(e.name)) {
        const text = fs.readFileSync(s, "utf8").replaceAll("@acme/", `${scope}/`).replaceAll("acme-platform", `${slug}-platform`).replaceAll("Acme", name).replaceAll('"acme"', `"${slug}"`);
        fs.writeFileSync(d, text);
      } else fs.copyFileSync(s, d);
    }
  };
  copy(source, dest);
  fs.mkdirSync(path.join(dest, "tools"), { recursive: true });
  for (const gate of GATES) fs.copyFileSync(path.join(here, gate), path.join(dest, "tools", gate));
  return dest;
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
const self = fileURLToPath(import.meta.url);
if (process.platform === "win32" ? invoked.toLowerCase() === self.toLowerCase() : invoked === self) {
  try {
    const dest = scaffold(parse(process.argv.slice(2)));
    process.stdout.write(`Scaffolded ${dest}\nNext: cd into it, run pnpm install --frozen-lockfile, then pnpm verify\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}
