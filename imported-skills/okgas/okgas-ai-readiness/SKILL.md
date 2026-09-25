---
name: okgas-ai-readiness
description: >-
  Ground an IDE agent in OkGas before code, docs, UI, or AI-runtime work. Use
  for general orientation at the start of OkGas work, before touching code,
  docs, UI, or the AI runtime. Trigger phrases: por onde comecar, contexto do
  projeto, preflight, onboarding no repo, antes de editar.
metadata:
  eis-kind: "engineering"
  mandatory: "false"
  runtimes: "codex,claude,cursor"
---

# OkGas AI Readiness

The rule in force lives in `specs/`. Start there, not here.

## How to load

1. Open `specs/INDEX.md` and load block 1, the mandatory set.
2. In block 2, take only the rows whose globs match the files you will touch,
   plus the `depends` closure shown in the catalog.
3. `CLAUDE.md` is the router: identity, load protocol, absolute rules.

## Always relevant

- `platform.precedence` — the single source ordering
- `platform.git-safety` — destructive git is forbidden
- `platform.authorization-gates` — what costs money or touches production
- `process.docs-topology` — a rule lives in `specs/`, nowhere else
- `process.quality-gates` — which commands your change type requires
- `platform.actions-budget` — GitHub Actions runs only deploy, backup and
  watch; lint and tests stay local

Legacy manuals under `docs/ai/agents/` are being absorbed. Where a spec exists,
the spec wins.

## Output

End with a `Skills Used` block — see `platform.skills-reporting`.
