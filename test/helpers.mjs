// Test helpers: build a throw-away library (real scripts + fixture catalog) and run the CLI
// under the Node permission model, so a defect cannot write outside the sandbox.
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REPO = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export function tmpRoot(label = "cw") {
  const dir = path.join(
    os.tmpdir(),
    `cw-test-${label}-${process.pid}-${crypto.randomBytes(3).toString("hex")}`,
  );
  fs.mkdirSync(dir, { recursive: true });
  return fs.realpathSync.native(dir);
}

export function cleanup(dir) {
  if (process.env.CW_KEEP_TEST) return;
  const rm = (p) => {
    let st;
    try {
      st = fs.lstatSync(p);
    } catch {
      return;
    }
    if (st.isSymbolicLink()) {
      try {
        fs.unlinkSync(p);
      } catch {
        fs.rmdirSync(p);
      }
    } else if (st.isDirectory()) {
      for (const n of fs.readdirSync(p)) rm(path.join(p, n));
      fs.rmdirSync(p);
    } else {
      try {
        fs.chmodSync(p, 0o666);
      } catch {
        /* ignore */
      }
      fs.unlinkSync(p);
    }
  };
  for (let attempt = 0; ; attempt++) {
    try {
      rm(dir);
      return;
    } catch (error) {
      if (
        attempt >= 20 ||
        !["EBUSY", "EPERM", "ENOTEMPTY"].includes(error.code)
      )
        throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
    }
  }
}

export function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

export function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

const OPERATIONAL = [
  "## Operational Contract",
  "",
  "| Field | Contract |",
  "| --- | --- |",
  "| Objective | fixture |",
  "| Use when | fixture |",
  "| Do not use when | fixture |",
  "| Inputs | fixture |",
  "| Preconditions | fixture |",
  "| Tools | fixture |",
  "| Procedure | fixture |",
  "| Output | fixture |",
  "| Validation | fixture |",
  "| Known failures | fixture |",
  "",
].join("\n");

export function skillMd(
  id,
  {
    description = `Fixture skill ${id} for tests.`,
    body = "",
    extraFrontmatter = "",
  } = {},
) {
  return `---\nname: ${id}\ndescription: ${JSON.stringify(description)}\n${extraFrontmatter}metadata:\n  version: "1.0"\n---\n\n# ${id}\n\n${OPERATIONAL}\n${body}\n`;
}

/**
 * Creates a library at <root>/lib with the real scripts and a fixture catalog.
 * @param {string} root
 * @param {{skills?: Array<{id: string, collection?: string, files?: Record<string,string>, status?: string, invocation?: string, triggers?: string[], root?: string}>, version?: string}} spec
 */
export function makeLibrary(root, spec = {}) {
  const lib = path.join(root, "lib");
  copyDir(path.join(REPO, "scripts"), path.join(lib, "scripts"));
  copyDir(
    path.join(REPO, "catalog", "contract"),
    path.join(lib, "catalog", "contract"),
  );
  const skills = spec.skills ?? [
    { id: "alpha-skill" },
    { id: "beta-skill", files: { "references/guide.md": "# guide\n" } },
  ];
  const registrySkills = [];
  const matrix = { version: "test", skills: [] };
  for (const s of skills) {
    const rootDir = s.root ?? "saas-skills";
    const rel = `${rootDir}/${s.collection ?? "engineering"}/${s.dirName ?? s.id}`;
    const dir = path.join(lib, ...rel.split("/"));
    write(path.join(dir, "SKILL.md"), s.skillMd ?? skillMd(s.name ?? s.id));
    for (const [f, c] of Object.entries(s.files ?? {}))
      write(path.join(dir, ...f.split("/")), c);
    registrySkills.push({
      id: s.id,
      path: rel,
      status: s.status ?? "active",
      origin: { kind: rootDir === "saas-skills" ? "canonical" : "imported" },
      family: s.collection ?? "engineering",
      profiles: s.profiles ?? ["dev"],
      invocation: s.invocation ?? "auto",
      summary: `summary ${s.id}`,
      triggers: s.triggers ?? [],
      ...(s.replacedBy ? { replacedBy: s.replacedBy } : {}),
    });
    const cases = (kind) =>
      [1, 2, 3].map((n) => ({
        id: `${s.id}-${kind}-${n}`,
        prompt: `p${n}`,
        expected_primary_skill: kind === "t" ? s.id : "other",
      }));
    matrix.skills.push({
      skill: s.id,
      should_trigger: cases("t"),
      should_not_trigger: cases("n"),
      conflicts: [],
      minimum_output: ["a", "b", "c"],
    });
  }
  write(
    path.join(lib, "saas-skills", "evals", "skill-trigger-matrix.json"),
    JSON.stringify(matrix, null, 2),
  );
  write(
    path.join(lib, "catalog", "registry.json"),
    JSON.stringify(
      {
        schema: "context-window/registry@1",
        library: "context-window/saas-skills",
        roots: { canonical: "saas-skills", imported: "imported-skills" },
        profiles: {
          dev: { description: "dev" },
          creative: { description: "creative" },
        },
        skills: registrySkills,
      },
      null,
      2,
    ),
  );
  write(
    path.join(lib, "package.json"),
    JSON.stringify({
      name: "context-window",
      version: spec.version ?? "2.0.0-test",
      type: "module",
      engines: { node: ">=20" },
    }),
  );
  return lib;
}

export function setVersion(lib, version) {
  const file = path.join(lib, "package.json");
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  pkg.version = version;
  fs.writeFileSync(file, JSON.stringify(pkg));
}

/** Runs the CLI of `lib` confined to `root` (read/write) with a synthetic home. */
export function cw(
  lib,
  args,
  { root, home, env = {}, permission = true, input } = {},
) {
  const sandbox = root ?? path.dirname(lib);
  const perm = permission
    ? [
        "--permission",
        `--allow-fs-read=${sandbox}`,
        `--allow-fs-write=${sandbox}`,
      ]
    : [];
  const homeDir = home ?? path.join(sandbox, "home");
  fs.mkdirSync(homeDir, { recursive: true });
  const res = spawnSync(
    process.execPath,
    [...perm, path.join(lib, "scripts", "cw.mjs"), ...args],
    {
      cwd: sandbox,
      encoding: "utf8",
      input,
      env: {
        SystemRoot: process.env.SystemRoot,
        PATH: process.env.PATH,
        USERPROFILE: homeDir,
        HOME: homeDir,
        TEMP: path.join(sandbox, "tmp"),
        TMP: path.join(sandbox, "tmp"),
        ...env,
      },
      timeout: 120000,
    },
  );
  return {
    code: res.status,
    stdout: res.stdout ?? "",
    stderr: res.stderr ?? "",
    all: `${res.stdout ?? ""}${res.stderr ?? ""}`,
  };
}

export function snapshot(root, { ignore = [] } = {}) {
  const outMap = {};
  if (!fs.existsSync(root)) return outMap;
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      const rel = path.relative(root, full).split(path.sep).join("/");
      if (ignore.some((i) => rel === i || rel.startsWith(`${i}/`))) continue;
      const st = fs.lstatSync(full);
      if (st.isSymbolicLink()) outMap[rel] = `link:${fs.readlinkSync(full)}`;
      else if (st.isDirectory()) {
        outMap[`${rel}/`] = "dir";
        walk(full);
      } else
        outMap[rel] = crypto
          .createHash("sha256")
          .update(fs.readFileSync(full))
          .digest("hex");
    }
  };
  walk(root);
  return outMap;
}

export function json(result) {
  return JSON.parse(result.stdout);
}
