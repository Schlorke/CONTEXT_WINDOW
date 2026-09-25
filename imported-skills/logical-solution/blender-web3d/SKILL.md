---
name: blender-web3d
description:
  Prepares a Blender scene for the web as glTF 2.0 or GLB: animation
  clips, skinning, morphs, materials, texture size, polycount, and
  optional Draco, Meshopt, or KTX2. Use for landing pages, Three.js,
  React Three Fiber, or a web export. Do not use for Spline runtime, and
  do not decimate or apply modifiers unless the user asked.
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-22"
  sources: "https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html"
---

# Blender Web 3D

Se o `blender-master` ainda não foi lido, leia
`.agents/skills/blender/blender-master/SKILL.md`.

Pipeline: Blender → GLB → otimização opcional → runtime web. Three.js, React
Three Fiber, Next.js, WebGL, WebGPU e Spline são destinos diferentes. Esta skill
entrega o GLB. Não embute a cena no site.

## Decisão

1. Inspecionar malha, armature, Actions, NLA, materiais, imagens.
2. Exportar uma **cópia**. `export_apply` fica desligado se houver modifier que
   multiplica geometria (Array, Subdivision).
3. Animações: exportar Actions ou NLA que já existem. Não criar gesto novo aqui
   — isso é `blender-animation`.
4. Draco, Meshopt ou KTX2 só se o pedido citar peso de download. Não são o
   default: complicam o loader e são difíceis de reverter no arquivo entregue.
5. Não decimar, não aplicar armature, não juntar malhas sozinho.

Orçamento e checagens: [references/export.md](references/export.md).

## Invariantes

- O `.blend` de origem não é sobrescrito.
- Material sem equivalente glTF (shader custom pesado) é reportado, não
  "convertido" num Principled genérico sem aviso.
- Escala em metros. Um personagem de 17 unidades não é "otimizado".

## Validar

Magic `glTF` no GLB, tamanho em bytes, e um load de volta (`import` numa cena
vazia de teste, ou checagem dos chunks) confirmando que o clip pedido está lá.
Não declarar sucesso só porque o operador retornou.
