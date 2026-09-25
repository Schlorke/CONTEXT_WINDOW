---
name: render-delivery
description: Escolhe codec, container, bitrate, resolucao e FPS de entrega. Use na exportacao final ou de revisao.
disable-model-invocation: true
---

# Entrega

## Quando nao ativar

Ainda nao ha picture lock, salvo um proxy de revisao marcado como revisao.

## Procedimento

1. Master de arquivo separado do arquivo de publicacao. Nao exporte so o H.264 e apague o projeto.
2. Revisao: H.264, 1920x1080 ou o quadro nativo, bitrate suficiente para ler texto. Nome `peca_v01_revisao`.
3. Master de edicao: ProRes 422 HQ ou DNxHR HQ no FPS da timeline.
4. Web e social comprimido: H.264 High, yuv420p, audio AAC, -14 LUFS como ponto de partida de streaming, pico a -1 dBTP.
5. FPS da entrega igual ao da timeline. Nao converta 24 em 30 para "ficar suave" sem pedido.
6. Free 21: nao assuma render acima de UHD, 10-bit ou acima de 60 fps. Se o pedido exigir, marque como recurso de Studio e nao force.

## MCP

A ponte atual nao dispara render. Render e manual no Deliver, ou fica BLOCKED na automacao.

## Definicao de pronto

Arquivo novo, nome versionado, ffprobe conferido, original intocado.
