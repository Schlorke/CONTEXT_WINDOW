// Review evidence for non-active catalog items: statuses follow the documented rules and a review
// tool can never promote an item by itself.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { reviewImported } from "../scripts/review-imported.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(
  fs.readFileSync(path.join(repo, "catalog", "registry.json"), "utf8"),
);

test("every non-active item is reviewed, none is promoted by the tool and each status has reasons [NR-15]", () => {
  const report = reviewImported();
  assert.equal(
    report.total,
    registry.skills.filter((s) => s.status !== "active").length,
  );
  for (const item of report.items) {
    assert.ok(
      ["não verificado", "bloqueado", "depreciado"].includes(
        item.review.status,
      ),
      item.id,
    );
    assert.ok(item.review.reasons.length > 0, item.id);
  }
});

test("unknown or unattributed third-party licenses block an item [NR-15]", () => {
  for (const item of reviewImported().items) {
    if (/unknown/i.test(item.license.declared ?? ""))
      assert.equal(item.review.status, "bloqueado", item.id);
    if (
      item.license.evidence.startsWith("frontmatter license") &&
      !item.license.files.length
    )
      assert.equal(item.review.status, "bloqueado", item.id);
  }
});

test("the registry makes no unverified authorship claim for imported items [NR-15]", () => {
  for (const s of registry.skills.filter((x) => x.status !== "active"))
    assert.doesNotMatch(s.origin?.license ?? "", /owner-authored/, s.id);
});
