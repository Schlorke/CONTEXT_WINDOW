---
name: spline-hero-design
description:
  3D hero direction for this landing and premium tech, B2B, AI, and enterprise
  sites — dark navy, controlled white light, blue accent, depth, restrained
  motion, high contrast. Use for hero 3D, landing-page 3D, SaaS look, or Logical
  Solution visual register. Avoid neon, generic cyberpunk, glow spam, cheap
  templates, and objects that fight the headline.
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-20"
  sources:
    "User brief Logical Solution 2026-09-20; packages/site-dom hero +
    SplineScene; docs/04-ao-clonar.md"
---

# Spline Hero Design

Se o `spline-master` ainda não foi lido, leia
`.agents/skills/spline/spline-master/SKILL.md`.

Direção de arte da hero 3D. Puxa modeling / materials / lighting / camera /
visual-qa conforme o gap — não carrega animation/interaction/web-integration por
default.

## Registro deste projeto

Landing de cuidado íntimo feminino com interface de referência zentry.com no
movimento, mas o **3D pedido para Logical Solution** (este brief) é:

- navy / near-black
- luz branca controlada
- azul como accent, não como flood
- tecnológico sofisticado, profundidade, superfícies sutis
- movimento elegante, alto contraste, premium

Malha roxa de clone é visual **provisório** (`docs/04-ao-clonar.md`) até a cena
definitiva. Não tratar a malha roxa como direção aprovada.

Paleta e vetos:
[references/logical-solution-register.md](references/logical-solution-register.md).

## Workflow

1. Layout DOM primeiro: onde estão título, CTA, nav. O 3D ocupa o vazio.
2. Um assunto. Silhueta simples (esfera/pedestal/estrutura) > cidade cyberpunk.
3. Luz de produto (skill lighting). Material sutil (skill materials).
4. Motion só se ajudar a ler o volume — idle mínimo.
5. `spline-visual-qa` + captura live com `hero`.
6. Se for para o site: `spline-web-performance` antes de exportar.

## Anti-padrões (veto)

- Neon excessivo, glow, reflexo de showroom barato
- Cyberpunk genérico, grid infinita, partículas rainbow
- Objetos competindo com headline
- Estética de template Spline "AI startup"
