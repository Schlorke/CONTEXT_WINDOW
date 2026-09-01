# Modular API — Anatomy, Boundary Laws, 12-Factor, Extraction Playbook

The backend is ONE modular monolith app (`apps/services/api`). Modules mirror
business domains. Microservices-per-domain and API gateways are forbidden
until a measured trigger exists (independent teams, divergent SLAs).

## App anatomy

```text
apps/services/api/
├── Dockerfile                  Born WITH the app — this is what makes any
│                               future host change (container platform, even
│                               a VPS) a deploy detail instead of a project.
└── src/
    ├── app/                    ═══ BOOTSTRAP (the only place that changes on rehosting)
    │   ├── server.ts           starts HTTP, mounts modules
    │   ├── health.ts           GET /healthz (alive) + /readyz (deps OK)
    │   ├── env.ts              ALL config via environment variables, validated
    │   │                       with Zod at boot — refuse to start on missing env
    │   └── shutdown.ts         graceful shutdown: drain connections, close pools
    ├── modules/                ═══ DOMAINS (each one extractable)
    │   └── <module>/           crm/ fleet/ tasks/ auth/ sync/ tracking/ ...
    │       ├── routes.ts       HTTP paths → controllers
    │       ├── controllers/    THIN: parse (Zod from packages/contracts) →
    │       │                   call service → shape response. No business rule.
    │       ├── services/       business rules. No HTTP knowledge.
    │       ├── repositories/   data access (Prisma), ALWAYS tenant-scoped
    │       ├── events/         events this module publishes/consumes (job bus)
    │       └── index.ts        ★ the module's ONLY public surface
    └── shared/                 middleware (dual auth, rate limit), error
                                envelope, http helpers
```

## The three boundary laws (lintable, non-negotiable)

1. **Module A talks to module B only through B's `index.ts` or through an
   event.** Never import another module's services/repositories/internals.
2. **A module never touches another module's tables.** Need the data? Ask the
   owning module's public surface.
3. **Controllers contain no business rules; services know no HTTP.**
   Transport and domain stay separable — the same module runs behind a Next.js
   route handler, a dedicated server or a queue consumer without edits.

Law 1 is what makes future extraction mechanical: every cross-module call
site is enumerable by grepping imports of the module's `index.ts`.

## 12-factor portability rules

| Rule      | Requirement                                                                         |
| --------- | ----------------------------------------------------------------------------------- |
| Config    | Env vars only; Zod-validated at boot; no config files read at runtime               |
| State     | ZERO local disk state; uploads/artifacts go to object storage                       |
| Processes | Disposable; nothing in memory that cannot die (rate limits, caches → managed Redis) |
| Logs      | Structured, to stdout; aggregation belongs to the deploy platform                   |
| Health    | `/healthz` + `/readyz` endpoints from day one                                       |
| Shutdown  | Graceful: stop accepting, drain, close, exit                                        |
| Build     | One Dockerfile per app; image runs identically on any container host                |

## Dual authentication outline

- Web browser: cookie session (SSR-friendly), unchanged.
- Native/API clients: `POST /api/v1/auth/token` issues an access JWT
  (~15 min) + rotating refresh token persisted server-side (revocable table);
  refresh rotation invalidates the used token; account suspension kills the
  refresh chain.
- One session-resolution middleware accepts cookie OR `Authorization: Bearer`
  and produces the same session context consumed by controllers.
- Idempotency-Key header required on sync batches and telemetry ingestion.

## Hosting truth table

| Claim                                                  | Verdict                                                                                                                     |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| "VPS gives stability under many requests"              | FALSE — serverless/container autoscaling handles concurrency better than a fixed box                                        |
| Long-running AI/agent loops exceed serverless timeouts | TRUE reason for a persistent process                                                                                        |
| Persistent connections (WebSocket/long SSE)            | TRUE reason                                                                                                                 |
| Continuous ingestion (telemetry/GPS at scale)          | TRUE reason                                                                                                                 |
| Predictable cost at sustained high traffic             | TRUE reason                                                                                                                 |
| Raw self-administered VPS                              | FORBIDDEN — use a managed container platform (Fly/Railway/Render/ECS); same persistent process, none of the sysadmin burden |

## Module extraction playbook (4 mechanical steps)

Use when a module earns its own deployable (scale, team, SLA):

```text
1. MOVE      src/modules/<m>  →  apps/services/<m>-api/src/modules/<m>
2. BOOT      copy src/app/ (server, health, env, shutdown) — ~5 files
3. TRANSPORT replace imports of the module's index.ts with HTTP/event calls
             (law 1 guarantees the call-site list is complete)
4. DEPLOY    new container on the same platform; update baseUrl/env
```

Rollback: the monolith keeps serving until cutover is confirmed; reverting is
a baseUrl change.

## Realtime and async defaults

- Streaming responses (chat): request-scoped SSE.
- Live data fan-out (positions, notifications): managed realtime channel
  (e.g. Supabase Realtime broadcast) — zero new infra when the DB provider
  already includes it.
- Background jobs/events: managed job bus (e.g. Inngest) with retries.
- Telemetry ingestion pattern: device buffer → batched idempotent POST
  (device seq + dual timestamps, dedupe by device+seq) → append-only table +
  latest-state upsert → realtime broadcast to dashboards.
- Self-managed Kafka/Rabbit/WebSocket clusters: only with a measured trigger,
  documented in the roadmap BEFORE building.
