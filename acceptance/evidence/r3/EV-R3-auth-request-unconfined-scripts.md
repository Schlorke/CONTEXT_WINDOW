# Pedido 10 — autorização para execução com scripts não confinados

**Status:** pedido apresentado; **não** autorizado.
Esta mensagem / este arquivo **não** autoriza execução não confinada.
Um JSON válido **não** substitui autorização explícita do proprietário.
`GUARD_LIMITS.writeConfinement` permanece `false`; `CONFINED_EXECUTOR.available`
permanece `false`; a suíte de confinamento permanece não executada.

Política CX-15 permanece inalterada. Autorização eventual permite apenas o modo
`authorized-unconfined` e **não** aprova o requisito de confinamento.

## Acoplamento atual do harness (ler antes de decidir)

`scripts/acceptance.mjs` hoje aceita **um** arquivo `--authorize-unconfined <json>`.
Se esse arquivo estiver presente:

1. Todas as etapas scriptadas (A7, A8, A9a, A9b, A9c, A10b, A11b) passam a
   executar via `runGuardedScript`.
2. Os installs A6 / A10 / A11 passam a `ignoreScripts: false` (lifecycle de
   dependências), além das etapas de `pnpm run`.

Isso **agrupa** permissões que as operações individuais não exigem todas.
As unidades de decisão abaixo são separáveis por risco; autorizar o harness
inteiro hoje implica o pacote acoplado. Autorizar um subconjunto exige
confirmação explícita do proprietário sobre **quais** itens e, se necessário,
ajuste do harness de aceite (não do guard) **antes** de executar.

## 1. Significado de cada item

| Item | Operação | Requisito que pretende comprovar |
| --- | --- | --- |
| **A7** | `pnpm run verify` no produto gerado do pacote | Gates FSD + tokens, typecheck web/native, testes Vitest, `next build`, `expo export` passam no produto do pacote final |
| **A8** | `pnpm run check:tokens` no produto | Propagação de um token canônico nos três níveis (resolução de estilo, render web, export mobile Hermes) |
| **A9a** | Edits temporários `#C0FFEE` + `pnpm run tokens` (falha) + restore + `tokens` (passa) | Contraprova do gate de tokens: literais ilegais falham pela regra certa; estado restaurado passa |
| **A9b** | Edit temporário (feature → widget) + `pnpm run arch` | Contraprova FSD: import ilegal falha com `FSD-LAYER` |
| **A9c** | Edit temporário (native bypass do token) + `pnpm run check:tokens` | Controle negativo da propagação: `styleResolution: false` |
| **A10b** | `pnpm run test` no fixture legado | Caracterização do app legado (Vitest) |
| **A11b** | `pnpm run verify` no produto migrado (scaffold + overlay) | Mesmos gates/build no app migrado |
| **A12** | Comparação estrutural + resultados de A10b/A11b | Mesmo `cases.json`, mesmos títulos de teste, mesma contagem de `expect`, 7 testes no legado e A11b ok — **não** é um spawn próprio; depende de A10b e A11b |

A10 e A11 (install congelado) já passam com `--ignore-scripts`. Não precisam desta
autorização para o install em si. Só passam a lifecycle se o harness acoplado
ligar `ignoreScripts: false`.

## 2. Comandos, executáveis, diretórios e destinos previstos

**Invocação do aceite (se autorizado o pacote acoplado):**

```text
node scripts/acceptance.mjs --sandbox C:\Temp\cw-r3\acceptance --authorize-unconfined <arquivo.json>
```

| Papel | Valor |
| --- | --- |
| Executável Node | `C:\Program Files\nodejs\node.exe` (`process.execPath`) |
| Executável pnpm | `pnpm` no PATH (observado: 12.5.1 via npm shim) |
| CWD do harness | `C:\Projetos\Context_Window` (só para build do pacote / QA opcional) |
| Sandbox raiz | `C:\Temp\cw-r3\acceptance` (fora do perfil; sem workspace ancestral) |
| Run | `C:\Temp\cw-r3\acceptance\run-<ISO>\` |
| Produto | `...\run-<ISO>\product\produto` (cwd de A7/A8/A9*) |
| Sandbox do produto | `...\run-<ISO>\product` |
| Legado | `...\run-<ISO>\legacy\legacy-shop` (cwd de A10b) |
| Migrado | `...\run-<ISO>\migrated\loja` (cwd de A11b) |
| Store/TEMP/XDG | sob o sandbox do projeto correspondente (redirecionados; **não** confinam) |

Spawn por etapa (quando autorizada): `spawnSync("pnpm", ["run", <script>], { cwd: projeto })`
via `runGuardedScript`.

**Destinos previstos (intencionais):** árvore do produto/legado/migrado,
`.next`, `dist-export`, caches sob TEMP/XDG redirecionados, store sob sandbox.
**Destinos possíveis sem fronteira:** qualquer caminho permitido pelo SO ao
processo e filhos (Next, Expo, Vitest, Node) — o guard não impede.

**Watch pós-fato (telemetria, não bloqueio):** se existirem,
`%USERPROFILE%\.npmrc`, `%USERPROFILE%\node_modules\.modules.yaml`,
`%USERPROFILE%\.expo`. `changedOutside=[]` **não** prova ausência de escrita
externa.

## 3. Scripts e inspeção

### Scripts de projeto (inspecionados no template / fixture)

Fonte: `…/assets/template/package.json` e `test/fixtures/legacy-shop/package.json`.

| Script | Comando inspecionado | Usado por |
| --- | --- | --- |
| `verify` | `pnpm arch && pnpm tokens && pnpm typecheck && pnpm test && pnpm build:web && pnpm bundle:mobile` | A7, A11b |
| `check:tokens` | `node tools/token-propagation-check.mjs` → vitest de Buttons + `build:web` + `bundle:mobile` | A8, A9c |
| `tokens` | `node tools/token-check.mjs` | A9a |
| `arch` | `node tools/arch-check.mjs` | A9b |
| `test` | `vitest run` | A10b (legado); também dentro de `verify` |
| `typecheck` | `tsc` em 5 tsconfigs | via `verify` |
| `build:web` | `pnpm --filter @acme/web build` → `next build` | via `verify` / `check:tokens` |
| `bundle:mobile` | `pnpm --filter @acme/mobile bundle` → `expo export …` | via `verify` / `check:tokens` |

No legado: só `test` → `vitest run` (e `build` existe mas **não** é chamado por A10b).

Não há `postinstall` / `prepare` no `package.json` raiz do template nem do legado
(inspecionado).

### Builds de dependência (pnpm 12)

`pnpm-workspace.yaml` do template: `strictDepBuilds: true`, `allowBuilds.esbuild: false`
(revisado: script do esbuild **não** deve rodar). Outros pacotes com scripts de
build não listados em `allowBuilds` **falham o install** se tentarem build —
não foram inventados como “aprovados”.

### O que **não** foi inspecionado pacote a pacote

- Árvore completa de `node_modules` do produto/legado/migrado (centenas de
  pacotes): lifecycle (`preinstall`/`install`/`postinstall`/`prepare`) **só
  entra em jogo** se o install rodar com `ignoreScripts: false` (acoplamento
  atual do harness).
- Binários transitivos disparados por Next/Expo/Vitest (compiladores, bundlers).
- Nenhum teste de escape contra projetos reais do proprietário.

## 4. Efeitos esperados vs possíveis (sem confinamento)

**Esperados (intencionais, sob o sandbox do run):**

- Artefatos de build (`.next`, `dist-export`, caches de teste) no produto/migrado
- Saída PASS/FAIL por etapa no `acceptance-report.json` / `acceptance.log`
- Restauro dos arquivos editados em A9a/A9b/A9c após cada contraprova
- Restauração do `tokens.ts` dentro de `check:tokens` (o próprio script)

**Possíveis porque não há confinamento de escrita:**

- Escrita em caminhos fora do sandbox (TEMP real se env falhar, caches de
  ferramentas, pastas sob o perfil, etc.)
- Alteração de alvos na watch-list — ou escrita externa **sem** aparecer em
  `changedOutside`
- Rede (registry, se algum passo baixar), CPU/disco no host
- Corepack pode obter o binário pinado do pnpm (fora do gate de scripts do projeto)

Autorizar **não** transforma o ambiente em confinado.

## 5. Interrupção e verificações posteriores já previstas

**Interrupção / não-prosseguimento:**

- Preflight do guard com blockers → não faz spawn
- Política CX-15 sem auth válida → `blocked`, `spawned: false`
- `spawnSync` com timeout (scripts: até ~30 min; install: ~15 min)
- Etapa com `ok: false` entra em `failed`; o processo termina com exit 1 se
  houver falhas em etapas obrigatórias (PENDING não conta como FAIL)
- Não há handler dedicado de SIGINT além do comportamento do processo Node

**Verificações posteriores já no harness:**

- `record` grava `decision`, `telemetry`/`changedOutside`, `limits`
- A9*: restauro dos edits; A9a exige falha (exit 1) + hits `#C0FFEE` + restore
  pass (exit 0)
- A12 só fecha com mesma estrutura **e** execução (A10b/A11b) quando autorizado
- Relatório: `pending` vs `passed` vs `failed` — autorização **não** marca
  automaticamente A7–A9, A10b, A11b ou A12 como PASS

## 6. Objeto de autorização exigido pelo código atual

Campos em `validateUnconfinedAuthorization` (`scripts/lib/pnpm-guard.mjs`).
**Somente estes.** Nenhum campo inventado. Nenhum valor de `authorizedBy`
preenchido em nome do proprietário.

| Campo | Tipo | Regra | Significado |
| --- | --- | --- | --- |
| `command` | string (≥3 chars) | obrigatório | Descrição do comando delimitado que se autoriza |
| `scripts` | string **ou** array de strings (≥3 chars cada; array não vazio) | obrigatório | Scripts/lifecycle conhecidos cobertos pela autorização |
| `destinations` | string **ou** array | obrigatório | Destinos previstos / conhecidos |
| `risks` | string **ou** array | obrigatório | Riscos assumidos (incl. falta de confinamento) |
| `authorizedBy` | string (≥3 chars) | obrigatório | Identidade de quem autoriza — **só o proprietário preenche** |

Esqueleto (não é autorização; `authorizedBy` propositalmente vazio de aprovação):

```json
{
  "command": "(preencher: comando(s) delimitado(s) desta decisão)",
  "scripts": ["(preencher)"],
  "destinations": ["(preencher)"],
  "risks": ["(preencher)"],
  "authorizedBy": "(preencher somente com autorização explícita do proprietário)"
}
```

Uso, **após** autorização explícita e arquivo preenchido pelo proprietário:

```text
node scripts/acceptance.mjs --sandbox C:\Temp\cw-r3\acceptance --authorize-unconfined <arquivo.json>
```

Se comandos ou escopo mudarem depois da aprovação, a alteração deve ser
apresentada **antes** de executar.

## Unidades separáveis (recomendação de decisão)

| Decisão | O que cobre | Não inclui |
| --- | --- | --- |
| **D1** — só A9a | `pnpm run tokens` (+ edits temporários no produto) | verify, check:tokens, builds Next/Expo, lifecycle de install |
| **D2** — só A9b | `pnpm run arch` | tokens, builds, install com scripts |
| **D3** — A8 e/ou A9c | `pnpm run check:tokens` (vitest + next build + expo export) | `verify` completo, A10b/A11b, install com scripts |
| **D4** — A7 (e opcionalmente A11b) | `pnpm run verify` no produto (e/ou migrado) | lifecycle de install; A9*; A10b |
| **D5** — A10b | `pnpm run test` no legado | verify do produto, install com scripts |
| **D6** — A12 | só faz sentido **junto** com D4(A11b) + D5 (A10b) | não é spawn extra |
| **D7** — install com lifecycle (`ignoreScripts: false` em A6/A10/A11) | postinstall/prepare de dependências | **não** é exigido por A9a/A9b sozinhos |

**Pedido ao proprietário:** indicar quais decisões (D1–D7) autoriza, com texto
explícito. Se autorizar o harness acoplado de uma vez, declarar que aceita
D1+D2+D3+D4+D5(+D6) **e** D7 juntos.

## Alternativa ambiental (não pedida como construção)

Executor confinado com limites efetivos de escrita
(`CONFINED_EXECUTOR.requirement`). Enquanto `available === false`, a suíte que
exige confinamento permanece em skip — sem fallback ao host. **Não** será
construído um executor próprio neste pedido.

## Fora de escopo deste pedido

Perfis reais, recuperação `gb-locacoes`, credenciais, avaliações com modelos,
publicação, builds externos, testes de escape contra projetos reais.
