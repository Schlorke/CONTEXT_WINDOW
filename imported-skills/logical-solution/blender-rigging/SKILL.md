---
name: blender-rigging
description:
  Inspects and edits Blender armatures, bones, constraints, vertex groups, and
  weights. Use for rigs, deformation, skinning, or a rigged character or animal.
  Do not use for keyframe acting, Spline, or material work. Never change a rig
  before the inspection pipeline.
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-22"
  sources: "live Blender 5.2.1 scene inspection 2026-09-22; bpy armature API"
---

# Blender Rigging

Se o `blender-master` ainda não foi lido, leia
`.agents/skills/blender/blender-master/SKILL.md`.

## Pipeline obrigatório

```text
inspect → mesh → armature → bones → constraints → vertex groups
→ weights → actions → NLA → checkpoint → só então editar
```

Detalhe e o que não apagar: [references/pipeline.md](references/pipeline.md).

## Decisão

| Sintoma               | Onde olhar primeiro                                        |
| --------------------- | ---------------------------------------------------------- |
| Não deforma           | Modifier ARMATURE, parent, vertex group com o nome do bone |
| Volume colapsa        | Pesos normalizados, bone errado influenciando              |
| Asa ou membro estoura | Cadeia daquele membro, não o rig inteiro                   |
| Osso não obedece      | Constraint, driver, herança de rotação                     |

Pedido só de análise: executar a inspeção e parar. Não entrar em Weight Paint.

## Invariantes

- Mapear os bones que existem. Nomes `Bone`, `Bone.001` são dados deste arquivo,
  não um padrão para criar por cima.
- Não remover armature modifier, vertex groups ou constraints sem pedido.
- Não renomear bone que já tem peso: o grupo deixa de casar.
- Uma correção de peso mexe só nos grupos citados pelo diagnóstico.

## Validar

Pose de teste reversível (rotacionar e voltar a zero) ou comparar um frame. Se a
malha explodir, rollback da cópia. Leia `blender-debug`.
