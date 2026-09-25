// Client contracts: where each client discovers skills, and where this library installs.
//
// Sources (fetched 2026-09-24; see acceptance/evidence/EV-017-contratos-externos.md):
// - Claude Code: ~/.claude/skills (or $CLAUDE_CONFIG_DIR/skills) and .claude/skills in the start
//   directory and parents up to the repository root.
// - Codex: .agents/skills (cwd up to repo root), ~/.agents/skills; the legacy $CODEX_HOME/skills is
//   still read by codex-cli 0.147.0-alpha.1.2 (observed with `codex debug prompt-input`).
// - Cursor: .agents/skills, .cursor/skills, ~/.agents/skills, ~/.cursor/skills natively and
//   .claude/skills, .codex/skills, ~/.claude/skills, ~/.codex/skills for compatibility.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const CLIENTS = ["claude", "codex", "cursor"];

/** Physical install locations ("sinks") written by this library. */
export const SINKS = {
  claude: { id: "claude-skills", clients: ["claude"] },
  agents: { id: "agents-skills", clients: ["codex", "cursor"] },
};

export function resolveHomes(opts = {}) {
  const home = path.resolve(opts.home ?? os.homedir());
  const claudeConfigDir = path.resolve(
    opts.claudeConfigDir ??
      (opts.home
        ? path.join(home, ".claude")
        : process.env.CLAUDE_CONFIG_DIR || path.join(home, ".claude")),
  );
  const codexHome = path.resolve(
    opts.codexHome ??
      (opts.home
        ? path.join(home, ".codex")
        : process.env.CODEX_HOME || path.join(home, ".codex")),
  );
  return { home, claudeConfigDir, codexHome };
}

/**
 * Physical sinks for one install context.
 * Cursor reads project `.claude/skills` and, at user scope, `~/.claude/skills`
 * when that directory is the Claude config dir. In those cases one copy serves
 * both clients. Codex always needs `.agents/skills`. Cursor alone, or Cursor
 * with a Claude config dir outside `~/.claude`, gets `.agents/skills`.
 */
export function sinksFor(ctx) {
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

export function sinkDir(sink, scope, { target, homes }) {
  if (scope === "project") {
    return sink === "claude"
      ? path.join(target, ".claude", "skills")
      : path.join(target, ".agents", "skills");
  }
  return sink === "claude"
    ? path.join(homes.claudeConfigDir, "skills")
    : path.join(homes.home, ".agents", "skills");
}

/** Every directory a client reads skills from, for diagnostics (doctor). */
export function discoveryDirs(client, options) {
  const seen = new Set();
  return listDiscoveryDirs(client, options).filter(({ dir }) => {
    const key =
      process.platform === "win32"
        ? path.resolve(dir).toLowerCase()
        : path.resolve(dir);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** The target and its parents up to the enclosing git root — where clients look for project skills. */
function projectAncestors(target) {
  const chain = [];
  let current = path.resolve(target);
  for (;;) {
    chain.push(current);
    try {
      if (fs.existsSync(path.join(current, ".git"))) return chain;
    } catch {
      return [path.resolve(target)];
    }
    const parent = path.dirname(current);
    if (parent === current) return [path.resolve(target)];
    current = parent;
  }
}

function listDiscoveryDirs(client, { target, homes }) {
  const ancestors = target ? projectAncestors(target) : [];
  const project = (sub) =>
    ancestors.map((dir) => ({ scope: "project", dir: path.join(dir, ...sub) }));
  switch (client) {
    case "claude":
      return [
        { scope: "user", dir: path.join(homes.claudeConfigDir, "skills") },
        ...project([".claude", "skills"]),
      ];
    case "codex":
      return [
        { scope: "user", dir: path.join(homes.home, ".agents", "skills") },
        { scope: "user-legacy", dir: path.join(homes.codexHome, "skills") },
        ...project([".agents", "skills"]),
      ];
    case "cursor":
      return [
        { scope: "user", dir: path.join(homes.home, ".agents", "skills") },
        { scope: "user", dir: path.join(homes.home, ".cursor", "skills") },
        {
          scope: "user-compat",
          dir: path.join(homes.home, ".claude", "skills"),
        },
        {
          scope: "user-compat",
          dir: path.join(homes.home, ".codex", "skills"),
        },
        ...(target
          ? [
              { scope: "project", dir: path.join(target, ".agents", "skills") },
              { scope: "project", dir: path.join(target, ".cursor", "skills") },
              {
                scope: "project-compat",
                dir: path.join(target, ".claude", "skills"),
              },
              {
                scope: "project-compat",
                dir: path.join(target, ".codex", "skills"),
              },
            ]
          : []),
      ];
    default:
      throw new Error(`Unknown client ${client}`);
  }
}

/** Locations written by library versions 1.x (manifest `.saas-skills-manifest.json`). */
export function legacyLocations({ target, homes }) {
  const list = [
    { kind: "codex-legacy", dir: path.join(homes.codexHome, "skills") },
    { kind: "claude-user", dir: path.join(homes.claudeConfigDir, "skills") },
    {
      kind: "cursor-user-rules",
      dir: path.join(homes.home, ".cursor", "rules"),
    },
  ];
  if (target) {
    list.push(
      { kind: "claude-project", dir: path.join(target, ".claude", "skills") },
      {
        kind: "cursor-project-rules",
        dir: path.join(target, ".cursor", "rules"),
      },
    );
  }
  return list;
}
