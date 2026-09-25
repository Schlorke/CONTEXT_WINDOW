// High-confidence credential patterns shared by the catalog gate and the repository secret scan.
// Callers report the pattern name and location only, never the matched value.
export const SECRET_PATTERNS = [
  {
    name: "private-key",
    re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
  },
  {
    name: "openai-or-anthropic-key",
    re: /\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{24,}\b/,
  },
  { name: "aws-access-key", re: /\bAKIA[0-9A-Z]{16}\b/ },
  {
    name: "github-token",
    re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  },
  { name: "slack-token", re: /\bxox[abprs]-[A-Za-z0-9-]{20,}\b/ },
  { name: "google-api-key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  {
    name: "oauth-token-field",
    re: /"(?:access|refresh|id)_token"\s*:\s*"[A-Za-z0-9._-]{20,}"/,
  },
];

/** Returns [{ pattern, line }] for every line that matches a credential pattern. */
export function findSecrets(text) {
  const hits = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    for (const { name, re } of SECRET_PATTERNS)
      if (re.test(lines[i])) hits.push({ pattern: name, line: i + 1 });
  }
  return hits;
}

const nonEmpty = (v) => typeof v === "string" && v.length > 0;

// File names that hold credentials, private environments, keys or session caches. They never
// belong in a skill package, a bundle or a product template, whatever their content.
const PRIVATE_NAMES = [
  /^\.env(?!\.example$)(\..+)?$/i,
  /^auth\.json$/i,
  /^\.credentials\.json$/i,
  /\.(pem|key|p12|pfx)$/i,
  /^id_(rsa|ed25519|ecdsa)(\.pub)?$/i,
  /^\.npmrc$/i,
  /^\.netrc$/i,
];
const PRIVATE_DIRS = /(^|\/)(sessions|\.ssh)(\/|$)/i;

/** True for a relative path (posix separators) that must never be copied or distributed. */
export function isPrivateFile(rel) {
  const name = rel.split("/").pop();
  return PRIVATE_NAMES.some((re) => re.test(name)) || PRIVATE_DIRS.test(rel);
}

/**
 * Recognizes client credential caches by name and JSON structure (keys only), even when the token
 * values would not match a pattern: Codex `auth.json` and Claude Code `.credentials.json`.
 */
export function credentialFileKind(fileName, text) {
  const name = fileName.toLowerCase();
  if (name !== "auth.json" && name !== ".credentials.json") return null;
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  if (
    name === "auth.json" &&
    (nonEmpty(data.OPENAI_API_KEY) ||
      nonEmpty(data.tokens?.refresh_token) ||
      nonEmpty(data.tokens?.access_token))
  )
    return "codex-auth-cache";
  if (
    name === ".credentials.json" &&
    (nonEmpty(data.claudeAiOauth?.accessToken) ||
      nonEmpty(data.claudeAiOauth?.refreshToken))
  )
    return "claude-credentials-cache";
  return null;
}
