import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { sinksFor } from "../scripts/lib/targets.mjs";

function ctx(clients, { scope = "project", claudeConfigDir } = {}) {
  const home = path.join("C:\\sandbox", "home");
  return {
    scope,
    clients,
    target: path.join("C:\\sandbox", "proj"),
    homes: {
      home,
      claudeConfigDir: claudeConfigDir ?? path.join(home, ".claude"),
      codexHome: path.join(home, ".codex"),
    },
  };
}

function names(result) {
  return result.map((s) => s.sink);
}

test("project Cursor shares the Claude sink", () => {
  assert.deepEqual(names(sinksFor(ctx(["claude", "cursor"]))), ["claude"]);
});

test("Codex always gets the agents sink beside Claude", () => {
  assert.deepEqual(names(sinksFor(ctx(["claude", "codex", "cursor"]))), [
    "claude",
    "agents",
  ]);
});

test("Cursor alone gets the agents sink", () => {
  assert.deepEqual(names(sinksFor(ctx(["cursor"]))), ["agents"]);
});

test("user Cursor shares ~/.claude/skills when that is the Claude config", () => {
  assert.deepEqual(
    names(sinksFor(ctx(["claude", "cursor"], { scope: "user" }))),
    ["claude"],
  );
});

test("a custom Claude config dir does not hide Cursor skills from ~/.agents", () => {
  const custom = path.join("C:\\sandbox", "claude-alt");
  assert.deepEqual(
    names(
      sinksFor(
        ctx(["claude", "cursor"], {
          scope: "user",
          claudeConfigDir: custom,
        }),
      ),
    ),
    ["claude", "agents"],
  );
});
