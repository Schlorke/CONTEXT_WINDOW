---
name: blender-animation
description:
  Animates in Blender with keyframes, interpolation, F-Curves, Actions, and NLA.
  Covers timing, spacing, arcs, anticipation, follow-through, overlap, and
  cycles for objects or rigged characters. Use for Blender motion, walk cycles,
  wings, or a landing. Do not use for Spline motion, weight painting, or a GLB
  export that only preserves existing clips.
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-22"
  sources: "https://docs.blender.org/manual/en/latest/animation/"
---

# Blender Animation

Se o `blender-master` ainda não foi lido, leia
`.agents/skills/blender/blender-master/SKILL.md`.

Atuação e decisão de timing ficam aqui. Rig e pesos ficam em `blender-rigging`.
Não duplicar aquele pipeline: se o alvo é um personagem com armature, a inspeção
do rig acontece antes do primeiro keyframe.

## Decisão

| Pedido                | Fazer                                                    |
| --------------------- | -------------------------------------------------------- |
| Objeto rígido         | Keyframe no objeto, Action nomeada                       |
| Personagem ou animal  | Pose bones descobertos na inspeção, Action nova          |
| Ciclo                 | Primeiro e último frame iguais; interpolation sem salto  |
| Clip para jogo ou web | Uma Action por gesto; NLA só se já existir edição lá     |
| "Está artificial"     | Timing e spacing nas F-Curves, não mais keyframes iguais |

Princípios e curvas: [references/principles.md](references/principles.md).

## Invariantes

- Não assumir bone `Bone` ou action `Action`. Listar e escolher.
- Não apagar Actions existentes. Criar outra.
- Não animar o rig "por cima" de NLA sem ver as strips.
- Root motion só se o pedido ou o export precisar.
- Checkpoint antes da primeira chave em arquivo do usuário.

## Validar

`frame_set` no início, no meio e no fim. O valor tem que mudar onde o gesto
muda, e repetir no loop. Captura em 2 ou 3 frames (`blender-visual-qa`). Curva
linear em cauda, asa ou corpo mole é falha de spacing, não sucesso.
