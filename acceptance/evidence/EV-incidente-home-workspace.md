# Incidente: `pnpm install` de teste alcançou o workspace do diretório pessoal

Registrado em 2026-09-25 01:00 (-03) pelo agente que executou a implementação.

## O que aconteceu

`<user-home>` é, ao mesmo tempo, um repositório git e um workspace pnpm (`pnpm-workspace.yaml`,
`package.json` do projeto `<host-workspace-project>`). A pasta de trabalho externa
(`<user-home>\<external-sandbox>\...`) fica dentro dele.

A cópia do fixture legado (`sandbox\legacy-e2e\legacy-shop`) não tinha `pnpm-workspace.yaml`
próprio. Ao rodar `pnpm install` nela, o pnpm subiu a árvore, tratou `<user-home>` como raiz do
workspace e executou a instalação do projeto `<host-workspace-project>`:

| Quando (-03) | Evidência |
| --- | --- |
| 2026-09-24 23:53–23:54 | 1.459 pastas em `<user-home>\node_modules\.pnpm` com data desse intervalo; `.modules.yaml` `prunedAt: 2026-09-25 02:54 GMT` |
| 2026-09-25 00:47–00:48 | `.modules.yaml`, `.bin`, `.pnpm` e `.pnpm-workspace-state-v1.json` regravados; `.husky/_` regravado às 00:48:01 |

## Impacto verificado (somente leitura)

- `<user-home>\node_modules` foi religado pelo pnpm 10.27.0 (versão fixada no `packageManager`
  do projeto) usando o store da área de testes:
  `storeDir: <user-home>\<external-sandbox>\sandbox\template-e2e\.pnpm-store\v10`.
- Os scripts de ciclo de vida da raiz rodaram: `prepare` (`husky`, regravou `.husky/_`) e
  `postinstall` (`scripts/safe-postinstall.js`, que tenta `prisma generate`). Nenhum arquivo de código
  mudou: `lib/validations` sem alteração desde 2026-04-05; o `prisma.config.ts` da raiz aponta para
  `<product-repo>/prisma/prisma.config.ts`, que não existe, então a geração falhou antes de
  escrever (o script ignora a falha).
- Scripts de build liberados em `onlyBuiltDependencies` (Prisma, sharp, esbuild, supabase…) podem
  ter rodado dentro de `node_modules`.
- `package.json` e `pnpm-lock.yaml` da raiz sem alteração (datas de 2026-04-05);
  `git status` limitado a `package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc .husky lib prisma scripts`
  mostra só `.npmrc` modificado, com data de 2026-05-16 (anterior a esta sessão).
- O repositório `<product-repo>` não foi tocado (o arquivo de configuração citado não existe).

## Correções para não repetir

- `test/fixtures/legacy-shop/pnpm-workspace.yaml` e `pnpm-workspace.yaml` na raiz da biblioteca: cada
  um é a própria raiz de workspace.
- `.prettierrc.json` e `.editorconfig` (`root = true`) na raiz: a cópia limpa dentro do diretório
  pessoal herdava o `.prettierrc` de `<user-home>`.
- Os roteiros de teste externos passaram a checar a data de `<user-home>\node_modules\.modules.yaml`
  e a abortar se ela mudar; as instalações de fixture usam `--ignore-scripts`. Execuções seguintes
  (legado, cópia limpa) terminaram sem tocar o workspace pessoal.

## Ação sugerida ao dono (não executada)

O store da área de testes não deve ser apagado antes de o `node_modules` de `<user-home>` ser
refeito. Para voltar ao estado habitual, rode no diretório `<user-home>`, com o store padrão, a
instalação normal do projeto `<host-workspace-project>` (`pnpm install`); o pnpm deve pedir para recriar o
`node_modules` por causa da troca de store. Esse passo **não foi executado nem testado** aqui, porque
roda os scripts daquele projeto e está fora do escopo autorizado.
