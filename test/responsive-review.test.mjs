import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, test } from "node:test";
import {
  REPO,
  cleanup,
  copyDir,
  cw,
  snapshot,
  tmpRoot,
  write,
} from "./helpers.mjs";

const root = tmpRoot("responsive-review");
after(() => cleanup(root));
const lib = path.join(root, "library");
for (const dir of ["scripts", "catalog", "saas-skills"])
  copyDir(path.join(REPO, dir), path.join(lib, dir));
fs.copyFileSync(
  path.join(REPO, "package.json"),
  path.join(lib, "package.json"),
);

const skill = "saas-ui-specifications";
const source = path.join(lib, "saas-skills", "frontend", skill);
const resources = [
  "references/reference-viewports.json",
  "references/responsive-review.md",
];

function checkInstalled(project, sink) {
  const installed = path.join(project, sink, "skills", skill);
  for (const resource of resources)
    assert.equal(
      fs.readFileSync(path.join(installed, resource), "utf8"),
      fs.readFileSync(path.join(source, resource), "utf8"),
    );
  const matrix = JSON.parse(
    fs.readFileSync(path.join(installed, resources[0]), "utf8"),
  );
  assert.equal(matrix.units, "CSS px");
  assert.deepEqual(matrix.referenceViewports.acerAspireGo15, {
    label: "Acer Aspire Go 15 — AG15-71P",
    width: 1536,
    height: 730,
    deviceScaleFactor: 1.25,
    isMobile: false,
    hasTouch: false,
  });
  assert.equal(matrix.referenceViewports.desktopMain.width, 1920);
  assert.equal(matrix.referenceViewports.desktopMain.height, 967);
  assert.equal(matrix.referenceViewports.desktopMain.deviceScaleFactor, 1);
  assert.equal(matrix.complementaryViewports.mobileStandard.width, 390);
  assert.equal(matrix.complementaryViewports.mobileStandard.height, 844);
  const contract = fs.readFileSync(path.join(project, "AGENTS.md"), "utf8");
  assert.match(
    contract,
    /Relevant UI layout changes: load `saas-ui-specifications`/,
  );
  assert.match(contract, /visual validation pending/);
}

test("dev installs measured responsive review for all three clients without changing application files", () => {
  for (const [client, sink] of [
    ["claude", ".claude"],
    ["codex", ".agents"],
    ["cursor", ".agents"],
  ]) {
    const project = path.join(root, client);
    const home = path.join(root, `${client}-home`);
    const app = path.join(project, "src");
    write(
      path.join(app, "page.tsx"),
      "export default function Page() { return null; }\n",
    );
    write(
      path.join(app, "viewports.json"),
      '{"local":{"width":1440,"height":800}}\n',
    );
    const before = snapshot(app);
    const args = [
      "--target",
      project,
      "--profile",
      "dev",
      "--clients",
      client,
      "--home",
      home,
    ];
    const plan = cw(lib, ["plan", ...args], { root });
    assert.equal(plan.code, 0, plan.all);
    assert.deepEqual(snapshot(app), before);
    const install = cw(lib, ["install", ...args], { root });
    assert.equal(install.code, 0, install.all);
    checkInstalled(project, sink);
    const verify = cw(lib, ["verify", "--target", project, "--home", home], {
      root,
    });
    assert.equal(verify.code, 0, verify.all);
    const again = cw(lib, ["install", ...args], { root });
    assert.equal(again.code, 0, again.all);
    checkInstalled(project, sink);
    assert.deepEqual(snapshot(app), before);
  }
});

test("portable bundle retains responsive resources and the installed contract", () => {
  const bundle = path.join(root, "bundle");
  const build = cw(lib, ["build", "--out", bundle], { root });
  assert.equal(build.code, 0, build.all);
  const project = path.join(root, "from-bundle");
  const home = path.join(root, "bundle-home");
  fs.mkdirSync(project);
  const install = cw(
    bundle,
    ["install", "--target", project, "--profile", "dev", "--home", home],
    { root },
  );
  assert.equal(install.code, 0, install.all);
  checkInstalled(project, ".claude");
  checkInstalled(project, ".agents");
  const verify = cw(bundle, ["verify", "--target", project, "--home", home], {
    root,
  });
  assert.equal(verify.code, 0, verify.all);
});
