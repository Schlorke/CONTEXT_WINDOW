---
name: audiovisual-debugging
description: Diagnostica codec, FPS, color space, audio, render, performance e midia offline. Use quando o arquivo ou o Resolve falha.
disable-model-invocation: true
---

# Diagnostico

## Quando nao ativar

O pedido e criativo e o arquivo abre normal.

## Procedimento

1. Separe sintoma: nao abre, offline, FPS errado, cor lavada, audio fora, render lento, MCP mudo.
2. ffprobe antes de reexportar. Anote codec, pix_fmt, fps, canais, color tags.
3. Offline no Resolve: o caminho mudou. Relink. Nao reimporte por cima perdendo o corte.
4. Cor lavada: LUT em cima de Rec.709, ou full range contra video range. Nao empilhe outro LUT.
5. Audio fora: FPS interpretado errado ou sample rate. Nao estique no ouvido; corrija a interpretacao.
6. Performance nesta maquina: GTX 1070 Ti e 32 GB. Proxy antes de culpar o disco. Fusion pesado precisa de cache.
7. MCP mudo no Free 21.1: `scriptapp` externo e nulo. A ponte Lua precisa estar rodando dentro do Resolve. Isso nao e bug de caminho Python.

## Definicao de pronto

Causa unica, prova (ffprobe, mensagem ou teste) e o proximo passo que nao destrói o original.
