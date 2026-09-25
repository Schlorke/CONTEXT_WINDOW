// Per-step unconfined authorization grants for acceptance (Pedido 10).
// A grant unlocks only the listed steps/scripts; it never flips install ignoreScripts.
// Presence of a JSON file alone is not permission — each operation must match a grant.
import fs from "node:fs";
import path from "node:path";
import {
  validateUnconfinedAuthorization,
  authorizationCoversOperation,
} from "./pnpm-guard.mjs";

const asList = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

/**
 * Loads an authorization document. Supports:
 * - { grants: [ { id, steps, command, scripts, destinations, risks, authorizedBy? } ], authorizedBy, denied? }
 * - legacy single-object (treated as one grant covering no steps unless `steps` is set)
 */
export function loadAuthorizationDocument(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!raw || typeof raw !== "object")
    throw new Error("authorization file must be a JSON object");
  const denied = new Set(asList(raw.denied).map(String));
  if (denied.has("D7") === false && raw.denyD7 === true) denied.add("D7");
  const grants = Array.isArray(raw.grants)
    ? raw.grants
    : raw.command
      ? [{ ...raw, id: raw.id ?? "legacy", steps: asList(raw.steps) }]
      : [];
  return {
    source: raw.source ?? null,
    authorizedBy: raw.authorizedBy ?? null,
    confinementRequirement: raw.confinementRequirement ?? "not approved",
    denied: [...denied],
    grants,
    filePath,
  };
}

function grantAuthorizedBy(doc, grant) {
  const by = grant.authorizedBy ?? doc.authorizedBy;
  if (typeof by !== "string" || by.trim().length < 3) return null;
  return by.trim();
}

/**
 * Resolves a grant for one acceptance step. Returns an authorizeUnconfined object
 * suitable for runGuardedScript, or { error } if not authorized for this operation.
 * Never authorizes install lifecycle (D7).
 */
export function resolveStepAuthorization(doc, stepId, operation) {
  if (!doc) {
    return {
      error:
        "no authorization document: step stays pending until --authorize-unconfined <json>",
    };
  }
  if (doc.denied.includes("D7") && operation?.kind === "install-lifecycle") {
    return {
      error: "D7 is denied: install lifecycle scripts are not authorized",
    };
  }
  if (operation?.kind === "install-lifecycle") {
    return {
      error:
        "install lifecycle is not part of D1–D6; keep ignoreScripts true (D7 not authorized)",
    };
  }

  const candidates = doc.grants.filter((g) =>
    asList(g.steps).map(String).includes(String(stepId)),
  );
  if (!candidates.length) {
    return {
      error: `no grant lists step ${stepId}; other grants do not unlock this step`,
    };
  }

  for (const grant of candidates) {
    const authorizedBy = grantAuthorizedBy(doc, grant);
    if (!authorizedBy) {
      return {
        error: `grant ${grant.id ?? "?"} for ${stepId}: authorizedBy missing`,
      };
    }
    const authorize = {
      command: grant.command,
      scripts: grant.scripts,
      destinations: grant.destinations,
      risks: grant.risks,
      authorizedBy,
    };
    const struct = validateUnconfinedAuthorization(authorize);
    if (struct) return { error: `grant ${grant.id}: ${struct}` };
    const cover = authorizationCoversOperation(authorize, operation);
    if (cover) continue; // try next grant
    return {
      authorize,
      grantId: grant.id ?? null,
      decisionIds: asList(grant.decisionIds ?? grant.id),
    };
  }
  return {
    error: `grant(s) for ${stepId} do not cover command/scripts/destinations of this operation`,
  };
}

/** True when a document explicitly denies D7 (install lifecycle). */
export function deniesInstallLifecycle(doc) {
  return Boolean(doc?.denied?.includes("D7"));
}
