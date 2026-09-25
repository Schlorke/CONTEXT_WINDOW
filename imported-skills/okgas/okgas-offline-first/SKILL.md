---
name: okgas-offline-first
description: >-
  OkGas offline-first writes: Form → Zod → Dexie → SyncQueue → /api/v1/sync.
  Use when touching Dexie, SyncQueue, sync-manager, offline entities, or
  conflict/LWW behavior.
metadata:
  eis-kind: "engineering"
  mandatory: "false"
  runtimes: "codex,claude,cursor"
---

# OkGas Offline-First

The rule in force lives in `specs/`. This skill only routes.

## Specs

- `sync.protocol` — batch shape, 50-op limit, replay by operation id
- `sync.conflict-resolution` — what CONFLICT means and when the server applies
- `sync.permissions` — entity × operation matrix; an empty cell denies everyone
- `sync.delete-semantics` — soft vs hard delete per entity
- `offline.client-scope` — which entities are ACTUALLY offline (web: `clients` only)
- `offline.identity-scope` — the queue belongs to one org and one user
- `tenancy.runtime` — the transaction every operation runs inside
- `contracts.error-shape` — the `CONFLICT:` / `DENIED:` / `INVALID:` prefixes

Index: `specs/INDEX.md`.

## Where

- Client motor: `apps/clients/web/src/shared/lib/offline/`
- Canonical entity example: `packages/panel-dom/src/entities/crm/client/api/offline/`
- Package: `packages/core/sync-engine/`

## Output

State which layer changed (schema / Dexie / queue / API), tenant impact, and
verification commands.
