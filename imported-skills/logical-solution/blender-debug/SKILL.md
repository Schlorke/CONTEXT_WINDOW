---
name: blender-debug
description:
  Diagnoses failed Blender operations and recovers once: bad deformation,
  artificial timing, exceptions, or a result that does not match the
  inspection. Use when a Blender edit fails or motion looks wrong. Do not
  use as the first skill for a happy-path material or light tweak.
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-22"
  sources: "bpy error reporting; project checkpoint rule"
---

# Blender Debug

Se o `blender-master` ainda não foi lido, leia
`.agents/skills/blender/blender-master/SKILL.md`.

## Ciclo

```text
operação → exceção ou validação → diagnóstico → um retry → rollback
```

Um retry com hipótese nova. O segundo erro igual encerra. Não há loop.

## Onde olhar

| Sintoma             | Hipótese em ordem                                           |
| ------------------- | ----------------------------------------------------------- |
| Exception           | Modo errado, contexto sem objeto ativo, nome que não existe |
| Não deforma         | Modifier, parent, grupo com nome diferente do bone          |
| Deforma demais      | Peso de outro bone; não "consertar" com mais subdivisão     |
| Animação artificial | Spacing linear, keys demais, pose copiada sem antecipação   |
| GLB sem clip        | Action não atribuída, NLA mudo, export sem animation        |
| Tela preta          | Câmera, world, luz — antes de samples                       |

## Rollback

Se existe cópia de checkpoint, voltar a ela para desfazer. Não apagar o `.blend`
original. Não salvar por cima depois de um erro não entendido.

## Relato

Uma linha: skill, tool, operação, resultado, se houve retry. Sem secret e sem
despejar a cena inteira.
