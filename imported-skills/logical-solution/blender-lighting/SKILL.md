---
name: blender-lighting
description:
  Lights Blender scenes with key, fill, rim, HDRI, area, sun, spot, or point
  lights, plus exposure. Use for Blender illumination, product, character, or
  cinematic light. Do not use for Spline lights, materials, or CSS. Do not add
  lights when the user asked only for materials.
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-22"
  sources: "https://docs.blender.org/manual/en/latest/render/lights/light_object.html"
---

# Blender Lighting

Se o `blender-master` ainda não foi lido, leia
`.agents/skills/blender/blender-master/SKILL.md`.

## Decisão

Ler as luzes que já existem. Uma função por luz.

| Papel | Quando                                                     |
| ----- | ---------------------------------------------------------- |
| Key   | A luz que explica a forma. Quase sempre a primeira decisão |
| Fill  | Só se a sombra da key enterra o detalhe                    |
| Rim   | Separa o sujeito do fundo                                  |
| HDRI  | Ambiente e reflexo; reduzir intensidade se já houver key   |
| Sun   | Exterior ou hora do dia, não produto pequeno               |

Escala: energia de Area e Point depende do tamanho da cena em metros. Não copiar
watts de outra cena. Exposição no Color Management ou na câmera, não "mais uma
luz" para clarear.

Produto: fundo controlado, key em ângulo, rim fraca. Personagem: key no rosto ou
no corpo, rim para a silhueta. Cinemático: contraste e uma direção só.

## Invariantes

- Pedido de luz não cria malha nem troca material.
- Não apagar luzes existentes sem dizer o nome.
- Nomear `Key Light`, `Fill Light`, `Rim Light` quando criar.

## Validar

Screenshot (`blender-visual-qa`). Sombra dura demais: aumentar tamanho da Area
ou ângulo do Sun, não subir samples.
