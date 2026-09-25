# Timing e curvas

Usar isto só quando a animação for o pedido.

- Antecipação: um key curto contra o gesto, antes do acento.
- Ação principal no acento. Follow-through e overlapping nos filhos (ponta da
  asa, cauda, cabeça), alguns frames depois da raiz do membro.
- Secondary motion é menor e mais lenta. Não compete com o gesto.
- Arcos na trajetória. Linha reta só em mecânico.
- Spacing: acelerar na saída, denso no amortecimento. Curva linear em corpo mole
  é o defeito "artificial".
- Staging: silhueta legível no frame do acento. Se a câmera não mostra, o
  problema pode ser `blender-camera`.
- Loop: valor e alça do primeiro frame iguais aos do último. Um frame duplicado
  no meio quebra o ciclo.
- Root motion: deixar no lugar se o chão da cena é a referência, salvo pedido de
  jogo ou de câmera que segue o deslocamento.

Não encher a Action de keys em todo frame. Dois extremos e um breakdown ensinam
mais do que uma curva travada.
