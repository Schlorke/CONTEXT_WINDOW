---
name: spline-modeling
description:
  Spline 3D modeling with primitives, groups, parenting, booleans, paths,
  extrusion, bevel, subdivision, cloners, naming, scale, and pivots. Use when
  creating or editing meshes, geometry, CSG, lathe, shape blends, or object
  organization in Spline. Prefer the simplest geometry that reads correctly. Do
  not use for lights-only or material-only edits.
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-20"
  sources: "Spline authoring-guide + authoring-guide-2 topic catalog 2026-09-20"
---

# Spline Modeling

Se o `spline-master` ainda não foi lido, leia
`.agents/skills/spline/spline-master/SKILL.md`.

Antes do primeiro `3d_run_code` da sessão: `authoring-guide` ×3. Antes de CSG:
`boolean-operations`. Antes de metaball: `shape-blends`. Antes de vaso/garrafa:
`lathe`. Params de shape: `dsl-reference`.

## Decisão

Escolher a técnica **mais simples** que produza a silhueta. Primitiva > lathe >
extrude > boolean > customMesh > geração IA.

IA (`3d_generate_3d_model`) só com pedido explícito.

## Workflow

1. Inspecionar cena e âncora (`3d_get_scene_mcp`).
2. Planejar grupos e nomes semânticos (`Hero Sphere`, `Pedestal`,
   `Studio Ground`).
3. Montar partes **eixo-alinhadas** num `3d_run_code`; no call seguinte
   `group()` e só então rotacionar o grupo.
4. Pivô no eixo do movimento futuro (base da árvore, dobradiça, centro da
   órbita).
5. Re-read `3d_get_scene`. Screenshot só depois da silhueta estar certa.
6. Encerrar visual com `spline-visual-qa`.

## Regras oficiais que não se negociam

- Rotações em graus. Piso `Plane`/`Rectangle`: `rotation({ x: -90 })`, `y: 0`.
- Telhado quadrado: `Pyramid` (`radialSegments: 4`), **sem** +45° Y "de
  correção".
- Detalhe colado em superfície = `Decal`, não um plano lutando z-fight.
- Boolean / shape blend: carregar o topic skill **antes** de escrever o código.

Custo de geometria: [references/geometry-cost.md](references/geometry-cost.md).

## Qualidade

- Silhueta legível a distância de hero.
- Escala coerente na cena (um sistema de unidades).
- Sem `Sphere 14`. Sem boolean aninhado se um hole resolve.
- Depois de modelar, perguntar: existe equivalente com menos polígonos?
