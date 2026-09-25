---
name: blender-to-resolve
description: Leva render do Blender ao Resolve com intermediate e entrega. Use quando a midia nasce no Blender, inclusive o cisne.
disable-model-invocation: true
---

# Blender para Resolve

## Quando nao ativar

Footage de camera ou tela, sem 3D.

## Procedimento

1. Nao edite o arquivo de cena do Blender para "consertar" cor no Resolve. Ajuste no Blender se o problema for de render.
2. Intermediate de master: sequencia EXR ou ProRes 422 HQ / DNxHR HQ quando o destino for cor e VFX. H.264 e entrega, nao master de 3D.
3. Combine FPS, resolucao e pixel aspect com a timeline. 24, 25 e 30 nao se misturam sem decisao explicita.
4. Alpha: EXR ou ProRes 4444. H.264 nao carrega alpha.
5. Nome: `peca_shot_v01_####.exr`. Versao nova em pasta nova.
6. No Resolve, a timeline nasce com o FPS do render. Cor: trate EXR linear como cena, nao como Rec.709.

## MCP Blender

O MCP `blender` global ja existe. Nao o reconfigure. Use-o so se o pedido for alterar a cena, e sem destruir o arquivo original.

## Definicao de pronto

O intermediate abre no Resolve no FPS certo, com alpha se houver, e o arquivo de cena original intacto.
