---
name: blender-materials
description:
  Decides Blender materials with Principled BSDF and PBR: base color,
  roughness, metallic, normal, alpha, and texture coordinates. Use when
  the user asks to improve or create a Blender material or shader. Do not
  use when the user said not to change materials, or for Spline materials,
  lighting-only, or CSS.
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-22"
  sources: "https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/principled.html"
---

# Blender Materials

Se o `blender-master` ainda não foi lido, leia
`.agents/skills/blender/blender-master/SKILL.md`.

Lookdev é decisão, não um preset único.

## Decisão

1. Listar materiais já ligados aos objetos do pedido.
2. Se o pedido não cita um material, não criar outro nem trocar o slot.
3. Ajustar o Principled que já existe: roughness e metallic explicam a maior
   parte do "parece plástico".
4. Normal e displacement só com mapa ou pedido. Não inventar relevo.
5. Alpha: blend mode compatível com Eevee ou Cycles, o que a cena usa.
6. Coordenada: UV se existir; Object ou Generated só para procedural sem UV.

## Invariantes

- "Sem alterar materiais" encerra esta skill antes de qualquer escrita.
- Não remover nós de textura existentes.
- Cor de base continua a cor do objeto, salvo pedido de mudança de cor.
- Não baixar textura de Poly Haven sem pedido explícito.

## Validar

O material certo no objeto certo. Screenshot sob a luz já existente
(`blender-visual-qa`). Se a luz for o problema, pare e diga — não pinte por
cima. Iluminação é `blender-lighting`.
