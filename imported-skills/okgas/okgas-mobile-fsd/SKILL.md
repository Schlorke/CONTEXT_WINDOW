---
name: okgas-mobile-fsd
description: >-
  OkGas Expo host shell (app+host+shared) + product UI from @okgas/panel-dom.
  Use when touching Expo, EAS, push tokens, or mobile parity with web.
metadata:
  eis-kind: "engineering"
  mandatory: "false"
  runtimes: "codex,claude,cursor"
---

# OkGas Mobile FSD

The rule in force lives in `specs/`. This skill only routes.

## Specs

- `architecture.runtime-targets` — Expo only; no Capacitor, no Tauri; parity is
  measured at the web PHONE breakpoint
- `architecture.monorepo-layout` — mobile never imports from `apps/clients/web`
- `architecture.panel-dom` — product FSD in panel-dom; Expo shell is
  `app` + `host` + `shared`
- `offline.client-scope` — what mobile actually queues offline
- `offline.identity-scope` — the queue is scoped by org and user; mobile is the
  side that gets this right
- `auth.sessions` — Bearer carries no role claim

Ops runbook: `docs/infra/mobile-expo-operations/`.

## Verify

`pnpm --filter mobile verify:architecture`

Index: `specs/INDEX.md`.

## Output

Name the mobile slice touched, the package boundaries, and the verify command
you ran.
