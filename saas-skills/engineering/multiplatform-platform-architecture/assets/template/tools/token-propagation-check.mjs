#!/usr/bin/env node
// Proves that a change to one canonical token is the value the components of both clients consume,
// without editing any client or component. It replaces the primary brand color with a sentinel and
// checks three evidence levels separately, then restores the token file:
//   1. style resolution — the web Button and the native Button (react-native replaced by recording
//      host components) resolve their background from the sentinel;
//   2. web rendering    — the page prerendered by `next build` renders a <button> whose inline
//      background-color is the sentinel;
//   3. mobile export    — the Android and iOS Hermes bundles produced by `expo export` contain it.
// Native runtime (running on a device or emulator) is not covered by this script.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const tokensFile = path.join(root, "packages", "design-tokens", "src", "tokens.ts");
const original = fs.readFileSync(tokensFile, "utf8");
const current = original.match(/brand600:\s*"(#[0-9A-Fa-f]{6})"/)?.[1];
if (!current) throw new Error("brand600 token not found");
const sentinel = "#12A457";
const run = (args, env = {}) => spawnSync("pnpm", args, { cwd: root, stdio: "inherit", shell: process.platform === "win32", env: { ...process.env, ...env } }).status;
const html = (file) => (fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "");
const buttonBackgrounds = (text) => [...text.matchAll(/<button\b[^>]*\bstyle="([^"]*)"/g)].map((m) => m[1].match(/background-color:\s*([^;]+)/i)?.[1]?.trim().toUpperCase()).filter(Boolean);
const bundlesWith = (dir) => {
  const hits = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".hbc") && fs.readFileSync(p).includes(Buffer.from(sentinel))) hits.push(path.relative(root, p).split(path.sep).join("/"));
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return hits;
};
const result = { sentinel, previous: current, styleResolution: null, webRender: null, mobileExport: null, nativeRuntime: "not covered by this script" };
try {
  fs.writeFileSync(tokensFile, original.replace(current, sentinel));
  result.styleResolution = run(["exec", "vitest", "run", "packages/ui/src/web/Button.web.test.tsx", "packages/ui/src/native/Button.native.test.tsx"], { EXPECT_PRIMARY: sentinel }) === 0;
  const built = run(["build:web"]) === 0;
  const pages = ["index.html", "catalog.html"].map((f) => path.join(root, "apps", "clients", "web", ".next", "server", "app", f));
  const backgrounds = pages.flatMap((f) => buttonBackgrounds(html(f)));
  result.webRender = { built, buttons: backgrounds.length, primaryButtons: backgrounds.filter((b) => b === sentinel).length, ok: built && backgrounds.includes(sentinel) };
  const exported = run(["bundle:mobile"]) === 0;
  const bundles = bundlesWith(path.join(root, "apps", "clients", "mobile", "dist-export"));
  result.mobileExport = { exported, android: bundles.some((b) => b.includes("/android/")), ios: bundles.some((b) => b.includes("/ios/")), bundles };
} finally {
  fs.writeFileSync(tokensFile, original);
}
console.log(JSON.stringify(result, null, 2));
const ok = result.styleResolution && result.webRender?.ok && result.mobileExport?.android && result.mobileExport?.ios;
if (!ok) {
  console.error("the token change did not reach every checked level");
  process.exitCode = 1;
}
