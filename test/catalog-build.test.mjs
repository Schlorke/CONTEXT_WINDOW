// Catalog validation, managed blocks, Claude hook and distributable build.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { after, describe, test } from "node:test";
import {
  REPO,
  cleanup,
  copyDir,
  cw,
  json,
  makeLibrary,
  skillMd,
  snapshot,
  tmpRoot,
  write,
} from "./helpers.mjs";
import {
  normalize,
  suggest,
} from "../scripts/templates/claude-skill-router.mjs";

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

describe("catalog gate", () => {
  const cases = [
    [
      "path traversal in name [ACH-003/CR-057]",
      { id: "evil-skill", name: "../../outside" },
      /frontmatter name "..\/..\/outside" differs from id/,
    ],
    [
      "duplicate id across collections [CR-078]",
      "dup",
      /duplicate skill id "alpha-skill"/,
    ],
    ["unregistered SKILL.md", "unregistered", /unregistered SKILL.md package/],
    [
      "invalid YAML frontmatter",
      {
        id: "yaml-skill",
        skillMd:
          "---\nname: yaml-skill\ndescription:\n  Frames shots: focal length,\n  focus and camera animation.\n---\n# x\n",
      },
      /invalid YAML/,
    ],
    [
      "broken reference",
      { id: "ref-skill", body: "See `references/missing.md`." },
      /broken reference: references\/missing.md/,
    ],
    [
      "reference escaping the package",
      { id: "esc-skill", body: "See [x](../other/SKILL.md)." },
      /reference escapes the package/,
    ],
    [
      "machine-specific path",
      { id: "path-skill", body: "Run from C:/Users/someone/project." },
      /machine-specific absolute path/,
    ],
    [
      "POSIX home path",
      { id: "posix-skill", body: "Config lives in /home/alice/.config." },
      /machine-specific absolute path/,
    ],
    [
      "secret-like content",
      {
        id: "secret-skill",
        files: {
          "references/k.md": `key ${["sk", "proj", "A".repeat(28)].join("-")}\n`,
        },
      },
      /secret-like content/,
    ],
    [
      "private file in a skill package [ACH-005]",
      { id: "priv-skill", files: { "assets/.env": "SYNTHETIC=1\n" } },
      /private file in package: assets\/\.env/,
    ],
    [
      "missing operational contract",
      {
        id: "bare-skill",
        skillMd: "---\nname: bare-skill\ndescription: bare\n---\n# bare\n",
      },
      /missing "## Operational Contract"/,
    ],
  ];
  for (const [label, spec, pattern] of cases) {
    test(`rejects ${label}`, () => {
      let skills;
      if (spec === "dup")
        skills = [
          { id: "alpha-skill" },
          { id: "alpha-skill", collection: "frontend" },
        ];
      else if (spec === "unregistered") skills = [{ id: "alpha-skill" }];
      else
        skills = [
          { id: "alpha-skill" },
          {
            ...spec,
            skillMd:
              spec.skillMd ??
              skillMd(spec.name ?? spec.id, { body: spec.body ?? "" }),
          },
        ];
      const w = world("catalog", { skills });
      if (spec === "unregistered")
        write(
          path.join(
            w.lib,
            "saas-skills",
            "engineering",
            "stray-skill",
            "SKILL.md",
          ),
          skillMd("stray-skill"),
        );
      const r = cw(w.lib, ["catalog"]);
      assert.equal(r.code, 1, r.all);
      assert.match(r.all, pattern);
      const inst = cw(w.lib, [
        "install",
        "--target",
        w.proj,
        "--profile",
        "dev",
        "--home",
        w.home,
      ]);
      assert.equal(inst.code, 1, "install refuses an invalid catalog");
      assert.deepEqual(Object.keys(snapshot(w.proj)), []);
    });
  }

  test("valid multi-line YAML metadata is parsed and rendered as the same value [CR-005]", () => {
    const md = `---\nname: folded-skill\ndescription: >-\n  Frames shots with focal length,\n  focus and camera animation.\nmetadata:\n  version: 1.0\n  last_validated: 2026-04-12\n---\n\n# folded\n\n${skillMd("x").split("\n\n# x\n\n")[1]}`;
    const w = world("folded", {
      skills: [{ id: "folded-skill", skillMd: md }],
    });
    assert.equal(cw(w.lib, ["catalog"]).code, 0);
    assert.equal(
      cw(w.lib, [
        "install",
        "--target",
        w.proj,
        "--profile",
        "dev",
        "--home",
        w.home,
      ]).code,
      0,
    );
    const rendered = fs.readFileSync(
      path.join(w.proj, ".claude", "skills", "folded-skill", "SKILL.md"),
      "utf8",
    );
    assert.match(
      rendered,
      /^description: Frames shots with focal length, focus and camera animation\.$/m,
    );
    assert.match(
      rendered,
      /^ {2}version: '1\.0'$/m,
      "metadata values stay strings",
    );
    assert.match(
      rendered,
      /^ {2}last_validated: '2026-04-12'$/m,
      "dates are not reinterpreted",
    );
  });

  test("relative paths that contain home/ or Users/ are not machine paths", () => {
    const w = world("relpath", {
      skills: [
        {
          id: "alpha-skill",
          skillMd: skillMd("alpha-skill", {
            body: "Move to `pages/home/ui/HomePage.tsx` and `src/Users/list.ts`.",
          }),
        },
      ],
    });
    const r = cw(w.lib, ["catalog"]);
    assert.equal(r.code, 0, r.all);
  });

  test("imported/quarantined items are inventoried but never distributed", () => {
    const w = world("imported", {
      skills: [
        { id: "alpha-skill" },
        {
          id: "imported-thing",
          root: "imported-skills",
          collection: "criativos",
          status: "imported-unreviewed",
          profiles: [],
        },
      ],
    });
    const r = cw(w.lib, ["catalog", "--json"]);
    assert.equal(r.code, 0, r.all);
    assert.equal(json(r).counts["imported:imported-unreviewed"], 1);
    assert.equal(
      cw(w.lib, [
        "install",
        "--target",
        w.proj,
        "--profile",
        "dev",
        "--home",
        w.home,
      ]).code,
      0,
    );
    assert.ok(
      !fs.existsSync(path.join(w.proj, ".claude", "skills", "imported-thing")),
    );
  });

  test("the lock file detects catalog drift", () => {
    const w = world("lock");
    assert.equal(cw(w.lib, ["catalog", "--write-lock"]).code, 0);
    assert.equal(cw(w.lib, ["catalog", "--check"]).code, 0);
    fs.appendFileSync(
      path.join(w.lib, "saas-skills", "engineering", "alpha-skill", "SKILL.md"),
      "\nchange\n",
    );
    const r = cw(w.lib, ["catalog", "--check"]);
    assert.equal(r.code, 1);
    assert.match(r.all, /stale/);
  });

  test("catalog hashes are EOL-stable across CRLF and LF working trees", async () => {
    const { canonicalBytes, hashTree, packageHash, sha256Canonical } =
      await import("../scripts/lib/fsx.mjs");
    const lf = Buffer.from("# Title\n\nBody line\n", "utf8");
    const crlf = Buffer.from("# Title\r\n\r\nBody line\r\n", "utf8");
    assert.equal(sha256Canonical(lf), sha256Canonical(crlf));
    assert.deepEqual(canonicalBytes(crlf), lf);

    const w = world("eol-lock", { skills: [{ id: "eol-skill" }] });
    const skillDir = path.join(
      w.lib,
      "saas-skills",
      "engineering",
      "eol-skill",
    );
    const skillFile = path.join(skillDir, "SKILL.md");
    assert.equal(cw(w.lib, ["catalog", "--write-lock"]).code, 0);
    const lockLf = fs.readFileSync(
      path.join(w.lib, "catalog", "catalog.lock.json"),
    );
    assert.equal(cw(w.lib, ["catalog", "--write-lock"]).code, 0);
    assert.deepEqual(
      fs.readFileSync(path.join(w.lib, "catalog", "catalog.lock.json")),
      lockLf,
    );

    const lfText = fs
      .readFileSync(skillFile, "utf8")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");
    fs.writeFileSync(skillFile, lfText);
    const hashLf = packageHash(hashTree(skillDir).hashes);
    fs.writeFileSync(skillFile, lfText.replace(/\n/g, "\r\n"));
    assert.match(fs.readFileSync(skillFile, "utf8"), /\r\n/);
    assert.equal(packageHash(hashTree(skillDir).hashes), hashLf);
    assert.equal(cw(w.lib, ["catalog", "--check"]).code, 0);
  });
});

describe("managed contract blocks", () => {
  test("contract block preserves user content, is idempotent and imports into CLAUDE.md", () => {
    const w = world("blocks");
    write(path.join(w.proj, "AGENTS.md"), "# Team rules\n\nKeep these.\n");
    const args = [
      "install",
      "--target",
      w.proj,
      "--profile",
      "dev",
      "--home",
      w.home,
      "--with-contract",
      "--with-usage-policy",
    ];
    assert.equal(cw(w.lib, args).code, 0);
    const agents = fs.readFileSync(path.join(w.proj, "AGENTS.md"), "utf8");
    assert.match(agents, /^# Team rules\n\nKeep these\./);
    assert.equal(
      (agents.match(/BEGIN context-window:contract/g) ?? []).length,
      1,
    );
    assert.equal(
      (agents.match(/BEGIN context-window:usage-policy/g) ?? []).length,
      1,
    );
    assert.match(
      fs.readFileSync(path.join(w.proj, "CLAUDE.md"), "utf8"),
      /^@AGENTS\.md$/m,
    );
    const before = snapshot(w.proj, { ignore: [".context-window"] });
    assert.equal(
      cw(w.lib, ["install", "--target", w.proj, "--home", w.home]).code,
      0,
    );
    assert.deepEqual(snapshot(w.proj, { ignore: [".context-window"] }), before);
    assert.equal(
      cw(w.lib, ["verify", "--target", w.proj, "--home", w.home]).code,
      0,
    );
  });

  test("an edited or malformed block is a conflict; uninstall removes only the block", () => {
    const w = world("blocks-edit");
    write(path.join(w.proj, "AGENTS.md"), "# Team\n");
    assert.equal(
      cw(w.lib, [
        "install",
        "--target",
        w.proj,
        "--profile",
        "dev",
        "--home",
        w.home,
        "--with-contract",
      ]).code,
      0,
    );
    const file = path.join(w.proj, "AGENTS.md");
    fs.writeFileSync(
      file,
      fs.readFileSync(file, "utf8").replace("Topology", "Topologia editada"),
    );
    const blocked = cw(w.lib, [
      "install",
      "--target",
      w.proj,
      "--home",
      w.home,
    ]);
    assert.equal(blocked.code, 2, blocked.all);
    assert.match(blocked.all, /edited locally/);
    assert.equal(
      cw(w.lib, ["uninstall", "--target", w.proj, "--home", w.home]).code,
      2,
      "edited block blocks uninstall",
    );
    assert.equal(
      cw(w.lib, [
        "uninstall",
        "--target",
        w.proj,
        "--home",
        w.home,
        "--force-local",
      ]).code,
      0,
    );
    assert.equal(fs.readFileSync(file, "utf8").trim(), "# Team");
    const backups = path.join(w.proj, ".context-window", "backups");
    assert.ok(
      fs
        .readdirSync(backups)
        .some((f) =>
          fs
            .readFileSync(path.join(backups, f), "utf8")
            .includes("Topologia editada"),
        ),
      "the edited block is kept in a backup before --force-local removes it",
    );
    write(
      path.join(w.proj, "AGENTS.md"),
      "# Team\n<!-- BEGIN context-window:contract v1 sha256=" +
        "0".repeat(64) +
        " -->\nno end\n",
    );
    const malformed = cw(w.lib, [
      "install",
      "--target",
      w.proj,
      "--profile",
      "dev",
      "--home",
      w.home,
      "--with-contract",
    ]);
    assert.equal(malformed.code, 2);
    assert.match(malformed.all, /malformed/);
  });

  test("contract export for Cursor User Rules carries version, hash and the optional usage policy", () => {
    const w = world("contract-export");
    const plain = cw(w.lib, ["contract"]);
    assert.equal(plain.code, 0);
    assert.match(
      plain.stdout,
      /^## Context Window — mandatory product architecture contract/,
    );
    assert.doesNotMatch(plain.stdout, /Skill usage disclosure/);
    const cursor = cw(w.lib, [
      "contract",
      "--format",
      "cursor-user-rules",
      "--with-usage-policy",
    ]);
    assert.equal(cursor.code, 0);
    assert.match(
      cursor.stdout,
      /^Context Window contract v2\.0\.0-test sha256=[0-9a-f]{12} — paste into Cursor Settings > Rules/,
    );
    assert.match(cursor.stdout, /Skill usage disclosure/);
    assert.equal(cw(w.lib, ["contract", "--format", "mdc"]).code, 64);
  });

  test("a profile that declares the contract installs it by default; --without-contract opts out", () => {
    const w = world("blocks-default");
    const regFile = path.join(w.lib, "catalog", "registry.json");
    const reg = JSON.parse(fs.readFileSync(regFile, "utf8"));
    reg.profiles.dev.contract = true;
    fs.writeFileSync(regFile, JSON.stringify(reg, null, 2));
    const plan = cw(w.lib, [
      "plan",
      "--target",
      w.proj,
      "--profile",
      "dev",
      "--home",
      w.home,
    ]);
    assert.match(
      plan.all,
      /AGENTS\.md/,
      "the plan shows the block before anything is written",
    );
    assert.deepEqual(Object.keys(snapshot(w.proj)), []);
    assert.equal(
      cw(w.lib, [
        "install",
        "--target",
        w.proj,
        "--profile",
        "dev",
        "--home",
        w.home,
      ]).code,
      0,
    );
    assert.match(
      fs.readFileSync(path.join(w.proj, "AGENTS.md"), "utf8"),
      /BEGIN context-window:contract/,
    );
    const other = path.join(w.root, "proj-without");
    fs.mkdirSync(other);
    assert.equal(
      cw(w.lib, [
        "install",
        "--target",
        other,
        "--profile",
        "dev",
        "--home",
        w.home,
        "--without-contract",
      ]).code,
      0,
    );
    assert.ok(!fs.existsSync(path.join(other, "AGENTS.md")));
  });

  test("a 1.x usage-policy block requires --migrate-legacy and is then replaced", () => {
    const w = world("blocks-legacy");
    write(
      path.join(w.proj, "AGENTS.md"),
      "# T\n\n<!-- BEGIN: SAAS_SKILLS_USAGE_REPORTING -->\nold\n<!-- END: SAAS_SKILLS_USAGE_REPORTING -->\n",
    );
    const args = [
      "install",
      "--target",
      w.proj,
      "--profile",
      "dev",
      "--home",
      w.home,
      "--with-usage-policy",
    ];
    assert.equal(cw(w.lib, args).code, 2);
    assert.equal(cw(w.lib, [...args, "--migrate-legacy"]).code, 0);
    const text = fs.readFileSync(path.join(w.proj, "AGENTS.md"), "utf8");
    assert.doesNotMatch(text, /SAAS_SKILLS_USAGE_REPORTING/);
    assert.match(text, /BEGIN context-window:usage-policy/);
  });
});

describe("claude router hook [ACH-020/ACH-021]", () => {
  const registry = JSON.parse(
    fs.readFileSync(path.join(REPO, "catalog", "registry.json"), "utf8"),
  );
  const routing = registry.skills
    .filter((s) => s.status === "active" && s.triggers?.length)
    .map((s) => ({ skill: s.id, promptTriggers: s.triggers }));
  const neutral = [
    "oi, tudo bem?",
    "Escreva um poema curto sobre o mar",
    "Qual a capital da Australia?",
    "Me explique a diferença entre capital de giro e fluxo de caixa",
    "Traduza 'good morning' para o espanhol",
    "Crie uma receita de bolo de cenoura",
    "Faça um resumo do filme Matrix",
  ];
  const ambiguous = [
    "Refatorar meu currículo para vaga de gerente",
    "Qual o endpoint do rio Amazonas? (pergunta geográfica)",
    "Preciso de evals de desempenho dos funcionários do RH",
    "O layout responsivo do meu cartão de visita impresso",
    "migração de aves no inverno",
  ];
  const positive = [
    [
      "Quero criar o schema do banco com Prisma e adicionar um índice",
      "prisma-database-design",
    ],
    ["Escrever testes unitarios com vitest para o hook", "testing-strategies"],
    ["Desenhar um diagrama de arquitetura em mermaid", "ai-context-diagrams"],
    [
      "Montar a paleta de cores e tipografia do design system",
      "saas-ui-specifications",
    ],
    [
      "Organizar o frontend em Feature-Sliced Design no packages/frontend",
      "react-saas-architecture",
    ],
    [
      "Criar o novo projeto com frontend web e mobile em monorepo",
      "multiplatform-platform-architecture",
    ],
  ];
  test("no suggestion for neutral or ambiguous prompts", () => {
    for (const p of [...neutral, ...ambiguous])
      assert.deepEqual(
        suggest(routing, p).map((e) => e.skill),
        [],
        p,
      );
  });
  test("expected skill suggested for positive prompts", () => {
    for (const [p, skill] of positive)
      assert.ok(
        suggest(routing, p).some((e) => e.skill === skill),
        `${p} -> ${suggest(routing, p).map((e) => e.skill)}`,
      );
  });
  test("word boundaries: api does not match rapid", () => {
    assert.deepEqual(
      suggest([{ skill: "x", promptTriggers: ["api"] }], "rapid prototyping"),
      [],
    );
    assert.equal(normalize("Migração"), "migracao");
  });

  test("hook install merges settings, preserves project entries and fails on non-strict JSON", () => {
    const w = world("hook", {
      skills: [{ id: "alpha-skill", triggers: ["alpha trigger"] }],
    });
    write(
      path.join(w.proj, ".claude", "settings.json"),
      JSON.stringify({
        permissions: { allow: ["Bash(ls:*)"] },
        hooks: {
          Stop: [{ hooks: [{ type: "command", command: "echo stop" }] }],
        },
      }),
    );
    const args = [
      "install",
      "--target",
      w.proj,
      "--profile",
      "dev",
      "--home",
      w.home,
      "--clients",
      "claude",
      "--with-claude-hook",
    ];
    assert.equal(cw(w.lib, args).code, 0);
    const settings = JSON.parse(
      fs.readFileSync(path.join(w.proj, ".claude", "settings.json"), "utf8"),
    );
    assert.deepEqual(settings.permissions, { allow: ["Bash(ls:*)"] });
    assert.ok(settings.hooks.Stop);
    assert.equal(settings.hooks.UserPromptSubmit.length, 1);
    assert.match(
      settings.hooks.UserPromptSubmit[0].hooks[0].command,
      /\$CLAUDE_PROJECT_DIR/,
    );
    const routingFile = path.join(w.proj, ".claude", "skill-routing.json");
    const table = JSON.parse(fs.readFileSync(routingFile, "utf8"));
    table.skills.push({
      skill: "project-skill",
      hint: "manual",
      promptTriggers: ["projeto x"],
    });
    fs.writeFileSync(routingFile, JSON.stringify(table));
    assert.equal(
      cw(w.lib, ["install", "--target", w.proj, "--home", w.home]).code,
      0,
    );
    const again = JSON.parse(fs.readFileSync(routingFile, "utf8"));
    assert.ok(
      again.skills.some((e) => e.skill === "project-skill"),
      "manual entry preserved",
    );
    assert.equal(
      JSON.parse(
        fs.readFileSync(path.join(w.proj, ".claude", "settings.json"), "utf8"),
      ).hooks.UserPromptSubmit.length,
      1,
      "idempotent registration",
    );
    assert.equal(
      cw(w.lib, ["verify", "--target", w.proj, "--home", w.home]).code,
      0,
    );

    const w2 = world("hook-jsonc", {
      skills: [{ id: "alpha-skill", triggers: ["alpha trigger"] }],
    });
    write(
      path.join(w2.proj, ".claude", "settings.json"),
      '{\n  // comment\n  "permissions": {}\n}\n',
    );
    const bad = cw(w2.lib, [
      "install",
      "--target",
      w2.proj,
      "--profile",
      "dev",
      "--home",
      w2.home,
      "--clients",
      "claude",
      "--with-claude-hook",
    ]);
    assert.equal(bad.code, 2, bad.all);
    assert.match(bad.all, /not strict JSON/);
    assert.ok(!fs.existsSync(path.join(w2.proj, ".claude", "hooks")));
  });

  test("installed hook answers from a subdirectory of a non-ASCII project", () => {
    const root = tmpRoot("hook-unicode");
    roots.push(root);
    const lib = makeLibrary(root, {
      skills: [{ id: "alpha-skill", triggers: ["schema do banco"] }],
    });
    const proj = path.join(root, "Projeto Locações – teste");
    fs.mkdirSync(path.join(proj, "src", "sub dir"), { recursive: true });
    assert.equal(
      cw(lib, [
        "install",
        "--target",
        proj,
        "--profile",
        "dev",
        "--home",
        path.join(root, "home"),
        "--clients",
        "claude",
        "--with-claude-hook",
      ]).code,
      0,
    );
    const hook = path.join(proj, ".claude", "hooks", "skill-router.mjs");
    const run = (cwd, env) =>
      spawnSync(process.execPath, [hook, "UserPromptSubmit"], {
        cwd,
        env: { ...process.env, TEMP: root, TMP: root, ...env },
        input: JSON.stringify({
          session_id: `s-${Math.random()}`,
          cwd,
          prompt: "ajustar o schema do banco",
        }),
        encoding: "utf8",
      });
    const fromSub = run(path.join(proj, "src", "sub dir"), {});
    assert.match(fromSub.stdout, /alpha-skill/, fromSub.stderr);
    const withEnv = run(path.join(proj, "src"), { CLAUDE_PROJECT_DIR: proj });
    assert.match(withEnv.stdout, /hookSpecificOutput/);
  });
});

describe("build and distribution [ACH-002/CR-059/G12]", () => {
  test("build refuses directories it did not create and dangerous locations", () => {
    const w = world("build-safety");
    write(path.join(w.root, "user-folder", "important.txt"), "keep\n");
    for (const target of [
      path.join(w.root, "user-folder"),
      w.lib,
      path.dirname(w.lib),
      w.home,
    ]) {
      const r = cw(w.lib, ["build", "--out", target]);
      assert.equal(r.code, 64, `${target}: ${r.all}`);
    }
    assert.equal(
      fs.readFileSync(
        path.join(w.root, "user-folder", "important.txt"),
        "utf8",
      ),
      "keep\n",
    );
    const outDir = path.join(w.root, "dist-bundle");
    assert.equal(cw(w.lib, ["build", "--out", outDir]).code, 0);
    assert.equal(
      cw(w.lib, ["build", "--out", outDir]).code,
      0,
      "a previous build can be replaced",
    );
  });

  test("build never bundles git-ignored credential files and refuses credential content [ACH-005]", () => {
    const w = world("build-secrets");
    const token = ["tok", "Z".repeat(32)].join("");
    write(
      path.join(w.lib, "dist", "old-run", "codex-home", "auth.json"),
      JSON.stringify({
        auth_mode: "chatgpt",
        tokens: { refresh_token: token, access_token: token },
      }),
    );
    const clean = path.join(w.root, "bundle-clean");
    assert.equal(cw(w.lib, ["build", "--out", clean]).code, 0);
    assert.ok(
      !Object.keys(snapshot(clean)).some(
        (rel) => rel.startsWith("dist") || rel.endsWith("auth.json"),
      ),
      "files outside the allowlist never reach the bundle",
    );
    const policy = path.join(w.lib, "catalog", "contract", "usage-policy.md");
    fs.appendFileSync(policy, `\n"refresh_token": "${token}"\n`);
    const refused = path.join(w.root, "bundle-refused");
    const r = cw(w.lib, ["build", "--out", refused]);
    assert.equal(r.code, 1, r.all);
    assert.match(r.all, /Refusing to build: credential-like content/);
    assert.match(
      r.all,
      /catalog\/contract\/usage-policy\.md:\d+: oauth-token-field/,
    );
    assert.ok(!r.all.includes(token), "the value is never printed");
    assert.ok(
      !fs.existsSync(refused),
      "nothing is written when the build is refused",
    );
  });

  test("build refuses private file names among the files it would distribute [ACH-005]", () => {
    const w = world("build-private");
    write(path.join(w.lib, "catalog", "contract", ".env"), "SYNTHETIC=1\n");
    const out = path.join(w.root, "bundle-private");
    const r = cw(w.lib, ["build", "--out", out]);
    assert.equal(r.code, 1, r.all);
    assert.match(r.all, /catalog\/contract\/\.env: private file name/);
    assert.ok(!fs.existsSync(out));
  });

  test("the bundle installs outside the checkout and matches checkout output", () => {
    const w = world("bundle", {
      skills: [
        {
          id: "alpha-skill",
          files: {
            "scripts/run.py": "print('ok')\n",
            "references/r.md": "# r\n",
          },
        },
        {
          id: "imported-x",
          root: "imported-skills",
          collection: "c",
          status: "imported-unreviewed",
          profiles: [],
        },
      ],
    });
    const bundle = path.join(w.root, "bundle");
    assert.equal(cw(w.lib, ["build", "--out", bundle]).code, 0);
    assert.ok(
      !fs.existsSync(path.join(bundle, "imported-skills")),
      "unreviewed content is not shipped",
    );
    const elsewhere = path.join(w.root, "elsewhere", "copied bundle");
    copyDir(bundle, elsewhere);
    const projA = path.join(w.root, "projA");
    const projB = path.join(w.root, "projB");
    fs.mkdirSync(projA);
    fs.mkdirSync(projB);
    assert.equal(
      cw(w.lib, [
        "install",
        "--target",
        projA,
        "--profile",
        "dev",
        "--home",
        w.home,
      ]).code,
      0,
    );
    const r = cw(
      elsewhere,
      ["install", "--target", projB, "--profile", "dev", "--home", w.home],
      { root: w.root },
    );
    assert.equal(r.code, 0, r.all);
    const strip = (snap) =>
      Object.fromEntries(
        Object.entries(snap).filter(
          ([k]) =>
            !k.includes(".cw-manifest.json") &&
            !k.startsWith(".context-window") &&
            !k.includes("/.cw/"),
        ),
      );
    assert.deepEqual(strip(snapshot(projB)), strip(snapshot(projA)));
    assert.equal(
      cw(elsewhere, ["verify", "--target", projB, "--home", w.home], {
        root: w.root,
      }).code,
      0,
    );
  });
});

describe("real repository catalog", () => {
  test("the canonical catalog passes the gate and its lock is current", () => {
    const r = spawnSync(
      process.execPath,
      [path.join(REPO, "scripts", "cw.mjs"), "catalog", "--check"],
      { encoding: "utf8" },
    );
    assert.equal(r.status, 0, `${r.stdout}${r.stderr}`);
  });

  test("always-on text and the skill listing stay within the context budget", () => {
    const contract = ["architecture-contract.md", "usage-policy.md"]
      .map(
        (f) =>
          fs.readFileSync(path.join(REPO, "catalog", "contract", f)).length,
      )
      .reduce((a, b) => a + b, 0);
    assert.ok(
      contract <= 4096,
      `contract + usage policy = ${contract} bytes (budget 4096)`,
    );
    const registry = JSON.parse(
      fs.readFileSync(path.join(REPO, "catalog", "registry.json"), "utf8"),
    );
    let listing = 0;
    for (const s of registry.skills.filter(
      (x) => x.status === "active" && x.invocation !== "explicit",
    )) {
      const raw = fs.readFileSync(
        path.join(REPO, ...s.path.split("/"), "SKILL.md"),
        "utf8",
      );
      const desc = raw.match(/^description:\s*(.+)$/m)[1];
      listing += Buffer.byteLength(`${s.id}: ${desc}`);
    }
    // Claude Code budgets the whole listing at 1% of the context window (about 2,000 tokens for a
    // 200k window, shared with other skills); 7,200 bytes keeps this library near 1,500 tokens.
    assert.ok(listing <= 7200, `listing = ${listing} bytes (budget 7200)`);
  });
});
