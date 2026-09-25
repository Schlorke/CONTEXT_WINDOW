---
name: fusion-vfx
description: Orienta Fusion em nos, mascara, tracking, key e compositing. Use quando a imagem precisa de composicao, nao so de um titulo na Edit page.
disable-model-invocation: true
---

# Fusion

## Quando nao ativar

Titulo simples ou ajuste de transform na Edit page. Isso nao precisa de Fusion.

## Procedimento

1. MediaIn no inicio, MediaOut no fim. Nao deixe nos orfaos.
2. Key: fundo uniforme e borda limpa antes de despill. Se a borda falhar, corrija a luz na filmagem em vez de esmagar o matte.
3. Mascara segue o movimento. Tracker com ponto de alto contraste. Se o track escorregar, pare e refaca o trecho; nao pinte por cima o plano inteiro.
4. Merge: fundo no background, elemento no foreground. Ajuste tamanho no primeiro plano, nao estique o fundo.
5. Cache o no pesado antes de julgar playback. Queda de FPS no viewer nao e defeito do corte.

## Free versus Studio

Magic Mask e ferramentas de studio nao devem ser assumidas. Se o no nao existir nesta instalacao, use mascara manual ou recorte no Blender e traga o intermediate.

## Definicao de pronto

O comp reproduz do MediaIn ao MediaOut e a borda do recorte aguenta um quadro parado.
