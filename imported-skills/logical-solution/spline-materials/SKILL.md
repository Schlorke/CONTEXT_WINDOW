---
name: spline-materials
description: >-
  Spline 3D materials and surface look using PBR thinking and Spline layer
  stacks: base color, roughness, metalness, transmission/glass, opacity,
  emissive, textures, reuse. Use when changing appearance, glass, metal, fabric,
  silk, rubber, ceramic, plastic, matte, glossy, or when a surface reads as the
  wrong material. Load MCP skill materials-and-look before non-trivial stacks.
  Do not use for lights-only or mesh topology.
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-20"
  sources: >-
    Spline authoring-guide-2 materials-and-look catalog; user-Spline material
    asset digest 2026-09-20
---

# Spline Materials

Se o `spline-master` ainda não foi lido, leia
`.agents/skills/spline/spline-master/SKILL.md`.

Antes de stack não trivial, decal, vidro/transmission ou tela emissiva:
`3d_load_skill("materials-and-look")`. Antes de `generateTexture`:
`texture-drawing`. Params: `dsl-reference`.

## Decisão

A DSL e as layer tables oficiais mandam. Este arquivo manda o **critério**. Não
inventar nomes de layer.

Leituras PBR quando o look precisa delas (metal vs dielétrico, roughness,
transmission). O Spline expressa isso em **layer stacks** (color, light,
gradient, fresnel, transmission, depth, texture, displace, matcap) — confirmar
props no topic skill, não aqui.

## Workflow

1. Digest: quais material assets existem e quem usa.
2. Reusar asset antes de criar outro (`Untitled Material` duplicado é cheiro).
3. Identificar o material do brief (tabela em
   [references/pbr-register.md](references/pbr-register.md)).
4. Aplicar no objeto alvo (seleção ou id). Não restylear a cena inteira.
5. Screenshot + `spline-visual-qa`. Superfície "plástico" em tecido/orgânico =
   falhou.

## Qualidade

- Metal: energia nos highlights, roughness baixo-médio, sem rainbow.
- Vidro: transmission, não um metal branco com opacity 0.3.
- Tecido/seda: roughness alto, sem fresnel de carro; seda tem highlight
  estreito, não espelho.
- Matte: roughness alto, sem matcap metálico.
- Telas/signage: receita "Screens & displays" do `materials-and-look`
  (self-lit). Texto ilegível = não done.
- Hero deste site: superfícies sutis; evitar perolado/chrome de template.

## Anti-padrões

- Aparência metálica/perolada quando o brief pede tecido ou orgânico.
- Um material novo por objeto quando um asset compartilhado serve.
- Gradient em volume que deveria ser lighting.
