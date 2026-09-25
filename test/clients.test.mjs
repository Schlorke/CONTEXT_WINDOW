// Client discovery through the real CLIs, without any model call (see scripts/lib/client-probes.mjs).
// Each suite runs only when its binary is found (CW_CODEX_BIN / CW_CLAUDE_BIN, PATH, or for Codex
// the ChatGPT editor extension); otherwise it is reported as skipped. These tests prove discovery
// and loading, not how a model applies the skills.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { REPO, cleanup, cw, tmpRoot, write } from "./helpers.mjs";
import {
  claudeProbe as probeClaude,
  codexPromptInput,
  findClaude,
  findCodex,
} from "../scripts/lib/client-probes.mjs";

const CODEX = findCodex()?.path ?? null;
const CLAUDE = findClaude()?.path ?? null;
const registry = JSON.parse(
  fs.readFileSync(path.join(REPO, "catalog", "registry.json"), "utf8"),
);
const devSkills = registry.skills.filter(
  (s) => s.status === "active" && s.profiles.includes("dev"),
);
const samePath = (a, b) =>
  process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b;

function buildBundle(root) {
  const build = spawnSync(
    process.execPath,
    [
      "--permission",
      `--allow-fs-read=${REPO}`,
      `--allow-fs-read=${root}`,
      `--allow-fs-write=${root}`,
      path.join(REPO, "scripts", "cw.mjs"),
      "build",
      "--out",
      path.join(root, "bundle"),
    ],
    { encoding: "utf8" },
  );
  assert.equal(build.status, 0, build.stderr);
  return path.join(root, "bundle");
}
function snapshotNames(dir, base = dir, acc = {}) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !e.isSymbolicLink()) snapshotNames(full, base, acc);
    else acc[path.relative(base, full).split(path.sep).join("/")] = true;
  }
  return acc;
}

describe(
  "Codex discovery [ACH-011/CR-031]",
  { skip: CODEX ? false : "Codex CLI not found" },
  () => {
    let root;
    const promptInput = (cwd) => codexPromptInput(CODEX, root, cwd);
    before(() => {
      root = tmpRoot("codex");
      for (const d of ["home", "codex-home", "proj", "elsewhere"])
        fs.mkdirSync(path.join(root, d), { recursive: true });
      const lib = buildBundle(root);
      spawnSync("git", ["init", "-q"], { cwd: path.join(root, "proj") });
      write(
        path.join(root, "proj", "AGENTS.md"),
        "# Team rules\n\nKeep these team rules.\n",
      );
      const common = [
        "--profile",
        "dev",
        "--clients",
        "codex",
        "--home",
        path.join(root, "home"),
        "--codex-home",
        path.join(root, "codex-home"),
      ];
      assert.equal(
        cw(
          lib,
          [
            "install",
            "--target",
            path.join(root, "proj"),
            ...common,
            "--with-usage-policy",
          ],
          { root },
        ).code,
        0,
      );
      assert.equal(cw(lib, ["install", "--user", ...common], { root }).code, 0);
    });
    after(() => root && cleanup(root));

    test("project skills are visible to Codex, explicit-only skills are not implicit", () => {
      const { skills } = promptInput(path.join(root, "proj"));
      const projectRoot = path.join(root, "proj", ".agents", "skills");
      const visible = new Set(
        skills
          .filter((s) => s.root && samePath(s.root, projectRoot))
          .map((s) => s.name),
      );
      for (const s of devSkills) {
        if (s.invocation === "explicit")
          assert.ok(
            !visible.has(s.id),
            `${s.id} must not be listed for implicit use`,
          );
        else
          assert.ok(
            visible.has(s.id),
            `${s.id} missing from the Codex skill list`,
          );
      }
    });

    test("the project AGENTS.md blocks reach the prompt and the team's own text is preserved", () => {
      const { text } = promptInput(path.join(root, "proj"));
      assert.match(text, /Keep these team rules\./);
      assert.match(text, /mandatory product architecture contract/);
      assert.match(text, /Skill usage disclosure/);
    });

    test("the user-scope contract in $CODEX_HOME/AGENTS.md reaches the prompt outside any project", () => {
      const { text } = promptInput(path.join(root, "elsewhere"));
      assert.ok(fs.existsSync(path.join(root, "codex-home", "AGENTS.md")));
      assert.match(text, /mandatory product architecture contract/);
      assert.doesNotMatch(text, /Keep these team rules\./);
    });

    test("the isolated CODEX_HOME never gains a credential cache [ACH-005]", () => {
      assert.ok(!fs.existsSync(path.join(root, "codex-home", "auth.json")));
    });
  },
);

describe(
  "Claude Code discovery [ACH-011/ACH-020/CR-031]",
  { skip: CLAUDE ? false : "Claude Code CLI not found" },
  () => {
    let root;
    const probe = (cwd, prompt) => {
      const r = probeClaude(CLAUDE, root, cwd, prompt);
      assert.equal(r.costUsd, 0, "no paid call");
      assert.equal(r.apiMs, 0, "no API round trip");
      return r;
    };
    before(() => {
      root = tmpRoot("claude");
      for (const d of ["home", "claude-config", "proj", "elsewhere"])
        fs.mkdirSync(path.join(root, d), { recursive: true });
      const lib = buildBundle(root);
      spawnSync("git", ["init", "-q"], { cwd: path.join(root, "proj") });
      const common = [
        "--profile",
        "dev",
        "--clients",
        "claude",
        "--home",
        path.join(root, "home"),
        "--claude-config-dir",
        path.join(root, "claude-config"),
      ];
      assert.equal(
        cw(
          lib,
          [
            "install",
            "--target",
            path.join(root, "proj"),
            ...common,
            "--with-claude-hook",
          ],
          { root },
        ).code,
        0,
      );
    });
    after(() => root && cleanup(root));

    test("project skills are discovered and the explicit-only skill is withheld from the model", () => {
      const proj = path.join(root, "proj");
      const installed = probe(proj, "hello");
      for (const s of devSkills)
        assert.ok(installed.skills.includes(s.id), `${s.id} not discovered`);
      assert.match(
        installed.loaded,
        new RegExp(`project: ${devSkills.length}\\b`),
      );
      const skillFile = path.join(
        proj,
        ".claude",
        "skills",
        "multi-agent-skill-installer",
        "SKILL.md",
      );
      const original = fs.readFileSync(skillFile);
      try {
        fs.writeFileSync(
          skillFile,
          original
            .toString("utf8")
            .replace(/^disable-model-invocation: true\r?\n/m, ""),
        );
        const withoutFlag = probe(proj, "hello");
        assert.equal(
          withoutFlag.sent,
          installed.sent + 1,
          "disable-model-invocation removes exactly one skill from the model listing",
        );
      } finally {
        fs.writeFileSync(skillFile, original);
      }
    });

    test("the routing hook adds context for a matching prompt and stays silent otherwise", () => {
      const proj = path.join(root, "proj");
      assert.equal(
        probe(
          proj,
          "Quero criar o schema do banco com Prisma e adicionar um indice",
        ).hookContext,
        true,
      );
      assert.equal(
        probe(proj, "Escreva um poema curto sobre o mar").hookContext,
        false,
      );
    });

    test("user-scope skills in CLAUDE_CONFIG_DIR are discovered outside any project", () => {
      const lib = path.join(root, "bundle");
      assert.equal(
        cw(
          lib,
          [
            "install",
            "--user",
            "--profile",
            "dev",
            "--clients",
            "claude",
            "--home",
            path.join(root, "home"),
            "--claude-config-dir",
            path.join(root, "claude-config"),
          ],
          { root },
        ).code,
        0,
      );
      const r = probe(path.join(root, "elsewhere"), "hello");
      assert.match(r.loaded, new RegExp(`user: ${devSkills.length}\\b`));
      for (const s of devSkills)
        assert.ok(
          r.skills.includes(s.id),
          `${s.id} not discovered at user scope`,
        );
    });

    test("the isolated profile never gains a credential cache [ACH-005]", () => {
      const found = Object.keys(snapshotNames(root)).filter((rel) =>
        /(^|\/)(auth\.json|\.credentials\.json)$/.test(rel),
      );
      assert.deepEqual(found, []);
    });
  },
);
