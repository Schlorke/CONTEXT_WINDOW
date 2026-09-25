---
name: okgas-lab-elicitation
description: >-
  OkGas lab XOR instruction-editor isolation (ADR-027). Use when the user
  mentions laboratorio, sandbox, elicitacao, instruction editor, date picker da
  elicitacao, or ambiguous elicitation UI work.
metadata:
  eis-kind: "engineering"
  mandatory: "false"
  runtimes: "codex,claude,cursor"
---

# OkGas Lab XOR Instruction Editor

The rule in force lives in `specs/`. This skill only routes.

## Specs

- `assistant.lab-isolation` — the two surfaces are deliberately duplicated;
  identify the target before opening files; ask when the request is ambiguous
- `assistant.elicitation-contract` — which tool family the assistant may call
- `architecture.fsd-layers` — nothing imports the laboratory view

## Verify

`pnpm verify:fsd`

Index: `specs/INDEX.md`.

## Output

Say which surface you changed — lab, instructions, or both — and the gate you
ran.
