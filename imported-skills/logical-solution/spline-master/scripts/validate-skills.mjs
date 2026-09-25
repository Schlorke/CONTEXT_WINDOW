#!/usr/bin/env node
// Valida .agents/skills/spline/*/SKILL.md: name == pasta, description <= 1024,
// agents/openai.yaml com $skill-name no default_prompt.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const nameRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function parseFrontmatter(text) {
  if (!text.startsWith("---\n") && !text.startsWith("---\r\n")) {
    throw new Error("missing YAML frontmatter");
  }
  const close = text.indexOf("\n---", 4);
  if (close < 0) throw new Error("unclosed YAML frontmatter");
  const yaml = text.slice(4, close).replace(/\r/g, "");
  const out = {};
  let key;
  for (const line of yaml.split("\n")) {
    const folded = line.match(/^(\w[\w-]*):\s*>-\s*$/);
    if (folded) {
      key = folded[1];
      out[key] = "";
      continue;
    }
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) {
      key = kv[1];
      out[key] = kv[2].replace(/^["']|["']$/g, "");
      continue;
    }
    if (key && /^\s+\S/.test(line)) {
      out[key] = (out[key] + " " + line.trim()).trim();
    }
  }
  return out;
}

const dirs = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const errors = [];
for (const dir of dirs) {
  const skillDir = path.join(root, dir);
  const skillMd = path.join(skillDir, "SKILL.md");
  if (!fs.existsSync(skillMd)) {
    errors.push(dir + ": missing SKILL.md");
    continue;
  }
  let fm;
  try {
    fm = parseFrontmatter(fs.readFileSync(skillMd, "utf8"));
  } catch (err) {
    errors.push(dir + ": " + err.message);
    continue;
  }
  if (fm.name !== dir) errors.push(dir + ': name "' + fm.name + '" != folder');
  if (!nameRe.test(fm.name || "")) errors.push(dir + ": invalid name");
  const desc = fm.description || "";
  if (!desc) errors.push(dir + ": empty description");
  if (desc.length > 1024) {
    errors.push(dir + ": description " + desc.length + " > 1024");
  }
  const openai = path.join(skillDir, "agents", "openai.yaml");
  if (!fs.existsSync(openai)) {
    errors.push(dir + ": missing agents/openai.yaml");
  } else {
    const yaml = fs.readFileSync(openai, "utf8");
    if (!yaml.includes("$" + dir)) {
      errors.push(dir + ": default_prompt must mention $" + dir);
    }
    const short = yaml.match(/short_description:\s*"([^"]+)"/);
    if (short) {
      const n = short[1].length;
      if (n < 25 || n > 64) {
        errors.push(dir + ": short_description length " + n + " not in 25..64");
      }
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("ok " + dirs.length + " spline skills in " + root);
