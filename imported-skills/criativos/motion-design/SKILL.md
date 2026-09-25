---
name: motion-design
description: Define hierarquia, easing, timing e composicao de motion graphics. Use em cartela, lower third, transicao grafica ou reveal de UI.
disable-model-invocation: true
---

# Motion

## Quando nao ativar

Correcao de cor, mix ou corte sem elemento grafico.

## Procedimento

1. Hierarquia: uma ideia por quadro. Titulo, suporte, detalhe. O que nao for lido em dois segundos nao entra.
2. Duracao de entrada: 8–14 quadros a 24 fps para UI; 12–20 para titulo cinematografico. Saida mais curta que a entrada.
3. Easing: ease-out na entrada (chega e assenta), ease-in na saida. Linear so em scroll e progressao de dados.
4. Nao anime posicao, escala, opacidade e desfoque ao mesmo tempo sem motivo. Um canal principal por movimento.
5. Safe area do formato. Texto nao atravessa corte de plataforma.
6. Marca Logical Solution: se tipografia ou cor estiver UNKNOWN, use neutro e registre a pendencia.

## Criterio

O grafismo entra no corte da informacao, nao no compasso da musica, salvo quando o corte e musical de proposito.

## Definicao de pronto

Cada elemento tem in, hold e out em quadros, e o quadro parado ainda se le.
