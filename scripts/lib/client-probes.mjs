// Probes of what the real client CLIs discover, without any model call. Shared by the client tests
// and the acceptance command.
// - Codex: `codex debug prompt-input` renders the model-visible input locally.
// - Claude Code: `claude -p` with an empty, isolated CLAUDE_CONFIG_DIR and no credentials emits its
//   init message (discovered skills) and stops at "Not logged in"; the API base URL points to an
//   unreachable local port as a second guard, and callers check that the cost is zero.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function onPath(name) {
  const probe = spawnSync(
    process.platform === "win32" ? "where" : "which",
    [name],
    { encoding: "utf8" },
  );
  const first =
    probe.status === 0 ? probe.stdout.split(/\r?\n/).find(Boolean) : null;
  return first && fs.existsSync(first) ? first : null;
}

/** Codex CLI bundled with the ChatGPT editor extension (documented install location). */
function codexInEditorExtensions(home) {
  const found = [];
  for (const editor of [".cursor", ".vscode"]) {
    const dir = path.join(home, editor, "extensions");
    if (!fs.existsSync(dir)) continue;
    for (const ext of fs
      .readdirSync(dir)
      .filter((n) => n.startsWith("openai.chatgpt-"))
      .sort()
      .reverse()) {
      const bin = path.join(dir, ext, "bin");
      if (!fs.existsSync(bin)) continue;
      for (const platform of fs.readdirSync(bin)) {
        const exe = path.join(
          bin,
          platform,
          process.platform === "win32" ? "codex.exe" : "codex",
        );
        if (fs.existsSync(exe)) found.push(exe);
      }
    }
  }
  return found[0] ?? null;
}

/** @returns {{path: string, source: string} | null} */
export function findCodex(env = process.env, home = os.homedir()) {
  if (env.CW_CODEX_BIN && fs.existsSync(env.CW_CODEX_BIN))
    return { path: env.CW_CODEX_BIN, source: "CW_CODEX_BIN" };
  const p = onPath("codex");
  if (p) return { path: p, source: "PATH" };
  const ext = codexInEditorExtensions(home);
  return ext ? { path: ext, source: "ChatGPT editor extension" } : null;
}

export function findClaude(env = process.env) {
  if (env.CW_CLAUDE_BIN && fs.existsSync(env.CW_CLAUDE_BIN))
    return { path: env.CW_CLAUDE_BIN, source: "CW_CLAUDE_BIN" };
  const p = onPath("claude");
  return p ? { path: p, source: "PATH" } : null;
}

export function versionOf(bin) {
  const r = spawnSync(bin, ["--version"], { encoding: "utf8", timeout: 60000 });
  return (r.stdout || r.stderr || "").trim().split(/\r?\n/)[0] ?? null;
}

/** Skills Codex lists for `cwd`, with the root each came from. `root` holds codex-home and home. */
export function codexPromptInput(codex, root, cwd, prompt = "hello") {
  const env = {
    ...process.env,
    CODEX_HOME: path.join(root, "codex-home"),
    HOME: path.join(root, "home"),
    USERPROFILE: path.join(root, "home"),
  };
  for (const key of ["OPENAI_API_KEY", "CODEX_API_KEY"]) delete env[key];
  fs.mkdirSync(env.CODEX_HOME, { recursive: true });
  fs.mkdirSync(env.HOME, { recursive: true });
  const r = spawnSync(codex, ["debug", "prompt-input", prompt], {
    cwd,
    env,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout: 120000,
  });
  if (r.status !== 0)
    throw new Error(
      `codex debug prompt-input failed: ${r.stderr.trim().slice(0, 300)}`,
    );
  const text = JSON.parse(r.stdout)
    .flatMap((item) => (item.content ?? []).map((c) => c.text ?? ""))
    .join("\n");
  const roots = new Map(
    [...text.matchAll(/- `(r\d+)` = `([^`]+)`/g)].map((m) => [
      m[1],
      path.resolve(m[2]),
    ]),
  );
  const skills = [
    ...text.matchAll(/^- ([a-z0-9-]+): .*?\(file: (r\d+)\//gm),
  ].map((m) => ({ name: m[1], root: roots.get(m[2]) }));
  return { text, roots, skills };
}

/** What Claude Code discovers in `cwd` with an isolated, credential-free configuration in `root`. */
export function claudeProbe(claude, root, cwd, prompt) {
  const log = path.join(root, `claude-${process.hrtime.bigint()}.log`);
  const env = {
    ...process.env,
    CLAUDE_CONFIG_DIR: path.join(root, "claude-config"),
    HOME: path.join(root, "home"),
    USERPROFILE: path.join(root, "home"),
    DISABLE_TELEMETRY: "1",
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1",
    DISABLE_AUTOUPDATER: "1",
  };
  for (const key of Object.keys(env))
    if (
      /^(ANTHROPIC_|CLAUDE_CODE_OAUTH|CLAUDE_CODE_USE_|AWS_|GOOGLE_|VERTEX)/.test(
        key,
      )
    )
      delete env[key];
  env.ANTHROPIC_BASE_URL = "http://127.0.0.1:9";
  fs.mkdirSync(env.CLAUDE_CONFIG_DIR, { recursive: true });
  fs.mkdirSync(env.HOME, { recursive: true });
  const r = spawnSync(
    claude,
    [
      "-p",
      prompt,
      "--output-format",
      "stream-json",
      "--verbose",
      "--no-session-persistence",
      "--max-budget-usd",
      "0.01",
      "--debug-file",
      log,
    ],
    {
      cwd,
      env,
      encoding: "utf8",
      timeout: 120000,
      maxBuffer: 32 * 1024 * 1024,
    },
  );
  const messages = (r.stdout ?? "")
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return {};
      }
    });
  const init = messages.find(
    (m) => m.type === "system" && m.subtype === "init",
  );
  const result = messages.find((m) => m.type === "result");
  const debug = fs.existsSync(log) ? fs.readFileSync(log, "utf8") : "";
  return {
    version: init?.claude_code_version ?? null,
    skills: init?.skills ?? [],
    sent: Number(
      debug.match(/Sending (\d+) skills via attachment/)?.[1] ?? Number.NaN,
    ),
    loaded: debug.match(/Loaded \d+ unique skills[^\n]*/)?.[0] ?? "",
    projectDirs: debug.match(/Loading skills from: [^\n]*/)?.[0] ?? "",
    hookContext: /Hook UserPromptSubmit .* provided additionalContext/.test(
      debug,
    ),
    costUsd: result?.total_cost_usd ?? null,
    apiMs: result?.duration_api_ms ?? null,
    result: result?.result ?? null,
    stderr: (r.stderr ?? "").slice(0, 300),
  };
}
