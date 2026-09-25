---
name: studio-router
description: Roteia pedidos do estúdio Remotion (vídeo programático, still, carrossel, captura Playwright, plano de edição). Não use para um oi, para Resolve/cor/Fusion, nem para carregar 3D, Storybook ou roteiro sem pedido explícito.
---

# Roteador do estúdio

Autoria local. Não é skill oficial.

## Quando não usar

- Saudação ou pergunta sem produção.
- Edição no DaVinci Resolve: use `creative-video-orchestrator`.
- Ajuste que não pede marca, 3D ou roteiro.

## Rotas

| Pedido | Skill |
| --- | --- |
| Roteiro ou estratégia | `content-script` |
| Importar Storybook ou tokens | `design-system-import` |
| Referência visual | `art-direction` |
| Screencast ou zoom de tela | `screencast-edit` |
| Apresentador, áudio ou legenda | `presenter-audio` |
| Thumbnail, still ou carrossel | `still-images` |
| Rive, Spline ou 3D | `motion-3d` |
| Revisar ou exportar | `visual-review` |
| Markup ou render Remotion | skills oficiais `remotion-markup`, `remotion-render`, `remotion-studio` |

Leia só a rota. Comandos: `pnpm doctor`, `pnpm studio`, `pnpm brand:check`, `pnpm capture:demo`, `pnpm render:video`, `pnpm render:still`, `pnpm verify`.
