---
name: okgas-module-boundaries
description: >-
  MANDATORY OkGas rule for ownership and dependency direction. Apply before
  creating, moving or renaming routes, FSD slices, server modules, packages,
  contracts or bounded contexts in the OkGas monorepo.
metadata:
  eis-kind: "engineering"
  mandatory: "true"
  runtimes: "codex,claude,cursor"
---

# OkGas Module Boundaries

Mandatory for structural work. The rule in force lives in `specs/`.

Product FSD → `@okgas/panel-dom` only. Host leftover →
`apps/clients/*/src/host` (outside the product chain). NEVER recreate
`entities`/`features`/`widgets`/`views` under an app `src/` top.

## Specs

- `architecture.monorepo-layout` — what may exist under `apps/` and
  `packages/`, and the two-consumer rule that admits a package
- `architecture.fsd-layers` — `shared < entities < features < widgets < views <
app`; a slice never imports a sibling
- `architecture.module-boundaries` — segments, the curated `index.ts`, and the
  folder patterns that are forbidden
- `architecture.api-module-shape` — thin route, controller, service, repository
- `architecture.routing` — route groups and the URL surface
- `architecture.runtime-targets` — web PWA and Expo; no Capacitor, no Tauri
- `architecture.naming` — file, symbol and alias conventions
- `ui.component-placement` — `@okgas/ui-web` versus the owning slice

## Before you move anything

Read `PROJECT_STATE.md` for the current phase. NEVER create a service, worker,
product or package outside the admission rule that authorizes it.

## Verify

`pnpm verify:fsd` · `pnpm verify:architecture`

Index: `specs/INDEX.md`.

## Output

State the layer, group, slice and segment you chose, and the gate you ran.
