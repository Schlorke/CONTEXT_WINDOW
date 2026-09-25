---
name: sound-design
description: Desenha transicoes, impacts, risers, ambience, sons de UI e camadas. Use quando o corte precisa de som desenhado, nao so de mix.
disable-model-invocation: true
---

# Desenho de som

## Quando nao ativar

So normalizar loudness de uma faixa pronta.

## Procedimento

1. Cada camada tem funcao: quem, onde, o que mudou. Ambience cola o lugar. Impact marca o corte que muda a ideia. Whoosh sem corte correspondente sai.
2. UI: o som acontece no quadro do clique, curto, sem reverb de sala grande.
3. Riser so antecipa uma revelacao que existe. Se nao ha revelacao, nao ha riser.
4. Nao cubra a fala. Se o impacto coincide com a palavra, mova o impacto para o corte visual.
5. Fonte de biblioteca fica em bin proprio. Nao substitua o audio original da camera.

## Definicao de pronto

Da para mutar cada camada e ainda explicar o que ela fazia.
