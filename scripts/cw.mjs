#!/usr/bin/env node
// Context Window distribution CLI. Run `node scripts/cw.mjs help` for usage.
// Exit codes: 0 ok · 1 failure/verification failed · 2 conflicts (nothing written) · 3 busy/interrupted · 64 usage.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BusyError,
  InterruptedError,
  acquireLock,
  adapterFault,
  applyPlan,
  controlDir,
  journalState,
  lockHolderAlive,
  recoverSink,
} from "./lib/apply.mjs";
import { applyFileBlocks, findBlock, planFileBlocks } from "./lib/blocks.mjs";
import {
  buildCatalog,
  lockFromCatalog,
  parseFrontmatter,
  selectSkills,
} from "./lib/catalog.mjs";
import { UsageError, isDirectRun, parseArgs } from "./lib/cli.mjs";
import {
  ensureDir,
  exists,
  hashTree,
  isInside,
  packageHash,
  readJsonOrNull,
  realpathOrSelf,
  removeTree,
  resolveThroughLinks,
  sha256,
  toPosix,
  writeFileAtomic,
} from "./lib/fsx.mjs";
import {
  credentialFileKind,
  findSecrets,
  isPrivateFile,
} from "./lib/secrets.mjs";
import {
  applyHook,
  buildRoutingEntries,
  hookState,
  planHook,
} from "./lib/hook.mjs";
import {
  LEGACY_MANIFEST_FILE,
  MANIFEST_FILE,
  readLegacyManifest,
  readManifest,
} from "./lib/manifest.mjs";
import { planLegacyCleanup, planSink } from "./lib/plan.mjs";
import { renderSkill } from "./lib/render.mjs";
import { BUILD_MARKER, sourceIdentity } from "./lib/source.mjs";
import {
  CLIENTS,
  discoveryDirs,
  legacyLocations,
  resolveHomes,
  sinkDir,
} from "./lib/targets.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const RECORD_SCHEMA = "context-window/install-record@1";

const COMMON = {
  target: { type: "string" },
  user: { type: "boolean" },
  home: { type: "string" },
  "claude-config-dir": { type: "string" },
  "codex-home": { type: "string" },
  clients: { type: "list" },
  profile: { type: "string" },
  json: { type: "boolean" },
};
const MUTATE = {
  ...COMMON,
  adopt: { type: "list" },
  "adopt-all": { type: "boolean" },
  "force-local": { type: "boolean" },
  "migrate-legacy": { type: "boolean" },
  "keep-legacy": { type: "boolean" },
  "with-contract": { type: "boolean" },
  "without-contract": { type: "boolean" },
  "with-usage-policy": { type: "boolean" },
  "without-usage-policy": { type: "boolean" },
  "with-claude-hook": { type: "boolean" },
  "without-claude-hook": { type: "boolean" },
  "dry-run": { type: "boolean" },
};

const out = { json: false, report: {} };
function say(line = "") {
  if (!out.json) process.stdout.write(`${line}\n`);
}

function readText(rel) {
  return fs.readFileSync(path.join(repoRoot, ...rel.split("/")), "utf8");
}

function loadCatalogOrFail() {
  const catalog = buildCatalog(repoRoot);
  if (catalog.errors.length) {
    const error = new Error(
      `Catalog invalid:\n- ${catalog.errors.join("\n- ")}`,
    );
    error.exitCode = 1;
    throw error;
  }
  return catalog;
}

function recordPath(ctx) {
  return ctx.scope === "project"
    ? path.join(ctx.target, ".context-window", "install.json")
    : path.join(ctx.homes.home, ".context-window", "install.json");
}

function resolveContext(values, { requireProfile = false } = {}) {
  if (Boolean(values.target) === Boolean(values.user))
    throw new UsageError(
      "Choose exactly one destination: --target <project-dir> or --user",
    );
  const scope = values.user ? "user" : "project";
  const homes = resolveHomes({
    home: values.home,
    claudeConfigDir: values["claude-config-dir"],
    codexHome: values["codex-home"],
  });
  const ctx = { scope, homes, target: null };
  if (scope === "project") {
    ctx.target = path.resolve(values.target);
    if (!exists(ctx.target) || !fs.statSync(ctx.target).isDirectory())
      throw new UsageError(
        `--target ${ctx.target} is not an existing directory`,
      );
  }
  ctx.record = readJsonOrNull(recordPath(ctx));
  ctx.clients = values.clients ?? ctx.record?.clients ?? CLIENTS;
  for (const c of ctx.clients)
    if (!CLIENTS.includes(c))
      throw new UsageError(
        `Unknown client "${c}" (expected ${CLIENTS.join(", ")})`,
      );
  ctx.profile = values.profile ?? ctx.record?.profile ?? null;
  if (requireProfile && !ctx.profile)
    throw new UsageError(
      "--profile <name> is required for the first install (see catalog/registry.json profiles)",
    );
  const pick = (on, off, fallback) =>
    values[on] ? true : values[off] ? false : fallback;
  const profileDefaults =
    (ctx.profile &&
      readJsonOrNull(path.join(repoRoot, "catalog", "registry.json"))
        ?.profiles?.[ctx.profile]) ||
    {};
  ctx.contract = pick(
    "with-contract",
    "without-contract",
    ctx.record?.contract ?? profileDefaults.contract === true,
  );
  ctx.usagePolicy = pick(
    "with-usage-policy",
    "without-usage-policy",
    ctx.record?.usagePolicy ?? false,
  );
  ctx.claudeHook = pick(
    "with-claude-hook",
    "without-claude-hook",
    ctx.record?.claudeHook ?? false,
  );
  if (ctx.claudeHook && scope !== "project")
    throw new UsageError("--with-claude-hook is only available with --target");
  if (ctx.claudeHook && !ctx.clients.includes("claude"))
    throw new UsageError("--with-claude-hook requires the claude client");
  return ctx;
}

/** Sinks for the selected clients. Cursor is served by .claude/skills (compat) or .agents/skills (native). */
function sinksFor(ctx) {
  const wanted = new Set();
  if (ctx.clients.includes("claude")) wanted.add("claude");
  if (ctx.clients.includes("codex")) wanted.add("agents");
  if (ctx.clients.includes("cursor")) {
    const claudeVisibleToCursor =
      ctx.scope === "project" ||
      path.resolve(ctx.homes.claudeConfigDir) ===
        path.join(ctx.homes.home, ".claude");
    if (!(wanted.has("claude") && claudeVisibleToCursor)) wanted.add("agents");
  }
  return [...wanted].map((sink) => ({
    sink,
    dir: sinkDir(sink, ctx.scope, ctx),
  }));
}

function desiredPackages(catalog, ctx, libraryVersion) {
  const desired = new Map();
  if (!ctx.profile) return desired;
  for (const skill of selectSkills(catalog, ctx.profile))
    desired.set(skill.id, renderSkill(repoRoot, skill, libraryVersion));
  return desired;
}

function blockTargets(ctx) {
  const targets = [];
  if (ctx.scope === "project") {
    targets.push({
      file: path.join(ctx.target, "AGENTS.md"),
      name: "contract",
      want: ctx.contract,
      inner: () => readText("catalog/contract/architecture-contract.md"),
    });
    targets.push({
      file: path.join(ctx.target, "AGENTS.md"),
      name: "usage-policy",
      want: ctx.usagePolicy,
      inner: () => readText("catalog/contract/usage-policy.md"),
    });
    const claudeWants =
      ctx.clients.includes("claude") && (ctx.contract || ctx.usagePolicy);
    targets.push({
      file: path.join(ctx.target, "CLAUDE.md"),
      name: "agents-import",
      want: claudeWants,
      inner: () =>
        "Claude Code: the shared agent instructions for this repository live in AGENTS.md.\n\n@AGENTS.md",
    });
  } else {
    const claudeMd = path.join(ctx.homes.claudeConfigDir, "CLAUDE.md");
    const codexMd = path.join(ctx.homes.codexHome, "AGENTS.md");
    const contract = () =>
      readText("catalog/contract/architecture-contract.md");
    const usage = () => readText("catalog/contract/usage-policy.md");
    targets.push({
      file: claudeMd,
      name: "contract",
      want: ctx.contract && ctx.clients.includes("claude"),
      inner: contract,
    });
    targets.push({
      file: claudeMd,
      name: "usage-policy",
      want: ctx.usagePolicy && ctx.clients.includes("claude"),
      inner: usage,
    });
    targets.push({
      file: codexMd,
      name: "contract",
      want: ctx.contract && ctx.clients.includes("codex"),
      inner: contract,
    });
    targets.push({
      file: codexMd,
      name: "usage-policy",
      want: ctx.usagePolicy && ctx.clients.includes("codex"),
      inner: usage,
    });
  }
  return targets;
}

function legacyOnlyDirs(ctx) {
  const sinkDirs = new Set(sinksFor(ctx).map((s) => path.resolve(s.dir)));
  return legacyLocations(ctx)
    .filter((loc) =>
      ctx.scope === "project"
        ? loc.kind.endsWith("project") || loc.kind === "cursor-project-rules"
        : !loc.kind.endsWith("project"),
    )
    .filter(
      (loc) =>
        !sinkDirs.has(path.resolve(loc.dir)) &&
        exists(path.join(loc.dir, LEGACY_MANIFEST_FILE)),
    );
}

function computePlan(catalog, ctx, values, identity) {
  const desired = desiredPackages(catalog, ctx, identity.libraryVersion);
  const adopt = values["adopt-all"] ? "all" : new Set(values.adopt ?? []);
  const options = {
    adopt,
    forceLocal: Boolean(values["force-local"]),
    migrateLegacy: Boolean(values["migrate-legacy"]),
  };
  const containRoot = ctx.scope === "project" ? ctx.target : undefined;
  const sinks = sinksFor(ctx).map(({ sink, dir }) => ({
    sink,
    desired,
    plan: planSink({
      sinkDir: dir,
      scope: ctx.scope,
      containRoot,
      desired,
      options,
    }),
  }));
  // Sinks written by a previous install but no longer selected are emptied (managed entries only).
  const selectedDirs = new Set(sinks.map((s) => path.resolve(s.plan.sinkDir)));
  for (const previous of ctx.record?.sinks ?? []) {
    if (selectedDirs.has(path.resolve(previous.dir))) continue;
    const none = new Map();
    sinks.push({
      sink: previous.sink,
      desired: none,
      plan: planSink({
        sinkDir: previous.dir,
        scope: ctx.scope,
        containRoot,
        desired: none,
        options,
      }),
    });
  }
  const legacy = legacyOnlyDirs(ctx).map((loc) => ({
    kind: loc.kind,
    plan: planLegacyCleanup(loc.dir, options),
  }));
  const legacyConflicts = [];
  if (!values["migrate-legacy"] && !values["keep-legacy"]) {
    for (const l of legacy) {
      legacyConflicts.push({
        where: l.plan.sinkDir,
        id: l.kind,
        type: "legacy-install-present",
        detail:
          "1.x install found; use --migrate-legacy (backs up and removes it) or --keep-legacy",
      });
    }
  }
  const legacyPlans = values["keep-legacy"] ? [] : legacy;
  const byFile = new Map();
  for (const t of blockTargets(ctx)) {
    if (!byFile.has(t.file)) byFile.set(t.file, []);
    byFile.get(t.file).push({
      name: t.name,
      version: identity.libraryVersion,
      desiredInner: t.want ? t.inner() : null,
      forceLocal: options.forceLocal,
      migrateLegacy: options.migrateLegacy,
    });
  }
  const blocks = [...byFile.entries()].map(([file, specs]) =>
    planFileBlocks(file, specs),
  );
  let hook = null;
  if (ctx.scope === "project" && (ctx.claudeHook || ctx.record?.claudeHook)) {
    const template = readText("scripts/templates/claude-skill-router.mjs");
    const skills = [...desired.keys()].map((id) =>
      catalog.skills.find((s) => s.id === id),
    );
    hook = planHook({
      target: ctx.target,
      template,
      entries: buildRoutingEntries(skills, ".claude/skills"),
      remove: !ctx.claudeHook,
      previousScriptHash: ctx.record?.hookScriptHash,
      forceLocal: options.forceLocal,
    });
  }
  const conflicts = [
    ...sinks.flatMap((s) =>
      s.plan.conflicts.map((c) => ({ where: s.plan.sinkDir, ...c })),
    ),
    ...(values["migrate-legacy"]
      ? legacy.flatMap((l) =>
          l.plan.conflicts.map((c) => ({ where: l.plan.sinkDir, ...c })),
        )
      : []),
    ...legacyConflicts,
    ...blocks.flatMap((b) =>
      b.conflicts.map((detail) => ({
        where: b.file,
        id: "block",
        type: "block",
        detail,
      })),
    ),
    ...(hook?.conflicts ?? []).map((detail) => ({
      where: ctx.target,
      id: "claude-hook",
      type: "hook",
      detail,
    })),
  ];
  for (const dir of [
    ...sinks.map((s) => s.plan.sinkDir),
    ...legacy.map((l) => l.plan.sinkDir),
  ]) {
    // Lock may outlive the journal briefly (unlink journal → release). Treat a live holder
    // as busy even without a journal so concurrent installors never see a false conflict.
    if (lockHolderAlive(dir))
      throw new BusyError(`${dir} is being updated by another process`);
    const journal = journalState(dir);
    if (!journal) continue;
    conflicts.push({
      where: dir,
      id: "*",
      type: "interrupted",
      detail: `journal from ${journal.startedAt}; run cw recover`,
    });
  }
  return { desired, sinks, legacy: legacyPlans, blocks, hook, conflicts };
}

function lockTargets(result) {
  return [
    ...new Set([
      ...result.sinks.map((s) => s.plan.sinkDir),
      ...result.legacy.map((l) => l.plan.sinkDir),
    ]),
  ].sort();
}

function printPlan(result) {
  for (const s of result.sinks) {
    say(`sink ${s.plan.sinkDir}`);
    for (const op of s.plan.ops)
      say(
        `  ${op.op.padEnd(22)} ${op.id}${op.backup ? " (backup)" : ""}${op.reason ? ` [${op.reason}]` : ""}${op.changes ? ` ${op.changes.join(" ")}` : ""}`,
      );
    if (s.plan.unchanged.length)
      say(`  unchanged              ${s.plan.unchanged.length} entries`);
  }
  for (const l of result.legacy) {
    say(`legacy ${l.plan.sinkDir}`);
    for (const op of l.plan.ops) say(`  ${op.op.padEnd(22)} ${op.id} (backup)`);
  }
  for (const b of result.blocks) {
    if (b.action === "none") continue;
    say(
      `blocks ${b.action.padEnd(22)} ${b.file} (${b.steps
        .filter((s) => s.action !== "none")
        .map((s) => `${s.name}:${s.action}`)
        .join(", ")})`,
    );
  }
  for (const a of result.hook?.actions ?? [])
    say(
      `hook   ${(a.next === null ? "remove" : "write").padEnd(22)} ${a.file}`,
    );
  for (const c of result.conflicts)
    say(`CONFLICT ${c.type} ${c.id} @ ${c.where}: ${c.detail}`);
}

function planToJson(result) {
  return {
    sinks: result.sinks.map((s) => ({
      dir: s.plan.sinkDir,
      ops: s.plan.ops,
      unchanged: s.plan.unchanged,
    })),
    legacy: result.legacy.map((l) => ({
      dir: l.plan.sinkDir,
      ops: l.plan.ops,
    })),
    blocks: result.blocks.map((b) => ({
      file: b.file,
      action: b.action,
      steps: b.steps,
      conflicts: b.conflicts,
    })),
    hook: result.hook
      ? result.hook.actions.map((a) => ({
          file: a.file,
          action: a.next === null ? "remove" : "write",
        }))
      : [],
    conflicts: result.conflicts,
  };
}

function cmdInstall(argv, { dryRunCommand = false } = {}) {
  const { values } = parseArgs(argv, MUTATE);
  out.json = Boolean(values.json);
  const ctx = resolveContext(values, { requireProfile: true });
  const catalog = loadCatalogOrFail();
  const identity = sourceIdentity(repoRoot);
  const report = (r) => {
    out.report = {
      command: dryRunCommand ? "plan" : "install",
      scope: ctx.scope,
      target: ctx.target,
      profile: ctx.profile,
      clients: ctx.clients,
      ...planToJson(r),
    };
  };
  const preview = dryRunCommand || values["dry-run"];
  // First pass without locks. A live lock holder already throws BusyError inside computePlan
  // (including the journal-unlinked window). Quiescent content conflicts may return 2 without
  // creating control dirs. Interrupted journals must not look like ordinary conflicts: they
  // fall through so acquireLock raises InterruptedError → exit 3 (ACH-010/CR-017).
  let result = null;
  try {
    result = computePlan(catalog, ctx, values, identity);
  } catch (error) {
    if (preview || error instanceof BusyError || error instanceof UsageError)
      throw error;
  }
  if (result) report(result);
  if (result && preview) {
    printPlan(result);
    if (result.conflicts.length) {
      say(`\n${result.conflicts.length} conflict(s). Nothing was written.`);
      return 2;
    }
    say("\nDry run: nothing was written.");
    return 0;
  }
  if (
    result &&
    result.conflicts.length &&
    !result.conflicts.some((c) => c.type === "interrupted")
  ) {
    printPlan(result);
    say(`\n${result.conflicts.length} conflict(s). Nothing was written.`);
    return 2;
  }
  // Re-plan while holding every lock, so a concurrent run can never apply a stale plan.
  const releases = [];
  try {
    const dirs = result
      ? lockTargets(result)
      : [
          ...new Set([
            ...sinksFor(ctx).map((s) => s.dir),
            ...(ctx.record?.sinks ?? []).map((s) => s.dir),
            ...legacyOnlyDirs(ctx).map((l) => l.dir),
          ]),
        ].sort();
    for (const dir of dirs) releases.push(acquireLock(dir, "install"));
    result = computePlan(catalog, ctx, values, identity);
    report(result);
    printPlan(result);
    if (result.conflicts.length) {
      say(`\n${result.conflicts.length} conflict(s). Nothing was written.`);
      return 2;
    }
    return applyInstall(ctx, catalog, identity, result);
  } finally {
    releases.forEach((release) => release());
  }
}

function applyInstall(ctx, catalog, identity, result) {
  const meta = (sink) => ({
    library: catalog.registry.library,
    libraryVersion: identity.libraryVersion,
    source: { commit: identity.commit, distribution: identity.distribution },
    scope: ctx.scope,
    sink,
    profile: ctx.profile,
  });
  const record = {
    schema: RECORD_SCHEMA,
    libraryVersion: identity.libraryVersion,
    source: { commit: identity.commit, distribution: identity.distribution },
    scope: ctx.scope,
    profile: ctx.profile,
    clients: ctx.clients,
    sinks: sinksFor(ctx).map((s) => ({ sink: s.sink, dir: s.dir })),
    contract: ctx.contract,
    usagePolicy: ctx.usagePolicy,
    claudeHook: ctx.claudeHook,
    hookScriptHash: ctx.claudeHook ? (result.hook?.scriptHash ?? null) : null,
    installedAt: new Date().toISOString(),
  };
  const backups = [];
  const applied = [];
  let phase = "skills";
  try {
    for (const s of result.sinks) {
      if (!s.plan.ops.length) continue;
      const r = applyPlan(s.plan, s.desired, meta(s.sink), {
        command: "install",
        lockHeld: true,
      });
      backups.push(...r.backups);
      applied.push(s.plan.sinkDir);
    }
    for (const l of result.legacy) {
      if (!l.plan.ops.length) continue;
      const r = applyPlan(l.plan, new Map(), null, {
        command: "install --migrate-legacy",
        lockHeld: true,
      });
      backups.push(...r.backups);
      applied.push(l.plan.sinkDir);
    }
    phase = "client files";
    const backupDir =
      ctx.scope === "project"
        ? path.join(ctx.target, ".context-window", "backups")
        : path.join(ctx.homes.home, ".context-window", "backups");
    for (const b of result.blocks) {
      adapterFault(path.basename(b.file));
      const saved = applyFileBlocks(b, backupDir);
      if (saved) backups.push(saved);
    }
    if (result.hook) {
      adapterFault("hook");
      applyHook(result.hook);
    }
  } catch (error) {
    say(`\nFAILED: ${error.message}`);
    for (const line of error.rollbackLog ?? []) say(`  ${line}`);
    if (applied.length)
      say(`Already applied (consistent, see cw status): ${applied.join(", ")}`);
    if (applied.length || phase !== "skills") {
      // The previous record keeps describing what is on disk (hook hash included); the marker
      // makes verify fail until an install completes.
      const previous = ctx.record ?? { ...record, hookScriptHash: null };
      const incomplete = {
        at: new Date().toISOString(),
        phase,
        error: error.message,
      };
      writeFileAtomic(
        recordPath(ctx),
        `${JSON.stringify({ ...previous, incomplete }, null, 2)}\n`,
      );
      say(
        "The install is incomplete: cw verify fails until cw install completes.",
      );
    }
    out.report.error = error.message;
    return error instanceof BusyError || error instanceof InterruptedError
      ? 3
      : 1;
  }
  writeFileAtomic(recordPath(ctx), `${JSON.stringify(record, null, 2)}\n`);
  for (const b of backups) say(`backup: ${b}`);
  say(
    `\nInstalled profile "${ctx.profile}" v${identity.libraryVersion} for ${ctx.clients.join(", ")} (${ctx.scope}).`,
  );
  out.report.backups = backups;
  return 0;
}

function sinkStatus(dir, desired) {
  const rows = [];
  const journal = journalState(dir);
  const lock = readJsonOrNull(path.join(controlDir(dir), "lock"));
  let manifest = null;
  try {
    manifest = readManifest(dir);
  } catch (error) {
    rows.push({ id: "*", state: "invalid-manifest", detail: error.message });
    return { dir, rows, journal, lock };
  }
  const legacy = readLegacyManifest(dir);
  if (legacy)
    rows.push({
      id: LEGACY_MANIFEST_FILE,
      state: "legacy-install",
      detail: `v${legacy.version}`,
    });
  const entries = new Map((manifest?.entries ?? []).map((e) => [e.id, e]));
  for (const [id, pkg] of desired) {
    const full = path.join(dir, id);
    const entry = entries.get(id);
    if (!exists(full)) {
      rows.push({ id, state: entry ? "missing" : "not-installed" });
      continue;
    }
    const disk = hashTree(full).hashes;
    if (!entry) {
      rows.push({
        id,
        state:
          packageHash(disk) === pkg.packageHash
            ? "unmanaged-identical"
            : "unmanaged-collision",
      });
      continue;
    }
    const intact =
      Object.keys(entry.files).length === Object.keys(disk).length &&
      Object.entries(entry.files).every(([rel, h]) => disk[rel] === h);
    if (!intact) rows.push({ id, state: "modified-locally" });
    else
      rows.push({
        id,
        state: entry.packageHash === pkg.packageHash ? "current" : "outdated",
      });
  }
  for (const [id] of entries)
    if (!desired.has(id)) rows.push({ id, state: "removed-upstream" });
  return {
    dir,
    rows,
    journal,
    lock,
    manifestVersion: manifest?.libraryVersion ?? null,
  };
}

function cmdStatus(argv, { strict }) {
  const { values } = parseArgs(argv, COMMON);
  out.json = Boolean(values.json);
  const ctx = resolveContext(values);
  if (!ctx.profile)
    throw new UsageError(
      "No install record found; pass --profile to inspect a selection",
    );
  const catalog = loadCatalogOrFail();
  const identity = sourceIdentity(repoRoot);
  const desired = desiredPackages(catalog, ctx, identity.libraryVersion);
  const sinks = sinksFor(ctx).map((s) => sinkStatus(s.dir, desired));
  const problems = [];
  const incomplete = ctx.record?.incomplete;
  if (incomplete) {
    say(
      `INCOMPLETE install since ${incomplete.at} (${incomplete.phase}): ${incomplete.error} — run cw install again`,
    );
    problems.push(`install incomplete (${incomplete.phase})`);
  }
  for (const s of sinks) {
    const counts = {};
    for (const r of s.rows) counts[r.state] = (counts[r.state] ?? 0) + 1;
    say(
      `sink ${s.dir} (manifest v${s.manifestVersion ?? "-"}): ${Object.entries(
        counts,
      )
        .map(([k, v]) => `${k}=${v}`)
        .join(" ")}`,
    );
    if (s.journal) {
      say(
        `  INTERRUPTED operation since ${s.journal.startedAt} — run cw recover`,
      );
      problems.push(`${s.dir}: interrupted`);
    }
    if (s.lock)
      say(`  lock held by pid ${s.lock.pid} since ${s.lock.startedAt}`);
    for (const r of s.rows.filter((row) => row.state !== "current")) {
      say(`  ${r.state.padEnd(20)} ${r.id}${r.detail ? ` ${r.detail}` : ""}`);
      problems.push(`${s.dir}/${r.id}: ${r.state}`);
    }
  }
  const blocks = blockTargets(ctx).map((t) => {
    const text = exists(t.file) ? fs.readFileSync(t.file, "utf8") : "";
    const found = findBlock(text, t.name);
    let state = found.state;
    if (t.want && found.state === "intact") {
      const desiredInner = t.inner().replace(/\r\n/g, "\n").trim();
      state =
        found.inner === desiredInner &&
        found.version === identity.libraryVersion
          ? "current"
          : "outdated";
    }
    if (!t.want && found.state === "absent") state = "not-requested";
    if (t.want && found.state === "absent") state = "missing";
    return { file: t.file, name: t.name, state };
  });
  for (const b of blocks) {
    if (b.state === "not-requested") continue;
    say(`block ${b.name} @ ${b.file}: ${b.state}`);
    if (b.state !== "current") problems.push(`${b.file}#${b.name}: ${b.state}`);
  }
  let hook = null;
  if (ctx.scope === "project" && ctx.claudeHook) {
    hook = hookState(
      ctx.target,
      readText("scripts/templates/claude-skill-router.mjs"),
    );
    say(`claude hook: script=${hook.script} registered=${hook.registered}`);
    if (hook.script !== "current" || !hook.registered)
      problems.push("claude hook not current");
  }
  out.report = {
    command: strict ? "verify" : "status",
    scope: ctx.scope,
    profile: ctx.profile,
    clients: ctx.clients,
    sinks,
    blocks,
    hook,
    problems,
  };
  if (strict) {
    say(
      problems.length
        ? `\nVERIFY FAILED (${problems.length} problem(s))`
        : "\nVERIFY PASSED",
    );
    return problems.length ? 1 : 0;
  }
  return 0;
}

function listSkillsIn(dir, recursive) {
  const found = [];
  if (!exists(dir)) return found;
  const walk = (current, depth) => {
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (!e.isDirectory() || e.name.startsWith(".")) continue;
      const full = path.join(current, e.name);
      if (exists(path.join(full, "SKILL.md"))) found.push(full);
      if (recursive && depth < 4) walk(full, depth + 1);
    }
  };
  walk(dir, 0);
  return found;
}

function cmdDoctor(argv) {
  const { values } = parseArgs(argv, {
    ...COMMON,
    strict: { type: "boolean" },
  });
  out.json = Boolean(values.json);
  const ctx = resolveContext(values);
  const catalog = loadCatalogOrFail();
  const identity = sourceIdentity(repoRoot);
  const expected = new Map();
  for (const skill of catalog.skills.filter((s) => s.status === "active"))
    expected.set(
      skill.id,
      renderSkill(repoRoot, skill, identity.libraryVersion).packageHash,
    );
  const clients = values.clients ?? CLIENTS;
  const report = { clients: {}, legacy: [], findings: [] };
  for (const client of clients) {
    const copies = [];
    for (const loc of discoveryDirs(client, ctx)) {
      for (const dir of listSkillsIn(loc.dir, client === "cursor")) {
        const raw = fs.readFileSync(path.join(dir, "SKILL.md"), "utf8");
        const fm = parseFrontmatter(raw);
        const name = fm.data?.name ?? path.basename(dir);
        const hash = packageHash(hashTree(dir).hashes);
        let manifest = null;
        try {
          manifest = readManifest(path.dirname(dir));
        } catch {
          manifest = null;
        }
        const managed = manifest?.entries?.find(
          (e) => e.id === path.basename(dir),
        );
        const state = !expected.has(name)
          ? fm.error
            ? "invalid-skill"
            : "foreign"
          : hash === expected.get(name)
            ? managed
              ? "managed-current"
              : "unmanaged-identical"
            : managed
              ? managed.packageHash === hash
                ? "managed-outdated"
                : "managed-modified"
              : "unmanaged-divergent";
        copies.push({
          name,
          dir,
          scope: loc.scope,
          hash,
          state,
          frontmatterError: fm.error ?? null,
        });
      }
    }
    const byName = new Map();
    for (const c of copies) {
      if (!byName.has(c.name)) byName.set(c.name, []);
      byName.get(c.name).push(c);
    }
    const duplicates = [...byName.entries()]
      .filter(([, list]) => list.length > 1)
      .map(([name, list]) => ({
        name,
        identical: new Set(list.map((c) => c.hash)).size === 1,
        copies: list.map((c) => ({ dir: c.dir, state: c.state })),
      }));
    report.clients[client] = { copies, duplicates };
    say(
      `client ${client}: ${copies.length} skill copies, ${duplicates.length} names with more than one copy`,
    );
    for (const d of duplicates) {
      say(
        `  ${d.identical ? "duplicate (identical)" : "DUPLICATE (DIVERGENT)"} ${d.name}`,
      );
      for (const c of d.copies) say(`      ${c.state.padEnd(20)} ${c.dir}`);
      if (!d.identical)
        report.findings.push(`${client}: divergent copies of ${d.name}`);
    }
    for (const c of copies.filter((x) =>
      [
        "unmanaged-divergent",
        "managed-modified",
        "managed-outdated",
        "invalid-skill",
      ].includes(x.state),
    )) {
      if (!duplicates.some((d) => d.name === c.name))
        say(`  ${c.state.padEnd(20)} ${c.dir}`);
      report.findings.push(`${client}: ${c.state} ${c.dir}`);
    }
  }
  for (const loc of legacyLocations(ctx)) {
    const legacy = readLegacyManifest(loc.dir);
    if (legacy) {
      say(
        `legacy 1.x install (${loc.kind}) at ${loc.dir}: v${legacy.version}, ${legacy.artifacts.length} artifacts`,
      );
      report.legacy.push({
        kind: loc.kind,
        dir: loc.dir,
        version: legacy.version,
        artifacts: legacy.artifacts.length,
      });
      report.findings.push(`legacy install at ${loc.dir}`);
    }
  }
  out.report = { command: "doctor", scope: ctx.scope, ...report };
  say(
    report.findings.length
      ? `\n${report.findings.length} finding(s).`
      : "\nNo findings.",
  );
  return values.strict && report.findings.length ? 1 : 0;
}

function cmdUninstall(argv) {
  const { values } = parseArgs(argv, {
    ...COMMON,
    "force-local": { type: "boolean" },
    "dry-run": { type: "boolean" },
  });
  out.json = Boolean(values.json);
  const ctx = resolveContext(values);
  if (!ctx.record)
    throw new UsageError(
      `No install record at ${recordPath(ctx)}; nothing is managed here`,
    );
  const catalog = loadCatalogOrFail();
  const identity = sourceIdentity(repoRoot);
  const options = {
    adopt: new Set(),
    forceLocal: Boolean(values["force-local"]),
    migrateLegacy: false,
  };
  const sinks = (ctx.record.sinks ?? []).map((s) => ({
    sink: s.sink,
    plan: planSink({
      sinkDir: s.dir,
      scope: ctx.scope,
      containRoot: ctx.scope === "project" ? ctx.target : undefined,
      desired: new Map(),
      options,
    }),
  }));
  const removal = {
    ...ctx,
    contract: false,
    usagePolicy: false,
    claudeHook: false,
    clients: ctx.record.clients,
  };
  const byFile = new Map();
  for (const t of blockTargets(removal)) {
    if (!byFile.has(t.file)) byFile.set(t.file, []);
    byFile.get(t.file).push({
      name: t.name,
      version: identity.libraryVersion,
      desiredInner: null,
      forceLocal: options.forceLocal,
      migrateLegacy: false,
    });
  }
  const blocks = [...byFile.entries()].map(([file, specs]) =>
    planFileBlocks(file, specs),
  );
  const hook =
    ctx.scope === "project" && ctx.record.claudeHook
      ? planHook({
          target: ctx.target,
          template: readText("scripts/templates/claude-skill-router.mjs"),
          entries: [],
          remove: true,
          previousScriptHash: ctx.record.hookScriptHash,
          forceLocal: options.forceLocal,
        })
      : null;
  const result = {
    sinks,
    legacy: [],
    blocks,
    hook,
    conflicts: [
      ...sinks.flatMap((s) =>
        s.plan.conflicts
          .filter((c) => !c.type.startsWith("legacy"))
          .map((c) => ({ where: s.plan.sinkDir, ...c })),
      ),
      ...blocks.flatMap((b) =>
        b.conflicts.map((detail) => ({
          where: b.file,
          id: "block",
          type: "block",
          detail,
        })),
      ),
      ...(hook?.conflicts ?? []).map((detail) => ({
        where: ctx.target,
        id: "claude-hook",
        type: "hook",
        detail,
      })),
    ],
  };
  out.report = { command: "uninstall", ...planToJson(result) };
  printPlan(result);
  if (result.conflicts.length) {
    say(`\n${result.conflicts.length} conflict(s). Nothing was removed.`);
    return 2;
  }
  if (values["dry-run"]) return 0;
  for (const s of sinks)
    if (s.plan.ops.length || exists(path.join(s.plan.sinkDir, MANIFEST_FILE)))
      applyPlan(
        {
          ...s.plan,
          ops: s.plan.ops.filter((o) => !o.op.startsWith("legacy")),
        },
        new Map(),
        {
          library: catalog.registry.library,
          libraryVersion: identity.libraryVersion,
          scope: ctx.scope,
          sink: s.sink,
        },
        { command: "uninstall" },
      );
  const blockBackupDir =
    ctx.scope === "project"
      ? path.join(ctx.target, ".context-window", "backups")
      : path.join(ctx.homes.home, ".context-window", "backups");
  for (const b of blocks) {
    const saved = applyFileBlocks(b, blockBackupDir);
    if (saved) say(`backup: ${saved}`);
  }
  if (hook) applyHook(hook);
  fs.unlinkSync(recordPath(ctx));
  say("\nUninstalled managed artifacts. Unmanaged content was left untouched.");
  return 0;
}

function cmdRecover(argv) {
  const { values } = parseArgs(argv, COMMON);
  out.json = Boolean(values.json);
  const ctx = resolveContext(values);
  const dirs = new Set([
    ...sinksFor(ctx).map((s) => s.dir),
    ...(ctx.record?.sinks ?? []).map((s) => s.dir),
    ...legacyLocations(ctx).map((l) => l.dir),
  ]);
  const results = [];
  for (const dir of dirs) {
    if (!exists(controlDir(dir))) continue;
    const r = recoverSink(dir);
    results.push({ dir, ...r });
    say(
      `${dir}: ${r.recovered ? "rolled back interrupted operation" : "no interrupted operation"}`,
    );
    for (const line of r.log) say(`  ${line}`);
  }
  out.report = { command: "recover", results };
  return 0;
}

const FORBIDDEN_OUT_MARKERS = [
  ".git",
  "package.json",
  "pnpm-workspace.yaml",
  "AGENTS.md",
];

export function assertSafeOutputDir(outDir) {
  const abs = resolveThroughLinks(outDir);
  const repo = realpathOrSelf(repoRoot);
  const home = realpathOrSelf(resolveHomes().home);
  const cwd = realpathOrSelf(process.cwd());
  if (path.parse(abs).root === abs)
    throw new UsageError(`Refusing to use a filesystem root as output: ${abs}`);
  for (const [label, p] of [
    ["repository", repo],
    ["home directory", home],
    ["current directory", cwd],
  ]) {
    if (isInside(abs, p))
      throw new UsageError(
        `Refusing output ${abs}: it is or contains the ${label} (${p})`,
      );
  }
  if (!exists(abs)) return "new";
  if (!fs.statSync(abs).isDirectory())
    throw new UsageError(`Output ${abs} exists and is not a directory`);
  const names = fs.readdirSync(abs);
  if (names.length === 0) return "empty";
  if (names.includes(BUILD_MARKER)) return "previous-build";
  const found = names.filter((n) => FORBIDDEN_OUT_MARKERS.includes(n));
  throw new UsageError(
    `Refusing to replace ${abs}: not empty and not a previous cw build${found.length ? ` (contains ${found.join(", ")})` : ""}`,
  );
}

function cmdBuild(argv) {
  const { values } = parseArgs(argv, {
    out: { type: "string" },
    json: { type: "boolean" },
  });
  out.json = Boolean(values.json);
  if (!values.out) throw new UsageError("--out <dir> is required");
  const outDir = path.resolve(values.out);
  const kind = assertSafeOutputDir(outDir);
  const catalog = loadCatalogOrFail();
  const identity = sourceIdentity(repoRoot);
  const files = new Map();
  const addFile = (rel) =>
    files.set(rel, fs.readFileSync(path.join(repoRoot, ...rel.split("/"))));
  const walkAdd = (relDir) => {
    for (const e of fs.readdirSync(path.join(repoRoot, ...relDir.split("/")), {
      withFileTypes: true,
    })) {
      const rel = `${relDir}/${e.name}`;
      if (e.isDirectory()) walkAdd(rel);
      else if (e.isFile()) addFile(rel);
    }
  };
  walkAdd("scripts/lib");
  addFile("scripts/cw.mjs");
  addFile("scripts/templates/claude-skill-router.mjs");
  walkAdd("catalog/contract");
  addFile("saas-skills/evals/skill-trigger-matrix.json");
  const distributable = catalog.skills.filter(
    (s) => s.status === "active" || s.status === "deprecated",
  );
  for (const s of catalog.skills.filter((x) => x.status === "active"))
    for (const rel of Object.keys(s.files)) addFile(`${s.path}/${rel}`);
  const registry = {
    ...catalog.registry,
    skills: catalog.registry.skills.filter((s) =>
      distributable.some((d) => d.id === s.id),
    ),
  };
  files.set(
    "catalog/registry.json",
    Buffer.from(`${JSON.stringify(registry, null, 2)}\n`),
  );
  files.set(
    "catalog/catalog.lock.json",
    Buffer.from(
      `${JSON.stringify(lockFromCatalog({ ...catalog, skills: catalog.skills.filter((s) => distributable.includes(s)) }, identity.libraryVersion), null, 2)}\n`,
    ),
  );
  const pkg = readJsonOrNull(path.join(repoRoot, "package.json"));
  files.set(
    "package.json",
    Buffer.from(
      `${JSON.stringify({ name: pkg.name, version: pkg.version, private: true, type: "module", engines: pkg.engines, scripts: { cw: "node scripts/cw.mjs" } }, null, 2)}\n`,
    ),
  );
  const leaks = [];
  for (const rel of files.keys())
    if (isPrivateFile(rel)) leaks.push(`${rel}: private file name`);
  for (const [rel, buf] of files) {
    const text = buf.toString("utf8");
    const kind = credentialFileKind(path.posix.basename(rel), text);
    if (kind) leaks.push(`${rel}: ${kind}`);
    for (const hit of findSecrets(text))
      leaks.push(`${rel}:${hit.line}: ${hit.pattern}`);
  }
  if (leaks.length) {
    const error = new Error(
      `Refusing to build: credential-like content in files selected for the bundle (values not shown):\n- ${leaks.join("\n- ")}`,
    );
    error.exitCode = 1;
    throw error;
  }
  const hashes = {};
  for (const [rel, buf] of files) hashes[rel] = sha256(buf);
  const marker = {
    schema: "context-window/build@1",
    libraryVersion: identity.libraryVersion,
    commit: identity.commit,
    builtAt: new Date().toISOString(),
    files: hashes,
  };
  const staging = `${outDir}.cw-staging-${process.pid}`;
  removeTree(staging);
  for (const [rel, buf] of files) {
    const dest = path.join(staging, ...rel.split("/"));
    ensureDir(path.dirname(dest));
    fs.writeFileSync(dest, buf);
  }
  fs.writeFileSync(
    path.join(staging, BUILD_MARKER),
    `${JSON.stringify(marker, null, 2)}\n`,
  );
  if (kind === "previous-build" || kind === "empty") removeTree(outDir);
  fs.renameSync(staging, outDir);
  out.report = {
    command: "build",
    out: outDir,
    files: files.size,
    activeSkills: catalog.skills.filter((s) => s.status === "active").length,
  };
  say(
    `Built ${files.size} files (${out.report.activeSkills} active skills) into ${outDir}`,
  );
  return 0;
}

function cmdCatalog(argv) {
  const { values } = parseArgs(argv, {
    "write-lock": { type: "boolean" },
    check: { type: "boolean" },
    json: { type: "boolean" },
  });
  out.json = Boolean(values.json);
  const catalog = buildCatalog(repoRoot);
  const identity = sourceIdentity(repoRoot);
  const lock = lockFromCatalog(catalog, identity.libraryVersion);
  const counts = lock.counts;
  say(
    `skills: ${catalog.skills.length} (${Object.entries(counts)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ")})`,
  );
  say(
    `duplicates: identical SKILL.md groups=${catalog.duplicates.identicalSkillMd.length}, duplicate file groups=${catalog.duplicates.duplicateFileGroups}, redundant files=${catalog.duplicates.redundantFiles}`,
  );
  const nonActiveIssues = catalog.skills.filter(
    (s) => s.status !== "active" && s.issues?.length,
  );
  if (nonActiveIssues.length)
    say(
      `non-active items with structural issues: ${nonActiveIssues.length} (not distributed)`,
    );
  out.report = {
    command: "catalog",
    counts,
    errors: catalog.errors,
    duplicates: catalog.duplicates,
    nonActiveIssues: nonActiveIssues.map((s) => ({
      id: s.id,
      status: s.status,
      issues: s.issues,
    })),
  };
  if (catalog.errors.length) {
    for (const e of catalog.errors) say(`ERROR ${e}`);
    return 1;
  }
  const lockFile = path.join(repoRoot, "catalog", "catalog.lock.json");
  const text = `${JSON.stringify(lock, null, 2)}\n`;
  if (values["write-lock"]) {
    writeFileAtomic(lockFile, text);
    say(`wrote ${toPosix(path.relative(repoRoot, lockFile))}`);
  }
  if (values.check) {
    const current = exists(lockFile)
      ? fs.readFileSync(lockFile, "utf8").replace(/\r\n/g, "\n")
      : "";
    if (current !== text) {
      say(
        "ERROR catalog/catalog.lock.json is stale; run: node scripts/cw.mjs catalog --write-lock",
      );
      return 1;
    }
    say("catalog lock is current");
  }
  return 0;
}

function cmdContract(argv) {
  const { values } = parseArgs(argv, {
    format: { type: "string" },
    "with-usage-policy": { type: "boolean" },
  });
  const identity = sourceIdentity(repoRoot);
  const parts = [
    "catalog/contract/architecture-contract.md",
    ...(values["with-usage-policy"]
      ? ["catalog/contract/usage-policy.md"]
      : []),
  ];
  const text = parts
    .map((rel) => readText(rel).replace(/\r\n/g, "\n").trim())
    .join("\n\n");
  const format = values.format ?? "plain";
  if (!["plain", "cursor-user-rules"].includes(format))
    throw new UsageError("--format must be plain or cursor-user-rules");
  const header =
    format === "cursor-user-rules"
      ? `Context Window contract v${identity.libraryVersion} sha256=${sha256(text).slice(0, 12)} — paste into Cursor Settings > Rules (User Rules).\n\n`
      : "";
  process.stdout.write(`${header}${text}\n`);
  return 0;
}

const HELP = `Context Window CLI

  node scripts/cw.mjs catalog [--check] [--write-lock] [--json]
  node scripts/cw.mjs plan      (--target <dir> | --user) --profile <p> [--clients claude,codex,cursor] [options]
  node scripts/cw.mjs install   (--target <dir> | --user) --profile <p> [--clients ...] [options]
  node scripts/cw.mjs status    (--target <dir> | --user) [--json]
  node scripts/cw.mjs verify    (--target <dir> | --user) [--json]
  node scripts/cw.mjs doctor    (--target <dir> | --user) [--clients ...] [--strict] [--json]
  node scripts/cw.mjs uninstall (--target <dir> | --user) [--force-local] [--dry-run]
  node scripts/cw.mjs recover   (--target <dir> | --user)
  node scripts/cw.mjs build     --out <dir>
  node scripts/cw.mjs contract  [--format plain|cursor-user-rules] [--with-usage-policy]

Install options: --with-contract --with-usage-policy --with-claude-hook (and --without-*;
  the contract defaults to the profile setting: on for "dev", off for "creative"),
  --adopt <id,...> | --adopt-all (take over unmanaged same-name folders, with backup),
  --force-local (overwrite local edits, with backup), --migrate-legacy | --keep-legacy (1.x installs),
  --home <dir> --claude-config-dir <dir> --codex-home <dir> (isolated profiles), --dry-run, --json.
Exit codes: 0 ok, 1 failure, 2 conflicts (nothing written), 3 busy/interrupted, 64 usage error.`;

function main(argv) {
  const [command, ...rest] = argv;
  switch (command) {
    case "catalog":
      return cmdCatalog(rest);
    case "plan":
      return cmdInstall(rest, { dryRunCommand: true });
    case "install":
      return cmdInstall(rest);
    case "status":
      return cmdStatus(rest, { strict: false });
    case "verify":
      return cmdStatus(rest, { strict: true });
    case "doctor":
      return cmdDoctor(rest);
    case "uninstall":
      return cmdUninstall(rest);
    case "recover":
      return cmdRecover(rest);
    case "build":
      return cmdBuild(rest);
    case "contract":
      return cmdContract(rest);
    case undefined:
    case "help":
    case "--help":
      process.stdout.write(`${HELP}\n`);
      return command ? 0 : 64;
    default:
      throw new UsageError(`Unknown command "${command}"`);
  }
}

if (isDirectRun(import.meta.url)) {
  let code;
  try {
    code = main(process.argv.slice(2));
  } catch (error) {
    if (error instanceof UsageError) {
      process.stderr.write(`usage error: ${error.message}\n`);
      code = 64;
    } else if (
      error instanceof BusyError ||
      error instanceof InterruptedError
    ) {
      process.stderr.write(`${error.message}\n`);
      code = 3;
    } else {
      process.stderr.write(`${error.message}\n`);
      code = error.exitCode ?? 1;
    }
  }
  if (out.json)
    process.stdout.write(
      `${JSON.stringify({ exitCode: code, ...out.report }, null, 2)}\n`,
    );
  process.exitCode = code;
}
