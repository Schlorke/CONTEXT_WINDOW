---
name: okgas-a11y-ui
description: >-
  OkGas accessibility and inclusive UI checks for web/Storybook. Use when the
  user mentions a11y, acessibilidade, teclado, aria, contraste, screen reader,
  or focus traps in dialogs/sheets.
metadata:
  eis-kind: "engineering"
  mandatory: "false"
  runtimes: "codex,claude,cursor"
---

# OkGas Accessibility UI

The rule in force lives in `specs/`. This skill only routes.

## Specs

- `ui.accessibility` — focus, keyboard, accessible names, contrast floor
- `ui.design-tokens` — the generated registry owns the contrast restriction
- `ui.component-placement` — reuse the primitive that already owns ARIA
- `ui.storybook-contract` — the story that proves the states

Nested dialog backdrop rule:
`.cursor/rules/nested-dialog-assistente-child-backdrop.mdc`

## Verify

`pnpm test:run:storybook` · `pnpm verify:ai`

Index: `specs/INDEX.md`.

## Output

List the a11y risks touched, the components reused, and how focus and keyboard
were checked.
