// Manifest v2: per-entry file hashes so ownership and local edits can be decided on disk state.
import path from "node:path";
import { SKILL_ID } from "./catalog.mjs";
import { exists, readJsonOrNull, writeFileAtomic } from "./fsx.mjs";

export const MANIFEST_FILE = ".cw-manifest.json";
export const LEGACY_MANIFEST_FILE = ".saas-skills-manifest.json";
export const MANIFEST_SCHEMA = "context-window/manifest@2";
const HEX64 = /^[0-9a-f]{64}$/;

export class ManifestError extends Error {}

export function isSafeRelFile(rel) {
  if (
    typeof rel !== "string" ||
    rel === "" ||
    rel.includes("\\") ||
    rel.includes("\0")
  )
    return false;
  if (rel.startsWith("/") || /^[A-Za-z]:/.test(rel)) return false;
  const parts = rel.split("/");
  return parts.every((p) => p !== "" && p !== "." && p !== "..");
}

export function validateManifest(manifest, file) {
  const fail = (msg) => {
    throw new ManifestError(`Invalid manifest ${file}: ${msg}`);
  };
  if (!manifest || typeof manifest !== "object") fail("not an object");
  if (manifest.schema !== MANIFEST_SCHEMA)
    fail(`unsupported schema ${manifest.schema}`);
  if (!Array.isArray(manifest.entries)) fail("entries must be an array");
  const seen = new Set();
  for (const entry of manifest.entries) {
    if (
      !entry ||
      typeof entry.id !== "string" ||
      !SKILL_ID.test(entry.id) ||
      entry.id.length > 64
    ) {
      fail(`unsafe entry id ${JSON.stringify(entry?.id)}`);
    }
    if (seen.has(entry.id)) fail(`duplicate entry ${entry.id}`);
    seen.add(entry.id);
    if (!HEX64.test(entry.packageHash ?? ""))
      fail(`entry ${entry.id} has no packageHash`);
    if (!entry.files || typeof entry.files !== "object")
      fail(`entry ${entry.id} has no files`);
    for (const [rel, hash] of Object.entries(entry.files)) {
      if (!isSafeRelFile(rel))
        fail(`entry ${entry.id} has unsafe file path ${JSON.stringify(rel)}`);
      if (!HEX64.test(hash))
        fail(`entry ${entry.id} file ${rel} has invalid hash`);
    }
  }
  return manifest;
}

export function readManifest(dir) {
  const file = path.join(dir, MANIFEST_FILE);
  const manifest = readJsonOrNull(file);
  if (!manifest) return null;
  return validateManifest(manifest, file);
}

export function readLegacyManifest(dir) {
  const file = path.join(dir, LEGACY_MANIFEST_FILE);
  if (!exists(file)) return null;
  try {
    const data = readJsonOrNull(file);
    const artifacts = Array.isArray(data?.artifacts)
      ? data.artifacts.filter((a) => typeof a === "string")
      : [];
    return {
      file,
      version: data?.version ?? null,
      runtime: data?.runtime ?? null,
      artifacts,
      safeArtifacts: artifacts.filter(
        (a) => /^[A-Za-z0-9._-]+$/.test(a) && a !== "." && a !== "..",
      ),
    };
  } catch {
    return {
      file,
      version: null,
      runtime: null,
      artifacts: [],
      safeArtifacts: [],
      corrupt: true,
    };
  }
}

export function writeManifest(dir, manifest) {
  validateManifest(manifest, path.join(dir, MANIFEST_FILE));
  writeFileAtomic(
    path.join(dir, MANIFEST_FILE),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}
