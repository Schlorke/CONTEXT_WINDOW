---
name: spline-interaction
description:
  Spline 3D interaction — hover, click, pointer, drag, scroll events, states,
  feedback, mouse, touch, and reduced motion. Use when wiring interactivity,
  events, or user-driven scene behavior. New behavior is code-driven by default
  (animation + html-content). Load MCP skill interactivity to edit existing
  events or event-only features (Scroll, Collision, DragDrop, LookAt). Do not
  use for idle loops with no input.
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-20"
  sources:
    "user-Spline 3d_get_objects schema; Spline authoring-guide-2 interactivity
    catalog"
---

# Spline Interaction

Se o `spline-master` ainda não foi lido, leia
`.agents/skills/spline/spline-master/SKILL.md`.

Nova interação: `animation` + `html-content`. Interatividade **já existente**,
ou feature só de events: `interactivity`. `3d_get_objects` **antes** de
`updateEvent` / `updateAction` / `updateTween`.

## Workflow

1. Digest → flags `events`/`states`.
2. `3d_get_objects` nos ids reais. Não inventar event id.
3. Escolher canal (código vs events) pela regra acima.
4. Feedback imediato e reversível (hover out / click segundo).
5. Play mode para verificar; `stop()` no fim.
6. `spline-visual-qa` se a interação muda o look.

Input e a11y: [references/input-and-a11y.md](references/input-and-a11y.md).

## Qualidade

- Mouse e touch. Drag no desktop pode ser inútil no mobile deste site (intro já
  desliga órbita).
- Não roubar o scroll da página se o host usa Lenis — Scroll event Spline é
  opt-in consciente.
- Reduced motion: desligar motion não essencial.
- Storytelling interativo > easter egg que compete com o CTA.

## Anti-padrões

- Recriar events que já existem.
- Hover-only sem equivalente no toque.
- Pointer lock / drag que prende o scroll mobile.
