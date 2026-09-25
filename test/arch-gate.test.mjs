// Architecture gate: the template passes, and every rule catches a deliberately injected violation.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, describe, test } from "node:test";
import { REPO, cleanup, copyDir, tmpRoot, write } from "./helpers.mjs";
import {
  check,
  extractImports,
} from "../saas-skills/engineering/multiplatform-platform-architecture/scripts/arch-check.mjs";
import { scaffold } from "../saas-skills/engineering/multiplatform-platform-architecture/scripts/scaffold.mjs";

const SKILL = path.join(
  REPO,
  "saas-skills",
  "engineering",
  "multiplatform-platform-architecture",
);
const TEMPLATE = path.join(SKILL, "assets", "template");
const roots = [];
after(() => roots.forEach(cleanup));

function projectCopy() {
  const root = tmpRoot("arch");
  roots.push(root);
  const dir = path.join(root, "p");
  copyDir(TEMPLATE, dir);
  return dir;
}
const fe = (p, ...rest) => path.join(p, "packages", "frontend", "src", ...rest);
const rules = (p) => check(p).violations.map((v) => v.rule);

describe("architecture gate", () => {
  test("the consumer template passes", () => {
    const result = check(TEMPLATE);
    assert.deepEqual(result.violations, []);
    assert.deepEqual(result.packages.sort(), [
      "@acme/design-tokens",
      "@acme/frontend",
      "@acme/mobile",
      "@acme/ui",
      "@acme/web",
    ]);
  });

  const cases = [
    [
      "FSD-LAYER",
      (p) =>
        write(
          fe(p, "entities", "product", "lib", "bad.ts"),
          'import { ToggleFavoriteButton } from "../../../features/toggle-favorite";\nexport const x = ToggleFavoriteButton;\n',
        ),
    ],
    [
      "FSD-SLICE",
      (p) => {
        write(
          fe(p, "features", "share-product", "index.ts"),
          'export { share } from "./model/share";\n',
        );
        write(
          fe(p, "features", "share-product", "model", "share.ts"),
          'import { ToggleFavoriteButton } from "../../toggle-favorite";\nexport const share = ToggleFavoriteButton;\n',
        );
      },
    ],
    [
      "FSD-PUBLIC-API",
      (p) =>
        write(
          fe(p, "widgets", "product-highlight", "lib", "deep.ts"),
          'import { formatPrice } from "../../../entities/product/model/product";\nexport const f = formatPrice;\n',
        ),
    ],
    [
      "FSD-XAPI",
      (p) => {
        write(
          fe(p, "entities", "product", "@x", "order.ts"),
          'export type { Product } from "../model/product";\n',
        );
        write(
          fe(p, "entities", "user", "index.ts"),
          'export type { User } from "./model/user";\n',
        );
        write(
          fe(p, "entities", "user", "model", "user.ts"),
          'import type { Product } from "../../product/@x/order";\nexport interface User { favorite?: Product }\n',
        );
      },
    ],
    [
      "FSD-WILDCARD-API",
      (p) =>
        fs.writeFileSync(
          fe(p, "features", "toggle-favorite", "index.ts"),
          'export * from "./ui/ToggleFavoriteButton";\n',
        ),
    ],
    [
      "FSD-GLOBAL-BARREL",
      (p) => write(fe(p, "index.ts"), 'export * from "./pages/home";\n'),
    ],
    [
      "FSD-UNKNOWN-LAYER",
      (p) =>
        write(
          fe(p, "components", "Card.tsx"),
          "export const Card = () => null;\n",
        ),
    ],
    [
      "FSD-SELF-PACKAGE",
      (p) =>
        write(
          fe(p, "widgets", "product-highlight", "lib", "self.ts"),
          'import { HomePage } from "@acme/frontend/pages/home";\nexport const h = HomePage;\n',
        ),
    ],
    [
      "UI-DUPLICATE-SOURCE",
      (p) =>
        write(
          fe(p, "shared", "ui", "button", "index.tsx"),
          "export function Button() { return null; }\n",
        ),
    ],
    [
      "FOUNDATION-UPWARD",
      (p) =>
        write(
          path.join(p, "packages", "ui", "src", "bad.ts"),
          'import { AppProviders } from "@acme/frontend/app";\nexport const a = AppProviders;\n',
        ),
    ],
    [
      "FOUNDATION-UPWARD",
      (p) =>
        write(
          path.join(p, "packages", "design-tokens", "src", "bad.ts"),
          'import { Button } from "@acme/ui";\nexport const b = Button;\n',
        ),
    ],
    [
      "CLIENT-DEEP-IMPORT",
      (p) =>
        write(
          path.join(p, "apps", "clients", "web", "src", "app", "x", "page.tsx"),
          'import { ToggleFavoriteButton } from "@acme/frontend/features/toggle-favorite";\nexport default function P() { return <ToggleFavoriteButton />; }\n',
        ),
    ],
    [
      "PACKAGE-BOUNDARY",
      (p) =>
        write(
          path.join(p, "apps", "clients", "mobile", "app", "deep.tsx"),
          'import { HomePage } from "../../../../packages/frontend/src/pages/home";\nexport default HomePage;\n',
        ),
    ],
    [
      "CLIENT-CROSS",
      (p) =>
        write(
          path.join(p, "apps", "clients", "mobile", "app", "cross.tsx"),
          'import Page from "../../web/src/app/page";\nexport default Page;\n',
        ),
    ],
    [
      "RUNTIME-WEB-ONLY",
      (p) =>
        write(
          fe(p, "pages", "home", "ui", "Link.tsx"),
          'import NextLink from "next/link";\nexport const L = NextLink;\n',
        ),
    ],
    [
      "RUNTIME-NATIVE-ONLY",
      (p) =>
        write(
          fe(p, "pages", "home", "ui", "Native.tsx"),
          'import { View } from "react-native";\nexport const V = View;\n',
        ),
    ],
    [
      "RUNTIME-NATIVE-ONLY",
      (p) =>
        write(
          path.join(p, "packages", "ui", "src", "web", "Bad.web.tsx"),
          'import { View } from "react-native";\nexport const V = View;\n',
        ),
    ],
    [
      "RUNTIME-WEB-ONLY",
      (p) =>
        write(
          path.join(p, "packages", "ui", "src", "native", "Bad.native.tsx"),
          'import { createPortal } from "react-dom";\nexport const c = createPortal;\n',
        ),
    ],
    [
      "RUNTIME-NODE",
      (p) =>
        write(
          fe(p, "shared", "lib", "fs.ts"),
          'import { readFileSync } from "node:fs";\nexport const r = readFileSync;\n',
        ),
    ],
    [
      "SERVER-ONLY",
      (p) =>
        write(
          path.join(p, "apps", "clients", "web", "src", "app", "db.ts"),
          'import { PrismaClient } from "@prisma/client";\nexport const db = new PrismaClient();\n',
        ),
    ],
    [
      "SERVER-ONLY",
      (p) => {
        write(
          path.join(p, "packages", "billing-server", "package.json"),
          JSON.stringify({
            name: "@acme/billing-server",
            contextWindow: { runtime: "server" },
          }),
        );
        write(
          fe(p, "features", "toggle-favorite", "api", "billing.ts"),
          'import { charge } from "@acme/billing-server";\nexport const c = charge;\n',
        );
      },
    ],
    [
      "TEST-IMPORT",
      (p) =>
        write(
          fe(p, "features", "toggle-favorite", "model", "uses-test.ts"),
          'import "./favorite.test";\nexport {};\n',
        ),
    ],
  ];
  for (const [rule, inject] of cases) {
    test(`detects ${rule}`, () => {
      const p = projectCopy();
      inject(p);
      const found = rules(p);
      assert.ok(
        found.includes(rule),
        `expected ${rule}, got ${found.join(", ") || "nothing"}`,
      );
    });
  }

  test("slice groups: grouped slices are valid, sibling imports inside a group are not", () => {
    const p = projectCopy();
    write(
      fe(p, "features", "crm", "client-save", "index.ts"),
      'export { save } from "./model/save";\n',
    );
    write(
      fe(p, "features", "crm", "client-save", "model", "save.ts"),
      "export const save = () => true;\n",
    );
    write(
      fe(p, "features", "crm", "client-delete", "index.ts"),
      'export { remove } from "./model/remove";\n',
    );
    write(
      fe(p, "features", "crm", "client-delete", "model", "remove.ts"),
      "export const remove = () => true;\n",
    );
    write(
      fe(p, "widgets", "crm-panel", "index.ts"),
      'export { panel } from "./ui/panel";\n',
    );
    write(
      fe(p, "widgets", "crm-panel", "ui", "panel.ts"),
      'import { save } from "../../../features/crm/client-save";\nimport { remove } from "../../../features/crm/client-delete";\nexport const panel = [save, remove];\n',
    );
    assert.deepEqual(rules(p), []);
    write(
      fe(p, "features", "crm", "client-delete", "model", "cross.ts"),
      'import { save } from "../../client-save";\nexport const c = save;\n',
    );
    assert.ok(rules(p).includes("FSD-SLICE"));
    write(fe(p, "features", "crm", "shared.ts"), "export const x = 1;\n");
    assert.ok(check(p).violations.some((v) => v.rule === "FSD-GROUP-CODE"));
  });

  test("entities may cross-import through the @x API addressed to them", () => {
    const p = projectCopy();
    write(
      fe(p, "entities", "product", "@x", "order.ts"),
      'export type { Product } from "../model/product";\n',
    );
    write(
      fe(p, "entities", "order", "index.ts"),
      'export type { Order } from "./model/order";\n',
    );
    write(
      fe(p, "entities", "order", "model", "order.ts"),
      'import type { Product } from "../../product/@x/order";\nexport interface Order { items: Product[] }\n',
    );
    assert.deepEqual(rules(p), []);
  });

  test("comments and strings never count as imports", () => {
    const src =
      '// import x from "react-native"\n/* import y from "next/link" */\nconst s = "import z from \'react-dom\'";\nexport const t = `require("fs")`;\n';
    assert.deepEqual(extractImports(src), []);
  });
});

describe("scaffold", () => {
  test("creates a renamed project whose gate copy is identical to the canonical gate", () => {
    const root = tmpRoot("scaffold");
    roots.push(root);
    const dest = scaffold({
      out: path.join(root, "Minha Loja"),
      scope: "@loja",
      name: "Minha Loja",
    });
    const pkg = JSON.parse(
      fs.readFileSync(
        path.join(dest, "apps", "clients", "web", "package.json"),
        "utf8",
      ),
    );
    assert.equal(pkg.name, "@loja/web");
    assert.ok(pkg.dependencies["@loja/frontend"]);
    assert.equal(
      fs.readFileSync(path.join(dest, "tools", "arch-check.mjs"), "utf8"),
      fs.readFileSync(path.join(SKILL, "scripts", "arch-check.mjs"), "utf8"),
    );
    assert.deepEqual(check(dest).violations, []);
    assert.throws(
      () => scaffold({ out: dest, scope: "@loja", name: "X" }),
      /not empty/,
    );
  });
});

describe("scaffold private files [ACH-005]", () => {
  test("a template that carries a credential, an environment file or a key is refused", () => {
    for (const leak of [
      ".env",
      "apps/clients/web/.env.local",
      "tools/auth.json",
      "packages/ui/.credentials.json",
      "id_rsa",
      ".npmrc",
    ]) {
      const root = tmpRoot("scaffold-private");
      roots.push(root);
      const source = path.join(root, "template");
      fs.cpSync(
        path.join(
          REPO,
          "saas-skills",
          "engineering",
          "multiplatform-platform-architecture",
          "assets",
          "template",
        ),
        source,
        { recursive: true },
      );
      fs.mkdirSync(path.dirname(path.join(source, ...leak.split("/"))), {
        recursive: true,
      });
      fs.writeFileSync(path.join(source, ...leak.split("/")), "SYNTHETIC=1\n");
      assert.throws(
        () =>
          scaffold({
            out: path.join(root, "out"),
            scope: "@acme",
            name: "Acme",
            source,
          }),
        /private files that must not reach a product/,
      );
      assert.ok(
        !fs.existsSync(path.join(root, "out")),
        `${leak}: nothing is written`,
      );
    }
  });

  test("an example environment file is allowed", () => {
    const root = tmpRoot("scaffold-example");
    roots.push(root);
    const source = path.join(root, "template");
    fs.cpSync(
      path.join(
        REPO,
        "saas-skills",
        "engineering",
        "multiplatform-platform-architecture",
        "assets",
        "template",
      ),
      source,
      { recursive: true },
    );
    fs.writeFileSync(path.join(source, ".env.example"), "API_URL=\n");
    const dest = scaffold({
      out: path.join(root, "out"),
      scope: "@acme",
      name: "Acme",
      source,
    });
    assert.ok(fs.existsSync(path.join(dest, ".env.example")));
  });
});
