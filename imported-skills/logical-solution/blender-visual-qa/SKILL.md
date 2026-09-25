---
name: blender-visual-qa
description:
  Reviews Blender results with viewport captures. Capture, inspect, adjust,
  capture again, stop after three cycles. Use after a visual Blender edit or
  when the user asks for visual QA. A script without an exception is not
  success. Do not use for Spline screenshots.
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-22"
  sources: "live user-blender get_viewport_screenshot 2026-09-22"
---

# Blender Visual QA

Se o `blender-master` ainda não foi lido, leia
`.agents/skills/blender/blender-master/SKILL.md`.

## Ciclo

```text
executar → capturar → olhar → diagnosticar → ajustar → capturar → parar
```

`get_viewport_screenshot` (`max_size` 800 salvo necessidade). Fatos numéricos
(posição, contagem, frame) vêm de `get_scene_info` ou de `frame_set`, não do
pixel.

## Limite

No máximo 3 ajustes visuais. Se o mesmo problema continuar, pare e descreva. Não
repetir o mesmo código.

## O que reprova

- Sujeito fora do quadro quando o pedido era enquadrar.
- Luz que estoura o objeto a ponto de perder a forma.
- Posa ou frame em que a malha atravessa de um jeito que o pedido não pediu.
- Animação cujo frame do meio é igual ao primeiro.

## O que não fazer

Não tratar screenshot como prova de peso, de nome de bone ou de clip dentro do
GLB. Isso é dado, não pixel.
