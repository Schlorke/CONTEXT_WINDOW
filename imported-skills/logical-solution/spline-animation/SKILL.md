---
name: spline-animation
description:
  Spline 3D motion — code-driven default via HTML overlay, easing, loops,
  entrances, idle, camera motion, hover motion, sequencing, and timing. Use when
  animating, spinning, orbiting, blooming, adding idle life, or scroll-related
  3D motion. Load MCP skill animation before creating moving objects. Load
  state-transitions only if the user names states, timeline, or the States
  panel. Do not use for static material or light-only edits.
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-20"
  sources:
    "Spline authoring-guide Motion & interactivity; authoring-guide-2 animation
    / state-transitions / html-content catalog"
---

# Spline Animation

Se o `spline-master` ainda não foi lido, leia
`.agents/skills/spline/spline-master/SKILL.md`.

**Sempre** antes de motion: `3d_load_skill("animation")` (channel map oficial).
Antes de escrever overlay: `html-content`. States do editor: `state-transitions`
só se o usuário pedir ou for kinematic physics.

## Decisão

Motion code-driven é o **default oficial**. States & Transitions são opt-in.
Toda animação precisa de propósito (ler o produto, transitar estado, idle
mínimo). Sem animação gratuita.

## Workflow

1. Ler `animation` **antes** de criar objetos — pivô e um nome estável por parte
   que se move.
2. Decompor por movimento: uma peça por eixo independente.
3. Entrada → entrega ao idle. Idle é secundário e pequeno.
4. Verificar em Play: `play()`, duas capturas com pose diferente, `stop()`. Não
   deixar o usuário preso em Play.
5. `spline-visual-qa`.

Princípios clássicos (quando couber):
[references/motion-principles.md](references/motion-principles.md).

## Qualidade

- Easing, anticipation e follow-through só se melhorarem a leitura.
- Mais de um elemento com stagger — não um único bob monolítico (contrato
  oficial).
- Hero deste site: movimento elegante e curto. Sem spin infinito chamativo.
- Scroll: o topic `interactivity` cobre Scroll event; a bridge HTML **não** relê
  scroll. Confirmar no skill MCP antes de prometer.

## Anti-padrões

- Construir a malha e só depois descobrir que o pivô está no centro errado.
- Migrar events que já funcionam para HTML "porque é default".
- Loop que impede o `renderMode: auto` de uma cena que deveria ser estática (ver
  `spline-web-performance`).
