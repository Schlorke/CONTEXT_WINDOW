# Imagem / referência → 3D

Não copiar o screenshot. Decompor.

```text
OBSERVE → DECOMPOSE → IDENTIFY GEOMETRY → MATERIALS → LIGHTING
→ CAMERA → DEPTH → PLAN → BUILD → COMPARE → REFINE
```

## Classificar cada elemento

| Vira             | Quando                                                                        |
| ---------------- | ----------------------------------------------------------------------------- |
| Geometria real   | silhueta muda com o ângulo; precisa de sombra própria; o usuário pode orbitar |
| Textura / decal  | detalhe colado numa superfície já existente (logo, desgaste, número)          |
| Iluminação       | brilho, rim, queda de sombra que não é um objeto                              |
| Background       | céu, gradiente, fog — não construir um set de cinema se um sky/fog resolve    |
| Partículas       | volume difuso (poeira, fagulha) — só se o brief pedir; custam runtime         |
| Animação         | só o que a referência implica como movimento, não "para ficar vivo"           |
| Composição 2D/3D | headline, CTA e nav deste site são DOM; o 3D não as substitui                 |

## Comparar

1. Construir o bloco (geometria crua).
2. Screenshot vs referência: proporção e silhueta primeiro.
3. Materiais e luz depois — senão você texturiza um volume errado.
4. Discrepâncias viram lista; cada item vira um `3d_run_code` curto.
5. Encerrar com `spline-visual-qa`.

## IA

`3d_generate_image` / `3d_generate_3d_model` só com pedido explícito. Uma esfera
de vidro premium, um pedestal ou um rig de luz de produto **não** justificam
geração IA.
