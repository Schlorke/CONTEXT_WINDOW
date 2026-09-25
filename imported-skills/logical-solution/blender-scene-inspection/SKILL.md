---
name: blender-scene-inspection
description:
  Read-only inspection of a live Blender scene. Lists objects, meshes,
  armatures, bones, cameras, lights, materials, actions, NLA, and constraints
  using real names. Use when the user asks to analyze, audit, or show a Blender
  scene or rig without modifying it. Do not use for edits, Spline, or CSS.
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-22"
  sources: "live user-blender get_scene_info and bpy.data 2026-09-22"
---

# Blender Scene Inspection

Se o `blender-master` ainda não foi lido, leia
`.agents/skills/blender/blender-master/SKILL.md`.

Esta skill só lê. Não chama `save`, não insere keyframe, não muda modo.

## Workflow

1. `get_scene_info` com o pedido do usuário em `user_prompt`.
2. Se precisar de detalhe, um `execute_blender_code` de leitura. Imprimir JSON.
   Não atribuir transforms.
3. Reportar o que existe. Dizer o que não foi encontrado.

## O que coletar

Objetos e tipo, collections, modifiers, materiais, câmeras, luzes. Se houver
armature: bones reais, constraints de pose, vertex groups do mesh pai, actions,
NLA strips, drivers. Não usar os nomes `Armature`, `Bone` ou `Cube` como se
fossem universais — neste arquivo eles podem existir, noutro não.

## Parar

Pedido de leitura termina no relatório. Edição é outra skill, depois de
checkpoint.

## Falha

Se o MCP não alcançar o Blender, dizer isso e não inventar a cena. Não abrir o
`.blend` do usuário num processo novo.
