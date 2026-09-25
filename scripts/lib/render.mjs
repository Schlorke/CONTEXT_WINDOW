// Renders the installable package of a skill. The same bytes are written to every sink
// (.claude/skills and .agents/skills), so a copy's identity can be verified by hash.
import fs from "node:fs";
import path from "node:path";
import yaml from "./vendor/js-yaml.mjs";
import { parseFrontmatter } from "./catalog.mjs";
import { packageHash, sha256 } from "./fsx.mjs";

const SPEC_FIELDS = ["license", "compatibility", "allowed-tools"];

function stringifyMeta(value) {
  if (value == null) return undefined;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return JSON.stringify(value);
}

export function renderSkill(repoRoot, skill, libraryVersion) {
  const dir = path.join(repoRoot, ...skill.path.split("/"));
  const files = {};
  for (const rel of Object.keys(skill.files)) {
    files[rel] = fs.readFileSync(path.join(dir, ...rel.split("/")));
  }
  const raw = files["SKILL.md"].toString("utf8");
  const fm = parseFrontmatter(raw);
  if (fm.error) throw new Error(`${skill.id}: ${fm.error}`);
  const out = { name: skill.id, description: fm.data.description };
  for (const field of SPEC_FIELDS)
    if (fm.data[field] != null) out[field] = fm.data[field];
  if (skill.invocation === "explicit") out["disable-model-invocation"] = true;
  const metadata = {};
  for (const [key, value] of Object.entries(fm.data.metadata ?? {})) {
    const str = stringifyMeta(value);
    if (str !== undefined) metadata[key] = str;
  }
  metadata["cw-id"] = skill.id;
  metadata["cw-library-version"] = libraryVersion;
  metadata["cw-source-hash"] = skill.packageHash;
  out.metadata = metadata;
  const frontmatter = yaml.dump(out, {
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  });
  files["SKILL.md"] = Buffer.from(
    `---\n${frontmatter}---\n${fm.body.startsWith("\n") || fm.body.startsWith("\r\n") ? "" : "\n"}${fm.body}`,
    "utf8",
  );

  if (skill.invocation === "explicit") {
    const current = files["agents/openai.yaml"]
      ? (yaml.load(files["agents/openai.yaml"].toString("utf8")) ?? {})
      : {};
    current.policy = {
      ...(current.policy ?? {}),
      allow_implicit_invocation: false,
    };
    files["agents/openai.yaml"] = Buffer.from(
      yaml.dump(current, { lineWidth: -1, noRefs: true }),
      "utf8",
    );
  }
  const hashes = {};
  for (const [rel, buf] of Object.entries(files)) hashes[rel] = sha256(buf);
  return { id: skill.id, files, hashes, packageHash: packageHash(hashes) };
}
