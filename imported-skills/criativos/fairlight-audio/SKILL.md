---
name: fairlight-audio
description: Mixa dialogo, musica, SFX, EQ, compressor, limiter e loudness no Fairlight. Use na etapa de som depois do corte.
disable-model-invocation: true
---

# Fairlight

## Quando nao ativar

Desenho de impacto e camada criativa. Isso e sound-design. Aqui e nivel, clareza e entrega.

## Procedimento

1. Trilhas separadas: dialogo, sala, SFX, musica. Nao imprima tudo num bus antes de equilibrar.
2. Dialogo inteligivel primeiro. Corte ruido constante com corte alto so se nao comer consoante. Prefira limpar a gravacao a mascarar com musica.
3. Compressor no dialogo para segurar picos de proximidade, nao para esmagar a frase. Attack lento o bastante para o ataque da consoante.
4. Musica abaixa sob a fala (ducking) e volta no buraco. Nao deixe a musica em nivel de fundo o tempo todo se ela conduz um trecho sem fala.
5. Limiter no master so para pico. Loudness de medicao, nao de "deixar alto".
6. Alvos usuais, a confirmar no brief: streaming de dialogo perto de -14 LUFS integrado; comercial de TV pede norma da emissora. Nao entregue acima de -1 dBTP.

## Medicao

Sem Fairlight aberto, meça copia com `ffmpeg -i arquivo -af ebur128 -f null -`. Nao sobrescreva o master.

## Definicao de pronto

Fala compreendida sem subir o volume no meio, musica nao cobre consoante, pico abaixo de 0 dBFS.
