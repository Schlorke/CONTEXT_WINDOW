---
name: visual-review
description: Revisa render de vídeo ou still do estúdio e gera contact sheet. Use para revisão visual, exportação ou QC do Remotion. Não use para um oi nem para recriar a peça inteira.
---

# Revisão visual

Autoria local, versão 0.1.0. Não é skill oficial.

## Não usar

Antes de existir render em `outputs/`.

## Procedimento

1. Rode `pnpm verify` para duração, resolução e contact sheet.
2. Olhe início, clique, retorno ao plano geral e o formato 9:16.
3. Confira fonte, cursor, apresentador, legenda e o aviso de fixture.
4. Falha volta para correção. Não relaxe o critério para aprovar.
5. Registre o estado: validada, configurada sem teste, bloqueada ou não implementada.

## Saída

Contact sheet e nota em `jobs/<job-id>/review.md`. Aprovação: o arquivo de mídia foi inspecionado, não só o código.
