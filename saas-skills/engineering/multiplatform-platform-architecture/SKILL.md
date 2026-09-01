---
name: multiplatform-platform-architecture
description: "Procedural guide for bootstrapping and governing multiplatform SaaS platforms: pnpm monorepo with apps grouped by execution nature (clients/services/workers), packages admitted by the two-consumer rule, products composition layer, FSD (Feature-Sliced Design) taxonomy on every frontend surface, modular API backend with three boundary laws and 12-factor portability, Expo/React Native mobile, dual cookie+Bearer auth, and contracts-first /api/v1 with OpenAPI generated from Zod. Use when starting a new SaaS platform or product, creating a monorepo, adding a mobile or desktop surface to an existing web SaaS, structuring apps and packages, extracting a backend API from Next.js, planning platform-level architecture, or deciding what is shared between web, mobile and desktop."
metadata:
  author: SaaS Platform Team
  version: 1.0.0
  last_validated: 2026-07-28
  sources:
    - references/platform-monorepo-tree.md
    - references/fsd-frontend-taxonomy.md
    - references/modular-api-anatomy.md
    - Feature-Sliced Design official documentation (fsd.dev)
    - The Twelve-Factor App methodology (12factor.net)
---

# When to Use This Skill

Use this skill when the task is platform-level architecture for a SaaS that
targets (now or in the future) more than one surface — web, mobile, desktop,
API consumers — or more than one product built on a shared kernel:

- Bootstrapping a brand-new SaaS project or platform repository.
- Converting a single-app repo into a pnpm workspace/monorepo.
- Adding a mobile (Expo/React Native) or desktop surface to a web SaaS.
- Deciding where code lives: app vs package vs product configuration.
- Extracting a backend API out of a Next.js host into its own service.
- Defining what is shared between platforms and what is duplicated.

This skill owns the PLATFORM level. Inside a single frontend surface, the FSD
taxonomy in `references/fsd-frontend-taxonomy.md` applies; for legacy repos
that already use feature-first single-app organization, defer to
`react-saas-architecture` and the repo's own governance (repo rules win).

## Core Workflow

MANDATORY inspection first: read the repo's `AGENTS.md`/`CLAUDE.md`, existing
ADRs, workspace files (`pnpm-workspace.yaml`, `turbo.json`) and any migration
roadmap/state document. Never bootstrap the target structure into a brownfield
repo that has an approved transition regime — follow its phase plan instead.

### Step 1: Fix the organizing axis — platform vs product

Classify every asset before writing structure:

- **Platform kernel** (product-agnostic): auth, RBAC, tenancy, AI runtime,
  sync engine, reporting, observability, design tokens.
- **Product modules** (segment-specific business): CRM, fleet, tasks, orders —
  whatever the product sells.
- **Product composition**: branding, enabled modules, seeds, tenant behavior.

The kernel must NEVER contain tenant/business rules; tenant behavior lives in
data (seeds/DB) or in the `products/` layer, never hardcoded in kernel code.

### Step 2: Lay the monorepo skeleton

pnpm workspace with apps grouped by execution nature. Canonical tree, full
responsibilities and dependency matrix: `references/platform-monorepo-tree.md`.

```text
apps/
├── clients/     web (Next.js, FSD) · mobile (Expo RN, FSD) · desktop (thin shell)
├── services/    api (modular monolith)
└── workers/     only when a real separate deployable exists
packages/        contracts · api-client · database · core/* · ui-web · ui-native ·
                 design-tokens · config
products/        one folder per product (branding, modules on/off, seeds)
```

Admission rules (MANDATORY):

- **Apps are deployables; packages are libraries.** HTTP controllers/routes
  belong to apps; reusable engines belong to packages.
- **Two-consumer rule:** code enters `packages/` only with 2+ real consumers.
  One consumer → it lives in the owning app until a second consumer appears.
- Do NOT pre-create empty structure (`workers/`, second APIs, gateway).
  Structure without a real consumer is dead weight, not readiness.

### Step 3: Contracts first

Before any second surface: extract network-crossing Zod schemas into
`packages/contracts`, generate OpenAPI 3.1 from them, version the HTTP surface
as `/api/v1`, and add a contract test to CI. Contracts are the lingua franca
that makes every future technology (Swift app, CLI, partner integration)
consumable without coupling to the current stack.

### Step 4: FSD on every frontend surface

Both `apps/clients/web` and `apps/clients/mobile` use Feature-Sliced Design by
the book, with two adaptations: the pages layer is named `views/` (Next.js
reserves `pages/`) and platform assets (design system, tokens, contracts,
api-client) live in `packages/`, outside FSD. Domain slice groups keep
per-domain readability. Layers, segment anatomy, slice-group rules and the
entity/feature/widget decision table: `references/fsd-frontend-taxonomy.md`.

### Step 5: Modular API backend

One modular monolith API (`apps/services/api`): per-module
`routes → controllers → services → repositories → events` with a public
`index.ts`, governed by three boundary laws and 12-factor portability rules
(env-only config validated at boot, zero local disk state, Dockerfile from
birth, healthz/readyz, graceful shutdown, structured stdout logs). Full
anatomy, laws and the 4-step module-extraction playbook:
`references/modular-api-anatomy.md`.

While the API is still hosted inside Next.js (common in early phases), keep
route handlers thin and delegate to module handlers so the later extraction is
a mounting change, not a rewrite.

### Step 6: Dual authentication

Web keeps cookie sessions. Native/API clients use Bearer: short-lived access
JWT (~15 min) + rotating refresh token persisted server-side with revocation.
A single session-resolution middleware accepts cookie OR Bearer and yields the
same session context. Never ship a mobile app on cookie/webview auth.

### Step 7: Mobile and desktop surfaces

- Mobile: Expo (Development Builds) + React Native. Own field-focused UI —
  NEVER port DOM/Tailwind components. Share contracts, api-client, tokens and
  pure logic only. Offline queue (SQLite) speaks the same sync contract as the
  web. Push via expo-notifications; background location via
  expo-location/task-manager; OTA via expo-updates; builds via EAS.
- Desktop: default to the installed PWA. Add a thin Tauri 2 shell over the
  deployed web app ONLY when a concrete OS-integration requirement exists,
  with its own ADR. Electron only if Node is required on the desktop.

### Step 8: Realtime and async sized to reality

Request-scoped SSE for streaming (chat), managed realtime channel (e.g.
Supabase Realtime) for live data (positions, notifications), managed job bus
(e.g. Inngest) for async work. No self-managed WebSocket servers, brokers or
queues until a measured trigger exists — document the upgrade triggers in the
roadmap instead of building them.

### Step 9: Deploy map

Web → Vercel-class SSR hosting. API → managed container platform
(Fly/Railway/Render/ECS) with the Dockerfile born in Step 5. NEVER a raw,
self-administered VPS: "stability under many requests" is not a valid reason
(serverless autoscaling already handles concurrency better than a fixed box);
valid reasons for a persistent process are long-running AI loops, persistent
connections, continuous ingestion and cost predictability.

### Step 10: Persist decisions for AI continuity

Every platform decision becomes a versioned artifact: a master ADR, a
normative target-architecture spec, and a phased roadmap with a resumption
anchor (current-state checklist + reading order) so ANY AI or engineer can
resume the work without the original conversation. New structural phases open
with their own focused ADR.

## Advanced Cases

- **Brownfield with transition regime:** when a repo has an approved target
  architecture plus a phase roadmap, current rules stay in force for
  unmigrated code; the roadmap state file is the single source of "where we
  are". Never apply target structure outside its phase.
- **Multi-product platform:** new products are composition (`products/<name>`
  plus module selection and seeds), never repository clone-and-strip. Kernel
  fixes land once for all products.
- **Module graduation to service:** apply the extraction playbook in
  `references/modular-api-anatomy.md`; the three laws guarantee all call
  sites are known.
- **Team scaling:** map teams to the tree (web team → `apps/clients/web`,
  mobile team → `apps/clients/mobile`, backend team → `apps/services/api`,
  platform team → `packages/core`) with CODEOWNERS per package.

## Fallback Clause

If the product count, surface requirements (GPS/push/offline depth), team
topology or deploy constraints are unknown, emit
`[INFORMATION NEEDED: products, surfaces, native requirements, team topology,
deploy constraints]` and stop before writing structure. If the repo has its
own governance that conflicts with this skill, the repo wins — document the
divergence instead of forcing this template.

## Anti-Patterns

- Cloning a whole repository and deleting parts to start a new product
  (forks diverge; every fix multiplies by N). Compose via `products/` instead.
- Pre-building empty infrastructure (gateway, Kubernetes, per-domain
  microservices, message brokers, `workers/` with nothing in it).
- Sharing UI across web and mobile (react-native-web universal components)
  — share knowledge (contracts, rules, tokens), duplicate presentation.
- Webview wrappers (Capacitor) for apps whose core requirements are
  background location, reliable push or field UX.
- Raw VPS administration when managed container platforms exist.
- Extracting the backend before contracts and token auth exist (double
  migration; two servers with no unlocked client).
- Putting HTTP controllers in packages or business engines in apps —
  deployables are apps, libraries are packages.
- Hardcoding tenant/business behavior in kernel code instead of data.
- **`!important` in CSS and the `!` important modifier in Tailwind are
  STRICTLY FORBIDDEN — inadmissible anti-coding practice.** No new project
  starts with them and no generated code introduces them, ever. Style
  conflicts are resolved by scope/selector, cascade order, a dedicated class
  or a component-architecture fix — never by force. If a third-party
  constraint makes an exception truly unavoidable, it requires an explicit
  human-approved ADR documenting root cause and removal plan; silent use is
  prohibited.

## Enforcement

- Workspace boundaries are enforced by the package manager itself: an import
  not declared in `package.json` does not resolve — prefer this structural
  enforcement over bespoke lint gates.
- FSD layers: Steiger (official FSD linter) in CI for each client app.
- API boundary laws: lint rules forbidding cross-module deep imports and
  cross-module table access; CI fails on violation.
- `!important` / Tailwind `!` prefix: stylelint (`declaration-no-important`)
  and an ESLint/grep check for the `!` utility prefix run in CI and MUST fail
  the build on any occurrence.
- Scaffolding generators (`gen:module`, `gen:slice`) stamp the canonical
  anatomies; hand-made structure that diverges from the references is a
  review blocker.
- Every structural phase updates the roadmap state file; a PR that changes
  structure without updating it is incomplete.

## Source References

- `references/platform-monorepo-tree.md` — canonical tree, responsibilities,
  dependency matrix, sharing policy.
- `references/fsd-frontend-taxonomy.md` — FSD layers, segments, slice groups,
  decision table, Next.js adaptations.
- `references/modular-api-anatomy.md` — module anatomy, three boundary laws,
  12-factor rules, extraction playbook, dual-auth outline.
- Feature-Sliced Design documentation: <https://feature-sliced.design>
- The Twelve-Factor App: <https://12factor.net>
