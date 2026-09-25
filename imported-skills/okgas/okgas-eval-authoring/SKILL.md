---
name: okgas-eval-authoring
description: >-
  OkGas AgentOps eval authoring and runner-v1. Use when creating/editing eval
  cases, datasets, eval hub UI, or CI eval workflow.
metadata:
  eis-kind: "engineering"
  mandatory: "false"
  runtimes: "codex,claude,cursor"
---

# OkGas Eval Authoring

The rule in force lives in `specs/`. This skill only routes.

## Specs

- `platform.authorization-gates` — real-LLM runs need explicit authorization in
  the current chat; the eval workflow costs API money
- `assistant.agentops-diagnosis` — diagnose the failing run before rewriting
  the eval
- `assistant.system-prompt-governance` — a tonal or policy failure is fixed in
  a database skill, never in TypeScript prompt prose
- `assistant.rag-grounding` — a retrieval change needs happy-path, irrelevant
  and injection cases
- `process.testing-policy` — how the suites relate
- `tenancy.model` — fixtures stay tenant-safe; no cross-org leakage

## Commands

`pnpm eval:run-v1` · `pnpm agentops:show <runId>` · workflow
`.github/workflows/eval.yml`

Tie a case to a capability already in the catalog. Never invent a tool.

Index: `specs/INDEX.md`.

## Output

Case id and intent, expected signal, cost risk (mock versus real LLM), and how
to re-run it.
