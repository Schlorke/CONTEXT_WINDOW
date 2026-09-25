---
name: spline-camera-composition
description:
  Spline 3D camera and composition — placement, FOV, perspective, framing,
  visual hierarchy, thirds, negative space, depth, parallax, and responsive hero
  framing. Use when aiming the camera, composing a shot, or checking that 3D
  does not fight headline, CTA, nav, or contrast on a website. Do not use for
  mesh modeling or material stacks.
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-20"
  sources:
    "user-Spline 3d_set_view / 3d_take_screenshot schemas; Spline
    authoring-guide camera fitting via dsl-reference"
---

# Spline Camera + Composition

Se o `spline-master` ainda não foi lido, leia
`.agents/skills/spline/spline-master/SKILL.md`.

Fitting e FOV da câmera **do usuário**: DSL (`lookFrom` / `focus` e o que o
`dsl-reference` listar). `3d_set_view` / aiming de `3d_take_screenshot` miram a
câmera **privada de screenshot** e **não** movem a viewport do usuário.

## Workflow

1. Saber o assunto (nomes) e o que precisa de espaço negativo (headline DOM,
   CTA).
2. Compor: foreground / mid / background. Hero isolado, não no centro morto se o
   layout web já ocupa o centro com tipo.
3. Ajustar a câmera da cena via `3d_run_code` (o que o usuário vê).
4. Captura de trabalho: `objects` ou `target` no screenshot.
5. Check final de build: `lookFrom`/`focus`, depois `3d_take_screenshot` com
   `view: "live"` e `hero: ["NomeDoAssunto"]`. Avisos EXPOSURE / FRAMING / HERO
   = não done.

Web: [references/web-framing.md](references/web-framing.md).

## Qualidade

- Hierarquia: o olho cai no assunto, não num fill light estourado.
- Terços e espaço negativo a serviço do layout.
- Profundidade por overlap + luz, não por 12 props extras.
- 3D nunca prejudica headline, CTA, navegação, legibilidade, contraste.

## Anti-padrões

- Tratar screenshot camera como a câmera do produto.
- Preencher o frame com o mesh até o tipo DOM sumir.
- FOV extremo "de jogo" em landing premium.
