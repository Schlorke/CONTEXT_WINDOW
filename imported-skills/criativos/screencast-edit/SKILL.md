---
name: screencast-edit
description: Monta plano de zoom e cursor para demonstração de software no Remotion, com telemetria Playwright ou marcação manual. Use para screencast, zoom de tela ou captura. Não use para cor no Resolve nem para animar Rive ou Spline.
---

# Edição de screencast

Autoria local, versão 0.1.0. Não é skill oficial. No Resolve, use `screen-recording-editor`.

## Não usar

Pedido que não altera enquadramento da tela.

## Entradas

Plano em `jobs/<job-id>/edit-plan.json`. Captura opcional via `pnpm capture:demo`.

## Procedimento

1. Com app acessível, grave viewport, cliques e bounding box. Não grave senha.
2. Sem telemetria, não invente clique. Evidência insuficiente mantém o plano geral.
3. Zoom só quando a narração, o alvo e o resultado pedem. Respeite permanência e intervalo.
4. A mesma câmera vale para tela, cursor e destaque. Não desenhe um segundo cursor se o vídeo já tem um.
5. Correção local muda a cena indicada e preserva o resto.
6. Movimento ilustrativo fica marcado como `illustrative`.

## Saída

Plano com intervalo, alvo, destaque, evidência e motivo. Aprovação: testes de geometria passam e o cursor coincide com o alvo no frame do clique.
