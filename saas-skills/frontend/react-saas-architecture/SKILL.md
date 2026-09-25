---
name: react-saas-architecture
description: "Organize React/Next.js/Expo frontends with strict Feature-Sliced Design in packages/frontend: layers, slices, segments, public APIs, @x cross-imports, routing kept in the clients. Use when creating or moving frontend code, deciding where a component, hook or page belongs, or reviewing structure."
metadata:
  author: SaaS Skills
  version: "2.0.0"
  last_validated: "2026-09-24"
  sources:
    - Feature-Sliced Design reference — layers and public API (feature-sliced.design/docs/reference, fetched 2026-09-24)
    - references/fsd-structure-examples.md
    - references/advanced-component-patterns.md
---

# When to Use This Skill

Use this skill for any frontend code in a product repository: creating a screen, a user action, a
business entity view, a reusable block, or reviewing where frontend code lives and how it imports.
The frontend is always Feature-Sliced Design inside `packages/frontend/src`, rendered by the thin
clients `apps/clients/web` and `apps/clients/mobile` (topology: `multiplatform-platform-architecture`).
Feature-first folders, type-based folders (`components/`, `hooks/`, `utils/`) or ad-hoc structures
are not alternatives.

## Operational Contract

| Field | Contract |
| --- | --- |
| Objective | Keep the product frontend strictly FSD so every client renders the same slices through explicit public APIs. |
| Use when | Adding or moving frontend code, reviewing imports, resolving cross-slice needs or circular imports, organizing a React/Next.js/Expo frontend. |
| Do not use when | Backend code (use clean-architecture-ddd), design-system internals of packages/ui (use design-system-implementation), creative/video projects. |
| Inputs | The change request and the current `packages/frontend/src` tree. |
| Preconditions | The repository has `packages/frontend`. If it does not: new project → `multiplatform-platform-architecture`; existing project → `legacy-code-refactoring` (adoption needs authorization). |
| Tools | `pnpm arch` (tools/arch-check.mjs), the TypeScript projects of both clients, the package tests. |
| Procedure | Follow the Core Workflow below in order. |
| Output | Code placed in the correct layer/slice/segment with public APIs updated and both clients still compiling. |
| Validation | `pnpm arch` reports no violation; `pnpm typecheck` passes for web and mobile; affected tests pass. |
| Known failures | Sibling-slice imports disguised through shared, deep imports past index.ts, wildcard public APIs, business rules in shared, web-only APIs in universal code. |

## Core Workflow

### Step 1: Classify the change

| Ask | Layer |
| --- | --- |
| Is it a screen (or a group of near-identical screens)? | `pages/<page>` |
| A large block reused by several pages, or one of several independent blocks of a page? | `widgets/<block>` |
| A user interaction reused on several pages (a verb: save, toggle, filter)? | `features/<verb-noun>` |
| A business concept (noun) with its model, api and view? | `entities/<noun>` |
| Business-agnostic foundation (api client setup, config, focused libs, UI facade)? | `shared/<segment>` |
| App-wide providers, routing adapters, global configuration? | `app/<segment>` |

"Not everything needs to be a feature" (FSD reference): code used by one page stays in that page.
When unsure, prefer the lower layer.

### Step 2: Build the slice with segments

```text
features/toggle-favorite/
├── model/favorite.ts          reducer/state/validation (pure, tested)
├── ui/ToggleFavoriteButton.tsx component using shared/ui (packages/ui) primitives
├── api/                       data access (only if the slice talks to the backend)
└── index.ts                   public API: explicit named exports only
```

Segments are named by purpose: `ui`, `model`, `api`, `lib`, `config`. Never `components`, `hooks`,
`types`, `utils`.

### Step 3: Write the public API

- `index.ts` lists exports explicitly: `export { ToggleFavoriteButton } from "./ui/ToggleFavoriteButton";`
- No `export * from` (FSD reference calls it bad practice: it hides the interface and leaks internals).
- When one slice must run in different environments, add environment-specific entry files (for
  example `index.server.ts`) instead of mixing them in one index.

### Step 4: Import only downward and only through public APIs

- A file imports other slices only from strictly lower layers (`widgets` → `features` → `entities`
  → `shared`), always through the other slice's `index.ts`.
- Inside the same slice, use relative imports with the full path.
- Sibling slices on the same layer never import each other. Compose them one layer up.
- Entities may reference each other only through `entities/<a>/@x/<b>.ts`, consumed only by
  `entities/<b>`. `@x` is not available on other layers.
- `app/` and `shared/` are segment-only layers: their segments import each other freely.

### Step 5: Compose at the right layer

Feature + entity compositions live in a widget or page. Example (template):
`widgets/product-highlight` renders `entities/product` (ProductCard) and
`features/toggle-favorite`; `pages/home` renders the widget. Never make one feature call another.

### Step 6: Keep shared thin and delegate UI

- `shared/ui/index.ts` re-exports or composes `@scope/ui`; it never defines a second Button.
- `shared/api` configures the HTTP client; endpoint calls of a concept live in that entity or feature.
- `shared/lib/<focus>` holds focused libraries (dates, money formatting) without business rules.

### Step 7: Respect runtime boundaries

- `packages/frontend` is universal: no `next/*`, `react-dom`, `react-native`, Node built-ins,
  Prisma or other server-only packages. Platform differences live in `packages/ui` variants
  (`.web.tsx` / `.native.tsx`) or in client adapters.
- Components with state or event handlers start with `"use client"` (a no-op for Metro);
  presentational components stay server-renderable for Next.js.
- Server-side data loading for web happens in the web route (React Server Component) calling the
  page slice's `api` functions; mobile calls the same functions client-side. Both pass data to the
  same page UI.

### Step 8: Verify

```bash
pnpm arch        # FSD + cross-package + runtime rules
pnpm typecheck   # web and native projects
pnpm test
```

## Advanced Cases

- **Large domains:** group slices in a folder with no code of its own (`features/crm/client-save`);
  sibling isolation still applies inside the group (see `multiplatform-platform-architecture`
  reference `fsd-frontend-taxonomy.md`).
- **Circular need between two slices:** move the shared part down (usually into an entity) or up
  into the composing widget/page.
- **Pages growing large:** keep non-reused blocks inside the page slice; extract a widget only when
  it becomes reusable or independent.
- **Component patterns** (compound components, render props, polymorphic components, providers):
  `references/advanced-component-patterns.md`.
- Worked placements and before/after examples: `references/fsd-structure-examples.md`.

## Fallback Clause

If `packages/frontend` does not exist, do not create an ad-hoc structure in a client: emit
`[INFORMATION NEEDED: new project (scaffold) or authorization to adopt the contract in this repository]`.
If the gate is not installed, copy `tools/arch-check.mjs` from the `multiplatform-platform-architecture`
skill and run it before finishing.

## Anti-Patterns

- Feature-first or type-based trees (`src/features/x/components`, `src/components`, `src/hooks`).
- A second FSD tree inside `apps/clients/web` or `apps/clients/mobile`.
- Importing `../../features/other/model/x` (bypassing index) or a sibling slice.
- `export *` public APIs and a global `src/index.ts` barrel.
- Business rules in `shared/`; Button implemented in `shared/ui` instead of `packages/ui`.
- `useRouter` from `next/navigation` or `react-native` imports inside `packages/frontend`.

## Enforcement

This skill is MANDATORY for frontend code. `tools/arch-check.mjs` blocks: FSD-LAYER, FSD-SLICE,
FSD-XAPI, FSD-PUBLIC-API, FSD-WILDCARD-API, FSD-GLOBAL-BARREL, FSD-UNKNOWN-LAYER, FSD-GROUP-CODE,
FSD-SELF-PACKAGE, UI-DUPLICATE-SOURCE, RUNTIME-* and SERVER-ONLY violations. A frontend change is not
complete while the gate fails.

## Source References

- Feature-Sliced Design — Layers: <https://feature-sliced.design/docs/reference/layers>
- Feature-Sliced Design — Public API: <https://feature-sliced.design/docs/reference/public-api>
- `references/fsd-structure-examples.md` — placements, before/after, import examples.
- `references/advanced-component-patterns.md` — React component patterns inside slices.
