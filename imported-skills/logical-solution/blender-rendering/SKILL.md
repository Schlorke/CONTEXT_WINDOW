---
name: blender-rendering
description:
  Chooses Blender render settings for preview, still, animation, product,
  character, or web: Cycles or Eevee, samples, denoise, light paths,
  resolution, transparency, motion blur, and color management. Use for
  Blender renders. Do not use for Spline screenshots or for GLB export
  (that is blender-web3d).
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-22"
  sources: "https://docs.blender.org/manual/en/latest/render/cycles/; https://docs.blender.org/manual/en/latest/render/eevee/"
---

# Blender Rendering

Se o `blender-master` ainda não foi lido, leia
`.agents/skills/blender/blender-master/SKILL.md`.

## Decisão

O objetivo escolhe o motor. Não há um preset único.

| Objetivo                       | Motor                                     | Notas                                       |
| ------------------------------ | ----------------------------------------- | ------------------------------------------- |
| Olhar rápido                   | Eevee ou Cycles com poucos samples        | Sem motion blur                             |
| Still de produto ou personagem | Cycles                                    | Denoise ligado, samples até a sombra limpar |
| Animação                       | O motor em que a luz já foi aprovada      | Motion blur só se houver movimento rápido   |
| Fundo transparente             | Film transparent                          | PNG ou EXR, não JPEG                        |
| Web / tempo real               | Não renderizar o frame final como entrega | Export é `blender-web3d`                    |

Samples e light paths sobem quando o diagnóstico é ruído ou fogo, não quando a
luz está fraca (`blender-lighting`). Cor: Filmic ou AgX já definido na cena
permanece, salvo pedido.

Composição (glare, cryptomatte, SDR+HDR) só se o pedido falar em comp. Não
montar node tree "para organizar".

## Invariantes

- Não disparar render de animação inteira sem o usuário pedir o intervalo.
- Escrever saída numa pasta nova, não por cima de frames existentes.
- Preview de agente: `get_viewport_screenshot`, não um render 4K.

## Validar

O arquivo de saída existe, a resolução é a pedida, o fundo bate com o pedido.
Imagem preta: câmera, world e luz antes de samples.
