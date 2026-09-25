# Espelhamento web + mobile — contrato obrigatório

Todo projeto de produto com frontend em que as skills do Context Window forem instaladas começa
com esta arquitetura. O espaço não fica em branco e a estrutura não é decidida depois.

Espelhamento significa **uma fonte de design e comportamento consumida pelos dois clientes**, não
duas implementações que tentam parecer iguais.

## Árvore obrigatória

```text
apps/
└── clients/
    ├── web/        host Next.js: src/app (rotas, layout, metadata); src/host e src/shared só com integração real
    └── mobile/     host Expo:    src/app (rotas Expo Router);       src/host e src/shared só com integração real
packages/
├── frontend/       o único FSD do produto: src/app, pages, widgets, features, entities, shared
├── ui/             design system: src/contract, src/web/*.web.tsx, src/native/*.native.tsx, catalog.ts
└── design-tokens/  paleta, temas claro/escuro, espaço, raio, tipografia
```

Outros pacotes (`contracts`, `api-client`, …) entram só quando têm dois consumidores reais.

## Regras

1. Telas, widgets, features e entities nascem só em `packages/frontend`, em FSD estrito:
   `app → pages → widgets → features → entities → shared`, imports só para camadas inferiores,
   nunca para um slice irmão, sempre pelo `index.ts` do slice. Sem barrel global, sem `export *`.
2. `packages/ui` e `packages/design-tokens` são fundações: nunca importam `packages/frontend` nem os
   clientes. `frontend/shared/ui` apenas delega a `packages/ui` — nunca uma segunda fonte do mesmo
   componente.
3. Os clientes importam só pontos de entrada (`@escopo/frontend/app`, `@escopo/frontend/pages/*`,
   `@escopo/ui`, `@escopo/design-tokens`). `apps/clients/mobile` nunca importa `apps/clients/web`.
4. Código universal não importa `next/*`, `react-dom`, `react-native`, APIs de Node, do navegador
   ou server-only. O que é de plataforma vive em variantes `.web.tsx` / `.native.tsx` atrás do mesmo
   contrato. `package.json` expõe `react-native` e `default` em `exports`; Metro e Next resolvem cada
   lado. Prisma, segredos e módulos server-only nunca chegam aos bundles.
5. Tokens mudam em um lugar e chegam aos dois clientes; componentes não têm cor, espaço ou fonte
   literais.
6. O catálogo (`catalog.ts` + página `catalog`) mostra cada estado de cada componente no web e no
   mobile. Storybook é opcional e, se existir, importa os mesmos componentes.
7. Pastas de roteamento dos frameworks ficam nos clientes; a camada `pages` do FSD está em outro
   pacote e não colide com o Pages Router do Next.

## Provas exigidas

| Prova | Como |
| --- | --- |
| Gate de arquitetura | `pnpm arch`; os testes do gate injetam violações e exigem falha |
| Resolução real | `pnpm build:web` (Next) e `pnpm bundle:mobile` (`expo export` Android e iOS) |
| Valores só dos tokens | `pnpm tokens` recusa cor, tamanho ou constante local de estilo fora de `packages/design-tokens` (TS/TSX e CSS dos clientes, `packages/ui` e `packages/frontend`) |
| Token nos dois clientes | `pnpm check:tokens` troca um token por uma cor sentinela e a exige no estilo resolvido pelos componentes web e nativo, no HTML do Next e nos bundles do Expo |
| Instalação limpa | `pnpm install --frozen-lockfile` com o pnpm fixado em `packageManager`, fora de qualquer workspace pai |
| Variantes certas | o bundle mobile não contém o código só-web e o build web não contém o só-nativo |
| Componente com estados e fluxo compartilhado | catálogo + feature do template usada pelas duas plataformas |
| Execução nativa | build nativo e execução em emulador/dispositivo quando o ambiente permitir; visualização no navegador não substitui |

## Exceção documentada: componentes DOM no Expo

O padrão anterior de alguns produtos (OkGas `packages/panel-dom`, Logical Solution
`packages/site-dom`) montava a interface web dentro do Expo com componentes DOM (`'use dom'`, uma
WebView). Isso continua possível para um widget só-web cuja versão nativa não se justifica, desde que
fique explícito como WebView, isolado atrás de uma variante `.native.tsx` e fora das telas principais
do produto. Não é o mecanismo padrão do espelhamento e não conta como prova de execução nativa.

## Projetos que já existem

Adotar o contrato em um repositório existente segue `legacy-code-refactoring`: inventário
(`legacy-inventory.mjs`), testes de caracterização, esqueleto alvo, movimentos incrementais, gate a
cada passo, retirada da estrutura antiga. Instalar skills nunca migra código.

Referência normativa da skill:
`saas-skills/engineering/multiplatform-platform-architecture/references/client-fsd-mirror.md`.
