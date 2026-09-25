---
name: okgas-feature-module-layout
description: >-
  MANDATORY OkGas rule — ALWAYS apply when creating, moving, renaming or
  refactoring code under apps/clients/*/src/** or packages/**. Governs FSD
  slices, segments, aggregates, terminal items and public entrypoints.
metadata:
  eis-kind: "engineering"
  mandatory: "true"
  runtimes: "codex,claude,cursor"
---

# OkGas Feature Module Layout

Mandatory for structural work. The rule in force lives in `specs/`.

Product UI → `@okgas/panel-dom`. Platform adapters → `apps/clients/*/src/host`.
Client shells are `app` + `host` + `shared`. NEVER recreate
`features`/`widgets`/`views` at the app top level.

## Specs

- `architecture.module-boundaries` — segments, the curated `index.ts`,
  aggregate versus terminal, and the forbidden folder patterns
- `architecture.fsd-layers` — the layer chain and the sibling ban
- `architecture.naming` — kebab-case files, capability names, alias `@/*`
- `architecture.monorepo-layout` — where apps and packages may live
- `ui.component-placement` — neutral component versus owning slice

## Classify before moving

Layer, then business group, then semantic slice, then optional segment (`ui`,
`model`, `api`, `lib`, `config`), then aggregate versus terminal.

```text
entities/fleet/vehicle/
├── ui/
├── model/
├── api/
├── lib/
└── index.ts
```

The slice owns its public `index.ts`. A group never owns a barrel. External
consumers import the slice's public API, never an internal segment.

A homonymous terminal (`dialog/dialog.tsx`) may co-locate implementation,
test, story and CSS. Do **not** create a `composition/` folder whose file
only mounts a `shell` or forwards props — inline that wrapper in the
terminal. Do not absorb a sibling that owns `AnimatePresence` or laboratory
sandbox UI.

## Verify

`pnpm verify:fsd` · `pnpm verify:architecture`

Index: `specs/INDEX.md`.

## Output

State the layer, group, slice and segment you chose, and the gate you ran.
