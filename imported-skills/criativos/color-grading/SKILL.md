---
name: color-grading
description: Conduz gestao de cor, scopes, exposicao, contraste, balanco, matching e look. Use na etapa de cor, depois do corte travado.
disable-model-invocation: true
---

# Cor

## Quando nao ativar

Antes do picture lock, salvo um balanco temporario para conseguir montar. Look definitivo espera o corte.

## Procedimento

1. Confirme o color space de entrada no clip e o de timeline/saida. Nao aplique LUT de camera em material Rec.709 ja convertido.
2. Ordem do no: equilibrio (exposicao e balanco), contraste, saturacao, look, janela. Nao comece pelo look.
3. Scopes: waveform para exposicao, parade para balanco, vectorscope para pele e saturacao. Pele nao vai para o canto do vectorscope.
4. Match: iguale o plano de referencia primeiro. O look e o ultimo no, copiado depois do match.
5. Entrega web e social: material de tela em Rec.709, sem deixar o branco estourado no waveform.

## Condicional

Tela de software gravada ja nasce em sRGB/Rec.709. Nao "normalize" como log. So una a tela aos planos de camera se os dois existirem no mesmo filme.

## MCP

Nesta instalacao a ponte nao expoe grade. A cor e decisao no Color page, nao chamada cega.

## Definicao de pronto

Planos adjacentes nao pulam exposicao, e o branco da UI continua branco.
