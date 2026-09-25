---
name: still-images
description: Produz thumbnail, still e carrossel com composição determinística. Use para imagem estática, capa ou peça de UI. Não use para gerar logo ou texto de interface por difusão.
---

# Imagens

Autoria local, versão 0.1.0. Não é skill oficial.

## Não usar

Pedido de vídeo em movimento, ou retoque quando a instrução é preservar pixels.

## Entradas

Assets oficiais ou a fixture `brands/fixture-tecnica`.

## Procedimento

1. Recorte, canvas, logo e tipo usam Sharp ou composição Remotion.
2. Preservação exata não recebe geração, contraste ou nitidez.
3. Sem provedor de geração configurado, a geração fica pendente. Prompt salvo não é imagem gerada.
4. Render com `pnpm render:still`.

## Saída

PNG em `outputs/`. Aprovação: texto de interface permanece vetorial ou tipográfico, não gerado.
