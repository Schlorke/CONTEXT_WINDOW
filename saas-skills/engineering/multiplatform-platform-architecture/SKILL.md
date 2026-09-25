---
name: multiplatform-platform-architecture
description: "Bootstrap and govern multiplatform products: pnpm monorepo with thin Next.js and Expo clients over packages/frontend (FSD), packages/ui (.web/.native) and packages/design-tokens; runnable template, scaffold and architecture gate. Use when starting a product, adding mobile or checking a repo against the contract."
metadata:
  author: SaaS Platform Team
  version: "2.0.0"
  last_validated: "2026-09-24"
  sources:
    - references/platform-monorepo-tree.md
    - references/client-fsd-mirror.md
    - references/fsd-frontend-taxonomy.md
    - references/modular-api-anatomy.md
    - Feature-Sliced Design reference (feature-sliced.design/docs/reference, fetched 2026-09-24)
    - The Twelve-Factor App methodology (12factor.net)
---

# When to Use This Skill

Use this skill for platform-level work on a product that has, or will have, a frontend:

- Bootstrapping a new product repository (web and mobile from day one).
- Converting a single-app repository into the mandatory topology (with `legacy-code-refactoring`).
- Deciding where code lives: client, package, product configuration or backend module.
- Integrating Next.js and Expo over shared packages; checking a repository with the architecture gate.
- Extracting a backend API out of a Next.js host.

Inside `packages/frontend`, the FSD rules of `react-saas-architecture` apply. Components and tokens
follow `design-system-implementation`. Backend architecture follows `clean-architecture-ddd`.

## Operational Contract

| Field | Contract |
| --- | --- |
| Objective | Give every product with a frontend the mandatory topology: thin web and mobile clients rendering one FSD frontend package, a shared design system and canonical tokens, verified by an executable gate. |
| Use when | Starting a product, adding a client, deciding code placement, integrating Next.js with Expo, or reviewing a repository against the contract. |
| Do not use when | Backend-only services, libraries without UI, automations or creative/media projects (they keep their own profile). |
| Inputs | Product name and npm scope, target surfaces, native requirements (push, offline, location), existing repository state. |
| Preconditions | Node >= 22.13 and the pnpm version pinned in the template's `packageManager` (run through Corepack or an equal pnpm); for an existing repository, an explicit authorization to change it (otherwise only assess). |
| Tools | `scripts/scaffold.mjs` (new projects), `scripts/arch-check.mjs` (FSD gate), `scripts/token-check.mjs` (token gate), the template in `assets/template/`, pnpm, Next.js, Expo CLI. |
| Procedure | Follow the Core Workflow below in order. |
| Output | A repository with `apps/clients/{web,mobile}`, `packages/{frontend,ui,design-tokens}`, a committed `pnpm-lock.yaml` and a passing `pnpm verify`. |
| Validation | `pnpm install --frozen-lockfile`, then `pnpm arch`, `pnpm tokens`, `pnpm typecheck`, `pnpm test`, `pnpm build:web`, `pnpm bundle:mobile` and `pnpm check:tokens` all succeed; native build and device run are reported separately. |
| Known failures | Duplicate FSD trees in the clients, DOM components imported by mobile, React version mismatch between clients, Metro not resolving workspace packages (`nodeLinker: hoisted` missing from `pnpm-workspace.yaml`), Next not compiling workspace TypeScript (missing `transpilePackages`), `ERR_PNPM_IGNORED_BUILDS` (a dependency build without an `allowBuilds` decision), a pnpm version inherited from a parent folder. |

## Core Workflow

MANDATORY inspection first: read the repository's `AGENTS.md`/`CLAUDE.md`, ADRs, workspace files and
any migration state document. An existing repository is never restructured without an explicit
request to adopt or modernize it; in that case use `legacy-code-refactoring`.

### Step 1: Classify assets — platform vs product

- **Platform kernel** (product-agnostic): auth, RBAC, tenancy, AI runtime, sync, observability.
- **Product modules**: the business the product sells (orders, fleet, CRM...).
- **Product composition**: branding, enabled modules, seeds, tenant behavior (data, not code).

The kernel never contains tenant or business rules.

### Step 2: Scaffold the mandatory topology

For a new product, generate the repository from the template instead of writing structure by hand:

```bash
node <this-skill>/scripts/scaffold.mjs --out ../my-product --scope @company --name "My Product"
cd ../my-product && pnpm install --frozen-lockfile && pnpm verify
```

The output folder must not sit inside another pnpm workspace or below a `package.json` that pins a
different `packageManager`: pnpm would install into the parent workspace and Corepack would pick the
parent's pnpm. The template ships its lockfile, so the first install is reproducible; regenerate it
only when dependencies change, and review the diff.

```text
apps/clients/web        Next.js App Router: src/app routes and layout; src/host and src/shared only when needed
apps/clients/mobile     Expo Router: src/app routes and layout; src/host for native integration (push, secure store, offline)
packages/frontend       product frontend, strictly FSD: src/{app,pages,widgets,features,entities,shared}
packages/ui             design-system components: contract + .web.tsx + .native.tsx
packages/design-tokens  canonical tokens and themes (the only place colors/spacing/type are defined)
```

Admission rules (MANDATORY):

- Clients hold routes, bootstrap, configuration and platform adapters only. Product screens,
  business rules and styles live in the packages. Mobile never imports the web client.
- `packages/frontend` exposes only `./app` (providers) and `./pages/*` to the clients; there is no
  global barrel. Clients import package entry points, never `src/` paths.
- **Two-consumer rule:** other code enters `packages/` only with two real consumers; do not
  pre-create empty packages, workers or gateways.

Canonical tree, responsibilities and dependency matrix: `references/platform-monorepo-tree.md`.
The web/mobile mirror contract: `references/client-fsd-mirror.md`.

### Step 3: Integrate Next.js and Expo over the same packages

These settings are part of the template and were verified with Next.js 16.3.6 (Turbopack) and
Expo SDK 57 / React Native 0.86.3 / React 19.2.3:

- One React version for the whole workspace (Expo's bundled version); Next accepts it.
- pnpm settings live in `pnpm-workspace.yaml` (pnpm 11+ reads only auth and registry settings from
  `.npmrc`): `nodeLinker: hoisted` so Metro and Next resolve one `node_modules` tree;
  `strictDepBuilds: true` with an explicit `allowBuilds` decision per dependency that has a build
  script (the template denies `esbuild`'s, which only validates the platform binary);
  `verifyDepsBeforeRun: error` so `pnpm run` never installs implicitly; and
  `minimumReleaseAgeExclude` only for exact versions, with the reason and a review date.
- `packages/ui/package.json` exports `{ "react-native": "./src/index.native.ts", "default": "./src/index.web.ts" }`:
  Metro selects the native implementation, Next and Vitest the web one. Mobile TypeScript uses
  `customConditions: ["react-native"]`.
- `next.config.mjs`: `transpilePackages` for the workspace packages and `turbopack.root` /
  `outputFileTracingRoot` at the workspace root.
- Web UI components that use context or events start with `"use client"`; pages stay server
  components so rendering and SEO are preserved. Never convert everything to client components.

### Step 4: Contracts first

Before a second consumer of the HTTP API exists: keep network-crossing Zod schemas in
`packages/contracts`, generate OpenAPI 3.1 from them, version the surface as `/api/v1` and add a
contract test to CI. Contracts are shared; server implementations are not.

### Step 5: Modular API backend

One modular monolith API (`apps/services/api` once it leaves Next.js): per module
`routes → controllers → services → repositories → events` with a public `index.ts`, three boundary
laws and 12-factor portability (env-only config validated at boot, no local disk state, Dockerfile
from birth, healthz/readyz, graceful shutdown, structured logs). Mark server-only packages with
`"contextWindow": { "runtime": "server" }` so the gate rejects client imports. Anatomy, laws and
extraction playbook: `references/modular-api-anatomy.md`. Architecture choice: `clean-architecture-ddd`.

### Step 6: Dual authentication

Web keeps cookie sessions. Native and API clients use Bearer: short-lived access JWT (~15 min) plus
a rotating refresh token persisted server-side with revocation. One session-resolution middleware
accepts cookie or Bearer and yields the same session context. Never ship mobile on webview auth.

### Step 7: Native capabilities and desktop

- Mobile native adapters (secure store, SQLite offline queue, push, background location, OTA) live
  in the mobile client or in platform-specific package variants; the product screens stay shared.
  Kotlin/Swift modules only for a demonstrated native need, wrapped behind a typed module.
- Desktop: default to the installed PWA; a thin Tauri shell only for a concrete OS requirement.

### Step 8: Realtime and async sized to reality

Request-scoped SSE for streaming, a managed realtime channel for live data, a managed job bus for
async work. No self-managed brokers or WebSocket servers until a measured trigger exists.

### Step 9: Verify, including the mirror

Run in the product repository:

```bash
pnpm arch            # architecture gate (tools/arch-check.mjs)
pnpm tokens          # token gate (tools/token-check.mjs): no literal colors or sizes outside design-tokens
pnpm typecheck       # web and native TypeScript projects
pnpm test            # unit tests of packages
pnpm build:web       # Next.js production build
pnpm bundle:mobile   # Metro bundles for Android and iOS (expo export)
pnpm check:tokens    # one token change reaches both clients without editing client styles
```

`pnpm verify` runs the first six in order. The token gate reads TS/TSX (style objects, inline
styles, class strings) and CSS in `apps/clients/web`, `apps/clients/mobile`, `packages/ui/src` and
`packages/frontend/src`; it rejects color literals, named colors, literal sizes in governed style
properties, local constants used as design values and redefinitions of canonical token names. Tests
and fixtures are out of scope; a deliberate exception needs `// token-check-allow: <reason>` on
the line (or a `{ "file", "value", "reason" }` entry in `tokens.allow` of `arch.config.json`) and
is listed in the report.

Report mobile evidence by level: module resolution, JS bundle, native build (Gradle/Xcode) and
execution on a device or emulator. A passing bundle does not prove a native build; Android does not
prove iOS; a browser preview does not prove native execution.

### Step 10: Persist decisions

Every platform decision becomes a versioned artifact (ADR, target spec, phased roadmap with a
resumption checklist) so any engineer or agent can continue without the original conversation.

## Advanced Cases

- **Brownfield with transition regime:** unmigrated code keeps current rules; the roadmap state file
  says where the migration is; intermediate states are labeled as such, never as final conformity.
- **Multi-product platform:** new products are composition (`products/<name>`), never clone-and-strip.
- **Module graduation to service:** apply the extraction playbook in `references/modular-api-anatomy.md`.
- **Team scaling:** CODEOWNERS per package (`packages/frontend` product team, `packages/ui` design
  system team, clients per platform team).

## Fallback Clause

If surfaces, native requirements, npm scope or deploy constraints are unknown, emit
`[INFORMATION NEEDED: product name/scope, surfaces, native requirements, deploy constraints]` and stop
before writing structure. If a dependency cannot be installed (offline machine), scaffold, run
`pnpm arch` and report the remaining steps as not verified.

## Anti-Patterns

- A second FSD tree inside `apps/clients/web` or `apps/clients/mobile`, or mobile importing web.
- Leaving the mobile client as an empty folder or the default Expo screen: it must render the shared pages.
- Two sources for the same component (`packages/ui` and `frontend/shared/ui`); shared/ui only delegates.
- Assuming DOM components, CSS or web-only libraries work in React Native.
- Cloning a repository and deleting parts to start a new product.
- Pre-building empty infrastructure (gateway, Kubernetes, brokers, empty `workers/`).
- Extracting the backend before contracts and token auth exist.
- Hardcoding tenant behavior in kernel code instead of data.
- **`!important` in CSS and the Tailwind `!` modifier are forbidden.** Resolve conflicts by scope,
  cascade order or component architecture; an exception needs a human-approved ADR.

## Enforcement

- `scripts/arch-check.mjs` (copied to `tools/arch-check.mjs` by the scaffold) runs in CI and blocks
  FSD layer/slice/public-API violations, foundations importing upward, clients reaching package
  internals or each other, and web/native/Node/server-only imports across runtime boundaries.
  Its own test suite injects each violation deliberately.
- Steiger (official FSD linter) may run in addition for FSD-specific diagnostics inside
  `packages/frontend`; it does not check cross-package or runtime boundaries.
- Workspace boundaries: an import not declared in `package.json` does not resolve.
- `!important` / Tailwind `!`: stylelint `declaration-no-important` and a grep check fail CI.

## Source References

- `assets/template/` — runnable reference project (web, mobile, packages) used by the scaffold.
- `scripts/scaffold.mjs` — creates a new product repository from the template.
- `scripts/arch-check.mjs` — architecture gate.
- `references/client-fsd-mirror.md` — web/mobile mirror contract.
- `references/platform-monorepo-tree.md` — canonical tree, responsibilities, dependency matrix.
- `references/fsd-frontend-taxonomy.md` — FSD layers, segments and decision table.
- `references/modular-api-anatomy.md` — backend module anatomy, boundary laws, extraction playbook.
- Feature-Sliced Design reference: <https://feature-sliced.design/docs/reference/layers>
- The Twelve-Factor App: <https://12factor.net>
