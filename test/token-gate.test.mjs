// Design-token gate: every counter-proof must fail for the right rule and file, and correct usage
// must pass. Each case starts from a fresh scaffold of the template.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, describe, test } from "node:test";
import { REPO, cleanup, tmpRoot } from "./helpers.mjs";
import { scaffold } from "../saas-skills/engineering/multiplatform-platform-architecture/scripts/scaffold.mjs";
import { checkTokens } from "../saas-skills/engineering/multiplatform-platform-architecture/scripts/token-check.mjs";

const SKILL = path.join(
  REPO,
  "saas-skills",
  "engineering",
  "multiplatform-platform-architecture",
);
const roots = [];
after(() => roots.forEach(cleanup));

function product() {
  const root = tmpRoot("tokens");
  roots.push(root);
  return scaffold({ out: path.join(root, "p"), scope: "@acme", name: "Acme" });
}
function edit(dir, rel, fn) {
  const file = path.join(dir, ...rel.split("/"));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const before = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const after = fn(before);
  assert.notEqual(after, before, `edit of ${rel} must change the file`);
  fs.writeFileSync(file, after);
}
const replaceOnce = (from, to) => (text) => {
  assert.ok(text.includes(from), `anchor not found: ${from}`);
  return text.replace(from, to);
};

describe("token gate — correct usage passes", () => {
  test("the template passes and examines every client and shared package", () => {
    const r = checkTokens(product());
    assert.deepEqual(r.violations, []);
    assert.ok(r.examined.code >= 30, `examined ${r.examined.code}`);
    assert.deepEqual(r.config.scope, [
      "apps/clients/web",
      "apps/clients/mobile",
      "packages/ui/src",
      "packages/frontend/src",
    ]);
  });

  test("comments, type-only literals, neutral constants, anchors and changes in the token source pass", () => {
    const p = product();
    edit(
      p,
      "packages/ui/src/web/Text.web.tsx",
      replaceOnce(
        '"use client";',
        '"use client";\n// Brand review: the old primary was #C0FFEE.\ninterface Weights {\n  fontWeight: "400" | "600";\n}\nexport type { Weights };',
      ),
    );
    edit(
      p,
      "packages/ui/src/web/Stack.web.tsx",
      replaceOnce(
        'display: "flex",',
        'display: "flex", flex: 1, opacity: 0.5, width: "100%", margin: 0,',
      ),
    );
    edit(
      p,
      "packages/frontend/src/pages/home/ui/HomePage.tsx",
      (t) => `${t}\nexport const anchor = "#section-produtos";\n`,
    );
    edit(
      p,
      "packages/design-tokens/src/tokens.ts",
      replaceOnce('brand600: "#1D4ED8"', 'brand600: "#12A457"'),
    );
    assert.deepEqual(checkTokens(p).violations, []);
  });

  test("a specific exception with a reason is reported as allowed, not as a violation", () => {
    const p = product();
    edit(
      p,
      "apps/clients/web/src/app/layout.tsx",
      replaceOnce(
        "<body style={{ margin: 0 }}>",
        '{/* token-check-allow: partner logo backdrop color mandated by the partner brand guide */}\n      <body style={{ margin: 0, backgroundColor: "#0A0A0A" }}>',
      ),
    );
    const r = checkTokens(p);
    assert.deepEqual(r.violations, []);
    assert.equal(r.allowed.length, 1);
    assert.match(r.allowed[0].reason, /partner brand guide/);
  });

  test("test files may assert concrete values", () => {
    const p = product();
    edit(
      p,
      "packages/ui/src/web/Button.web.test.tsx",
      (t) => `${t}\nexport const expected = "#C0FFEE";\n`,
    );
    const r = checkTokens(p);
    assert.deepEqual(r.violations, []);
    assert.ok(r.ignored >= 1);
  });
});

describe("token gate — counter-proofs fail for the right reason", () => {
  const cases = [
    [
      "#C0FFEE in Button.web.tsx",
      "packages/ui/src/web/Button.web.tsx",
      replaceOnce(
        "backgroundColor: s.backgroundColor,",
        'backgroundColor: "#C0FFEE",',
      ),
      "color-literal",
      "#C0FFEE",
    ],
    [
      "a different value in Button.native.tsx",
      "packages/ui/src/native/Button.native.tsx",
      replaceOnce(
        "backgroundColor: s.backgroundColor,",
        'backgroundColor: "rgb(12, 34, 56)",',
      ),
      "color-literal",
      "rgb(12, 34, 56)",
    ],
    [
      "a single occurrence in the web client",
      "apps/clients/web/src/app/page.tsx",
      (t) =>
        t.replace(
          /return \(?\s*<HomePage \/>\)?;/,
          'return (\n    <div style={{ color: "hsl(200 50% 40%)" }}>\n      <HomePage />\n    </div>\n  );',
        ),
      "color-literal",
      "hsl(200 50% 40%)",
    ],
    [
      "a literal in the mobile client",
      "apps/clients/mobile/src/app/index.tsx",
      replaceOnce(
        'contentInsetAdjustmentBehavior="automatic"',
        'contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: "#123456" }}',
      ),
      "color-literal",
      "#123456",
    ],
    [
      "a local redefinition of a token with the canonical value",
      "packages/frontend/src/widgets/product-highlight/ui/ProductHighlight.tsx",
      (t) =>
        `${t}\nconst palette = { brand600: "#1D4ED8" };\nexport { palette };\n`,
      "token-redefinition",
      '{ brand600: "#1D4ED8" }',
    ],
    [
      "a spacing number in a native style",
      "packages/ui/src/native/Button.native.tsx",
      replaceOnce(
        "paddingVertical: s.paddingVertical,",
        "paddingVertical: 13,",
      ),
      "number-literal",
      "13",
    ],
    [
      "a spacing value through a local constant",
      "packages/ui/src/native/Stack.native.tsx",
      (t) =>
        t.replace(
          "return <View style={s}>",
          "const gap = 8;\n  return <View style={{ ...s, gap }}>",
        ),
      "local-constant",
      "gap = 8",
    ],
    [
      "a named color",
      "packages/ui/src/web/Text.web.tsx",
      replaceOnce(
        "style={{ margin: 0, ...s }}",
        'style={{ margin: 0, ...s, color: "rebeccapurple" }}',
      ),
      "named-color",
      "rebeccapurple",
    ],
    [
      "an arbitrary color in a class name",
      "apps/clients/web/src/app/layout.tsx",
      replaceOnce(
        "<body style={{ margin: 0 }}>",
        '<body className="bg-[#C0FFEE]" style={{ margin: 0 }}>',
      ),
      "color-literal",
      "#C0FFEE",
    ],
    [
      "a border width inside a template string",
      "packages/ui/src/web/Button.web.tsx",
      replaceOnce(
        "border: `${s.borderWidth}px solid ${s.borderColor}`,",
        "border: `2px solid ${s.borderColor}`,",
      ),
      "dimension-literal",
      "2px",
    ],
    [
      "an exception without a reason",
      "packages/ui/src/web/Button.web.tsx",
      replaceOnce(
        "backgroundColor: s.backgroundColor,",
        '// token-check-allow:\n        backgroundColor: "#C0FFEE",',
      ),
      "exception-without-reason",
      "#C0FFEE",
    ],
  ];
  for (const [label, rel, fn, rule, value] of cases) {
    test(label, () => {
      const p = product();
      edit(p, rel, fn);
      const r = checkTokens(p);
      const hit = r.violations.find(
        (v) => v.file === rel && v.rule === rule && v.value === value,
      );
      assert.ok(
        hit,
        `expected ${rule} ${value} in ${rel}, got ${JSON.stringify(r.violations)}`,
      );
    });
  }

  test("CSS declarations are examined", () => {
    const p = product();
    edit(
      p,
      "apps/clients/web/src/app/globals.css",
      () =>
        "/* #ffffff in a comment is ignored */\na { color: #abc; padding: 3px; margin: 0; }\n",
    );
    const r = checkTokens(p);
    assert.ok(
      r.violations.some(
        (v) => v.rule === "color-literal" && v.value === "#abc",
      ),
    );
    assert.ok(
      r.violations.some(
        (v) => v.rule === "dimension-literal" && v.value === "3px",
      ),
    );
    assert.equal(r.violations.filter((v) => v.file.endsWith(".css")).length, 2);
  });
});

describe("token gate — integration", () => {
  test("pnpm verify runs the token gate next to the architecture gate", () => {
    const pkg = JSON.parse(
      fs.readFileSync(
        path.join(SKILL, "assets", "template", "package.json"),
        "utf8",
      ),
    );
    assert.equal(pkg.scripts.tokens, "node tools/token-check.mjs");
    assert.match(pkg.scripts.verify, /^pnpm arch && pnpm tokens && /);
  });

  test("the scaffold ships the canonical token gate, not a copy that can drift", () => {
    const p = product();
    assert.equal(
      fs.readFileSync(path.join(p, "tools", "token-check.mjs"), "utf8"),
      fs.readFileSync(path.join(SKILL, "scripts", "token-check.mjs"), "utf8"),
    );
  });
});
