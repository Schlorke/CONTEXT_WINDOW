---
name: okgas-agentops-diagnosis
description: >-
  Diagnose OkGas assistant/chat with AgentOps (pnpm agentops:show) BEFORE
  searching code. Use when the user reports assistant, chat, elicitation or
  skill behavior, or gives a conversation link, run id, logs or screenshot.
  Triggers: AgentOps, assistente errado, chat nao funciona, a IA respondeu,
  runId, link da conversa, /assistente?c=, elicitacao.
metadata:
  eis-kind: "engineering"
  mandatory: "false"
  runtimes: "codex,claude,cursor"
---

# OkGas AgentOps Diagnosis

The rule in force lives in `specs/`. This skill only routes.

## Specs

- `assistant.agentops-diagnosis` — run first, code last; the six-step order
- `assistant.system-prompt-governance` — where a behaviour fix must land
- `assistant.elicitation-contract` — which tool should have been chosen
- `assistant.rag-grounding` — whether retrieval reached the prompt
- `platform.authorization-gates` — the CLI hits the production database

Start with `pnpm agentops:show <runId-or-url>`.

Watch out: the persisted field is `telemetry.appliedSkills`, not
`manifest.systemBehaviorSkills` — see the spec's `## Known failure`.

Index: `specs/INDEX.md`.

## Output

Report the run evidence, the likely cause, the fix path, the verification you
ran, and what stayed unresolved.
