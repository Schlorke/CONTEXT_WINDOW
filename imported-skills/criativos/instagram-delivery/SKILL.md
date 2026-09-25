---
name: instagram-delivery
description: Entrega pecas 9:16, 4:5 e 1:1 para Instagram. Use ao exportar Reel, feed ou corte quadrado.
disable-model-invocation: true
---

# Entrega Instagram

## Quando nao ativar

Master de arquivo ou site. Aqui o destino e o app.

## Procedimento

1. Reel e Story: 1080x1920, 9:16. Feed retrato: 1080x1350, 4:5. Quadrado: 1080x1080.
2. Texto e rosto fora das zonas de UI. No 9:16, nao encoste no topo nem no rodape.
3. H.264, yuv420p, AAC estereo. Duracao dentro do limite atual do formato; se o limite nao estiver no brief, confirme antes de cortar o final.
4. Capa legivel no primeiro quadro util, nao num quadro preto de fade.
5. Nao entregue Rec.2020 nem 10-bit para o feed. O app recomprime.

## Definicao de pronto

ffprobe mostra a geometria pedida e um quadro de checagem mostra texto inteiro.
