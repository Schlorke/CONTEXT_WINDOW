---
name: design-system-import
description: Importa Design System para brands/<id> a partir de Storybook, pasta ou tokens indicados. Use quando o pedido citar Storybook, tokens, componentes ou marca. Não use para inventar identidade nem para um ajuste de legenda.
---

# Importação de Design System

Autoria local, versão 0.1.0. Não é skill oficial.

## Não usar

Sem fonte indicada. Sem Storybook no workspace, a consulta MCP fica pendente.

## Entradas

URL pública, pasta local ou pacote. Separe `campaignBrand` e `productBrand`.

## Procedimento

1. Não copie `node_modules`, segredos ou dados de produção.
2. Grave `brands/<id>/manifest.json` com origem, versão ou hash e status `verified`, `inferred` ou `unknown`.
3. Conflito entre doc, código e Storybook fica registrado. Não misture versões.
4. Screenshot não comprova token. Props e variantes vêm da fonte, não de inferência.
5. Rode `pnpm brand:check`.
6. Não migre Tailwind de material importado para a versão 4.

## Saída

Manifesto e lista do que continua desconhecido. Aprovação: nenhum valor oficial foi inventado.
