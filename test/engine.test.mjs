// Distribution engine: install / plan / status / verify / uninstall / recover / doctor.
// Each test names the audit finding (ACH) or criterion (CR) it protects.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, test } from "node:test";
import { BusyError, acquireLock, controlDir } from "../scripts/lib/apply.mjs";
import {
  cleanup,
  cw,
  json,
  makeLibrary,
  setVersion,
  skillMd,
  snapshot,
  tmpRoot,
  write,
} from "./helpers.mjs";

const roots = [];
after(() => roots.forEach(cleanup));
function world(label, spec) {
  const root = tmpRoot(label);
  roots.push(root);
  const lib = makeLibrary(root, spec);
  const proj = path.join(root, "proj");
  fs.mkdirSync(proj, { recursive: true });
  return { root, lib, proj, home: path.join(root, "home") };
}
const install = (w, extra = []) =>
  cw(w.lib, [
    "install",
    "--target",
    w.proj,
    "--profile",
    "dev",
    "--home",
    w.home,
    ...extra,
  ]);

function editRegistry(lib, fn) {
  const reg = path.join(lib, "catalog", "registry.json");
  const data = JSON.parse(fs.readFileSync(reg, "utf8"));
  fn(data);
  fs.writeFileSync(reg, JSON.stringify(data, null, 2));
}
function removeSkill(lib, id) {
  editRegistry(lib, (d) => {
    d.skills = d.skills.filter((s) => s.id !== id);
  });
  fs.rmSync(path.join(lib, "saas-skills", "engineering", id), {
    recursive: true,
  });
}
function renameSkill(lib, from, to) {
  const base = path.join(lib, "saas-skills", "engineering");
  fs.renameSync(path.join(base, from), path.join(base, to));
  const file = path.join(base, to, "SKILL.md");
  fs.writeFileSync(
    file,
    fs.readFileSync(file, "utf8").replace(`name: ${from}`, `name: ${to}`),
  );
  editRegistry(lib, (d) => {
    const s = d.skills.find((x) => x.id === from);
    s.id = to;
    s.path = `saas-skills/engineering/${to}`;
  });
  const mfile = path.join(
    lib,
    "saas-skills",
    "evals",
    "skill-trigger-matrix.json",
  );
  const m = JSON.parse(fs.readFileSync(mfile, "utf8"));
  const e = m.skills.find((x) => x.skill === from);
  e.skill = to;
  for (const c of e.should_trigger) c.expected_primary_skill = to;
  fs.writeFileSync(mfile, JSON.stringify(m));
}

describe("install into projects", () => {
  test("project install writes only inside the target (no global side effect) [ACH-018/CR-080]", () => {
    const w = world("scope");
    const r = install(w, ["--clients", "claude,codex,cursor"]);
    assert.equal(r.code, 0, r.all);
    assert.ok(
      fs.existsSync(
        path.join(w.proj, ".claude", "skills", "alpha-skill", "SKILL.md"),
      ),
    );
    assert.ok(
      fs.existsSync(
        path.join(
          w.proj,
          ".agents",
          "skills",
          "beta-skill",
          "references",
          "guide.md",
        ),
      ),
    );
    assert.deepEqual(
      Object.keys(snapshot(w.home)),
      [],
      "home must stay empty for a project install",
    );
  });

  test("identical bytes in every sink and verifiable identity metadata [ACH-011]", () => {
    const w = world("identity");
    assert.equal(install(w).code, 0);
    const a = fs.readFileSync(
      path.join(w.proj, ".claude", "skills", "alpha-skill", "SKILL.md"),
      "utf8",
    );
    const b = fs.readFileSync(
      path.join(w.proj, ".agents", "skills", "alpha-skill", "SKILL.md"),
      "utf8",
    );
    assert.equal(a, b);
    assert.match(a, /cw-id: alpha-skill/);
    assert.match(a, /cw-source-hash: [0-9a-f]{64}/);
    assert.doesNotMatch(a, /^paths:/m, "no client-specific visibility gating");
  });

  test("unmanaged same-name content is never overwritten; conflict and nothing written [ACH-001/CR-012]", () => {
    const w = world("collision");
    write(
      path.join(w.proj, ".claude", "skills", "alpha-skill", "SKILL.md"),
      "team version\n",
    );
    write(
      path.join(w.proj, ".claude", "skills", "alpha-skill", "notes.md"),
      "private\n",
    );
    const before = snapshot(w.proj);
    const r = install(w);
    assert.equal(r.code, 2, r.all);
    assert.match(r.all, /CONFLICT unmanaged-collision alpha-skill/);
    assert.deepEqual(
      snapshot(w.proj),
      before,
      "nothing may be written when a conflict exists",
    );
  });

  test("--adopt replaces an unmanaged folder only after backing it up [CR-012]", () => {
    const w = world("adopt");
    write(
      path.join(w.proj, ".claude", "skills", "alpha-skill", "notes.md"),
      "private\n",
    );
    const r = install(w, ["--adopt", "alpha-skill", "--clients", "claude"]);
    assert.equal(r.code, 0, r.all);
    const backup = r.all.match(/backup: (.+)/)[1].trim();
    assert.equal(
      fs.readFileSync(path.join(backup, "notes.md"), "utf8"),
      "private\n",
    );
    assert.ok(
      !backup.includes(`${path.sep}skills${path.sep}alpha-skill`),
      "backup lives outside the skills root",
    );
  });

  test("an identical unmanaged copy is adopted without rewriting", () => {
    const w = world("adopt-identical");
    assert.equal(install(w, ["--clients", "claude"]).code, 0);
    fs.unlinkSync(path.join(w.proj, ".claude", "skills", ".cw-manifest.json"));
    const r = install(w, ["--clients", "claude"]);
    assert.equal(r.code, 0, r.all);
    assert.match(r.all, /adopt-identical\s+alpha-skill/);
  });

  test("projects with different selections stay isolated from each other [CR-079]", () => {
    const w = world("isolation");
    const other = path.join(w.root, "other");
    fs.mkdirSync(other);
    const base = ["--profile", "dev", "--home", w.home];
    assert.equal(
      cw(w.lib, ["install", "--target", w.proj, ...base, "--clients", "claude"])
        .code,
      0,
    );
    assert.equal(
      cw(w.lib, [
        "install",
        "--target",
        other,
        ...base,
        "--clients",
        "codex",
        "--with-contract",
      ]).code,
      0,
    );
    const otherBefore = snapshot(other);
    assert.ok(
      !fs.existsSync(path.join(w.proj, ".agents")) &&
        !fs.existsSync(path.join(w.proj, "AGENTS.md")),
    );
    assert.ok(!fs.existsSync(path.join(other, ".claude")));
    assert.equal(
      cw(w.lib, ["uninstall", "--target", w.proj, "--home", w.home]).code,
      0,
    );
    assert.deepEqual(
      snapshot(other),
      otherBefore,
      "removing one project does not touch the other",
    );
    assert.equal(
      cw(w.lib, ["verify", "--target", other, "--home", w.home]).code,
      0,
    );
  });

  test("second run is a no-op (idempotent) [CR-009]", () => {
    const w = world("idem");
    assert.equal(install(w).code, 0);
    const before = snapshot(w.proj, { ignore: [".context-window"] });
    const r = install(w);
    assert.equal(r.code, 0, r.all);
    assert.deepEqual(snapshot(w.proj, { ignore: [".context-window"] }), before);
  });

  test("content drift without version bump is reported and fixed by sync [ACH-006/CR-014]", () => {
    const w = world("drift");
    assert.equal(install(w).code, 0);
    fs.appendFileSync(
      path.join(
        w.lib,
        "saas-skills",
        "engineering",
        "beta-skill",
        "references",
        "guide.md",
      ),
      "new line\n",
    );
    const status = cw(w.lib, ["status", "--target", w.proj, "--home", w.home]);
    assert.match(status.all, /outdated\s+beta-skill/);
    const verify = cw(w.lib, ["verify", "--target", w.proj, "--home", w.home]);
    assert.equal(verify.code, 1, verify.all);
    assert.equal(install(w).code, 0);
    assert.equal(
      cw(w.lib, ["verify", "--target", w.proj, "--home", w.home]).code,
      0,
    );
    assert.match(
      fs.readFileSync(
        path.join(
          w.proj,
          ".agents",
          "skills",
          "beta-skill",
          "references",
          "guide.md",
        ),
        "utf8",
      ),
      /new line/,
    );
  });

  test("local edits are detected and never silently overwritten [ACH-008/CR-013]", () => {
    const w = world("local-edit");
    assert.equal(install(w).code, 0);
    const file = path.join(
      w.proj,
      ".claude",
      "skills",
      "alpha-skill",
      "SKILL.md",
    );
    fs.appendFileSync(file, "\nLOCAL EDIT\n");
    assert.match(
      cw(w.lib, ["status", "--target", w.proj, "--home", w.home]).all,
      /modified-locally\s+alpha-skill/,
    );
    fs.appendFileSync(
      path.join(w.lib, "saas-skills", "engineering", "alpha-skill", "SKILL.md"),
      "\nupstream change\n",
    );
    const blocked = install(w);
    assert.equal(blocked.code, 2, blocked.all);
    assert.match(fs.readFileSync(file, "utf8"), /LOCAL EDIT/);
    const forced = install(w, ["--force-local"]);
    assert.equal(forced.code, 0, forced.all);
    const backup = forced.all.match(/backup: (.+)/)[1].trim();
    assert.match(
      fs.readFileSync(path.join(backup, "SKILL.md"), "utf8"),
      /LOCAL EDIT/,
    );
  });

  test("verify detects an incomplete package (missing auxiliary file) [CR-020]", () => {
    const w = world("incomplete");
    assert.equal(install(w).code, 0);
    fs.unlinkSync(
      path.join(
        w.proj,
        ".agents",
        "skills",
        "beta-skill",
        "references",
        "guide.md",
      ),
    );
    const v = cw(w.lib, ["verify", "--target", w.proj, "--home", w.home]);
    assert.equal(v.code, 1);
    assert.match(v.all, /modified-locally\s+beta-skill/);
  });

  test("removal and rename in the source clean managed entries only [CR-011]", () => {
    const w = world("rename", {
      skills: [
        { id: "alpha-skill" },
        { id: "beta-skill" },
        { id: "gamma-skill" },
      ],
    });
    assert.equal(install(w).code, 0);
    write(
      path.join(w.proj, ".claude", "skills", "team-skill", "SKILL.md"),
      "team\n",
    );
    removeSkill(w.lib, "beta-skill");
    renameSkill(w.lib, "gamma-skill", "gamma-renamed");
    const r = install(w);
    assert.equal(r.code, 0, r.all);
    for (const sink of [".claude", ".agents"]) {
      assert.ok(
        !fs.existsSync(path.join(w.proj, sink, "skills", "beta-skill")),
      );
      assert.ok(
        !fs.existsSync(path.join(w.proj, sink, "skills", "gamma-skill")),
      );
      assert.ok(
        fs.existsSync(
          path.join(w.proj, sink, "skills", "gamma-renamed", "SKILL.md"),
        ),
      );
    }
    assert.ok(
      fs.existsSync(
        path.join(w.proj, ".claude", "skills", "team-skill", "SKILL.md"),
      ),
    );
    assert.equal(
      cw(w.lib, ["verify", "--target", w.proj, "--home", w.home]).code,
      0,
    );
  });

  test("dry-run and plan write nothing and announce removals and conflicts [ACH-019/CR-018/CR-019]", () => {
    const w = world("dry");
    assert.equal(install(w).code, 0);
    removeSkill(w.lib, "beta-skill");
    fs.appendFileSync(
      path.join(w.proj, ".claude", "skills", "alpha-skill", "SKILL.md"),
      "edit\n",
    );
    const before = snapshot(w.root, { ignore: ["lib"] });
    const plan = cw(w.lib, [
      "plan",
      "--target",
      w.proj,
      "--home",
      w.home,
      "--json",
    ]);
    const report = json(plan);
    assert.equal(plan.code, 2);
    assert.ok(
      report.sinks.some((s) =>
        s.ops.some((o) => o.op === "remove" && o.id === "beta-skill"),
      ),
    );
    assert.ok(
      report.conflicts.some(
        (c) => c.type === "locally-modified" && c.id === "alpha-skill",
      ),
    );
    assert.deepEqual(snapshot(w.root, { ignore: ["lib"] }), before);
  });
});

describe("path safety", () => {
  test("malicious manifest entries are rejected and nothing is deleted [ACH-007/CR-058]", () => {
    for (const bad of [".", "", "../victim", "C:\\victim", "a/../../victim"]) {
      const w = world("manifest");
      write(
        path.join(w.proj, ".claude", "skills", "team-skill", "SKILL.md"),
        "team\n",
      );
      write(path.join(w.root, "victim", "keep.txt"), "keep\n");
      write(
        path.join(w.proj, ".claude", "skills", ".cw-manifest.json"),
        JSON.stringify({
          schema: "context-window/manifest@2",
          entries: [{ id: bad, packageHash: "0".repeat(64), files: {} }],
        }),
      );
      const r = install(w, ["--clients", "claude"]);
      assert.equal(r.code, 2, `${bad}: ${r.all}`);
      assert.match(r.all, /invalid-manifest/);
      assert.ok(
        fs.existsSync(
          path.join(w.proj, ".claude", "skills", "team-skill", "SKILL.md"),
        ),
      );
      assert.ok(fs.existsSync(path.join(w.root, "victim", "keep.txt")));
    }
  });

  test("a manifest file path escaping the entry is rejected [ACH-007]", () => {
    const w = world("manifest-file");
    write(
      path.join(w.proj, ".claude", "skills", ".cw-manifest.json"),
      JSON.stringify({
        schema: "context-window/manifest@2",
        entries: [
          {
            id: "alpha-skill",
            packageHash: "0".repeat(64),
            files: { "../../x": "0".repeat(64) },
          },
        ],
      }),
    );
    const r = install(w, ["--clients", "claude"]);
    assert.equal(r.code, 2);
    assert.match(r.all, /unsafe file path/);
  });

  test("a junction at an entry is a conflict and its target is untouched [CR-060]", () => {
    const w = world("junction-entry");
    write(path.join(w.root, "outside", "keep.txt"), "keep\n");
    fs.mkdirSync(path.join(w.proj, ".claude", "skills"), { recursive: true });
    fs.symlinkSync(
      path.join(w.root, "outside"),
      path.join(w.proj, ".claude", "skills", "alpha-skill"),
      "junction",
    );
    const r = install(w, ["--clients", "claude"]);
    assert.equal(r.code, 2, r.all);
    assert.match(r.all, /CONFLICT link alpha-skill/);
    assert.ok(fs.existsSync(path.join(w.root, "outside", "keep.txt")));
  });

  test("a project runtime dir that is a junction to outside the project is refused [CR-061]", () => {
    const w = world("junction-root");
    fs.mkdirSync(path.join(w.root, "elsewhere"), { recursive: true });
    fs.mkdirSync(path.join(w.proj, ".claude"), { recursive: true });
    fs.symlinkSync(
      path.join(w.root, "elsewhere"),
      path.join(w.proj, ".claude", "skills"),
      "junction",
    );
    const r = install(w, ["--clients", "claude"]);
    assert.equal(r.code, 2, r.all);
    assert.match(r.all, /unsafe-root/);
    assert.deepEqual(fs.readdirSync(path.join(w.root, "elsewhere")), []);
  });

  test("non-ASCII, spaces and dashes in target and home paths [ACH-004/CR-004/CR-061]", () => {
    const root = tmpRoot("unicode");
    roots.push(root);
    const lib = makeLibrary(root);
    const proj = path.join(root, "Projeto Açaí – Ção (teste)");
    const home = path.join(root, "Usuário Teste");
    fs.mkdirSync(proj, { recursive: true });
    const r = cw(
      lib,
      [
        "install",
        "--target",
        proj,
        "--profile",
        "dev",
        "--home",
        home,
        "--with-contract",
      ],
      { home },
    );
    assert.equal(r.code, 0, r.all);
    assert.equal(
      cw(lib, ["verify", "--target", proj, "--home", home], { home }).code,
      0,
    );
    assert.deepEqual(
      fs.readdirSync(root).sort(),
      ["Projeto Açaí – Ção (teste)", "Usuário Teste", "lib"].sort(),
      "no stray directories",
    );
    const u = cw(lib, ["uninstall", "--target", proj, "--home", home], {
      home,
    });
    assert.equal(u.code, 0, u.all);
    assert.ok(
      !fs.existsSync(path.join(proj, ".claude", "skills", "alpha-skill")),
    );
  });

  test(
    "case-mismatched existing folder is a conflict on case-insensitive filesystems",
    { skip: process.platform !== "win32" },
    () => {
      const w = world("case");
      write(
        path.join(w.proj, ".claude", "skills", "Alpha-Skill", "SKILL.md"),
        "x\n",
      );
      const r = install(w, ["--clients", "claude"]);
      assert.equal(r.code, 2, r.all);
      assert.match(r.all, /case-mismatch/);
    },
  );
});

describe("failures, interruption and concurrency", () => {
  test("an injected failure rolls back to the exact previous state [ACH-009/CR-015]", () => {
    const w = world("rollback", {
      skills: [
        { id: "alpha-skill" },
        { id: "beta-skill" },
        { id: "gamma-skill" },
      ],
    });
    assert.equal(install(w, ["--clients", "claude"]).code, 0);
    for (const id of ["alpha-skill", "beta-skill", "gamma-skill"])
      fs.appendFileSync(
        path.join(w.lib, "saas-skills", "engineering", id, "SKILL.md"),
        "\nv2\n",
      );
    const before = snapshot(w.proj);
    const r = cw(w.lib, ["install", "--target", w.proj, "--home", w.home], {
      env: { CW_TEST_FAULT: "throw-after:2" },
    });
    assert.equal(r.code, 1, r.all);
    assert.match(r.all, /rolled back/);
    assert.deepEqual(snapshot(w.proj), before);
  });

  test("a killed process leaves a journal; status reports it and recover restores the previous state [CR-015/CR-016]", () => {
    for (const fault of ["exit-after:1", "exit-mid:2"]) {
      const w = world("kill", {
        skills: [{ id: "alpha-skill" }, { id: "beta-skill" }],
      });
      assert.equal(install(w, ["--clients", "claude"]).code, 0);
      for (const id of ["alpha-skill", "beta-skill"])
        fs.appendFileSync(
          path.join(w.lib, "saas-skills", "engineering", id, "SKILL.md"),
          "\nv2\n",
        );
      const before = snapshot(w.proj, { ignore: [".claude/.cw"] });
      const r = cw(w.lib, ["install", "--target", w.proj, "--home", w.home], {
        env: { CW_TEST_FAULT: fault },
      });
      assert.equal(r.code, 99, `${fault}: ${r.all}`);
      assert.match(
        cw(w.lib, ["status", "--target", w.proj, "--home", w.home]).all,
        /INTERRUPTED/,
      );
      const again = install(w);
      assert.equal(
        again.code,
        3,
        "a new install must refuse as busy/interrupted while a journal exists",
      );
      assert.equal(
        cw(w.lib, ["recover", "--target", w.proj, "--home", w.home]).code,
        0,
      );
      assert.deepEqual(
        snapshot(w.proj, { ignore: [".claude/.cw"] }),
        before,
        fault,
      );
      assert.equal(install(w).code, 0);
      assert.equal(
        cw(w.lib, ["verify", "--target", w.proj, "--home", w.home]).code,
        0,
      );
    }
  });

  test("a write failure (directory in place of a file) is reported and state stays verifiable", () => {
    const w = world("eisdir", {
      skills: [{ id: "alpha-skill" }, { id: "beta-skill" }],
    });
    assert.equal(install(w, ["--clients", "claude"]).code, 0);
    fs.appendFileSync(
      path.join(w.lib, "saas-skills", "engineering", "beta-skill", "SKILL.md"),
      "\nv2\n",
    );
    const ctl = path.join(w.proj, ".claude", ".cw", "skills");
    write(
      path.join(ctl, "staging"),
      "a file where the staging directory must be\n",
    );
    const r = install(w);
    assert.equal(r.code, 1, r.all);
    fs.unlinkSync(path.join(ctl, "staging"));
    assert.equal(
      cw(w.lib, ["status", "--target", w.proj, "--home", w.home]).code,
      0,
    );
    assert.equal(install(w).code, 0);
    assert.equal(
      cw(w.lib, ["verify", "--target", w.proj, "--home", w.home]).code,
      0,
    );
  });

  test("a live lock without journal yields busy, not a false conflict [ACH-010/CR-017]", () => {
    // Reproduces the unlock→conflict race: another holder still owns the lock after its
    // journal was removed, while disk looks "locally-modified". Mutating install must
    // return 3 (busy), never 2 (conflict) from that unlocked observation.
    const w = world("lock-no-journal", {
      skills: [{ id: "alpha-skill" }, { id: "beta-skill" }],
    });
    assert.equal(install(w, ["--clients", "claude"]).code, 0);
    const sink = path.join(w.proj, ".claude", "skills");
    fs.appendFileSync(
      path.join(sink, "alpha-skill", "SKILL.md"),
      "\nlocal drift\n",
    );
    const lockFile = path.join(controlDir(sink), "lock");
    fs.mkdirSync(path.dirname(lockFile), { recursive: true });
    fs.writeFileSync(
      lockFile,
      JSON.stringify({
        pid: process.pid,
        host: os.hostname(),
        startedAt: new Date().toISOString(),
        command: "install",
      }),
    );
    try {
      const r = install(w, ["--clients", "claude"]);
      assert.equal(r.code, 3, r.all);
      assert.match(r.all, /locked|being updated/i);
    } finally {
      try {
        fs.unlinkSync(lockFile);
      } catch {
        /* released */
      }
    }
  });

  test("concurrent installs never produce a misleading success [ACH-010/CR-017]", async () => {
    const w = world("concurrency", {
      skills: [
        { id: "alpha-skill" },
        { id: "beta-skill" },
        { id: "gamma-skill" },
      ],
    });
    const run = () =>
      new Promise((resolve) => {
        const child = spawn(
          process.execPath,
          [
            "--permission",
            `--allow-fs-read=${w.root}`,
            `--allow-fs-write=${w.root}`,
            path.join(w.lib, "scripts", "cw.mjs"),
            "install",
            "--target",
            w.proj,
            "--profile",
            "dev",
            "--home",
            w.home,
          ],
          {
            cwd: w.root,
            env: {
              SystemRoot: process.env.SystemRoot,
              PATH: process.env.PATH,
              USERPROFILE: w.home,
            },
          },
        );
        child.on("close", (code) => resolve(code));
      });
    for (let round = 0; round < 5; round += 1) {
      fs.appendFileSync(
        path.join(
          w.lib,
          "saas-skills",
          "engineering",
          "alpha-skill",
          "SKILL.md",
        ),
        `\nround ${round}\n`,
      );
      const codes = await Promise.all([run(), run(), run(), run()]);
      assert.ok(
        codes.every((c) => [0, 3].includes(c)),
        `round ${round}: ${codes}`,
      );
      assert.ok(
        codes.includes(0),
        `round ${round}: at least one run must succeed`,
      );
      const v = cw(w.lib, ["verify", "--target", w.proj, "--home", w.home]);
      assert.equal(v.code, 0, `round ${round}: ${v.all}`);
    }
  });
});

describe("user scope, clients and legacy installs", () => {
  test("user scope honours CLAUDE_CONFIG_DIR and writes ~/.agents/skills for Codex/Cursor [CR-029/CR-030]", () => {
    const w = world("user");
    const claudeDir = path.join(w.root, "home", "custom-claude");
    const r = cw(w.lib, ["install", "--user", "--profile", "dev"], {
      env: { CLAUDE_CONFIG_DIR: claudeDir },
    });
    assert.equal(r.code, 0, r.all);
    assert.ok(
      fs.existsSync(path.join(claudeDir, "skills", "alpha-skill", "SKILL.md")),
    );
    assert.ok(
      fs.existsSync(
        path.join(w.home, ".agents", "skills", "alpha-skill", "SKILL.md"),
      ),
    );
    assert.ok(
      !fs.existsSync(path.join(w.home, ".codex", "skills", "alpha-skill")),
      "the legacy Codex location is not written",
    );
  });

  test("claude+cursor uses a single sink (Cursor reads .claude/skills) to avoid duplicates", () => {
    const w = world("single-sink");
    assert.equal(install(w, ["--clients", "claude,cursor"]).code, 0);
    assert.ok(
      fs.existsSync(path.join(w.proj, ".claude", "skills", "alpha-skill")),
    );
    assert.ok(!fs.existsSync(path.join(w.proj, ".agents")));
  });

  test("explicit-only skills are marked for every client", () => {
    const w = world("explicit", {
      skills: [{ id: "alpha-skill", invocation: "explicit" }],
    });
    assert.equal(install(w).code, 0);
    const skill = fs.readFileSync(
      path.join(w.proj, ".agents", "skills", "alpha-skill", "SKILL.md"),
      "utf8",
    );
    assert.match(skill, /^disable-model-invocation: true$/m);
    const openai = fs.readFileSync(
      path.join(
        w.proj,
        ".agents",
        "skills",
        "alpha-skill",
        "agents",
        "openai.yaml",
      ),
      "utf8",
    );
    assert.match(openai, /allow_implicit_invocation: false/);
  });

  test("a 1.x install blocks until --migrate-legacy, which backs up before removing [CR-021/CR-031]", () => {
    const w = world("legacy");
    const legacyCodex = path.join(w.home, ".codex", "skills");
    write(path.join(legacyCodex, "alpha-skill", "SKILL.md"), "old v1 copy\n");
    write(path.join(legacyCodex, "hatch-pet", "SKILL.md"), "not managed\n");
    write(
      path.join(legacyCodex, ".saas-skills-manifest.json"),
      JSON.stringify({
        library: "context-window/saas-skills",
        version: "1.17.0",
        artifacts: ["alpha-skill"],
      }),
    );
    const rules = path.join(w.home, ".cursor", "rules");
    write(path.join(rules, "skill-alpha-skill.mdc"), "old rule\n");
    write(path.join(rules, "my-rule.mdc"), "user rule\n");
    write(
      path.join(rules, ".saas-skills-manifest.json"),
      JSON.stringify({
        library: "context-window/saas-skills",
        version: "1.17.0",
        artifacts: ["skill-alpha-skill.mdc"],
      }),
    );
    const blocked = cw(w.lib, [
      "install",
      "--user",
      "--profile",
      "dev",
      "--home",
      w.home,
    ]);
    assert.equal(blocked.code, 2, blocked.all);
    assert.match(blocked.all, /legacy-install-present/);
    const migrated = cw(w.lib, [
      "install",
      "--user",
      "--profile",
      "dev",
      "--home",
      w.home,
      "--migrate-legacy",
    ]);
    assert.equal(migrated.code, 0, migrated.all);
    assert.ok(!fs.existsSync(path.join(legacyCodex, "alpha-skill")));
    assert.ok(
      fs.existsSync(path.join(legacyCodex, "hatch-pet", "SKILL.md")),
      "unmanaged content survives",
    );
    assert.ok(fs.existsSync(path.join(rules, "my-rule.mdc")));
    assert.ok(!fs.existsSync(path.join(rules, "skill-alpha-skill.mdc")));
    assert.match(migrated.all, /backup: .+alpha-skill/);
  });

  test("doctor reports divergent homonymous copies across discovery dirs without touching them [ACH-011/CR-031]", () => {
    const w = world("doctor");
    assert.equal(
      cw(w.lib, [
        "install",
        "--user",
        "--profile",
        "dev",
        "--home",
        w.home,
        "--clients",
        "claude",
      ]).code,
      0,
    );
    write(
      path.join(w.home, ".agents", "skills", "alpha-skill", "SKILL.md"),
      skillMd("alpha-skill", {
        description: "Corrupted copy across Codex, Codex, and Cursor.",
      }),
    );
    const before = snapshot(w.home);
    const r = cw(w.lib, [
      "doctor",
      "--user",
      "--home",
      w.home,
      "--json",
      "--strict",
    ]);
    const report = json(r);
    assert.equal(r.code, 1);
    const dup = report.clients.cursor.duplicates.find(
      (d) => d.name === "alpha-skill",
    );
    assert.equal(dup.identical, false);
    assert.ok(
      report.clients.codex.copies.some(
        (c) => c.state === "unmanaged-divergent",
      ),
    );
    assert.deepEqual(snapshot(w.home), before, "doctor is read-only");
  });

  test("a project inside the home directory does not list the user skills dir twice", () => {
    const w = world("doctor-nested");
    const proj = path.join(w.home, "work", "proj");
    fs.mkdirSync(proj, { recursive: true });
    const common = ["--profile", "dev", "--home", w.home, "--clients", "codex"];
    assert.equal(cw(w.lib, ["install", "--user", ...common]).code, 0);
    assert.equal(cw(w.lib, ["install", "--target", proj, ...common]).code, 0);
    const report = json(
      cw(w.lib, [
        "doctor",
        "--target",
        proj,
        "--home",
        w.home,
        "--clients",
        "codex",
        "--json",
      ]),
    );
    const dirs = report.clients.codex.copies.map((c) => c.dir.toLowerCase());
    assert.equal(new Set(dirs).size, dirs.length, dirs.join("\n"));
    const alpha = report.clients.codex.duplicates.find(
      (d) => d.name === "alpha-skill",
    );
    assert.equal(alpha.copies.length, 2, "one user copy and one project copy");
  });
});

describe("doctor project boundaries", () => {
  test("project discovery stops at the git root, like the clients do", () => {
    const w = world("doctor-gitroot");
    const outer = path.join(w.root, "outer");
    const repo = path.join(outer, "repo");
    const pkg = path.join(repo, "packages", "app");
    fs.mkdirSync(path.join(repo, ".git"), { recursive: true });
    fs.mkdirSync(pkg, { recursive: true });
    write(
      path.join(outer, ".claude", "skills", "alpha-skill", "SKILL.md"),
      skillMd("alpha-skill", {
        description: "Stale copy above the repository.",
      }),
    );
    write(
      path.join(repo, ".claude", "skills", "beta-skill", "SKILL.md"),
      skillMd("beta-skill", { description: "Copy at the repository root." }),
    );
    const report = json(
      cw(w.lib, [
        "doctor",
        "--target",
        pkg,
        "--home",
        w.home,
        "--clients",
        "claude",
        "--json",
      ]),
    );
    const dirs = report.clients.claude.copies.map((c) => c.dir);
    assert.ok(
      dirs.some((d) =>
        d.includes(path.join("repo", ".claude", "skills", "beta-skill")),
      ),
      "the git root is scanned",
    );
    assert.ok(
      !dirs.some((d) =>
        d.includes(path.join("outer", ".claude", "skills", "alpha-skill")),
      ),
      "nothing above the git root",
    );
  });
});

describe("strict CLI", () => {
  test("unknown flags, positional paths and missing destination are usage errors [ACH-018/CR-080]", () => {
    const w = world("cli");
    for (const args of [
      ["install", "--target", w.proj, "--profile", "dev", "--projet-only"],
      ["install", w.proj, "--profile", "dev"],
      ["install", "--profile", "dev"],
      ["install", "--target", w.proj],
    ]) {
      const r = cw(w.lib, [...args, "--home", w.home]);
      assert.equal(r.code, 64, `${args.join(" ")}: ${r.all}`);
    }
    assert.deepEqual(Object.keys(snapshot(w.home)), []);
    assert.deepEqual(Object.keys(snapshot(w.proj)), []);
  });
});

describe("version bump", () => {
  test("a version bump alone marks entries outdated because identity metadata changes", () => {
    const w = world("bump");
    assert.equal(install(w).code, 0);
    setVersion(w.lib, "2.0.1-test");
    assert.match(
      cw(w.lib, ["status", "--target", w.proj, "--home", w.home]).all,
      /outdated/,
    );
    assert.equal(install(w).code, 0);
    assert.equal(
      cw(w.lib, ["verify", "--target", w.proj, "--home", w.home]).code,
      0,
    );
  });
});

describe("lock races [CX-11]", () => {
  const liveHolder = () =>
    JSON.stringify({
      pid: process.pid,
      host: os.hostname(),
      startedAt: new Date().toISOString(),
      command: "install",
    });
  const deadPid = () => spawnSync(process.execPath, ["-e", ""]).pid;
  function withFirstLockRead(lockFile, replacement, fn) {
    const real = fs.readFileSync;
    let first = true;
    fs.readFileSync = (file, ...rest) => {
      if (first && path.resolve(String(file)) === path.resolve(lockFile)) {
        first = false;
        return replacement();
      }
      return real(file, ...rest);
    };
    try {
      return fn();
    } finally {
      fs.readFileSync = real;
    }
  }

  test("a lock released and re-taken between the publish attempt and the read is never deleted", () => {
    const root = tmpRoot("lock-vanished");
    roots.push(root);
    const sink = path.join(root, "proj", ".claude", "skills");
    const lockFile = path.join(controlDir(sink), "lock");
    const live = liveHolder();
    write(lockFile, live);
    const vanished = () => {
      throw Object.assign(new Error("ENOENT: lock released"), {
        code: "ENOENT",
      });
    };
    assert.throws(
      () =>
        withFirstLockRead(lockFile, vanished, () =>
          acquireLock(sink, "install"),
        ),
      BusyError,
    );
    assert.equal(
      fs.readFileSync(lockFile, "utf8"),
      live,
      "the new holder keeps its lock",
    );
  });

  test("a stale lock replaced by a live one before removal is left alone", () => {
    const root = tmpRoot("lock-stale-replaced");
    roots.push(root);
    const sink = path.join(root, "proj", ".claude", "skills");
    const lockFile = path.join(controlDir(sink), "lock");
    const live = liveHolder();
    write(lockFile, live);
    const stale = JSON.stringify({
      pid: deadPid(),
      host: os.hostname(),
      startedAt: "2026-01-01T00:00:00.000Z",
      command: "install",
    });
    assert.throws(
      () =>
        withFirstLockRead(
          lockFile,
          () => stale,
          () => acquireLock(sink, "install"),
        ),
      BusyError,
    );
    assert.equal(
      fs.readFileSync(lockFile, "utf8"),
      live,
      "the live lock survives",
    );
  });

  test("a stale lock with no journal is taken over", () => {
    const root = tmpRoot("lock-stale");
    roots.push(root);
    const sink = path.join(root, "proj", ".claude", "skills");
    const lockFile = path.join(controlDir(sink), "lock");
    write(
      lockFile,
      JSON.stringify({
        pid: deadPid(),
        host: os.hostname(),
        startedAt: "2026-01-01T00:00:00.000Z",
        command: "install",
      }),
    );
    const release = acquireLock(sink, "install");
    assert.equal(
      JSON.parse(fs.readFileSync(lockFile, "utf8")).pid,
      process.pid,
    );
    release();
    assert.ok(!fs.existsSync(lockFile));
  });
});

describe("client adapter failures [CX-10]", () => {
  const verify = (w, scope = ["--target", w.proj]) =>
    cw(w.lib, ["verify", ...scope, "--home", w.home]);
  const blocksIntact = (file) => {
    const text = fs.readFileSync(file, "utf8");
    const begins = (text.match(/<!-- BEGIN context-window:/g) ?? []).length;
    const ends = (text.match(/<!-- END context-window:/g) ?? []).length;
    return begins === ends;
  };

  for (const point of ["AGENTS.md", "CLAUDE.md", "hook"])
    test(`a failure before the ${point} adapter is reported, verify fails and a new install converges`, () => {
      const w = world(`adapter-${point.replace(/\W/g, "")}`);
      write(path.join(w.proj, "AGENTS.md"), "# Team notes\n\nkeep me\n");
      const flags = ["--with-usage-policy", "--with-claude-hook"];
      assert.equal(install(w, flags).code, 0);
      setVersion(w.lib, "2.0.1-test");
      const r = cw(
        w.lib,
        [
          "install",
          "--target",
          w.proj,
          "--profile",
          "dev",
          "--home",
          w.home,
          ...flags,
        ],
        { env: { CW_TEST_FAULT: `throw-before:${point}` } },
      );
      assert.equal(r.code, 1, r.all);
      assert.match(r.all, /FAILED: CW_TEST_FAULT/);
      const v = verify(w);
      assert.equal(
        v.code,
        1,
        `an incomplete install is never verified\n${v.all}`,
      );
      for (const f of ["AGENTS.md", "CLAUDE.md"])
        assert.ok(
          blocksIntact(path.join(w.proj, f)),
          `${f} has no half-written block`,
        );
      assert.match(
        fs.readFileSync(path.join(w.proj, "AGENTS.md"), "utf8"),
        /keep me/,
      );
      assert.equal(install(w, flags).code, 0);
      assert.equal(verify(w).code, 0);
    });

  test("a newly requested hook that failed to be written is not verified as installed", () => {
    const w = world("adapter-new-hook");
    assert.equal(install(w, ["--with-usage-policy"]).code, 0);
    const r = cw(
      w.lib,
      ["install", "--target", w.proj, "--home", w.home, "--with-claude-hook"],
      { env: { CW_TEST_FAULT: "throw-before:hook" } },
    );
    assert.equal(r.code, 1, r.all);
    const v = verify(w);
    assert.equal(v.code, 1, v.all);
    assert.match(v.all, /INCOMPLETE/);
    assert.equal(
      cw(w.lib, [
        "install",
        "--target",
        w.proj,
        "--home",
        w.home,
        "--with-claude-hook",
      ]).code,
      0,
    );
    const ok = verify(w);
    assert.equal(ok.code, 0, ok.all);
    assert.match(ok.all, /claude hook: script=current registered=true/);
  });

  test("a failure before the Codex user AGENTS.md block is reported and converges", () => {
    const w = world("adapter-codex-user");
    const user = [
      "--user",
      "--profile",
      "dev",
      "--home",
      w.home,
      "--clients",
      "codex",
      "--with-usage-policy",
    ];
    assert.equal(cw(w.lib, ["install", ...user]).code, 0);
    const codexAgents = path.join(w.home, ".codex", "AGENTS.md");
    assert.ok(fs.existsSync(codexAgents));
    setVersion(w.lib, "2.0.1-test");
    const r = cw(w.lib, ["install", ...user], {
      env: { CW_TEST_FAULT: "throw-before:AGENTS.md" },
    });
    assert.equal(r.code, 1, r.all);
    assert.equal(verify(w, ["--user"]).code, 1);
    assert.ok(blocksIntact(codexAgents));
    assert.equal(cw(w.lib, ["install", ...user]).code, 0);
    assert.equal(verify(w, ["--user"]).code, 0);
  });
});
