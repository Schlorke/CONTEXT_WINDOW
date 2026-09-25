---
name: spline-scene-analysis
description: >-
  Audits an existing Spline 3D scene before any edit: hierarchy, naming,
  transforms, materials, lights, camera, states, events, animations, cloners,
  complexity, and bottlenecks. Use when inspecting, auditing, mapping, or
  understanding a live Spline scene. Principle: inspect before edit. Do not use
  to author new geometry from scratch.
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-20"
  sources: >-
    user-Spline 3d_get_scene_mcp / 3d_get_objects / 3d_analyze_scene schemas
    2026-09-20
---

# Spline Scene Analysis

Se o `spline-master` ainda não foi lido, leia
`.agents/skills/spline/spline-master/SKILL.md`.

## Princípio

INSPECT BEFORE EDIT. Cena existente não se reconstrói sem justificativa.

## Workflow

1. `3d_get_scene_mcp` — digest + âncora + seleção + materiais + background.
2. Ler a hierarquia pelo **indent**. Não há campo parent separado.
3. Anotar flags: `SELECTED`, `hidden`, `cloner:`, `states:N`, `events:N`,
   `anims:N`.
4. `3d_get_objects({ ids })` nos nós com interatividade, cloner, ou o assunto do
   pedido.
5. `3d_analyze_scene` se o pedido envolve peso, FPS, ou "está pesado".
6. Entregar um mapa curto, depois editar só o recorte aprovado.

## O que o digest já diz

Formato oficial (não inventar campos):

`NAME [Type/Geometry] id p=x,y,z r=x,y,z s=x,y,z size=w,h,d FLAGS`

Defaults omitidos: `r=0,0,0`, `s=1,1,1`, visível, sem interatividade.
`+N more like "stem"` é run dobrada — `expand: [parentId]` ou
`select(o => o.name.startsWith('stem'))` no DSL.

Detalhe de flags e armadilhas:
[references/digest-flags.md](references/digest-flags.md).

## Relatório mínimo

- Hierarquia (grupos vs meshes vs lights)
- Naming (semântico vs `Untitled` / `Group 11`)
- Seleção atual e o que "isto" significa
- Materiais asset vs locais; unused assets
- Luzes e `castsShadows`
- States / events / anims (ids reais via `get_objects`)
- Complexidade: objects, polys, cloners, booleans (via `analyze_scene` quando
  chamado)
- O que NÃO mexer

## Qualidade

- Fatos vêm do digest e de `get_objects`, não do screenshot.
- Não sugerir rebuild porque o naming está feio — rename incremental.
- Âncora livre é para build **ao lado**, não para ignorar o conteúdo.
