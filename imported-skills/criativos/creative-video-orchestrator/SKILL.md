---
name: creative-video-orchestrator
description: Roteia pedidos de video, Resolve, Reels, comerciais, SaaS, color, audio, Fusion, Blender e entrega. Use quando o usuario pedir para editar, montar, colorir, mixar, legendar, renderizar ou entregar um video. Le somente as skills especialistas necessarias.
---

# Orquestrador de video

Esta skill decide o que ler. Ela nao substitui as especialistas.

## Procedimento

1. Classifique o pedido: institucional, comercial, SaaS, tela, social, cinema, motion, cor, audio, entrega, ingest, QC ou debug.
2. Leia no maximo as skills da rota abaixo. Nao leia as outras.
3. Se a marca for Logical Solution, inclua `logical-solution-video-director` e trate campo UNKNOWN como desconhecido.
4. Preserve arquivos-fonte. Nunca sobrescreva a midia original.
5. Use o MCP `criativos-resolve` apenas pelas ferramentas descritas em `davinci-mcp-operator`.
6. Se a ponte Lua nao estiver ativa, pare a parte do Resolve e siga com inspecao local via FFmpeg.

## Rotas

| Pedido | Skills |
|---|---|
| Editar Reel, Short ou TikTok | social-video, hook-retention, sound-design, color-grading, render-delivery |
| Instagram alem do vertical | instagram-delivery no lugar de render-delivery |
| Institucional Logical Solution | logical-solution-video-director, commercial-editor, storytelling, motion-design, fairlight-audio, color-grading |
| Demo de SaaS | b2b-tech-video, saas-product-video, screen-recording-editor, motion-design, fairlight-audio |
| Render vindo do Blender | blender-to-resolve, cinematic-editing, color-grading, sound-design, render-delivery |
| Landing page ou site | web-video-delivery, saas-product-video, quality-control |
| So cor | color-grading, quality-control |
| So audio | fairlight-audio, sound-design |
| So legenda | subtitles-accessibility |
| Ingest | media-ingest |
| Exportacao | render-delivery, quality-control |
| Falha de codec, FPS, offline ou render | audiovisual-debugging |

Acrescente `video-editing-director` somente quando a estrutura do corte ainda nao existe.
Acrescente `davinci-mcp-operator` somente quando for agir dentro do Resolve.
Acrescente `fusion-vfx` somente se houver compositing, key, tracking ou mascara.

## Definicao de pronto

O plano nomeia as skills lidas, a midia de trabalho (copia ou timeline nova) e o que ficou bloqueado.
