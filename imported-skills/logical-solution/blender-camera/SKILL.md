---
name: blender-camera
description:
  Frames Blender shots: focal length, sensor, composition, depth of field,
  focus, and camera animation. Use for a Blender camera, cinematic move,
  or tracking a character. Do not use for Spline cameras, CSS layout, or
  lighting-only requests.
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-22"
  sources: "https://docs.blender.org/manual/en/latest/render/cameras.html"
---

# Blender Camera

Se o `blender-master` ainda não foi lido, leia
`.agents/skills/blender/blender-master/SKILL.md`.

## Decisão

Achar a câmera da cena pelo tipo `CAMERA`. Não criar uma segunda se o pedido é
enquadrar a que existe.

| Intenção              | Lente (full frame como referência)                |
| --------------------- | ------------------------------------------------- |
| Retrato ou personagem | 50–85 mm                                          |
| Produto               | 80–100 mm, câmera mais longe                      |
| Ambiente              | 24–35 mm                                          |
| Acompanhar ação       | A lente fica; quem se move é a câmera, com easing |

Depth of field só com um alvo real (objeto ou bone descoberto). Foco no sujeito,
não no chão vazio.

Movimento: poucos keys, arco, antecipação curta se a câmera "chega". Travelling
paralelo gera parallax; zoom digital não. Não animar distorção de lente para
compensar enquadramento ruim.

## Invariantes

- Não mudar a lente para "consertar" um modelo fora de escala. Conferir
  dimensões primeiro (`blender-modeling` só se a escala estiver errada).
- Resolução de saída é `blender-rendering`.

## Validar

Screenshot pela câmera, não só pelo viewport do usuário. Sujeito inteiro no
quadro, espaço na direção do movimento.
