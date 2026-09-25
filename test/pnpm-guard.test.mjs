// pnpm guard: preventive preflight blocks adversarial layouts before any process starts; env
// redirection biases default write locations; post-run mtime watch detects some side effects.
// Write confinement of subprocesses is NOT provided (see GUARD_LIMITS and CX-14).
// Execution policy: scripts without proven confinement refuse to spawn unless authorizeUnconfined
// is complete. Characterization tests and policy tests are separate describes.
// Real-install cases run only when CW_SANDBOX_ROOT points to a folder outside the user profile.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, describe, test } from "node:test";
import { cleanup, snapshot, tmpRoot, write } from "./helpers.mjs";
import {
  CONFINED_EXECUTOR,
  GUARD_LIMITS,
  preflight,
  runGuardedPnpm,
  runGuardedScript,
  validateUnconfinedAuthorization,
} from "../scripts/lib/pnpm-guard.mjs";

const roots = [];
after(() => roots.forEach(cleanup));
const homes = new Map();
function root(label) {
  const base = tmpRoot(label);
  roots.push(base);
  const sandbox = path.join(base, "sandbox");
  fs.mkdirSync(sandbox, { recursive: true });
  fs.mkdirSync(path.join(base, "home"), { recursive: true });
  homes.set(sandbox, path.join(base, "home"));
  return sandbox;
}
const homeOf = (sandbox) => homes.get(sandbox);
const json = (o) => `${JSON.stringify(o, null, 2)}\n`;
const clean = (dir, extraWs = "") => {
  write(
    path.join(dir, "package.json"),
    json({ name: "clean", private: true, packageManager: "pnpm@12.5.1" }),
  );
  write(
    path.join(dir, "pnpm-workspace.yaml"),
    `packages:\n  - "."\nverifyDepsBeforeRun: error\nstrictDepBuilds: true\nallowBuilds: {}\n${extraWs}`,
  );
};

const synthAuth = (overrides = {}) => ({
  command: "pnpm install (synthetic characterization)",
  scripts: ["postinstall → write-outside.mjs"],
  destinations: ["sibling forbidden/ under the disposable root"],
  risks: ["writes outside the declared sandbox; confinement remains unproven"],
  authorizedBy:
    "test:characterization-only (not owner approval of confinement)",
  ...overrides,
});

describe("pnpm guard — preflight", () => {
  test("an ancestor workspace is selected instead of the project: blocked before any process starts", () => {
    const r = root("guard-ancestor");
    const ancestor = path.join(r, "ancestor");
    write(
      path.join(ancestor, "package.json"),
      json({
        name: "ancestor-app",
        packageManager: "pnpm@10.27.0",
        scripts: { postinstall: "node scripts/evil.js", prepare: "husky" },
      }),
    );
    write(path.join(ancestor, "pnpm-workspace.yaml"), "packages:\n  - app\n");
    write(path.join(ancestor, ".pnpmfile.cjs"), "module.exports = {}\n");
    write(
      path.join(ancestor, "child", "package.json"),
      json({ name: "child" }),
    );
    const before = snapshot(r);
    const result = runGuardedPnpm({
      project: path.join(ancestor, "child"),
      sandbox: r,
      home: homeOf(r),
      args: ["install"],
    });
    assert.equal(result.blocked, true);
    assert.equal(result.spawned, false);
    const text = result.preflight.blockers.join("\n");
    assert.match(
      text,
      /pnpm would use the workspace at .*ancestor, not the project/,
    );
    assert.match(
      text,
      /pnpm version would be inherited from .*ancestor \(pnpm@10\.27\.0\)/,
    );
    assert.match(text, /pnpmfile present/);
    assert.deepEqual(
      snapshot(r),
      before,
      "not a single file or folder was created, changed or removed",
    );
  });

  test("a sandbox inside the user profile is refused", () => {
    const r = root("guard-home");
    clean(path.join(r, "p"));
    const pf = preflight({ project: path.join(r, "p"), sandbox: r, home: r });
    assert.ok(
      pf.blockers.some((b) => /overlap/.test(b)),
      pf.blockers.join("\n"),
    );
  });

  test("a clean, pinned, self-contained project passes", () => {
    const r = root("guard-clean");
    clean(path.join(r, "p"));
    const pf = preflight({
      project: path.join(r, "p"),
      sandbox: r,
      home: homeOf(r),
    });
    assert.deepEqual(pf.blockers, []);
    assert.equal(pf.facts.packageManager.value, "pnpm@12.5.1");
  });

  test("unreviewed or unsafe build settings are blocked, including the placeholder pnpm writes", () => {
    const r = root("guard-settings");
    const outsideStore = path.resolve(r, "..", "outside-pnpm-store");
    for (const [extra, pattern] of [
      ["dangerouslyAllowAllBuilds: true\n", /dangerouslyAllowAllBuilds/],
      ["strictDepBuilds: false\n", /strictDepBuilds is disabled/],
      [
        `storeDir: ${JSON.stringify(outsideStore)}\n`,
        /storeDir .* outside the sandbox/,
      ],
    ]) {
      const project = path.join(r, "p");
      clean(project, extra);
      const text = fs
        .readFileSync(path.join(project, "pnpm-workspace.yaml"), "utf8")
        .replace("strictDepBuilds: true\n", "");
      fs.writeFileSync(path.join(project, "pnpm-workspace.yaml"), text);
      const pf = preflight({
        project,
        sandbox: r,
        home: homeOf(r),
      });
      assert.ok(
        pf.blockers.some((b) => pattern.test(b)),
        `${extra}: ${pf.blockers.join("\n")}`,
      );
    }
    const placeholder = path.join(r, "placeholder");
    clean(placeholder);
    fs.writeFileSync(
      path.join(placeholder, "pnpm-workspace.yaml"),
      'packages:\n  - "."\nverifyDepsBeforeRun: error\nallowBuilds:\n  esbuild: set this to true or false\n',
    );
    const pf = preflight({
      project: placeholder,
      sandbox: r,
      home: homeOf(r),
    });
    assert.ok(
      pf.blockers.some((b) =>
        /allowBuilds\.esbuild is not a reviewed decision/.test(b),
      ),
      pf.blockers.join("\n"),
    );
  });

  test("a project reached through a junction that leaves the sandbox is refused", () => {
    const r = root("guard-junction");
    const outside = root("guard-outside");
    clean(path.join(outside, "real"));
    fs.symlinkSync(
      path.join(outside, "real"),
      path.join(r, "linked"),
      "junction",
    );
    const pf = preflight({
      project: path.join(r, "linked"),
      sandbox: r,
      home: homeOf(r),
    });
    assert.ok(
      pf.blockers.some((b) => /not inside the sandbox/.test(b)),
      pf.blockers.join("\n"),
    );
  });

  test("running scripts is refused when pnpm could install implicitly", () => {
    const r = root("guard-implicit");
    write(
      path.join(r, "p", "package.json"),
      json({
        name: "p",
        packageManager: "pnpm@12.5.1",
        scripts: { test: "node -e 1" },
      }),
    );
    write(path.join(r, "p", "pnpm-workspace.yaml"), 'packages:\n  - "."\n');
    const result = runGuardedScript({
      project: path.join(r, "p"),
      sandbox: r,
      home: homeOf(r),
      script: "test",
      authorizeUnconfined: synthAuth({
        command: "pnpm run test",
        scripts: ["test"],
      }),
    });
    assert.equal(result.spawned, false);
    assert.ok(
      result.preflight.blockers.some((b) => /verifyDepsBeforeRun/.test(b)),
    );
  });
});

describe("pnpm guard — limits (characterization)", () => {
  test("write confinement is not claimed: GUARD_LIMITS documents the proven mechanism only", () => {
    assert.equal(GUARD_LIMITS.writeConfinement, false);
    assert.equal(CONFINED_EXECUTOR.available, false);
    assert.match(GUARD_LIMITS.mechanism, /preflight/);
    assert.match(GUARD_LIMITS.not, /sandbox/i);
    assert.match(CONFINED_EXECUTOR.requirement, /confines filesystem writes/i);
  });
});

describe("pnpm guard — execution policy [CX-15]", () => {
  test("install with scripts and no authorization is refused before spawn with no effects", () => {
    const r = root("policy-block-install");
    clean(path.join(r, "p"));
    const before = snapshot(path.dirname(r));
    const result = runGuardedPnpm({
      project: path.join(r, "p"),
      sandbox: r,
      home: homeOf(r),
      args: ["install"],
      ignoreScripts: false,
    });
    assert.equal(result.blocked, true);
    assert.equal(result.spawned, false);
    assert.equal(result.decision.mode, "blocked");
    assert.equal(result.decision.confinementRequirement, "not approved");
    assert.match(result.preflight.blockers.join("\n"), /authorizeUnconfined/);
    assert.deepEqual(snapshot(path.dirname(r)), before);
  });

  test("a warning alone is not enough: incomplete authorizeUnconfined is refused", () => {
    const r = root("policy-incomplete-auth");
    clean(path.join(r, "p"));
    const result = runGuardedPnpm({
      project: path.join(r, "p"),
      sandbox: r,
      home: homeOf(r),
      args: ["install"],
      ignoreScripts: false,
      authorizeUnconfined: {
        command: "pnpm install",
        scripts: ["postinstall"],
      },
    });
    assert.equal(result.spawned, false);
    assert.match(
      result.preflight.blockers.join("\n"),
      /authorizeUnconfined\.(destinations|risks|authorizedBy)/,
    );
    assert.ok(validateUnconfinedAuthorization({ command: "x" }));
  });

  test("pnpm run without authorization is refused before spawn", () => {
    const r = root("policy-block-script");
    clean(path.join(r, "p"));
    write(
      path.join(r, "p", "package.json"),
      json({
        name: "p",
        private: true,
        packageManager: "pnpm@12.5.1",
        scripts: { test: "node -e 1" },
      }),
    );
    const before = snapshot(r);
    const result = runGuardedScript({
      project: path.join(r, "p"),
      sandbox: r,
      home: homeOf(r),
      script: "test",
    });
    assert.equal(result.blocked, true);
    assert.equal(result.spawned, false);
    assert.equal(result.decision.mode, "blocked");
    assert.deepEqual(snapshot(r), before);
  });

  test("scripts-disabled install is allowed by policy without authorizeUnconfined", () => {
    const r = root("policy-scripts-off");
    clean(path.join(r, "p"));
    const decisionOnly = runGuardedPnpm({
      project: path.join(r, "p"),
      sandbox: r,
      home: homeOf(r),
      args: ["install", "--help"],
      ignoreScripts: true,
    });
    // --help still spawns pnpm; policy mode must be scripts-disabled when ignoreScripts is true.
    // If preflight fails for other reasons we only care about the decision path on a clean project.
    if (!decisionOnly.blocked) {
      assert.equal(decisionOnly.decision.mode, "scripts-disabled");
      assert.equal(decisionOnly.limits.writeConfinement, false);
      assert.match(decisionOnly.effectiveMode.notes.join("\n"), /pnpmfile/);
    } else {
      assert.fail(decisionOnly.preflight.blockers.join("\n"));
    }
  });

  test("authorization permits a delimited unconfined mode but does not approve confinement", () => {
    assert.equal(validateUnconfinedAuthorization(synthAuth()), null);
    const r = root("policy-auth-mode");
    clean(path.join(r, "p"));
    // Refuse spawn for missing network-free proof: use a dry decision via validate + decide path
    // by calling runGuardedPnpm with authorize and args that fail fast if spawned incorrectly.
    // Here we only assert the decision object when blocked by something else is not needed —
    // spawn with --version after auth would still be unconfined.
    const result = runGuardedPnpm({
      project: path.join(r, "p"),
      sandbox: r,
      home: homeOf(r),
      args: ["--version"],
      ignoreScripts: false,
      authorizeUnconfined: synthAuth({
        command: "pnpm --version",
        scripts: ["(none — version only)"],
        destinations: ["none expected"],
        risks: ["unconfined process on the host"],
      }),
    });
    assert.equal(result.blocked, false);
    assert.equal(result.decision.mode, "authorized-unconfined");
    assert.equal(result.decision.confinementRequirement, "not approved");
    assert.equal(result.limits.writeConfinement, false);
  });

  test("tests that require write confinement stay blocked: no host fallback", () => {
    assert.equal(CONFINED_EXECUTOR.available, false);
    assert.equal(GUARD_LIMITS.writeConfinement, false);
    // Placeholder for a future confined-executor suite: until CONFINED_EXECUTOR.available,
    // any test that needs confinement must skip rather than run on the host.
    if (!CONFINED_EXECUTOR.available) {
      assert.match(CONFINED_EXECUTOR.requirement, /authorized executor/i);
    }
  });
});

const SANDBOX_ROOT = process.env.CW_SANDBOX_ROOT;
describe(
  "pnpm guard — real install (scripts disabled)",
  {
    skip: SANDBOX_ROOT
      ? false
      : "set CW_SANDBOX_ROOT to a folder outside the user profile",
  },
  () => {
    test("dependency scripts do not run under --ignore-scripts; store stays redirected; telemetry is watch-list only", () => {
      const sandbox = path.join(SANDBOX_ROOT, `guard-${process.pid}`);
      fs.rmSync(sandbox, { recursive: true, force: true });
      roots.push(sandbox);
      const p = path.join(sandbox, "p");
      clean(p);
      const pkg = JSON.parse(
        fs.readFileSync(path.join(p, "package.json"), "utf8"),
      );
      pkg.dependencies = { "local-dep": "file:../local-dep" };
      fs.writeFileSync(path.join(p, "package.json"), json(pkg));
      const marker = path.join(SANDBOX_ROOT, `MARKER-${process.pid}.txt`);
      write(
        path.join(sandbox, "local-dep", "package.json"),
        json({
          name: "local-dep",
          version: "1.0.0",
          scripts: {
            postinstall: `node -e "require('fs').writeFileSync(${JSON.stringify(marker)}, 'x')"`,
          },
        }),
      );
      write(
        path.join(sandbox, "local-dep", "index.js"),
        "module.exports = 1;\n",
      );
      const watchFile = path.join(SANDBOX_ROOT, `WATCH-${process.pid}.txt`);
      fs.writeFileSync(watchFile, "watched");
      const r = runGuardedPnpm({
        project: p,
        sandbox,
        args: ["install"],
        watch: [watchFile],
      });
      assert.equal(r.blocked, false, JSON.stringify(r.preflight?.blockers));
      assert.equal(r.status, 0, r.stdout + r.stderr);
      assert.equal(r.decision.mode, "scripts-disabled");
      assert.ok(
        fs.existsSync(path.join(p, "node_modules", "local-dep", "index.js")),
      );
      assert.ok(
        !fs.existsSync(marker),
        "the dependency's postinstall did not run under --ignore-scripts",
      );
      const modules = JSON.parse(
        fs.readFileSync(path.join(p, "node_modules", ".modules.yaml"), "utf8"),
      );
      assert.ok(
        path
          .resolve(modules.storeDir)
          .toLowerCase()
          .startsWith(path.resolve(sandbox).toLowerCase()),
        modules.storeDir,
      );
      assert.deepEqual(r.changedOutside, []);
      assert.match(r.telemetry.meaning, /does not mean no external writes/);
      assert.ok(
        r.effectiveMode.differencesFromNormalUse.some((d) => /skipped/.test(d)),
      );
      fs.rmSync(watchFile, { force: true });
    });
  },
);

describe(
  "pnpm guard — characterization of missing write confinement [CX-14]",
  {
    skip: SANDBOX_ROOT
      ? false
      : "set CW_SANDBOX_ROOT to a folder outside the user profile",
  },
  () => {
    test("with authorizeUnconfined, a lifecycle script can write outside; empty changedOutside does not hide it", () => {
      const base = path.join(SANDBOX_ROOT, `guard-escape-${process.pid}`);
      fs.rmSync(base, { recursive: true, force: true });
      roots.push(base);
      const sandbox = path.join(base, "sandbox");
      const home = path.join(base, "home");
      const forbidden = path.join(base, "forbidden");
      const project = path.join(sandbox, "p");
      fs.mkdirSync(project, { recursive: true });
      fs.mkdirSync(home, { recursive: true });
      fs.mkdirSync(forbidden, { recursive: true });
      const escapeFile = path.join(forbidden, "escape.txt");
      const payload = `escape-${process.pid}`;
      write(
        path.join(project, "write-outside.mjs"),
        `import fs from "node:fs";\nfs.writeFileSync(${JSON.stringify(escapeFile)}, ${JSON.stringify(payload)});\n`,
      );
      write(
        path.join(project, "package.json"),
        json({
          name: "escape",
          private: true,
          packageManager: "pnpm@12.5.1",
          scripts: { postinstall: "node ./write-outside.mjs" },
          dependencies: { "is-number": "7.0.0" },
        }),
      );
      write(
        path.join(project, "pnpm-workspace.yaml"),
        'packages:\n  - "."\nverifyDepsBeforeRun: error\nstrictDepBuilds: true\nallowBuilds: {}\n',
      );
      const r = runGuardedPnpm({
        project,
        sandbox,
        home,
        args: ["install"],
        ignoreScripts: false,
        authorizeUnconfined: synthAuth({
          command: "pnpm install (CX-14 characterization)",
          scripts: ["postinstall → write-outside.mjs"],
          destinations: [escapeFile],
        }),
      });
      assert.equal(r.blocked, false, JSON.stringify(r.preflight?.blockers));
      assert.equal(r.decision.mode, "authorized-unconfined");
      assert.equal(r.decision.confinementRequirement, "not approved");
      assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
      assert.equal(fs.readFileSync(escapeFile, "utf8"), payload);
      assert.deepEqual(
        r.changedOutside,
        [],
        "counterproof: external write happened and the watch list stayed empty",
      );
      assert.match(r.telemetry.meaning, /does not mean no external writes/);
      assert.equal(r.limits.writeConfinement, false);
    });
  },
);

describe(
  "pnpm guard — confined executor suite",
  {
    skip: CONFINED_EXECUTOR.available ? false : CONFINED_EXECUTOR.requirement,
  },
  () => {
    test("write-escape fails under the confined executor", () => {
      assert.fail("unreachable until CONFINED_EXECUTOR.available is true");
    });
  },
);
