#!/usr/bin/env node
// Acceptance: evaluates the distributable package and the products generated from it — not only the
// checkout. Every package-manager run goes through the pnpm guard (scripts/lib/pnpm-guard.mjs):
// preventive preflight + env redirection under --sandbox (must be outside the user profile, no
// parent workspace). That is not write confinement of subprocesses (GUARD_LIMITS.writeConfinement).
//   node scripts/acceptance.mjs --sandbox <dir> [--skip-qa] [--without-clients]
// Writes <sandbox>/run-<time>/acceptance-report.json and exits 0 only when every required step passed.
// --without-clients records the Codex/Claude discovery steps as not verified instead of running them.
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs, UsageError } from "./lib/cli.mjs";
import {
  claudeProbe,
  codexPromptInput,
  findClaude,
  findCodex,
  versionOf,
} from "./lib/client-probes.mjs";
import { isPrivateFile } from "./lib/secrets.mjs";
import {
  CONFINED_EXECUTOR,
  GUARD_LIMITS,
  preflight,
  runGuardedPnpm,
  runGuardedScript,
} from "./lib/pnpm-guard.mjs";
import {
  deniesInstallLifecycle,
  loadAuthorizationDocument,
  resolveStepAuthorization,
} from "./lib/authorize-grants.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { values } = parseArgs(process.argv.slice(2), {
  sandbox: { type: "string" },
  "skip-qa": { type: "boolean" },
  "without-clients": { type: "boolean" },
  "authorize-unconfined": { type: "string" },
});
if (!values.sandbox)
  throw new UsageError("--sandbox <dir outside the user profile> is required");
const sandboxRoot = path.resolve(values.sandbox);

/**
 * Per-step grants document. Presence alone does not unlock every step.
 * Installs always use ignoreScripts:true (D7 never enabled by this harness).
 */
let authDoc = null;
if (values["authorize-unconfined"]) {
  authDoc = loadAuthorizationDocument(
    path.resolve(values["authorize-unconfined"]),
  );
}
const run = path.join(
  sandboxRoot,
  `run-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
fs.mkdirSync(run, { recursive: true });
const home = os.homedir();
const watch = [
  path.join(home, ".npmrc"),
  path.join(home, "node_modules", ".modules.yaml"),
  path.join(home, ".expo"),
].filter((f) => fs.existsSync(f));
const sha = (f) =>
  crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const steps = [];
const logFile = path.join(run, "acceptance.log");

function record(id, title, ok, facts = {}, output = "") {
  steps.push({ id, title, ok, ...facts });
  const label = ok === null ? "PENDING" : ok ? "PASS" : "FAIL";
  fs.appendFileSync(
    logFile,
    `\n## ${id} ${title}: ${label}\n${JSON.stringify(facts)}\n${output.trim().split(/\r?\n/).slice(-60).join("\n")}\n`,
  );
  process.stdout.write(`${label} ${id} ${title}\n`);
  return ok;
}
const node = (args, cwd = run) =>
  spawnSync(process.execPath, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
const out = (r) => `${r.stdout ?? ""}\n${r.stderr ?? ""}`;

steps.push({
  id: "P0",
  title: "execution policy for this acceptance run",
  ok: null,
  writeConfinement: GUARD_LIMITS.writeConfinement,
  confinedExecutor: CONFINED_EXECUTOR,
  authorizeUnconfinedFile: values["authorize-unconfined"] ?? null,
  authorizationSource: authDoc?.source ?? null,
  authorizedBy: authDoc?.authorizedBy ?? null,
  denied: authDoc?.denied ?? [],
  grants: (authDoc?.grants ?? []).map((g) => ({
    id: g.id,
    steps: g.steps,
    command: g.command,
    scripts: g.scripts,
  })),
  installLifecycle: "always --ignore-scripts (D7 not enabled by this harness)",
  note: authDoc
    ? "per-step grants loaded; each scripted step must match its grant; installs stay scripts-disabled; confinement not approved"
    : "no authorize-unconfined file: installs use --ignore-scripts; scripted steps stay pending (not failed)",
});
if (authDoc && !deniesInstallLifecycle(authDoc)) {
  process.stderr.write(
    "warning: authorization document does not list D7 in denied[]; harness still forces --ignore-scripts on installs\n",
  );
}
// A1 library QA on the checkout
if (!values["skip-qa"]) {
  const qa = spawnSync("pnpm", ["qa"], {
    cwd: repo,
    encoding: "utf8",
    shell: process.platform === "win32",
    maxBuffer: 256 * 1024 * 1024,
  });
  record(
    "A1",
    "library QA on the checkout (pnpm qa)",
    qa.status === 0,
    { exit: qa.status },
    out(qa),
  );
}

// A2 package: build, scan, identity
const bundle = path.join(run, "bundle");
const b = node([
  path.join(repo, "scripts", "cw.mjs"),
  "build",
  "--out",
  bundle,
]);
const marker =
  b.status === 0
    ? JSON.parse(fs.readFileSync(path.join(bundle, ".cw-build.json"), "utf8"))
    : null;
record(
  "A2",
  "distributable package built outside the checkout",
  b.status === 0,
  {
    bundle,
    libraryVersion: marker?.libraryVersion,
    commit: marker?.commit,
    files: marker ? Object.keys(marker.files).length : 0,
    markerSha256: marker ? sha(path.join(bundle, ".cw-build.json")) : null,
  },
  out(b),
);
const scan = node([
  path.join(repo, "scripts", "secret-scan.mjs"),
  "--root",
  bundle,
]);
const privateInBundle = marker
  ? Object.keys(marker.files).filter(isPrivateFile)
  : ["(no bundle)"];
record(
  "A3",
  "package carries no credentials, private environments, keys or session caches",
  scan.status === 0 && privateInBundle.length === 0,
  { privateFiles: privateInBundle },
  out(scan),
);

// A4 product from the package
const scaffoldModule = await import(
  pathToFileURL(
    path.join(
      bundle,
      "saas-skills",
      "engineering",
      "multiplatform-platform-architecture",
      "scripts",
      "scaffold.mjs",
    ),
  ).href
);
const productSandbox = path.join(run, "product");
fs.mkdirSync(productSandbox, { recursive: true });
const product = scaffoldModule.scaffold({
  out: path.join(productSandbox, "produto"),
  scope: "@empresa",
  name: "Produto",
});
spawnSync("git", ["init", "-q"], { cwd: product });
const manifests = ["package.json", "pnpm-workspace.yaml", "pnpm-lock.yaml"].map(
  (f) => [f, sha(path.join(product, f))],
);
const pf = preflight({ project: product, sandbox: productSandbox });
record(
  "A4",
  "product generated from the package; preflight of workspace, pnpm version, settings and scripts",
  pf.ok,
  {
    product,
    blockers: pf.blockers,
    warnings: pf.warnings,
    workspaceRoot: pf.facts.workspaceRoot,
    packageManager: pf.facts.packageManager,
    settings: pf.facts.settings,
    lifecycleScripts: pf.facts.lifecycleScripts,
    lockfileSha256: manifests[2][1],
  },
);

// A5 library installed into the product from the package
const cwHome = path.join(run, "cw-home");
fs.mkdirSync(cwHome, { recursive: true });
const cwRun = (args) =>
  node([path.join(bundle, "scripts", "cw.mjs"), ...args, "--home", cwHome]);
const inst = cwRun([
  "install",
  "--target",
  product,
  "--profile",
  "dev",
  "--with-usage-policy",
  "--with-claude-hook",
]);
const ver = cwRun(["verify", "--target", product]);
const doc = cwRun(["doctor", "--target", product, "--strict"]);
record(
  "A5",
  "library installed into the product from the package; verify and doctor --strict",
  inst.status === 0 && ver.status === 0 && doc.status === 0,
  { install: inst.status, verify: ver.status, doctor: doc.status },
  [out(inst), out(ver), out(doc)].join("\n"),
);

// A6 frozen install of the product — always scripts-disabled (D7 not authorized).
const fi = runGuardedPnpm({
  project: product,
  sandbox: productSandbox,
  args: ["install", "--frozen-lockfile"],
  ignoreScripts: true,
  authorizeUnconfined: null,
  watch,
});
const modules =
  fi.status === 0
    ? JSON.parse(
        fs.readFileSync(
          path.join(product, "node_modules", ".modules.yaml"),
          "utf8",
        ),
      )
    : {};
const unchanged = manifests.every(([f, h]) => sha(path.join(product, f)) === h);
record(
  "A6",
  "frozen install from the shipped lockfile (scripts disabled; store redirected; D7 not used)",
  !fi.blocked &&
    fi.status === 0 &&
    unchanged &&
    modules.nodeLinker === "hoisted",
  {
    exit: fi.status,
    blocked: fi.blocked,
    manifestsUnchanged: unchanged,
    nodeLinker: modules.nodeLinker,
    storeDir: modules.storeDir,
    packageManager: modules.packageManager,
    decision: fi.decision,
    effectiveMode: fi.effectiveMode,
    telemetry: fi.telemetry,
    limits: fi.limits ?? GUARD_LIMITS,
    watchedFilesUnchanged: fi.changedOutside,
    ignoreScripts: true,
  },
  out(fi),
);

const pendingScripts = (id, title, request, reason) => {
  steps.push({
    id,
    title,
    ok: null,
    pendingAuthorization: true,
    authorizeUnconfinedRequest: request,
    resolveError: reason ?? null,
    confinedExecutor: CONFINED_EXECUTOR,
    note:
      reason ??
      "blocked by execution policy until a matching per-step grant in --authorize-unconfined <json>",
  });
  process.stdout.write(`PENDING ${id} ${title}\n`);
  return { ok: null, text: "", r: { blocked: true, spawned: false } };
};

const script = (id, title, project, sb, name, expectOk = true, env = {}) => {
  const operation = {
    command: `pnpm run ${name}`,
    scripts: [name],
    destinations: [project, sb],
  };
  const resolved = resolveStepAuthorization(authDoc, id, operation);
  if (resolved.error) {
    return pendingScripts(
      id,
      title,
      {
        command: operation.command,
        scripts: operation.scripts,
        destinations: [
          project,
          sb,
          "redirected TEMP/XDG/store under the sandbox",
          "possible writes elsewhere on the host (unconfined)",
        ],
        risks: [
          "lifecycle and build tools can write outside the declared sandbox",
          "authorization does not approve write confinement",
        ],
        authorizedBy: "(awaiting matching grant)",
      },
      resolved.error,
    );
  }
  const r = runGuardedScript({
    project,
    sandbox: sb,
    script: name,
    watch,
    env,
    authorizeUnconfined: resolved.authorize,
    operation,
  });
  const ok = !r.blocked && (expectOk ? r.status === 0 : r.status !== 0);
  const text = out(r);
  const tests = text.match(/Tests\s+(\d+) passed/)?.[1];
  record(
    id,
    title,
    ok,
    {
      exit: r.status,
      blocked: r.blocked,
      spawned: r.spawned,
      cwd: project,
      command: operation.command,
      grantId: resolved.grantId,
      tests: tests ? Number(tests) : undefined,
      decision: r.decision,
      telemetry: r.telemetry,
      limits: r.limits,
      confinementRequirement: r.decision?.confinementRequirement,
    },
    text,
  );
  return { ok, text, r };
};
// A7 product verify, A8 token propagation
script(
  "A7",
  "product pnpm verify: FSD gate, token gate, typecheck web+native, tests, next build, expo export",
  product,
  productSandbox,
  "verify",
);
const prop = script(
  "A8",
  "token change consumed by both clients (style resolution, web render, mobile export)",
  product,
  productSandbox,
  "check:tokens",
);
if (prop.text) {
  const propJson = prop.text.slice(
    prop.text.indexOf("{"),
    prop.text.lastIndexOf("}") + 1,
  );
  try {
    steps.at(-1).levels = JSON.parse(propJson);
  } catch {
    steps.at(-1).levels = null;
  }
}

// A9 counter-proofs (each restored afterwards)
const edit = (rel, from, to) => {
  const f = path.join(product, ...rel.split("/"));
  const before = fs.readFileSync(f, "utf8");
  if (!before.includes(from))
    throw new Error(`anchor not found in ${rel}: ${from}`);
  fs.writeFileSync(f, before.replace(from, to));
  return () => fs.writeFileSync(f, before);
};
{
  const operation = {
    command: "pnpm run tokens",
    scripts: ["tokens"],
    destinations: [product, productSandbox],
  };
  const resolved = resolveStepAuthorization(authDoc, "A9a", operation);
  if (resolved.error) {
    pendingScripts(
      "A9a",
      "token counter-proof (#C0FFEE…)",
      {
        command: "pnpm run tokens (with temporary #C0FFEE edits)",
        scripts: ["tokens"],
        destinations: [product, productSandbox],
        risks: ["unconfined node process for the token gate"],
        authorizedBy: "(awaiting matching grant)",
      },
      resolved.error,
    );
  } else {
    const restore = [
      edit(
        "packages/ui/src/web/Button.web.tsx",
        "backgroundColor: s.backgroundColor,",
        'backgroundColor: "#C0FFEE",',
      ),
      edit(
        "packages/ui/src/native/Button.native.tsx",
        "backgroundColor: s.backgroundColor,",
        'backgroundColor: "#C0FFEE",',
      ),
      edit(
        "apps/clients/web/src/app/page.tsx",
        "return <HomePage />;",
        'return (\n    <div style={{ color: "#C0FFEE" }}>\n      <HomePage />\n    </div>\n  );',
      ),
    ];
    const r = runGuardedScript({
      project: product,
      sandbox: productSandbox,
      script: "tokens",
      watch,
      authorizeUnconfined: resolved.authorize,
      operation,
    });
    restore.forEach((f) => f());
    const text = out(r);
    const files = [
      "packages/ui/src/web/Button.web.tsx",
      "packages/ui/src/native/Button.native.tsx",
      "apps/clients/web/src/app/page.tsx",
    ];
    const hits = files.map((f) =>
      new RegExp(
        `TOKEN color-literal ${f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\d+:\\d+ .*#C0FFEE`,
      ).test(text),
    );
    const again = runGuardedScript({
      project: product,
      sandbox: productSandbox,
      script: "tokens",
      watch,
      authorizeUnconfined: resolved.authorize,
      operation,
    });
    record(
      "A9a",
      "token counter-proof (#C0FFEE in Button.web, Button.native and the web client) fails for the right rule; restored state passes",
      r.status === 1 && hits.every(Boolean) && again.status === 0,
      {
        exit: r.status,
        perFile: Object.fromEntries(files.map((f, i) => [f, hits[i]])),
        restoredExit: again.status,
        decision: r.decision,
        grantId: resolved.grantId,
        confinementRequirement: r.decision?.confinementRequirement,
        adversarialRestored: true,
      },
      text,
    );
  }
}
{
  const operation = {
    command: "pnpm run arch",
    scripts: ["arch"],
    destinations: [product, productSandbox],
  };
  const resolved = resolveStepAuthorization(authDoc, "A9b", operation);
  if (resolved.error) {
    pendingScripts(
      "A9b",
      "FSD counter-proof (feature importing a widget)",
      {
        command: "pnpm run arch",
        scripts: ["arch"],
        destinations: [product],
        risks: ["unconfined node process"],
        authorizedBy: "(awaiting matching grant)",
      },
      resolved.error,
    );
  } else {
    const restore = edit(
      "packages/frontend/src/features/toggle-favorite/ui/ToggleFavoriteButton.tsx",
      "\n",
      '\nimport { ProductHighlight } from "../../../widgets/product-highlight";\nvoid ProductHighlight;\n',
    );
    const r = runGuardedScript({
      project: product,
      sandbox: productSandbox,
      script: "arch",
      watch,
      authorizeUnconfined: resolved.authorize,
      operation,
    });
    restore();
    record(
      "A9b",
      "FSD counter-proof (feature importing a widget) fails the architecture gate",
      r.status === 1 && /FSD-LAYER/.test(out(r)),
      {
        exit: r.status,
        decision: r.decision,
        grantId: resolved.grantId,
        confinementRequirement: r.decision?.confinementRequirement,
        adversarialRestored: true,
      },
      out(r),
    );
  }
}
{
  const operation = {
    command: "pnpm run check:tokens",
    scripts: ["check:tokens"],
    destinations: [product, productSandbox],
  };
  const resolved = resolveStepAuthorization(authDoc, "A9c", operation);
  if (resolved.error) {
    pendingScripts(
      "A9c",
      "propagation negative control: native component bypasses the token",
      {
        command: "pnpm run check:tokens",
        scripts: ["check:tokens"],
        destinations: [product],
        risks: ["unconfined builds/tests"],
        authorizedBy: "(awaiting matching grant)",
      },
      resolved.error,
    );
  } else {
    const restore = edit(
      "packages/ui/src/native/Button.native.tsx",
      "backgroundColor: s.backgroundColor,",
      'backgroundColor: "#1D4ED8", // token-check-allow: negative control of the propagation proof only',
    );
    const r = runGuardedScript({
      project: product,
      sandbox: productSandbox,
      script: "check:tokens",
      watch,
      authorizeUnconfined: resolved.authorize,
      operation,
    });
    restore();
    record(
      "A9c",
      "propagation negative control: a native component that bypasses the token makes the proof fail",
      r.status === 1 && /"styleResolution": false/.test(out(r)),
      {
        exit: r.status,
        decision: r.decision,
        grantId: resolved.grantId,
        confinementRequirement: r.decision?.confinementRequirement,
        adversarialRestored: true,
      },
      out(r),
    );
  }
}

// A10 legacy app and A11 migrated product
const legacySandbox = path.join(run, "legacy");
fs.mkdirSync(legacySandbox, { recursive: true });
const legacy = path.join(legacySandbox, "legacy-shop");
fs.cpSync(path.join(repo, "test", "fixtures", "legacy-shop"), legacy, {
  recursive: true,
});
const li = runGuardedPnpm({
  project: legacy,
  sandbox: legacySandbox,
  args: ["install", "--frozen-lockfile"],
  ignoreScripts: true,
  authorizeUnconfined: null,
  watch,
});
record(
  "A10",
  "legacy app: frozen install (scripts disabled; D7 not used)",
  !li.blocked && li.status === 0,
  {
    exit: li.status,
    blocked: li.blocked,
    blockers: li.preflight?.blockers,
    fixtureLockSha256: sha(path.join(legacy, "pnpm-lock.yaml")),
    ignoreScripts: true,
    decision: li.decision,
  },
  out(li),
);
const legacyTests = script(
  "A10b",
  "legacy app: characterization tests",
  legacy,
  legacySandbox,
  "test",
);

const migSandbox = path.join(run, "migrated");
fs.mkdirSync(migSandbox, { recursive: true });
const migrated = scaffoldModule.scaffold({
  out: path.join(migSandbox, "loja"),
  scope: "@acme",
  name: "Loja",
});
const overlay = path.join(repo, "test", "fixtures", "legacy-shop-migration");
const migration = JSON.parse(
  fs.readFileSync(path.join(overlay, "migration.json"), "utf8"),
);
for (const rel of migration.removeFromTemplate)
  fs.rmSync(path.join(migrated, ...rel.split("/")), {
    recursive: true,
    force: true,
  });
fs.cpSync(overlay, migrated, { recursive: true });
const vit = path.join(migrated, "vitest.config.ts");
fs.writeFileSync(
  vit,
  fs
    .readFileSync(vit, "utf8")
    .replace(
      'include: ["packages/**/*.test.{ts,tsx}"]',
      `include: ${JSON.stringify(migration.vitestInclude)}`,
    ),
);
const mi = runGuardedPnpm({
  project: migrated,
  sandbox: migSandbox,
  args: ["install", "--frozen-lockfile"],
  ignoreScripts: true,
  authorizeUnconfined: null,
  watch,
});
record(
  "A11",
  "migrated product assembled from the package template: frozen install (scripts disabled; D7 not used)",
  !mi.blocked && mi.status === 0,
  {
    exit: mi.status,
    blocked: mi.blocked,
    blockers: mi.preflight?.blockers,
    ignoreScripts: true,
    decision: mi.decision,
  },
  out(mi),
);
const migVerify = script(
  "A11b",
  "migrated product: pnpm verify (gates, typecheck, same characterization cases, build, export)",
  migrated,
  migSandbox,
  "verify",
);
const titles = (f) =>
  [
    ...fs
      .readFileSync(f, "utf8")
      .matchAll(/\bit(?:\.each\([^)]*\))?\(\s*"([^"]+)"/g),
  ]
    .map((m) => m[1])
    .sort();
const expects = (f) =>
  (fs.readFileSync(f, "utf8").match(/\bexpect\(/g) ?? []).length;
const legacyTest = path.join(legacy, "characterization", "legacy.test.tsx");
const migratedTest = path.join(
  migrated,
  "characterization",
  "migrated.test.tsx",
);
const sameCases =
  sha(path.join(legacy, "characterization", "cases.json")) ===
  sha(path.join(migrated, "characterization", "cases.json"));
const sameTitles =
  JSON.stringify(titles(legacyTest)) === JSON.stringify(titles(migratedTest));
const legacyCount = Number(
  legacyTests.text.match(/Tests\s+(\d+) passed/)?.[1] ?? 0,
);
const a12Ready =
  legacyTests.ok === true && migVerify.ok === true && legacyCount === 7;
if (!a12Ready) {
  steps.push({
    id: "A12",
    title:
      "behavior preserved: same cases file and test titles (awaits A10b and A11b results)",
    ok: null,
    sameCases,
    sameTitles,
    expectCalls: [expects(legacyTest), expects(migratedTest)],
    casesSha256: sha(path.join(legacy, "characterization", "cases.json")),
    pendingAuthorization: legacyTests.ok == null || migVerify.ok == null,
    note:
      legacyTests.ok == null || migVerify.ok == null
        ? "A12 needs executed A10b and A11b; no extra subprocesses"
        : "A10b/A11b ran but did not produce the expected passing characterization",
    legacyTestsOk: legacyTests.ok,
    migVerifyOk: migVerify.ok,
    legacyTestsPassed: legacyCount,
  });
  process.stdout.write(
    "PENDING A12 behavior preserved: awaits successful A10b and A11b\n",
  );
} else {
  record(
    "A12",
    "behavior preserved: same cases file, same test titles and assertion count, legacy cases pass on both",
    sameCases &&
      sameTitles &&
      expects(legacyTest) === expects(migratedTest) &&
      legacyCount === 7 &&
      migVerify.ok,
    {
      sameCases,
      sameTitles,
      expectCalls: [expects(legacyTest), expects(migratedTest)],
      legacyTestsPassed: legacyCount,
      casesSha256: sha(path.join(legacy, "characterization", "cases.json")),
      noExtraSpawn: true,
    },
  );
}

// A13 client discovery in the generated product (no model call)
const skipClients = values["without-clients"];
const codex = skipClients ? null : findCodex();
if (skipClients) {
  steps.push({
    id: "A13a",
    title: "Codex discovery in the generated product",
    ok: null,
    notVerified: "skipped by --without-clients",
  });
  steps.push({
    id: "A13b",
    title: "Claude Code discovery in the generated product",
    ok: null,
    notVerified: "skipped by --without-clients",
  });
} else if (codex) {
  const probeRoot = path.join(run, "codex-probe");
  const res = codexPromptInput(codex.path, probeRoot, product);
  const projectRoot = path.join(product, ".agents", "skills").toLowerCase();
  const fromProject = res.skills
    .filter((s) => s.root && s.root.toLowerCase() === projectRoot)
    .map((s) => s.name);
  record(
    "A13a",
    "Codex lists the product's installed skills from the product root",
    fromProject.length === 20,
    {
      binary: codex.path,
      source: codex.source,
      version: versionOf(codex.path),
      fromProject: fromProject.length,
      roots: [...res.roots.values()],
    },
  );
} else
  record(
    "A13a",
    "Codex lists the product's installed skills from the product root",
    false,
    {
      notVerified:
        "Codex CLI not found in CW_CODEX_BIN, PATH or the ChatGPT editor extension",
    },
  );
const claude = skipClients ? null : findClaude();
if (skipClients) {
  /* recorded with A13a */
} else if (claude) {
  const probeRoot = path.join(run, "claude-probe");
  const res = claudeProbe(claude.path, probeRoot, product, "hello");
  record(
    "A13b",
    "Claude Code loads the product's installed skills from the project (credential-free, cost 0)",
    /project: 21\b/.test(res.loaded) && res.costUsd === 0 && res.apiMs === 0,
    {
      binary: claude.path,
      version: res.version,
      loaded: res.loaded,
      projectDirs: res.projectDirs,
      costUsd: res.costUsd,
      result: res.result,
    },
  );
} else
  record(
    "A13b",
    "Claude Code loads the product's installed skills from the project",
    false,
    { notVerified: "Claude Code CLI not found" },
  );
steps.push({
  id: "A13c",
  title: "Cursor project-scope discovery in a new session",
  ok: null,
  notVerified:
    "requires a new Cursor session on the product (see acceptance/CURSOR-VERIFICATION.md)",
});

const required = steps.filter((s) => s.ok !== null);
const pending = steps.filter((s) => s.ok === null);
const report = {
  schema: "context-window/acceptance-run@1",
  at: new Date().toISOString(),
  node: process.version,
  platform: `${process.platform} ${os.release()}`,
  repoHead: spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: repo,
    encoding: "utf8",
  }).stdout.trim(),
  run,
  policy: {
    writeConfinement: GUARD_LIMITS.writeConfinement,
    confinedExecutor: CONFINED_EXECUTOR,
    authorizationSource: authDoc?.source ?? null,
    denied: authDoc?.denied ?? [],
    installLifecycle: "always-ignore-scripts",
  },
  passed: required.filter((s) => s.ok).length,
  failed: required.filter((s) => !s.ok).map((s) => s.id),
  pending: pending.map((s) => s.id),
  steps,
};
fs.writeFileSync(
  path.join(run, "acceptance-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
process.stdout.write(
  `\n${report.passed}/${required.length} required steps passed${report.failed.length ? `; failed: ${report.failed.join(", ")}` : ""}${pending.length ? `; pending authorization/environment: ${pending.map((s) => s.id).join(", ")}` : ""}\nreport: ${path.join(run, "acceptance-report.json")}\n`,
);
process.exitCode = report.failed.length ? 1 : 0;
