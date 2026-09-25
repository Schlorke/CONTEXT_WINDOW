---
name: okgas-db-migration
description: >-
  OkGas production database schema changes. Use before any Prisma migrate
  command, adding or altering a column, resolving drift, or touching
  prisma/migrations. Triggers: migration, migrar banco, alterar schema, coluna
  nova, prisma migrate, db push, migrate diff, drift do banco,
  _prisma_migrations, backup do banco, P3018, 0A000.
metadata:
  eis-kind: "engineering"
  mandatory: "false"
  runtimes: "codex,claude,cursor"
---

# OkGas Database Migration

The rule in force lives in `specs/`. This skill only routes.

Stop before the first Prisma command: the default environment is PRODUCTION.

## Specs

- `platform.database-migrations` — the forbidden commands, the drift Prisma
  cannot see, the additive-only shape, and the backup that must precede a change
- `platform.authorization-gates` — the per-user breakdown owed before any
  destructive database operation
- `tenancy.rls-inventory` — **generated**: which tables carry a policy, so a new
  table is not left ungoverned
- `domain.entities-catalog` — **generated**: which models carry `orgId`
- `tenancy.gaps` — tables with `orgId` and no policy
- `tenancy.model` — what a tenant is; which models inherit it by relation
- `platform.backend-deploy` — the CI run that backs up, migrates and publishes;
  only `pnpm api:status` proves it landed

Never restate a column or table list here: it is generated. Run
`pnpm specs:tenancy`.

## Before and after the push

1. `pnpm ci:rehearse-migrate` passes locally. The `pre-push` hook repeats it
   on the pushed commit and blocks a migration that does not apply.
2. After the push, `pnpm api:status` — backup or `migrate deploy` can still
   fail inside `deploy-api.yml`.

## Verify

`pnpm prisma:validate` · `pnpm ci:rehearse-migrate` · `pnpm verify:prisma-fields` ·
`pnpm verify:tenant-rls`

Index: `specs/INDEX.md`.

## Output

State which database the command reached, the backup you took, the additive SQL
you applied, and the authorization the owner gave.
