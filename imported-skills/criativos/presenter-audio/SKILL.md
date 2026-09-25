---
name: presenter-audio
description: Posiciona apresentador, trata áudio e revisa legendas em português brasileiro. Use para apresentador, narração, legenda, SRT ou VTT. Não use para inventar rosto ou voz, nem para 3D.
---

# Apresentador e áudio

Autoria local, versão 0.1.0. Não é skill oficial. Legendas no Remotion também seguem a skill oficial `remotion-captions`.

## Não usar

Peça sem fala, apresentador ou legenda.

## Entradas

Mídia fornecida. Sem imagem real, o slot fica com o texto "Apresentador não fornecido".

## Procedimento

1. Não invente aparência, fala ou voz.
2. Posição estável, sem cobrir alvo, legenda ou mensagem.
3. Recorte ruim vira janela limpa. Não entregue contorno defeituoso.
4. Transcrição só com timestamps do áudio. Roteiro planejado não vira transcrição.
5. `@remotion/whisper-webgpu` e `@remotion/video-matting` não estão instalados. Não declare a capacidade pronta.
6. Narração sintética só com ferramenta, voz, direitos e custo autorizados.

## Saída

Layout ou legenda revisada. Aprovação: o placeholder não é apresentado como pessoa real.
