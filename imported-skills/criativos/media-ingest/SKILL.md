---
name: media-ingest
description: Organiza ingest, nomes, bins, proxies e conform. Use ao receber midia nova, antes de cortar.
disable-model-invocation: true
---

# Ingest

## Quando nao ativar

A midia ja esta nomeada, offline resolvido e o pedido e corte.

## Procedimento

1. Copie para a pasta do job. Nao renomeie o cartao nem o original.
2. Nome: `data_camera_cena_take`. Espaco e caractere especial ficam de fora do nome tecnico.
3. ffprobe em cada arquivo: codec, FPS, resolucao, audio, duracao. Anote divergencia.
4. Proxy ou optimized media quando o original for pesado para o GTX 1070 Ti. O original permanece linkado.
5. Offline: relink para a copia, nao para um export antigo.
6. Bin espelha a pasta. Nao jogue tudo no root do Media Pool.

## Definicao de pronto

Inventario com caminho, FPS, resolucao e codec, e nenhum original movido para fora do lugar de origem sem copia.
