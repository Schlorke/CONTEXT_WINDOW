// Legacy adoption: inventory of the legacy fixture, assembled migration passes the gate, the
// characterization cases are the same file for both sides, and legacy structures are retired.
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { after, test } from "node:test";
import { REPO, cleanup, tmpRoot } from "./helpers.mjs";
import { assembleMigrated } from "./fixtures/assemble-migration.mjs";
import { check } from "../saas-skills/engineering/multiplatform-platform-architecture/scripts/arch-check.mjs";
import { checkTokens } from "../saas-skills/engineering/multiplatform-platform-architecture/scripts/token-check.mjs";
import { inventory } from "../saas-skills/engineering/legacy-code-refactoring/scripts/legacy-inventory.mjs";

const LEGACY = path.join(REPO, "test", "fixtures", "legacy-shop");
const roots = [];
after(() => roots.forEach(cleanup));
const hash = (f) =>
  crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");

test("inventory reports every gap of the legacy project", () => {
  const r = inventory(LEGACY);
  assert.deepEqual(r.missingTopology, [
    "apps/clients/web",
    "apps/clients/mobile",
    "packages/frontend",
    "packages/ui",
    "packages/design-tokens",
  ]);
  assert.deepEqual(r.typeFolders, ["components", "hooks", "utils"]);
  assert.deepEqual(r.routes, ["pages/index.tsx"]);
  assert.deepEqual(r.colorLiterals, ["components/Button.tsx"]);
  assert.match(
    r.mapping.find((m) => m.file === "components/Button.tsx").proposal,
    /packages\/ui/,
  );
});

test("the migrated project reaches the contract with the same characterization cases", () => {
  const root = tmpRoot("migration");
  roots.push(root);
  const dest = assembleMigrated(path.join(root, "loja"));
  assert.deepEqual(check(dest).violations, []);
  assert.deepEqual(
    checkTokens(dest).violations,
    [],
    "migrated code reads design values from the token package",
  );
  const r = inventory(dest);
  assert.deepEqual(r.missingTopology, []);
  assert.deepEqual(r.typeFolders, [], "legacy type-based folders are retired");
  assert.deepEqual(
    r.colorLiterals.filter((f) => !f.startsWith("packages/design-tokens")),
    [],
    "no color literal outside the tokens package",
  );
  assert.equal(
    hash(path.join(dest, "characterization", "cases.json")),
    hash(path.join(LEGACY, "characterization", "cases.json")),
  );
  for (const legacyDir of ["components", "hooks", "utils", "pages"])
    assert.ok(!fs.existsSync(path.join(dest, legacyDir)));
});
