---
name: quality-control
description: Faz o controle de qualidade audiovisual antes de publicar. Use como ultima leitura antes da entrega.
disable-model-invocation: true
---

# Controle de qualidade

## Quando nao ativar

Rascunho interno marcado como rascunho.

## Procedimento

1. ffprobe: resolucao, FPS, codec, audio, duracao, pixel format.
2. Assista o arquivo exportado, nao so a timeline. Fade final, quadro preto e corte de palavra aparecem no export.
3. Texto: ortografia, nome do produto, safe area.
4. Som: fala sem clip, musica nao cobre consoante, sem estalo no corte.
5. Cor: plano adjacente sem pulo, UI branca continua branca.
6. Marca: nada inventado. Pendencia UNKNOWN listada.
7. Fonte original ainda no lugar.

## Definicao de pronto

Lista curta do que passou e do que bloqueia a publicacao. Sem bloqueio aberto, a peca pode sair.
