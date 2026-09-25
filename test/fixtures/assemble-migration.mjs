// Assembles the migrated legacy-shop: template skeleton + migration overlay - retired template slices.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scaffold } from "../../saas-skills/engineering/multiplatform-platform-architecture/scripts/scaffold.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const overlayRoot = path.join(here, "legacy-shop-migration");

function copyTree(src, dest) {
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      copyTree(s, d);
    } else fs.copyFileSync(s, d);
  }
}

export function assembleMigrated(dest) {
  scaffold({ out: dest, scope: "@acme", name: "Loja" });
  const migration = JSON.parse(fs.readFileSync(path.join(overlayRoot, "migration.json"), "utf8"));
  for (const rel of migration.removeFromTemplate) fs.rmSync(path.join(dest, ...rel.split("/")), { recursive: true, force: true });
  copyTree(overlayRoot, dest);
  const vitest = path.join(dest, "vitest.config.ts");
  fs.writeFileSync(vitest, fs.readFileSync(vitest, "utf8").replace('include: ["packages/**/*.test.{ts,tsx}"]', `include: ${JSON.stringify(migration.vitestInclude)}`));
  return dest;
}
