---
name: blender-modeling
description:
  Chooses how to model in Blender: edit mesh, modifiers, bevel, booleans,
  normals, origin, symmetry, retopology, UV, sculpt, or geometry nodes.
  Use for Blender mesh or topology tasks. Do not use for rigging, materials,
  Spline, or CSS layout.
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-22"
  sources: "https://docs.blender.org/manual/en/latest/modeling/"
---

# Blender Modeling

Se o `blender-master` ainda não foi lido, leia
`.agents/skills/blender/blender-master/SKILL.md`.

## Decisão

Escolher o meio menos destrutivo que resolve.

| Situação                                          | Preferir                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| Repetição, espessura, parafuso, arredondar aresta | Modifier (não aplicar)                                                  |
| Forma única e simples                             | Edição de malha                                                         |
| Volume orgânico ainda sem topologia final         | Escultura; retopo depois, não no meio                                   |
| Peça que muda por parâmetro                       | Geometry Nodes                                                          |
| Malha para deformar                               | Topologia que segue a dobra; evitar boolean aplicado                    |
| UV                                                | Só se o material ou o export precisar; não reunwrap o que já está certo |

Detalhe: [references/approaches.md](references/approaches.md).

## Invariantes

- Inspecionar o objeto ativo, o modo e a seleção antes de editar.
- Não aplicar modifier num mesh que já deforma com armature, salvo pedido.
- Origem e escala: aplicar escala não uniforme antes de bevel ou physics.
- Normal: conferir face orientation antes de "consertar" sombreamento com hacks
  de material.
- Preservar UV existente quando o pedido não for UV.

## Validar

Contagem de vértices, modificadores ainda na pilha, dimensões. Screenshot só se
a forma mudou (`blender-visual-qa`).
