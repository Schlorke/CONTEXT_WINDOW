// Preventive preflight and contained defaults for pnpm in disposable environments (tests,
// acceptance). This is not an OS security sandbox: once pnpm (or a lifecycle script) is spawned,
// the process can write anywhere the operating system allows.
//
// Execution policy (enforced by runGuardedPnpm / runGuardedScript):
//   - Scripts enabled + write confinement not proven → refuse to spawn unless authorizeUnconfined
//     is supplied with command, scripts, destinations, risks and authorizedBy.
//   - That authorization permits one delimited unconfined run; it does not make the environment
//     confined and does not approve the confinement requirement.
//   - ignoreScripts=true is not a universal code-execution block (pnpmfile is refused separately;
//     Corepack may still fetch the pinned pnpm binary).
//   - changedOutside is mtime telemetry on a fixed watch list only; [] does not mean "no external writes".
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { isInside } from "./fsx.mjs";
import yaml from "./vendor/js-yaml.mjs";

/** Limits of every guarded run — keep in sync with EV-R3-guard-proof.json. */
export const GUARD_LIMITS = Object.freeze({
  writeConfinement: false,
  mechanism: "preventive-preflight+env-redirection+post-mtime-watch",
  not: "OS/security sandbox for subprocess writes",
});

/**
 * No confined executor is wired in this repository. Tests that require write confinement must stay
 * blocked until one is available and authorized — never fall back to the unrestricted host.
 */
export const CONFINED_EXECUTOR = Object.freeze({
  available: false,
  requirement:
    "an authorized executor that confines filesystem writes of pnpm and its child processes to a declared sandbox (for example OS-enforced allowlists), proven by a synthetic write-escape that fails to leave the sandbox",
});

const AUTHORIZE_FIELDS = [
  "command",
  "scripts",
  "destinations",
  "risks",
  "authorizedBy",
];

const asAuthList = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

/**
 * Validates owner authorization for an unconfined scripted run. Returns a blocker string or null.
 * Authorization does not flip GUARD_LIMITS.writeConfinement.
 */
export function validateUnconfinedAuthorization(authorize) {
  if (authorize == null)
    return "scripts enabled without proven write confinement: pass authorizeUnconfined { command, scripts, destinations, risks, authorizedBy } or keep ignoreScripts/true and do not run project scripts";
  if (typeof authorize !== "object" || Array.isArray(authorize))
    return "authorizeUnconfined must be an object";
  for (const field of AUTHORIZE_FIELDS) {
    const value = authorize[field];
    if (Array.isArray(value)) {
      if (!value.length || value.some((v) => String(v).trim().length < 3))
        return `authorizeUnconfined.${field} must list non-empty entries`;
    } else if (typeof value !== "string" || value.trim().length < 3) {
      return `authorizeUnconfined.${field} is required (non-empty string)`;
    }
  }
  return null;
}

/**
 * Confronts a structurally valid authorization with the operation about to run.
 * A non-empty authorizedBy alone is not enough: command, scripts and destinations
 * of the effective operation must be covered. Returns a blocker string or null.
 */
export function authorizationCoversOperation(authorize, operation) {
  if (!operation || typeof operation !== "object")
    return "operation { command, scripts, destinations } is required to match authorization";
  const struct = validateUnconfinedAuthorization(authorize);
  if (struct) return struct;

  const opScripts = asAuthList(operation.scripts).map((s) =>
    String(s).trim().toLowerCase(),
  );
  if (!opScripts.length)
    return "operation.scripts must list the script(s) to run";
  const authScripts = asAuthList(authorize.scripts).map((s) =>
    String(s).trim().toLowerCase(),
  );
  for (const s of opScripts) {
    const covered = authScripts.some(
      (a) =>
        a === s ||
        a.startsWith(`${s} `) ||
        a.includes(`pnpm run ${s}`) ||
        a.split(/\s*→\s*|\s*->\s*|[,;]/)[0].trim() === s,
    );
    if (!covered)
      return `authorizeUnconfined.scripts does not cover script "${s}"`;
  }

  const authCmd = String(authorize.command).trim().toLowerCase();
  const opCmd = String(operation.command ?? "")
    .trim()
    .toLowerCase();
  if (!opCmd) return "operation.command is required";
  const cmdCovers =
    authCmd === opCmd ||
    authCmd.startsWith(opCmd) ||
    opCmd.startsWith(authCmd.split("(")[0].trim()) ||
    opScripts.every((s) => authCmd.includes(s));
  if (!cmdCovers)
    return `authorizeUnconfined.command does not match operation "${operation.command}"`;

  const opDests = asAuthList(operation.destinations).map((d) =>
    path.resolve(String(d)),
  );
  if (!opDests.length)
    return "operation.destinations must list cwd/sandbox paths";
  const authDests = asAuthList(authorize.destinations);
  for (const dest of opDests) {
    const covered = authDests.some((raw) => {
      const text = String(raw).trim();
      if (text.length < 3) return false;
      // Descriptive acknowledgements are not path coverage.
      if (/possible writes|redirected temp|xdg|unconfined/i.test(text))
        return false;
      try {
        return isInside(path.resolve(text), dest);
      } catch {
        return false;
      }
    });
    if (!covered)
      return `authorizeUnconfined.destinations do not cover path "${dest}"`;
  }
  return null;
}

function scriptsWouldRun({ ignoreScripts, kind }) {
  if (kind === "script") return true;
  return ignoreScripts === false;
}

function decideExecution({
  ignoreScripts = true,
  kind = "pnpm",
  authorizeUnconfined = null,
  operation = null,
}) {
  const wantsScripts = scriptsWouldRun({ ignoreScripts, kind });
  if (!wantsScripts) {
    return {
      allow: true,
      mode: "scripts-disabled",
      confinementRequirement: "not applicable",
      authorizeUnconfined: null,
    };
  }
  if (GUARD_LIMITS.writeConfinement && CONFINED_EXECUTOR.available) {
    return {
      allow: true,
      mode: "confined",
      confinementRequirement: "satisfied",
      authorizeUnconfined: null,
    };
  }
  const authError = validateUnconfinedAuthorization(authorizeUnconfined);
  if (authError) {
    return {
      allow: false,
      mode: "blocked",
      confinementRequirement: "not approved",
      blocker: authError,
      authorizeUnconfined: null,
    };
  }
  // When an operation descriptor is supplied, the grant must cover it (no JSON-only bypass).
  if (operation) {
    const cover = authorizationCoversOperation(authorizeUnconfined, operation);
    if (cover) {
      return {
        allow: false,
        mode: "blocked",
        confinementRequirement: "not approved",
        blocker: cover,
        authorizeUnconfined: null,
      };
    }
  }
  return {
    allow: true,
    mode: "authorized-unconfined",
    confinementRequirement: "not approved",
    authorizeUnconfined: {
      command: authorizeUnconfined.command,
      scripts: authorizeUnconfined.scripts,
      destinations: authorizeUnconfined.destinations,
      risks: authorizeUnconfined.risks,
      authorizedBy: authorizeUnconfined.authorizedBy,
    },
  };
}

function telemetry(watchPaths, changed) {
  return {
    changedOutside: changed,
    watchList: watchPaths,
    meaning:
      "mtime changes among the watch list only; an empty array does not mean no external writes occurred",
  };
}

function blockedResult(preflight, decision, extras = {}) {
  return {
    blocked: true,
    spawned: false,
    preflight,
    decision,
    limits: GUARD_LIMITS,
    confinedExecutor: CONFINED_EXECUTOR,
    ...extras,
  };
}

const LIFECYCLE = [
  "pnpm:devPreinstall",
  "preinstall",
  "install",
  "postinstall",
  "preprepare",
  "prepare",
  "postprepare",
];
const PNPMFILES = [".pnpmfile.cjs", ".pnpmfile.mjs"];

const real = (p) => {
  try {
    return fs.realpathSync.native(p);
  } catch {
    return path.resolve(p);
  }
};
const key = (p) =>
  process.platform === "win32"
    ? path.resolve(p).toLowerCase()
    : path.resolve(p);
const inside = (child, parent) => {
  const rel = path.relative(key(parent), key(child));
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
};
const readJson = (p) => {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
};
const readYaml = (p) => {
  try {
    return yaml.load(fs.readFileSync(p, "utf8")) ?? {};
  } catch (error) {
    return { __error: String(error.message).split("\n")[0] };
  }
};
const mtime = (p) => {
  try {
    return fs.statSync(p).mtimeMs;
  } catch {
    return null;
  }
};

function ancestorsOf(dir) {
  const chain = [];
  let current = real(dir);
  for (;;) {
    chain.push(current);
    const parent = path.dirname(current);
    if (parent === current) return chain;
    current = parent;
  }
}

/** Global pnpm configuration files that apply to every run unless XDG_CONFIG_HOME is redirected. */
function globalConfigFiles(env) {
  const dirs = [];
  if (env.XDG_CONFIG_HOME) dirs.push(path.join(env.XDG_CONFIG_HOME, "pnpm"));
  else if (process.platform === "win32" && env.LOCALAPPDATA)
    dirs.push(path.join(env.LOCALAPPDATA, "pnpm", "config"));
  else dirs.push(path.join(os.homedir(), ".config", "pnpm"));
  return dirs
    .flatMap((d) =>
      ["config.yaml", "rc", "auth.ini"].map((f) => path.join(d, f)),
    )
    .filter((f) => fs.existsSync(f));
}

/**
 * @param {{project: string, sandbox: string, home?: string, env?: NodeJS.ProcessEnv, ignoreScripts?: boolean}} options
 * @returns {{ok: boolean, blockers: string[], warnings: string[], facts: object}}
 */
export function preflight({
  project,
  sandbox,
  home = os.homedir(),
  env = process.env,
  ignoreScripts = true,
}) {
  const blockers = [];
  const warnings = [];
  const projectReal = real(project);
  const sandboxReal = real(sandbox);
  const facts = {
    project: projectReal,
    sandbox: sandboxReal,
    cwd: projectReal,
  };

  if (!fs.existsSync(path.join(projectReal, "package.json")))
    blockers.push(`no package.json in ${projectReal}`);
  if (!inside(projectReal, sandboxReal))
    blockers.push(
      `project ${projectReal} is not inside the sandbox ${sandboxReal} (after resolving links)`,
    );
  if (
    home &&
    (inside(sandboxReal, real(home)) || inside(real(home), sandboxReal))
  )
    blockers.push(
      `sandbox ${sandboxReal} and the user profile ${real(home)} overlap; run disposable installs outside the home directory`,
    );

  const chain = ancestorsOf(projectReal);
  facts.ancestors = chain
    .map((dir) => {
      const entry = { dir };
      for (const f of [
        "pnpm-workspace.yaml",
        "pnpm-workspace.yml",
        "package.json",
        ".npmrc",
        ...PNPMFILES,
      ])
        if (fs.existsSync(path.join(dir, f))) (entry.files ??= []).push(f);
      return entry;
    })
    .filter((e) => e.files);

  // Workspace root: pnpm uses the workspace-dir override when set, otherwise the nearest
  // pnpm-workspace.yaml from the real path of the working directory.
  const override =
    env.PNPM_CONFIG_WORKSPACE_DIR ??
    env.pnpm_config_workspace_dir ??
    env.NPM_CONFIG_WORKSPACE_DIR ??
    env.npm_config_workspace_dir;
  const nearestWorkspace = chain.find(
    (dir) =>
      fs.existsSync(path.join(dir, "pnpm-workspace.yaml")) ||
      fs.existsSync(path.join(dir, "pnpm-workspace.yml")),
  );
  const workspaceRoot = override ? real(override) : (nearestWorkspace ?? null);
  facts.workspaceRoot = workspaceRoot;
  facts.workspaceRootSource = override
    ? "workspace-dir override in the environment"
    : nearestWorkspace
      ? "nearest pnpm-workspace.yaml"
      : "none (project is standalone)";
  if (workspaceRoot && key(workspaceRoot) !== key(projectReal))
    blockers.push(
      `pnpm would use the workspace at ${workspaceRoot}, not the project ${projectReal}`,
    );
  if (
    !workspaceRoot &&
    chain.slice(1).some((dir) => fs.existsSync(path.join(dir, "package.json")))
  )
    warnings.push(
      "the project has no pnpm-workspace.yaml and a parent folder has a package.json",
    );

  // pnpm version: Corepack uses the nearest package.json that declares packageManager.
  const pmSource = chain.find(
    (dir) =>
      typeof readJson(path.join(dir, "package.json"))?.packageManager ===
      "string",
  );
  facts.packageManager = pmSource
    ? {
        value: readJson(path.join(pmSource, "package.json")).packageManager,
        declaredIn: pmSource,
      }
    : null;
  if (!pmSource)
    blockers.push(
      "no packageManager pin: the pnpm version would come from machine state (Corepack default)",
    );
  else if (key(pmSource) !== key(projectReal))
    blockers.push(
      `the pnpm version would be inherited from ${pmSource} (${facts.packageManager.value})`,
    );
  else if (!/^pnpm@\d+\.\d+\.\d+/.test(facts.packageManager.value))
    blockers.push(
      `packageManager must pin an exact pnpm version, found ${facts.packageManager.value}`,
    );

  // Settings of the selected workspace and scripts that can run.
  const settings = workspaceRoot
    ? readYaml(path.join(workspaceRoot, "pnpm-workspace.yaml"))
    : {};
  if (settings.__error)
    blockers.push(`pnpm-workspace.yaml is not valid YAML: ${settings.__error}`);
  facts.settings = {
    nodeLinker: settings.nodeLinker ?? null,
    verifyDepsBeforeRun: settings.verifyDepsBeforeRun ?? "install (default)",
    strictDepBuilds: settings.strictDepBuilds ?? "true (default)",
    allowBuilds: settings.allowBuilds ?? {},
    storeDir: settings.storeDir ?? null,
    cacheDir: settings.cacheDir ?? null,
    stateDir: settings.stateDir ?? null,
  };
  if (settings.dangerouslyAllowAllBuilds === true)
    blockers.push("dangerouslyAllowAllBuilds is enabled");
  if (settings.strictDepBuilds === false)
    blockers.push(
      "strictDepBuilds is disabled: unreviewed dependency builds would only warn",
    );
  for (const [name, value] of Object.entries(facts.settings.allowBuilds))
    if (value !== true && value !== false)
      blockers.push(
        `allowBuilds.${name} is not a reviewed decision (${JSON.stringify(value)})`,
      );
  facts.dependencyBuildsThatMayRun = ignoreScripts
    ? []
    : Object.entries(facts.settings.allowBuilds)
        .filter(([, v]) => v === true)
        .map(([n]) => n);
  if (
    !settings.verifyDepsBeforeRun ||
    settings.verifyDepsBeforeRun === "install" ||
    settings.verifyDepsBeforeRun === "prompt"
  )
    warnings.push(
      `verifyDepsBeforeRun is ${facts.settings.verifyDepsBeforeRun}: "pnpm run"/"pnpm exec" may install implicitly`,
    );
  for (const k of [
    "storeDir",
    "cacheDir",
    "stateDir",
    "globalDir",
    "virtualStoreDir",
    "modulesDir",
  ]) {
    const v = settings[k];
    if (
      typeof v === "string" &&
      !inside(path.resolve(workspaceRoot ?? projectReal, v), sandboxReal)
    )
      blockers.push(
        `${k} in pnpm-workspace.yaml points outside the sandbox (${v})`,
      );
  }

  const packages = [projectReal];
  if (workspaceRoot && Array.isArray(settings.packages)) {
    for (const pattern of settings.packages) {
      const base = String(pattern).replace(/\/\*\*?$/, "");
      const dir = path.join(workspaceRoot, base);
      if (String(pattern).endsWith("*") && fs.existsSync(dir))
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
          if (e.isDirectory()) packages.push(path.join(dir, e.name));
        }
      else packages.push(dir);
    }
  }
  facts.lifecycleScripts = [];
  for (const dir of [...new Set(packages.map(key))].map((k) =>
    packages.find((p) => key(p) === k),
  )) {
    const pkg = readJson(path.join(dir, "package.json"));
    for (const name of LIFECYCLE)
      if (pkg?.scripts?.[name])
        facts.lifecycleScripts.push({
          package: path.relative(projectReal, dir) || ".",
          script: name,
          command: pkg.scripts[name],
        });
  }
  if (facts.lifecycleScripts.length && !ignoreScripts)
    warnings.push(
      `${facts.lifecycleScripts.length} project lifecycle script(s) will run`,
    );
  facts.pnpmfiles = PNPMFILES.filter((f) =>
    fs.existsSync(path.join(workspaceRoot ?? projectReal, f)),
  );
  if (facts.pnpmfiles.length)
    blockers.push(
      `pnpmfile present (${facts.pnpmfiles.join(", ")}): it runs code even with --ignore-scripts`,
    );

  // Configuration inherited from the machine.
  facts.globalConfigFiles = globalConfigFiles(env);
  facts.userNpmrc =
    [
      env.PNPM_CONFIG_USERCONFIG,
      env.pnpm_config_userconfig,
      env.NPM_CONFIG_USERCONFIG,
      env.npm_config_userconfig,
      path.join(home ?? os.homedir(), ".npmrc"),
    ].find((p) => p && fs.existsSync(p)) ?? null;
  facts.configEnv = Object.keys(env)
    .filter((k) => /^(npm|pnpm)_config_|^PNPM_|^COREPACK_/i.test(k))
    .sort();
  if (facts.configEnv.length)
    warnings.push(
      `package-manager environment variables are set: ${facts.configEnv.join(", ")}`,
    );

  return { ok: blockers.length === 0, blockers, warnings, facts };
}

/**
 * Environment redirection for a guarded run: default locations pnpm and Expo write to are pointed
 * at folders under the sandbox. Directories are created only when `materialize()` runs, after a
 * successful preflight. This does not deny writes to other paths.
 */
export function guardedEnv({ sandbox, env = process.env }) {
  const dirs = {
    tmp: "tmp",
    xdgConfig: "xdg/config",
    xdgData: "xdg/data",
    xdgCache: "xdg/cache",
    xdgState: "xdg/state",
    store: ".pnpm-store",
    cache: ".pnpm-cache",
    state: ".pnpm-state",
    expoHome: "expo-home",
  };
  const abs = Object.fromEntries(
    Object.entries(dirs).map(([k, rel]) => [
      k,
      path.join(sandbox, ...rel.split("/")),
    ]),
  );
  const userconfig = path.join(sandbox, "user.npmrc");
  const materialize = () => {
    for (const d of Object.values(abs)) fs.mkdirSync(d, { recursive: true });
    if (!fs.existsSync(userconfig)) fs.writeFileSync(userconfig, "");
  };
  const clean = Object.fromEntries(
    Object.entries(env).filter(([k]) => !/^(npm|pnpm)_config_|^PNPM_/i.test(k)),
  );
  return {
    env: {
      ...clean,
      TEMP: abs.tmp,
      TMP: abs.tmp,
      XDG_CONFIG_HOME: abs.xdgConfig,
      XDG_DATA_HOME: abs.xdgData,
      XDG_CACHE_HOME: abs.xdgCache,
      XDG_STATE_HOME: abs.xdgState,
      pnpm_config_store_dir: abs.store,
      pnpm_config_cache_dir: abs.cache,
      pnpm_config_state_dir: abs.state,
      pnpm_config_userconfig: userconfig,
      // Do not override verifyDepsBeforeRun: the project's pnpm-workspace.yaml must keep its own
      // decision (templates set "error"). Overriding it here would silently weaken that policy.
      pnpm_config_update_notifier: "false",
      NEXT_TELEMETRY_DISABLED: "1",
      EXPO_NO_TELEMETRY: "1",
      // Expo CLI keeps user state in ~/.expo unless this is set.
      __UNSAFE_EXPO_HOME_DIRECTORY: abs.expoHome,
    },
    dirs: { ...abs, userconfig },
    materialize,
  };
}

function watchList(facts, extra = []) {
  const files = [];
  for (const a of facts.ancestors ?? []) {
    if (key(a.dir) === key(facts.project)) continue;
    for (const f of a.files) files.push(path.join(a.dir, f));
    files.push(
      path.join(a.dir, "node_modules", ".modules.yaml"),
      path.join(a.dir, "node_modules"),
    );
  }
  if (facts.userNpmrc) files.push(facts.userNpmrc);
  return [...new Set([...files, ...facts.globalConfigFiles, ...extra])];
}

/**
 * Runs a project script (`pnpm run <script>`) after preflight. Scripts always count as enabled, so
 * without proven write confinement this refuses to spawn unless authorizeUnconfined is complete.
 * The product's pnpm-workspace.yaml must set verifyDepsBeforeRun to error or false.
 */
export function runGuardedScript({
  project,
  sandbox,
  script,
  home,
  watch = [],
  env: extraEnv = {},
  timeoutMs = 1800000,
  authorizeUnconfined = null,
  operation = null,
}) {
  const { env, dirs, materialize } = guardedEnv({ sandbox });
  const pf = preflight({ project, sandbox, home, env });
  const verify = String(pf.facts.settings?.verifyDepsBeforeRun ?? "");
  if (pf.ok && !/^(error|false)$/.test(verify))
    pf.blockers.push(
      `verifyDepsBeforeRun is ${verify}: running scripts could install dependencies implicitly`,
    );
  const effectiveOperation = operation ?? {
    command: `pnpm run ${script}`,
    scripts: [script],
    destinations: [project, sandbox],
  };
  const decision = decideExecution({
    kind: "script",
    authorizeUnconfined,
    operation: effectiveOperation,
  });
  if (!decision.allow)
    pf.blockers.push(
      decision.blocker ?? "unconfined scripts blocked by policy",
    );
  if (pf.blockers.length)
    return blockedResult({ ...pf, ok: false }, decision, {
      script,
      operation: effectiveOperation,
    });
  materialize();
  const list = watchList(pf.facts, watch);
  const before = new Map(list.map((f) => [f, mtime(f)]));
  const r = spawnSync("pnpm", ["run", script], {
    cwd: pf.facts.project,
    env: { ...env, ...extraEnv },
    encoding: "utf8",
    shell: process.platform === "win32",
    timeout: timeoutMs,
    maxBuffer: 256 * 1024 * 1024,
  });
  const changed = list.filter((f) => mtime(f) !== before.get(f));
  return {
    blocked: false,
    preflight: pf,
    spawned: true,
    script,
    operation: effectiveOperation,
    status: r.status,
    stdout: r.stdout ?? "",
    stderr: r.stderr ?? "",
    changedOutside: changed,
    telemetry: telemetry(list, changed),
    dirs,
    decision,
    limits: GUARD_LIMITS,
    confinedExecutor: CONFINED_EXECUTOR,
  };
}

/**
 * Runs `pnpm <args>` only when the preflight and the execution policy pass.
 * Default: ignoreScripts=true (lifecycle scripts skipped via --ignore-scripts). That is not a
 * universal code block: a present pnpmfile is still a preflight blocker; --ignore-pnpmfile is
 * passed only because the preflight already refused pnpmfiles, as defense in depth for the install.
 * ignoreScripts=false requires authorizeUnconfined unless write confinement is proven.
 */
export function runGuardedPnpm({
  project,
  sandbox,
  args,
  home,
  ignoreScripts = true,
  watch = [],
  timeoutMs = 900000,
  authorizeUnconfined = null,
}) {
  const { env, dirs, materialize } = guardedEnv({ sandbox });
  const pf = preflight({ project, sandbox, home, env, ignoreScripts });
  const decision = decideExecution({
    ignoreScripts,
    kind: "pnpm",
    authorizeUnconfined,
  });
  if (!decision.allow)
    pf.blockers.push(
      decision.blocker ?? "unconfined scripts blocked by policy",
    );
  if (pf.blockers.length)
    return blockedResult({ ...pf, ok: false }, decision, { args });

  const effectiveMode = {
    ignoreScripts,
    installArgsAdditions: [],
    differencesFromNormalUse: [],
    notes: [],
  };
  if (ignoreScripts) {
    effectiveMode.differencesFromNormalUse.push(
      "lifecycle scripts (preinstall/install/postinstall/prepare/…) are skipped via --ignore-scripts",
    );
    effectiveMode.notes.push(
      "pnpmfile would still run under --ignore-scripts on pnpm 12; this runner refuses a present pnpmfile in preflight and also passes --ignore-pnpmfile",
    );
    effectiveMode.notes.push(
      "Corepack may download the pinned pnpm binary before the install; that is outside this policy's script gate",
    );
  } else {
    effectiveMode.differencesFromNormalUse.push(
      "lifecycle scripts run as in a normal install (authorized unconfined or confined executor)",
    );
  }

  materialize();
  const list = watchList(pf.facts, watch);
  const before = new Map(list.map((f) => [f, mtime(f)]));
  const finalArgs = [...args];
  if (
    ignoreScripts &&
    args[0] === "install" &&
    !finalArgs.includes("--ignore-scripts")
  ) {
    finalArgs.push("--ignore-scripts");
    effectiveMode.installArgsAdditions.push("--ignore-scripts");
  }
  if (args[0] === "install") {
    finalArgs.push(`--store-dir=${dirs.store}`, "--ignore-pnpmfile");
    effectiveMode.installArgsAdditions.push(
      `--store-dir=<sandbox>/.pnpm-store`,
      "--ignore-pnpmfile",
    );
  }
  const r = spawnSync("pnpm", finalArgs, {
    cwd: pf.facts.project,
    env,
    encoding: "utf8",
    shell: process.platform === "win32",
    timeout: timeoutMs,
    maxBuffer: 256 * 1024 * 1024,
  });
  const changed = list.filter((f) => mtime(f) !== before.get(f));
  return {
    blocked: false,
    preflight: pf,
    spawned: true,
    args: finalArgs,
    status: r.status,
    stdout: r.stdout ?? "",
    stderr: r.stderr ?? "",
    changedOutside: changed,
    telemetry: telemetry(list, changed),
    dirs,
    decision,
    effectiveMode,
    limits: GUARD_LIMITS,
    confinedExecutor: CONFINED_EXECUTOR,
  };
}
