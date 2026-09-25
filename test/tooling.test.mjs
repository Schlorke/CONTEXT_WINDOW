// Repository tooling: the Markdown fixer never edits fenced content or headings; the secret scan
// fails on publishable credentials, reports ignored copies as owner actions and never prints values.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { after, test } from "node:test";
import { REPO, cleanup, tmpRoot, write } from "./helpers.mjs";
import { fixFenceLanguages } from "../scripts/fix-markdownlint.mjs";

const roots = [];
after(() => roots.forEach(cleanup));

test("bare opening fences get a language; closing fences stay bare", () => {
  assert.equal(
    fixFenceLanguages("a\n```\nx\n```\nb\n"),
    "a\n```text\nx\n```\nb\n",
  );
});

test("comments inside fences and headings outside are untouched", () => {
  const src =
    "# Title\n\n#### Deep heading\n\n```bash\n# Common issues\npnpm tsc\n```\n\n## Title\n";
  assert.equal(fixFenceLanguages(src), src);
});

test("a fence of another character or shorter length does not close the block", () => {
  const src = "````md\n```\ninner\n```\n~~~\n````\n\n~~~\n```\n~~~\n";
  assert.equal(
    fixFenceLanguages(src),
    "````md\n```\ninner\n```\n~~~\n````\n\n~~~text\n```\n~~~\n",
  );
});

test("CRLF files keep CRLF and list-indented fences are handled", () => {
  assert.equal(
    fixFenceLanguages("1. step\r\n   ```\r\n   run\r\n   ```\r\n"),
    "1. step\r\n   ```text\r\n   run\r\n   ```\r\n",
  );
});

function gitRepo(label) {
  const root = tmpRoot(label);
  roots.push(root);
  const git = (...args) =>
    spawnSync("git", args, { cwd: root, encoding: "utf8" });
  assert.equal(git("init", "-q").status, 0);
  write(path.join(root, ".gitignore"), "dist/\n");
  write(path.join(root, "docs", "ok.md"), "# nothing secret\n");
  return root;
}
const scanCli = (root) =>
  spawnSync(
    process.execPath,
    [path.join(REPO, "scripts", "secret-scan.mjs"), "--root", root],
    { encoding: "utf8" },
  );
const fakeToken = ["tok", "A".repeat(30)].join("");
const fakeKey = ["sk", "proj", "B".repeat(30)].join("-");

test("a git-ignored credential copy fails the scan without printing it [ACH-005]", () => {
  const root = gitRepo("secrets-ignored");
  write(
    path.join(root, "dist", "codex-home", "auth.json"),
    `{\n  "tokens": {\n    "access_token": "${fakeToken}"\n  }\n}\n`,
  );
  const r = scanCli(root);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(
    r.stdout,
    /ERROR local copy\s+dist\/codex-home\/auth\.json:3\s+oauth-token-field/,
  );
  assert.ok(!r.stdout.includes(fakeToken), "the value is never printed");
});

test("a synthetic Codex auth cache is recognized by structure even with short token values", () => {
  const root = gitRepo("secrets-structure");
  const shortValue = ["s", "y", "n"].join("");
  write(
    path.join(root, "dist", "home", ".codex", "auth.json"),
    JSON.stringify({
      auth_mode: "chatgpt",
      OPENAI_API_KEY: null,
      tokens: { refresh_token: shortValue, access_token: shortValue },
    }),
  );
  write(
    path.join(root, "dist", "claude", ".credentials.json"),
    JSON.stringify({
      claudeAiOauth: { accessToken: shortValue, refreshToken: shortValue },
    }),
  );
  const r = scanCli(root);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(
    r.stdout,
    /dist\/home\/\.codex\/auth\.json:1\s+codex-auth-cache/,
  );
  assert.match(
    r.stdout,
    /dist\/claude\/\.credentials\.json:1\s+claude-credentials-cache/,
  );
  assert.ok(!r.stdout.includes(`"${shortValue}"`));
});

test("a snapshot directory that is not a git work tree is scanned as publishable", () => {
  const root = tmpRoot("secrets-snapshot");
  roots.push(root);
  write(path.join(root, "copy", "notes.md"), `token ${fakeKey}\n`);
  const r = scanCli(path.join(root, "copy"));
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(
    r.stdout,
    /ERROR publishable\s+notes\.md:1\s+openai-or-anthropic-key/,
  );
  assert.ok(!r.stdout.includes(fakeKey));
});

test("a publishable credential fails the scan without printing it", () => {
  const root = gitRepo("secrets-publishable");
  write(path.join(root, "config", "leak.json"), `{ "key": "${fakeKey}" }\n`);
  const r = scanCli(root);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(
    r.stdout,
    /ERROR publishable\s+config\/leak\.json:1\s+openai-or-anthropic-key/,
  );
  assert.ok(!r.stdout.includes(fakeKey));
  assert.ok(
    fs.existsSync(path.join(root, "config", "leak.json")),
    "the scan never deletes files",
  );
});
