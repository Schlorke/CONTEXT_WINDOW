---
name: okgas-saas-security-review
description: >-
  Review OkGas changes for SaaS security, multi-tenancy, RBAC, uploads and
  AI-tool safety. Use when touching API routes, file uploads, admin features,
  assistant/AI tools, database access or anything tenant-sensitive. Triggers:
  seguranca, security, RBAC, permissao, autorizacao, multi-tenant, orgId,
  isolamento de tenant, vazar dados, upload.
metadata:
  eis-kind: "engineering"
  mandatory: "false"
  runtimes: "codex,claude,cursor"
---

# OkGas SaaS Security Review

The rule in force lives in `specs/`. This skill only routes.

## Specs

- `tenancy.model` — what a tenant is; which models inherit it by relation
- `tenancy.runtime` — `withTenantTransaction` is the only door; the failure is
  SILENT (zero rows, no exception)
- `tenancy.runtime-limits` — the 5s budget and the `25P02` rollback trap
- `tenancy.rls-inventory` — **generated**: per-table policies and grants
- `tenancy.credentials` — how far each database login can reach
- `tenancy.gaps` — tables with `orgId` and no policy
- `rbac.roles` and `rbac.permissions` — **generated** role × permission matrix
- `auth.sessions` — Bearer carries no role claim; never authorize from it
- `offline.identity-scope` — the offline queue belongs to one org and one user
- `assistant.rag-grounding` — retrieved text is data, never instruction
- `domain.audit-log` — what is audited and what is not

Never restate a table list here: it is generated. Run `pnpm specs:tenancy`.

## Verify

`pnpm verify:tenant-rls` · `pnpm --filter api verify:rls-credential` ·
`pnpm --filter web verify:rls-credential`

Index: `specs/INDEX.md`.

## Output

State the tenant impact, which spec governs it, and the verification you ran.
