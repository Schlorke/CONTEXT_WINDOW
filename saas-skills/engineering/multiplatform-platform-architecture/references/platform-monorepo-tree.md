# Platform Monorepo — Canonical Tree and Dependency Rules

## Full canonical tree

```text
platform/
├── apps/                              ═══ WHAT EXECUTES (deployables)
│   ├── clients/                       User-facing surfaces (thin)
│   │   ├── web/                       Next.js: src/app routes/layout, public/, platform integration
│   │   ├── mobile/                    Expo Router: app/ routes/layout, native integration
│   │   └── desktop/                   (future) Tauri 2 thin shell over the deployed web
│   ├── services/
│   │   └── api/                       Modular monolith backend (Dockerfile born with it)
│   └── workers/                       Async deployables — only when one truly exists
├── packages/                          ═══ LIBRARIES
│   ├── frontend/                      Product frontend, strictly FSD (app, pages, widgets,
│   │                                  features, entities, shared). Universal: no Next, Expo,
│   │                                  React Native, DOM, server code or secrets.
│   ├── ui/                            Design-system components: contract + .web + .native
│   ├── design-tokens/                 Canonical tokens and themes (TS data)
│   ├── contracts/                     Zod schemas + inferred types + generated OpenAPI
│   ├── api-client/                    Typed HTTP client; token storage injected
│   ├── database/                      Prisma schema + client; backend only ("runtime": "server")
│   ├── core/                          Platform kernel (auth-lib, rbac, tenancy, observability...)
│   └── config/                        tsconfig/eslint presets — configuration only
├── products/                          ═══ PER-PRODUCT COMPOSITION (branding, modules, seeds)
├── tools/                             arch-check.mjs, token-propagation-check.mjs, generators
└── docs/                              Editorial; never imported by runtime code
```

`frontend`, `ui` and `design-tokens` exist from day one. The other packages appear only when they
have a real responsibility (two consumers, or a boundary such as server-only database access).

## Dependency matrix

| From → To | Rule |
| --- | --- |
| `packages/*` → `apps/*` | FORBIDDEN |
| `apps/clients/mobile` ↔ `apps/clients/web` | FORBIDDEN |
| clients → `packages/frontend` | Only `@scope/frontend/app` and `@scope/frontend/pages/*` |
| clients → `packages/ui`, `packages/design-tokens` | Allowed through package exports |
| `packages/ui` → `packages/frontend` or clients | FORBIDDEN |
| `packages/design-tokens` → any workspace package | FORBIDDEN |
| `packages/frontend` → `packages/ui`, `packages/design-tokens` | Allowed (`shared/ui` re-exports `ui`) |
| universal code → `next/*`, `react-dom`, `react-native`, Node built-ins | FORBIDDEN (use `.web`/`.native` variants or client adapters) |
| clients or universal packages → server-only packages (`database`, Prisma) | FORBIDDEN |
| `packages/contracts` → anything but `zod` | FORBIDDEN |
| api module A → api module B internals | FORBIDDEN (public `index.ts` or events only) |

Each row except the last two is enforced by `tools/arch-check.mjs`.

## Placement decision table

| Question | Destination |
| --- | --- |
| Does it execute or deploy? | `apps/<group>/<app>` |
| Is it a route or screen mapping? | client route file (web `src/app`, mobile `app/`) rendering a page |
| Is it a page (screen content)? | `packages/frontend/src/pages/<page>` |
| Large self-contained block reused by pages? | `packages/frontend/src/widgets/<name>` |
| User action (verb) reused on several pages? | `packages/frontend/src/features/<verb>` |
| Business noun? | `packages/frontend/src/entities/<name>` |
| Business-agnostic helper or API client setup? | `packages/frontend/src/shared/<segment>` |
| Visual primitive/component of the design system? | `packages/ui` |
| Color, spacing, type value? | `packages/design-tokens` |
| Data contract crossing the network? | `packages/contracts` |
| Product branding, rules, seeds? | `products/<product>` |

## Sharing policy

| Asset | Policy |
| --- | --- |
| Types, DTOs, Zod schemas | Shared (`contracts`) |
| Pure business rules | Shared (entities/features models) |
| Server use cases | Never shared with clients; clients call the API |
| Product UI | One FSD tree in `packages/frontend`, rendered by both clients |
| Component implementation | One contract, `.web` and `.native` implementations in `packages/ui` |
| Tokens | Shared as data from `packages/design-tokens` |
| Auth | Shared contract; cookie (web) vs SecureStore + Bearer (mobile) |
| Offline storage | Per platform (IndexedDB vs SQLite) under one sync contract |
| Prisma access | Backend only |
| Env values | Never shared; share the env schema |

## Workspace mechanics

- `pnpm-workspace.yaml`: `apps/clients/*`, `apps/services/*`, `packages/*` (add `products/*` when
  used), plus the pnpm settings: `nodeLinker: hoisted` for Expo/Metro, `strictDepBuilds: true` with
  an `allowBuilds` decision per dependency build, `verifyDepsBeforeRun: error`.
- `package.json` pins `packageManager` to an exact pnpm version and `pnpm-lock.yaml` is committed;
  installs use `--frozen-lockfile`. `.npmrc` holds only registry and auth settings, never secrets
  committed to the repository.
- Group folders (`clients/`, `services/`) are organization only; each app keeps its `package.json`.
- Add Turborepo when build time hurts; Changesets when packages need independent versions.
