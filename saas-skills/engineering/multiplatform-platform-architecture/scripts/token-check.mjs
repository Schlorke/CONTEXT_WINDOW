#!/usr/bin/env node
// Design-token gate. Design values that the design system governs — colors, spacing, radius,
// border widths and typography — may only be defined in the canonical token source; consumer code
// must read them from it. Separate from arch-check.mjs (import direction); `pnpm verify` runs both.
//   node tools/token-check.mjs [--root <product>] [--json]
//
// Examined: .ts .tsx .js .jsx .mjs .cjs (TypeScript AST: string, template and numeric literals in
// value positions, style objects, JSX attributes, local constants) and .css (declarations).
// Not examined (reported as such): every other file type, e.g. .json, .svg, images.
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_TOKEN_CONFIG = {
  canonical: ["packages/design-tokens/src"],
  scope: ["apps/clients/web", "apps/clients/mobile", "packages/ui/src", "packages/frontend/src"],
  ignoreDirs: ["node_modules", ".next", ".expo", "dist", "dist-export", "build", "coverage", "android", "ios"],
  // Tests may assert concrete values; adversarial fixtures live in __fixtures__.
  ignoreFiles: ["\\.(test|spec)\\.[cm]?[jt]sx?$", "(^|/)__fixtures__/"],
  allow: [],
};

const CODE = /\.(tsx?|jsx?|mjs|cjs)$/;
const CSS = /\.css$/;
const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])/;
const COLOR_FN = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;
const DIMENSION = /(?<![\w.#-])-?(?:\d+\.?\d*|\.\d+)(?:px|rem|em|pt|dp|vh|vw|vmin|vmax|%)?(?![\w.])/g;
const NAMED = new Set("aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen".split(" "));
const COLOR_PROP = /(^|[a-z])(color|colour)$|^(background|backgroundColor|borderColor|border(Top|Right|Bottom|Left|Start|End)Color|outlineColor|shadowColor|textShadowColor|tintColor|overlayColor|placeholderTextColor|selectionColor|underlineColorAndroid|fill|stroke|stopColor|floodColor|lightingColor)$/i;
const DIM_PROP = /^(padding|margin)(Top|Right|Bottom|Left|Horizontal|Vertical|Start|End|Block|Inline|BlockStart|BlockEnd|InlineStart|InlineEnd)?$|^(gap|rowGap|columnGap)$|^border(Top|Right|Bottom|Left|Start|End)?(Left|Right)?Radius$|^border(TopLeft|TopRight|BottomLeft|BottomRight|TopStart|TopEnd|BottomStart|BottomEnd)Radius$|^border(Top|Right|Bottom|Left|Start|End)?Width$|^(fontSize|lineHeight|letterSpacing)$/;
const SHORTHAND = /^(border(Top|Right|Bottom|Left)?|padding|margin|font|outline)$/;
const WEIGHT_PROP = /^fontWeight$/;
const ALLOW_COMMENT = /token-check-allow:\s*(.*)$/;
const CSS_KEYWORDS = new Set(["transparent", "currentcolor", "inherit", "initial", "unset", "none", "revert"]);

function loadTypeScript(root) {
  for (const base of [path.join(root, "package.json"), fileURLToPath(import.meta.url)]) {
    try {
      return createRequire(base)("typescript");
    } catch {
      /* try the next location */
    }
  }
  throw new Error("typescript is not installed next to the product or this script; run pnpm install first");
}

export function loadTokenConfig(root) {
  const file = path.join(root, "arch.config.json");
  const user = fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")).tokens ?? {}) : {};
  return { ...DEFAULT_TOKEN_CONFIG, ...user };
}

const toPosix = (p) => p.split(path.sep).join("/");

function listFiles(root, rel, ignoreDirs, acc) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isSymbolicLink()) continue;
    const child = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (!ignoreDirs.includes(e.name)) listFiles(root, child, ignoreDirs, acc);
    } else if (e.isFile()) acc.push(child);
  }
  return acc;
}

function isNonZeroNumber(text) {
  const n = Number(text);
  return Number.isFinite(n) && n !== 0;
}

function dimensionsIn(text) {
  return [...text.matchAll(DIMENSION)].map((m) => m[0]).filter((v) => isNonZeroNumber(v.replace(/[a-z%]+$/i, "")) && !v.endsWith("%"));
}

function colorIn(text) {
  const hex = text.match(HEX);
  if (hex) return hex[0];
  const fn = text.match(COLOR_FN);
  if (fn) return text.slice(fn.index, text.indexOf(")", fn.index) + 1 || undefined);
  return null;
}

/** Name of the style property (or JSX attribute) that receives `node`, if any. */
function propertyOf(ts, node) {
  let current = node;
  while (current.parent && (ts.isParenthesizedExpression(current.parent) || ts.isConditionalExpression(current.parent) || ts.isBinaryExpression(current.parent) || ts.isTemplateSpan(current.parent) || ts.isTemplateExpression(current.parent) || ts.isPrefixUnaryExpression(current.parent) || ts.isAsExpression(current.parent) || ts.isJsxExpression(current.parent))) current = current.parent;
  const parent = current.parent;
  if (parent && ts.isPropertyAssignment(parent) && parent.initializer === current) return parent.name.getText().replace(/^["']|["']$/g, "");
  if (parent && ts.isJsxAttribute(parent)) return parent.name.getText();
  return null;
}

function inTypePosition(ts, node) {
  for (let n = node.parent; n; n = n.parent) {
    if (ts.isTypeNode(n) || ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n)) return true;
    if (ts.isImportDeclaration(n) || ts.isExportDeclaration(n) || ts.isExternalModuleReference(n)) return true;
    if (ts.isCallExpression(n) && n.expression.getText() === "require") return true;
    if (ts.isBlock(n) || ts.isSourceFile(n)) return false;
  }
  return false;
}

function allowReason(lines, line) {
  for (const l of [lines[line], lines[line - 1]]) {
    const m = l?.match(ALLOW_COMMENT);
    if (m) return m[1].trim();
  }
  return null;
}

function checkCode(ts, rel, text, tokenExports, report) {
  const kind = rel.endsWith(".tsx") ? ts.ScriptKind.TSX : rel.endsWith(".jsx") ? ts.ScriptKind.JSX : rel.match(/\.[cm]?js$/) ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, kind);
  const lines = text.split(/\r?\n/);
  const localNumbers = new Map();
  const found = [];
  const add = (node, rule, property, value) => {
    const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    const reason = allowReason(lines, line);
    const entry = { file: rel, line: line + 1, column: character + 1, rule, property, value };
    if (reason === null) found.push(entry);
    else if (reason.length < 8) found.push({ ...entry, rule: "exception-without-reason" });
    else report.allowed.push({ ...entry, reason });
  };
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const init = ts.isPrefixUnaryExpression(node.initializer) ? node.initializer.operand : node.initializer;
      if (ts.isNumericLiteral(init) && isNonZeroNumber(init.text)) localNumbers.set(node.name.text, init.text);
      if (tokenExports.has(node.name.text) && (ts.isObjectLiteralExpression(node.initializer) || ts.isNumericLiteral(init))) add(node.name, "token-redefinition", node.name.text, node.initializer.getText().slice(0, 40));
    }
    const isString = ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node);
    if (isString && !inTypePosition(ts, node)) {
      const value = node.text;
      const property = propertyOf(ts, node);
      const color = colorIn(value);
      if (color) add(node, "color-literal", property, color);
      else if (property && COLOR_PROP.test(property) && NAMED.has(value.trim().toLowerCase())) add(node, "named-color", property, value.trim());
      if (property && (DIM_PROP.test(property) || SHORTHAND.test(property))) for (const d of dimensionsIn(value)) add(node, "dimension-literal", property, d);
      if (property && WEIGHT_PROP.test(property) && /^(\d{3}|bold|bolder|lighter|normal)$/i.test(value.trim())) add(node, "font-weight-literal", property, value.trim());
    }
    if (ts.isNumericLiteral(node) && !inTypePosition(ts, node) && isNonZeroNumber(node.text)) {
      const property = propertyOf(ts, node);
      if (property && (DIM_PROP.test(property) || WEIGHT_PROP.test(property))) add(node, "number-literal", property, node.text);
    }
    if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.initializer) && localNumbers.has(node.initializer.text)) {
      const property = node.name.getText().replace(/^["']|["']$/g, "");
      if (DIM_PROP.test(property)) add(node.initializer, "local-constant", property, `${node.initializer.text} = ${localNumbers.get(node.initializer.text)}`);
    }
    if (ts.isShorthandPropertyAssignment(node) && localNumbers.has(node.name.text) && DIM_PROP.test(node.name.text)) add(node, "local-constant", node.name.text, `${node.name.text} = ${localNumbers.get(node.name.text)}`);
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

function checkCss(rel, text, report) {
  const found = [];
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
  const lines = text.split(/\r?\n/);
  for (const m of clean.matchAll(/([a-zA-Z-]+)\s*:\s*([^;{}]+)[;}]/g)) {
    const property = m[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const value = m[2].trim();
    const line = clean.slice(0, m.index).split("\n").length;
    const push = (rule, v) => {
      const reason = allowReason(lines, line - 1);
      const entry = { file: rel, line, column: 1, rule, property, value: v };
      if (reason === null) found.push(entry);
      else report.allowed.push({ ...entry, reason });
    };
    if (m[1].startsWith("--")) {
      if (colorIn(value)) push("custom-property-definition", colorIn(value));
      continue;
    }
    const color = colorIn(value);
    if (color) push("color-literal", color);
    else if (COLOR_PROP.test(property) && value.split(/\s+/).some((w) => NAMED.has(w.toLowerCase()) && !CSS_KEYWORDS.has(w.toLowerCase()))) push("named-color", value);
    if (DIM_PROP.test(property) || SHORTHAND.test(property)) for (const d of dimensionsIn(value.replace(/var\([^)]*\)/g, ""))) push("dimension-literal", d);
  }
  return found;
}

export function checkTokens(root, config = loadTokenConfig(root)) {
  const ts = loadTypeScript(root);
  const ignoreFiles = config.ignoreFiles.map((p) => new RegExp(p));
  const report = { root, examined: { code: 0, css: 0 }, notExamined: {}, ignored: 0, allowed: [], violations: [], config: { scope: config.scope, canonical: config.canonical } };
  const tokenExports = new Set();
  for (const dir of config.canonical) {
    const index = path.join(root, dir, "index.ts");
    if (fs.existsSync(index)) for (const m of fs.readFileSync(index, "utf8").matchAll(/export\s*\{([^}]+)\}/g)) for (const n of m[1].split(",")) if (!/^\s*type\s/.test(n)) tokenExports.add(n.trim().split(/\s+as\s+/).pop());
  }
  for (const entry of config.allow) if (!entry.file || !entry.value || !entry.reason || String(entry.reason).length < 8) report.violations.push({ file: "arch.config.json", line: 0, column: 0, rule: "exception-without-reason", property: null, value: JSON.stringify(entry) });
  for (const scope of config.scope) {
    for (const rel of listFiles(root, scope, config.ignoreDirs, [])) {
      if (config.canonical.some((c) => rel === c || rel.startsWith(`${c}/`))) continue;
      if (ignoreFiles.some((re) => re.test(rel))) {
        report.ignored += 1;
        continue;
      }
      const text = fs.readFileSync(path.join(root, ...rel.split("/")), "utf8");
      let found;
      if (CODE.test(rel) && !rel.endsWith(".d.ts")) {
        report.examined.code += 1;
        found = checkCode(ts, rel, text, tokenExports, report);
      } else if (CSS.test(rel)) {
        report.examined.css += 1;
        found = checkCss(rel, text, report);
      } else {
        const ext = path.extname(rel) || path.basename(rel);
        report.notExamined[ext] = (report.notExamined[ext] ?? 0) + 1;
        continue;
      }
      for (const v of found) {
        const allowed = config.allow.find((a) => a.file === v.file && a.value === v.value && a.reason && String(a.reason).length >= 8);
        if (allowed) report.allowed.push({ ...v, reason: allowed.reason });
        else report.violations.push(v);
      }
    }
  }
  return report;
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
const self = fileURLToPath(import.meta.url);
if (process.platform === "win32" ? invoked.toLowerCase() === self.toLowerCase() : invoked === self) {
  const args = process.argv.slice(2);
  const rootIndex = args.indexOf("--root");
  const root = path.resolve(rootIndex === -1 ? process.cwd() : args[rootIndex + 1]);
  const report = checkTokens(root);
  if (args.includes("--json")) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  else {
    for (const v of report.violations) process.stdout.write(`TOKEN ${v.rule} ${v.file}:${v.line}:${v.column}${v.property ? ` ${v.property}` : ""} ${v.value}\n`);
    for (const a of report.allowed) process.stdout.write(`allowed ${a.file}:${a.line} ${a.value} (${a.reason})\n`);
    const skipped = Object.entries(report.notExamined).map(([k, n]) => `${k}=${n}`).join(", ");
    process.stdout.write(`${report.violations.length ? `\n${report.violations.length} token violation(s)` : "token gate passed"} — examined ${report.examined.code} code and ${report.examined.css} CSS files; ${report.ignored} test/fixture files skipped; not examined: ${skipped || "none"}\n`);
  }
  process.exitCode = report.violations.length ? 1 : 0;
}
