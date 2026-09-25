// Acceptance authorization separation (Pedido 10): D1–D6 grants must not enable D7;
// per-step matching; unauthorized steps refuse before spawn. Synthetic only.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  deniesInstallLifecycle,
  loadAuthorizationDocument,
  resolveStepAuthorization,
} from "../scripts/lib/authorize-grants.mjs";
import {
  authorizationCoversOperation,
  GUARD_LIMITS,
  runGuardedPnpm,
  runGuardedScript,
  validateUnconfinedAuthorization,
} from "../scripts/lib/pnpm-guard.mjs";
import { cleanup, snapshot, write } from "./helpers.mjs";

const roots = [];
after(() => roots.forEach(cleanup));
const tmp = () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "cw-auth-"));
  roots.push(d);
  return d;
};
const json = (o) => `${JSON.stringify(o, null, 2)}\n`;

function writeAuth(dir, doc) {
  const f = path.join(dir, "auth.json");
  fs.writeFileSync(f, json(doc));
  return f;
}

const owner = "proprietário — Pedido 10 (mensagem de autorização delimitada)";
const risks = [
  "execução sem confinamento de escrita",
  "código de dependências pode rodar sob pnpm run",
  "permissões do processo no SO",
];

describe("acceptance auth separation [Pedido 10]", () => {
  test("D1–D6 grants document denies D7 and does not flip install ignoreScripts", () => {
    const dir = tmp();
    const root = path.join(dir, "acceptance");
    fs.mkdirSync(root, { recursive: true });
    const file = writeAuth(dir, {
      source: "Pedido 10 — teste sintético",
      authorizedBy: owner,
      confinementRequirement: "not approved",
      denied: ["D7"],
      grants: [
        {
          id: "D1",
          steps: ["A9a"],
          command: "pnpm run tokens",
          scripts: ["tokens"],
          destinations: [root],
          risks,
        },
      ],
    });
    const doc = loadAuthorizationDocument(file);
    assert.equal(deniesInstallLifecycle(doc), true);
    assert.equal(GUARD_LIMITS.writeConfinement, false);

    const sandbox = path.join(root, "run-x", "product");
    const project = path.join(sandbox, "produto");
    fs.mkdirSync(project, { recursive: true });
    write(
      path.join(project, "package.json"),
      json({ name: "p", private: true, packageManager: "pnpm@12.5.1" }),
    );
    write(
      path.join(project, "pnpm-workspace.yaml"),
      'packages:\n  - "."\nverifyDepsBeforeRun: error\nstrictDepBuilds: true\nallowBuilds: {}\n',
    );

    // Install must stay scripts-disabled even with grants present.
    const install = runGuardedPnpm({
      project,
      sandbox,
      home: path.join(dir, "home"),
      args: ["install", "--help"],
      ignoreScripts: true,
    });
    assert.equal(
      install.blocked,
      false,
      install.preflight?.blockers?.join("\n"),
    );
    assert.equal(install.decision.mode, "scripts-disabled");
    assert.ok(install.effectiveMode.ignoreScripts);

    // Explicit D7-style request is refused by resolveStepAuthorization.
    const d7 = resolveStepAuthorization(doc, "A6", {
      kind: "install-lifecycle",
      command: "pnpm install",
      scripts: ["postinstall"],
      destinations: [project, sandbox],
    });
    assert.match(d7.error, /D7|lifecycle|ignoreScripts/i);
  });

  test("a grant for A9a does not authorize A7; mismatch refuses before spawn", () => {
    const dir = tmp();
    const root = path.join(dir, "acceptance");
    const sandbox = path.join(root, "run-x", "product");
    const project = path.join(sandbox, "produto");
    fs.mkdirSync(project, { recursive: true });
    write(
      path.join(project, "package.json"),
      json({
        name: "p",
        private: true,
        packageManager: "pnpm@12.5.1",
        scripts: { tokens: "node -e 1", verify: "node -e 1" },
      }),
    );
    write(
      path.join(project, "pnpm-workspace.yaml"),
      'packages:\n  - "."\nverifyDepsBeforeRun: error\nstrictDepBuilds: true\nallowBuilds: {}\n',
    );
    const file = writeAuth(dir, {
      source: "Pedido 10 — teste sintético",
      authorizedBy: owner,
      denied: ["D7"],
      confinementRequirement: "not approved",
      grants: [
        {
          id: "D1",
          steps: ["A9a"],
          command: "pnpm run tokens",
          scripts: ["tokens"],
          destinations: [root],
          risks,
        },
      ],
    });
    const doc = loadAuthorizationDocument(file);
    const a9a = resolveStepAuthorization(doc, "A9a", {
      command: "pnpm run tokens",
      scripts: ["tokens"],
      destinations: [project, sandbox],
    });
    assert.equal(a9a.error, undefined, a9a.error);
    assert.equal(a9a.grantId, "D1");

    const a7 = resolveStepAuthorization(doc, "A7", {
      command: "pnpm run verify",
      scripts: ["verify"],
      destinations: [project, sandbox],
    });
    assert.match(a7.error, /no grant lists step A7/i);

    const before = snapshot(sandbox);
    const blocked = runGuardedScript({
      project,
      sandbox,
      home: path.join(dir, "home"),
      script: "verify",
      authorizeUnconfined: a9a.authorize,
      operation: {
        command: "pnpm run verify",
        scripts: ["verify"],
        destinations: [project, sandbox],
      },
    });
    assert.equal(blocked.spawned, false);
    assert.equal(blocked.blocked, true);
    assert.match(
      blocked.preflight.blockers.join("\n"),
      /does not cover script "verify"|does not match operation/i,
    );
    assert.deepEqual(snapshot(sandbox), before);
  });

  test("authorizedBy alone is not enough without matching command/scripts/destinations", () => {
    const authorize = {
      command: "pnpm run tokens",
      scripts: ["tokens"],
      destinations: ["C:\\Temp\\cw-r3\\acceptance"],
      risks,
      authorizedBy: owner,
    };
    assert.equal(validateUnconfinedAuthorization(authorize), null);
    const miss = authorizationCoversOperation(authorize, {
      command: "pnpm run verify",
      scripts: ["verify"],
      destinations: [
        "C:\\Temp\\cw-r3\\acceptance\\run-1\\product\\produto",
        "C:\\Temp\\cw-r3\\acceptance\\run-1\\product",
      ],
    });
    assert.match(miss, /does not cover script "verify"/i);

    const outside = authorizationCoversOperation(authorize, {
      command: "pnpm run tokens",
      scripts: ["tokens"],
      destinations: ["C:\\Users\\someone\\real-project"],
    });
    assert.match(outside, /do not cover path/i);
  });

  test("matching grant covers command, script and destination under the authorized root", () => {
    const authorize = {
      command: "pnpm run arch",
      scripts: ["arch"],
      destinations: ["C:\\Temp\\cw-r3\\acceptance"],
      risks,
      authorizedBy: owner,
    };
    assert.equal(
      authorizationCoversOperation(authorize, {
        command: "pnpm run arch",
        scripts: ["arch"],
        destinations: [
          "C:\\Temp\\cw-r3\\acceptance\\run-abc\\product\\produto",
          "C:\\Temp\\cw-r3\\acceptance\\run-abc\\product",
        ],
      }),
      null,
    );
  });
});

// Keep this module importable when helpers path differs on Windows temp.
void fileURLToPath;
