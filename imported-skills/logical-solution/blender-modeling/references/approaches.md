# Quando usar o quê

Ler só o trecho do pedido.

## Modifiers

Manter na pilha enquanto a decisão puder mudar. Aplicar é destrutivo. Escala não
uniforme aplicada antes de Bevel e de Solidify.

## Boolean e bevel

Boolean para encaixe duro que a topologia manual custaria mais. Bevel largo pede
suporte, senão o Shade Smooth quebra. Em malha que deforma, evitar ambos
aplicados.

## Retopo e UV

Retopo quando a escultura ou o scan não deformam. UV quando há mapa. Não
reunwrap para "limpar" um bake que já funciona.

## Geometry Nodes

Usar quando a forma é parâmetro (contagem, espalhamento, espessura). Não
converter uma malha animada por armature em nós no meio do shot.

## Escultura

Volume e gesto. Sem vertex group de deformação no meio do sculpt. Retopo antes
de rig.

## Física e partículas

Cloth, rigid body, fluid e partículas são simulação: cache, escala em metros, e
não misturar com a Action do personagem sem bake pedido. Não assar cache em cima
da única cópia do arquivo.
