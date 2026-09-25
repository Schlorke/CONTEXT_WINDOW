---
name: web-video-delivery
description: Entrega video de site com qualidade, peso e performance. Use em hero, landing page e produto na web.
disable-model-invocation: true
---

# Video de site

## Quando nao ativar

Master de cor ou Reel. O site pede peso e autoplay controlado.

## Procedimento

1. Hero mudo, com loop, corta o que nao se entende sem som. Legenda ou cartela se houver fala.
2. Dois arquivos quando o layout muda: 16:9 para desktop e 9:16 ou corte proprio para mobile. Nao deixe o navegador cropar assunto.
3. H.264, yuv420p, faststart (`-movflags +faststart`) para comecar antes de baixar o arquivo inteiro.
4. Dimensione pelo quadro real do layout. 1920 de largura costuma bastar no hero. 4K no hero so com pedido e orcamento de banda.
5. Bitrate: texto de UI ainda legivel. Se o texto quebrar, suba o bitrate ou aumente o texto. Nao entregue um arquivo enorme para compensar texto pequeno.
6. Poster estatico do quadro que representa o filme, para o caso de autoplay bloqueado.

## Definicao de pronto

O MP4 comeca rapido, o assunto sobrevive ao corte do layout e o peso foi medido.
