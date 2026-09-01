# Platform Monorepo — Canonical Tree and Dependency Rules

## Full canonical tree

```text
platform/
├── apps/                              ═══ WHAT EXECUTES (deployables)
│   ├── clients/                       User-facing surfaces
│   │   ├── web/                       Next.js — SSR panel + PWA (FSD inside)
│   │   │   ├── app/                   Next App Router: routing ONLY (3-5 line routes)
│   │   │   ├── public/
│   │   │   └── src/                   FSD: app/ views/ widgets/ features/ entities/ shared/
│   │   ├── mobile/                    Expo RN — field app (FSD inside)
│   │   │   ├── app/                   expo-router screens
│   │   │   └── src/                   FSD layers in React Native
│   │   └── desktop/                   (future) Tauri 2 thin shell over deployed web
│   ├── services/
│   │   └── api/                       Modular monolith backend
│   │       ├── Dockerfile             Born with the app
│   │       └── src/                   app/ (bootstrap) + modules/ + shared/
│   └── workers/                       Async deployables — create ONLY when one truly exists
├── packages/                          ═══ LIBRARIES (2+ consumers rule)
│   ├── contracts/                     Zod schemas + inferred types + generated OpenAPI.
│   │                                  Depends on zod ONLY. The platform's lingua franca.
│   ├── api-client/                    Typed isomorphic HTTP client. Token storage and
│   │                                  refresh handling injected via interface.
│   ├── database/                      Prisma schema (multi-file, per domain) + client.
│   │                                  Consumed by api (and workers). NEVER by clients.
│   ├── core/                          Platform kernel — product-agnostic. FORBIDDEN to
│   │   │                              contain tenant/business rules (those live in data
│   │   │                              or products/).
│   │   ├── agent-runtime/             AI runtime: planner, tools, context, RAG
│   │   ├── sync-engine/               Offline sync server engine (batch, LWW, policy)
│   │   ├── reporting/                 Versioned templates + PDF generation
│   │   ├── auth-lib/                  Session/token verification shared by api + web SSR
│   │   ├── rbac/                      Roles, permissions, can()
│   │   ├── tenancy/                   Org resolution, scoping helpers
│   │   └── observability/             Tracing/telemetry wrappers
│   ├── ui-web/                        DOM design system (React + Tailwind/Radix)
│   ├── ui-native/                     React Native design system (consumes design-tokens)
│   ├── design-tokens/                 Colors/spacing/typography as DATA (JSON/TS)
│   └── config/                        tsconfig/eslint presets — configuration only
├── products/                          ═══ PER-PRODUCT COMPOSITION
│   └── <product>/                     Branding, enabled modules, seeds, tenant behavior,
│                                      env schema. New product = new folder, NOT a fork.
├── tooling/                           Gates, generators (gen:module, gen:slice), scripts
└── docs/                              Editorial. NEVER imported by runtime code.
```

## Dependency matrix

| From → To                                  | Rule                                                              |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `packages/*` → `apps/*`                    | FORBIDDEN (structurally impossible — packages never declare apps) |
| `apps/*` → `packages/*`                    | Allowed via package name declared in the app's `package.json`     |
| `apps/clients/mobile` → `apps/clients/web` | FORBIDDEN (no path between client apps)                           |
| `packages/contracts` → anything but `zod`  | FORBIDDEN (no framework, no Prisma, no browser/Node APIs)         |
| `packages/core/*` → `packages/ui-*`        | FORBIDDEN (kernel never knows presentation)                       |
| `packages/database` → clients              | FORBIDDEN (Prisma never leaves the backend)                       |
| Any runtime code → `docs/**`               | FORBIDDEN                                                         |
| api module A → api module B internals      | FORBIDDEN (public `index.ts` or events only)                      |

## Placement decision table

| Question                               | Answer     | Destination                         |
| -------------------------------------- | ---------- | ----------------------------------- |
| Does it execute/deploy?                | app        | `apps/<group>/<app>`                |
| Is it a routed page?                   | view       | app's `src/views/<page>`            |
| Is it a large self-contained UI block? | widget     | app's `src/widgets/<group>/<name>`  |
| Is it a user action (verb)?            | feature    | app's `src/features/<group>/<verb>` |
| Is it a business noun?                 | entity     | app's `src/entities/<group>/<name>` |
| Business-agnostic, single app?         | app shared | app's `src/shared/*`                |
| Reusable engine, 2+ consumers?         | package    | `packages/core/<name>`              |
| Data contract crossing the network?    | contracts  | `packages/contracts`                |
| One product's branding/rules/seeds?    | product    | `products/<product>`                |

## Sharing policy (web × mobile × desktop × future surfaces)

| Asset                                                      | Policy                                                                              |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Types, DTOs, Zod schemas                                   | Share fully (`contracts`)                                                           |
| OpenAPI                                                    | Share the contract only (generated)                                                 |
| API client                                                 | Share via interface (injected storage/token)                                        |
| Pure business rules (calculations, validation, formatting) | Share fully                                                                         |
| Server use-cases/services                                  | Never shared with clients — clients consume the API                                 |
| React DOM components                                       | Never shared with mobile                                                            |
| React Native components                                    | Implemented separately                                                              |
| Design tokens                                              | Share fully as data                                                                 |
| Icon set                                                   | Share semantically (lucide / lucide-react-native)                                   |
| Tailwind classes / style recipes                           | Never shared (web-only)                                                             |
| Data hooks                                                 | Share query keys + fetchers; final hook per platform                                |
| Auth                                                       | Share the contract (endpoints); implementation per platform (cookie vs SecureStore) |
| Offline storage/queue                                      | Separate implementations (IndexedDB web / SQLite mobile) under ONE sync contract    |
| Prisma access                                              | Backend only, always                                                                |
| Env values                                                 | Never shared; share the per-app env SCHEMA                                          |

Anti-goal: 100% code sharing. Universal UI produces a mediocre panel AND a
mediocre field app. Share knowledge; duplicate presentation.

## Workspace mechanics

- `pnpm-workspace.yaml` globs: `apps/clients/*`, `apps/services/*`,
  `apps/workers/*`, `packages/*`, `products/*`.
- Nested group folders (`clients/`, `services/`) are organization only — each
  app keeps its own `package.json` and remains independent.
- Add Turborepo when build/CI time hurts; it is an optimization, not a
  prerequisite.
- Versioning/ownership at scale: CODEOWNERS per package, Changesets when
  packages need independent versions.

## Two-stage migration for brownfield single-app repos

1. **Stage 1:** repo root remains the web app; create `packages/*` on demand
   (contracts first) and `apps/mobile` when the mobile phase starts.
2. **Stage 2:** move the root into `apps/clients/web` (pure `git mv`, no logic
   change) once packages stabilize; update CI/gate paths in the same change.

Never do stage 2 first: path churn without functional gain blocks real work.
