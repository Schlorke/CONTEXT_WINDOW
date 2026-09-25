# Relatório final — Context Window 2.0.0

Data: 2026-09-25. Ambiente das provas: Windows 11 (10.0.26200), Node.js 25.2.1, pnpm 12.5.1 (e
10.27.0 quando fixado pelo projeto), Next.js 16.3.6, Expo SDK 57 / React Native 0.86.3, Codex CLI
0.147.0-alpha.1.2, Claude Code 2.1.74, Cursor 3.22.7. Ponto de partida: commit `66194b0` com 370
mudanças locais do dono preservadas. Nada foi commitado, enviado ou publicado.

Legenda: **IMPLEMENTADO** (código/documento existe), **EXECUTADO** (rodou aqui), **APROVADO**
(rodou e passou no critério), **REPROVADO** (rodou ou foi observado e não passa), **NÃO VERIFICADO**
(não pôde ser executado; motivo indicado).

## Incidente durante a validação

Uma instalação `pnpm` de teste subiu até o workspace pnpm que existe no diretório pessoal
(`<user-home>`, projeto `<host-workspace-project>`) e religou o `node_modules` daquele projeto usando o store da
área de testes; os scripts `prepare` (husky) e `postinstall` do projeto rodaram. Nenhum arquivo de
código, `package.json` ou `pnpm-lock.yaml` foi alterado (verificado por data e `git status` limitado).
Causa corrigida (workspace próprio no fixture e na biblioteca, config do Prettier fixada, guarda nos
roteiros). Detalhes, provas e a ação sugerida (não executada): `evidence/EV-incidente-home-workspace.md`.
**Não apague** `<user-home>\<external-sandbox>\sandbox\template-e2e\.pnpm-store`
antes de refazer aquele `node_modules`.

## Preservação do trabalho local

Comparação por hash com o baseline da auditoria (2.540 arquivos; `evidence/EV-final-compare.json`):
2.477 inalterados, 47 modificados, 16 removidos, 152 adicionados.

- Inalterados: `imported-skills/` inteiro, `dist/` inteiro, `.markdownlint-cli2.jsonc`,
  `.markdownlint.yaml` e `saas-skills/integrations/cursor-rule-profiles.json` (com a edição local).
- Reescritos a partir das edições locais do dono, mantendo a intenção (espelhamento FSD, hosts finos,
  mobile sem importar o web) e trocando `packages/<produto>-dom` por `packages/frontend`: `README.md`,
  `AGENTS.md`, `CLIENT_FSD_MIRROR.md` e a skill `multiplatform-platform-architecture`. O texto
  anterior está no snapshot `<user-home>\<external-sandbox>\sandbox\repo-wt`.
- `.vscode/settings.json` apareceu durante a sessão (00:27) sem ter sido criado por este trabalho;
  não foi tocado.
- Nada foi adicionado ao índice do git; HEAD continua em `66194b0`.

## 1. O que foi implementado

| Área | Arquivos | Responsabilidade | Estado |
| --- | --- | --- | --- |
| Instalador | `scripts/cw.mjs`, `scripts/lib/{plan,apply,manifest,blocks,hook,targets,render,catalog,source,fsx,cli,secrets}.mjs` | plano, aplicação com lock/journal/rollback, manifests, blocos, hook, destinos por cliente, pacote distribuível | APROVADO |
| Catálogo | `catalog/registry.json`, `catalog/catalog.lock.json`, `catalog/contract/*` | status, origem, perfis, gatilhos; lock de hashes; contrato e política | APROVADO |
| Gate de arquitetura | `saas-skills/engineering/multiplatform-platform-architecture/scripts/arch-check.mjs` | topologia, camadas FSD, slices, APIs públicas, runtime, fronteiras de pacote | APROVADO |
| Template + scaffold | `.../assets/template/**`, `.../scripts/scaffold.mjs` | produto Next.js + Expo sobre `packages/frontend`, `packages/ui`, `packages/design-tokens` | APROVADO |
| Legado | `saas-skills/engineering/legacy-code-refactoring/scripts/legacy-inventory.mjs`, `test/fixtures/legacy-shop*` | inventário e prova de migração com caracterização | APROVADO |
| Skills | 21 `SKILL.md` com `Operational Contract`; 8 reescritas ou realinhadas | conteúdo operacional | APROVADO (estrutura) / NÃO VERIFICADO (eficácia) |
| Qualidade | `test/*.test.mjs` (100 testes), `scripts/secret-scan.mjs`, `scripts/fix-markdownlint.mjs`, `.github/workflows/qa.yml` | testes, segredos, lint, CI | APROVADO local / CI NÃO VERIFICADA |
| Documentação | `README.md`, `AGENTS.md`, `saas-skills/README.md`, `saas-skills/docs/**`, `CHANGELOG.md`, ADR 0002 | operação e decisões | IMPLEMENTADO |

Removidos: 13 scripts 1.x e seus aliases, `PORTABILITY_MATRIX.md`, `.backup-runtimes/<host-workspace-project>.mdc`.

## 2. Achados

22 de 28 encerrados com teste; 4 parciais; 2 abertos. Tabela completa em `TRACEABILITY.md`.

- **Abertos:** ACH-005 (credencial `dist/global-runtime-validation-20260413/codex-home/auth.json`
  ainda na árvore, ignorada pelo git; `pnpm secrets` a aponta; remover e revogar cabe ao dono) e
  ACH-024 (nenhuma avaliação comportamental; exige chamadas de modelo).
- **Parciais:** ACH-011 (Cursor de projeto não verificado), ACH-013 (perfis reais desta máquina com
  cópias 1.x divergentes), ACH-026 (licenças de importados declaradas, não verificadas;
  `cursor-rule-profiles.json` mantido por ter edição local do dono), ACH-027 (CI não executada).

## 3. Arquitetura e árvore reais

```text
catalog/        registry.json · catalog.lock.json · contract/{architecture-contract,usage-policy}.md
scripts/        cw.mjs · lib/ · templates/claude-skill-router.mjs · secret-scan.mjs · fix-markdownlint.mjs · evals
saas-skills/    frontend/ backend/ engineering/ ai-integration/ documentation/ · docs/ · evals/ · integrations/
imported-skills/ 83 itens importados (não distribuídos)
test/           engine · catalog-build · arch-gate · legacy-migration · clients · tooling · fixtures/
acceptance/     REPORT.md · RUBRIC.md · TRACEABILITY.md · contract.json · evidence/
```

Template consumidor (gerado por `scaffold.mjs`):

```text
apps/clients/web/src/app/{layout,page,catalog/page}.tsx     Next.js, só rotas
apps/clients/mobile/src/app/{_layout,index,catalog}.tsx     Expo Router, só telas
packages/frontend/src/app/providers                          AppProviders
packages/frontend/src/pages/{home,catalog}                   páginas (ui, api)
packages/frontend/src/widgets/product-highlight              bloco composto
packages/frontend/src/features/toggle-favorite               interação (model + ui)
packages/frontend/src/entities/product                       entidade (model + ui)
packages/frontend/src/shared/ui                              fachada para @escopo/ui
packages/ui/src/{contract,web,native,theme}, catalog.ts      design system .web/.native
packages/design-tokens/src/tokens.ts                         paleta, temas, espaço, tipografia
tools/arch-check.mjs · tools/token-propagation-check.mjs     gate e prova de token
```

Fluxo de instalação: fonte (`saas-skills/`) + registry → render (mesmos bytes para todo destino) →
plano → aplicação com lock/journal → manifest por destino → `verify`/`doctor`.

## 4. Matriz de clientes

| Cliente (versão) | Descoberta de projeto | Escopo de usuário | Instruções | Explícita | Hook | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| Claude Code 2.1.74 | 21/21 (`Loaded 21 … project: 21`) | 21/21 em `CLAUDE_CONFIG_DIR` | — | a skill explícita sai da lista enviada ao modelo (23 vs 24) | contexto injetado em prompt correspondente; silêncio em neutro | APROVADO |
| Codex CLI 0.147.0-alpha.1.2 | 20 automáticas na raiz `.agents/skills` | não isolável (usa o perfil do SO) | blocos do `AGENTS.md` e `$CODEX_HOME/AGENTS.md` no prompt | ausente da lista implícita | — | APROVADO (projeto) / NÃO VERIFICADO (usuário) |
| Cursor 3.22.7 | não verificada (CLI exige a API) | lê `~/.claude`, `~/.codex`, `~/.agents` (observado) | documentado | documentado | — | NÃO VERIFICADO (projeto) |

Provas: `test/clients.test.mjs` (6 testes, sem chamada de modelo; custo 0 verificado no Claude) e
`saas-skills/docs/runtime/IDE_RUNTIME_GUIDE.md`.

## 5. Cobertura por habilidade e contagens

Contagem publicada (pós-2.1): 24 skills `canonical:active` (perfil `dev` 21 + `creative` 3).
Imports locais não entram no registry publicado; conhecimento útil está nas skills canônicas.
Histórico R1: 21 ativos + 83 importados não revisados (inventário de origem omitido).
Duplicatas detectadas pelo gate na época: grupos de arquivos redundantes só em imports locais.

| Skill | Linhas | Tokens | Casos (disparo/não/conflito/saída) | Gatilhos do hook |
| --- | ---: | ---: | --- | ---: |
| ai-context-diagrams | 457 | 3.540 | 3/3/1/3 | 5 |
| ai-interface-design | 362 | 3.427 | 3/3/1/3 | 6 |
| context-window-optimization | 450 | 3.681 | 4/3/1/4 | 7 |
| multi-agent-skill-creator | 194 | 1.849 | 3/3/1/3 | 6 |
| multi-agent-skill-installer (explícita) | 139 | 1.842 | 3/3/1/3 | 6 |
| multi-perspective-council | 301 | 3.648 | 3/3/1/4 | 9 |
| prompt-engineering-hybrid | 335 | 3.182 | 3/3/1/3 | 6 |
| saas-ai-agent-engineer | 189 | 2.521 | 3/3/1/3 | 9 |
| api-design-patterns | 392 | 3.269 | 3/3/1/3 | 10 |
| clean-architecture-ddd | 385 | 3.728 | 4/3/1/4 | 15 |
| prisma-database-design | 388 | 3.018 | 3/3/1/3 | 9 |
| intelligent-project-docs | 280 | 2.856 | 3/3/1/3 | 6 |
| technical-research-writing | 408 | 3.712 | 3/3/1/3 | 5 |
| legacy-code-refactoring | 263 | 3.674 | 4/3/1/4 | 10 |
| multiplatform-platform-architecture | 209 | 2.850 | 5/4/1/5 | 13 |
| systems-analysis-saas | 311 | 2.974 | 3/3/1/3 | 5 |
| testing-strategies | 431 | 3.723 | 4/3/1/4 | 10 |
| component-reuse-portability | 465 | 3.525 | 3/3/1/3 | 6 |
| design-system-implementation | 309 | 3.025 | 4/3/1/3 | 8 |
| react-saas-architecture | 157 | 2.115 | 5/3/1/4 | 9 |
| saas-ui-specifications | 422 | 3.190 | 3/3/1/3 | 11 |

Todas: frontmatter válido, `Operational Contract` com as 10 chaves, referências dentro do pacote,
nenhum caminho de máquina ou segredo (gate). Casos de avaliação: IMPLEMENTADOS; execução com
modelo: NÃO VERIFICADA.

## 6. Instalação, atualização, migração e espelhamento

| Prova | Resultado | Estado |
| --- | --- | --- |
| Produto do zero, fora do checkout (`EV-final-e2e`): pacote → scaffold → git init → plan → install → verify → doctor --strict → pnpm install → pnpm verify → check:tokens → violação deliberada → reversão → uninstall --dry-run | 13/13 passos | APROVADO |
| `pnpm verify` do produto: gate, typecheck web e nativo, testes, `next build`, `expo export` Android e iOS | exit 0 | APROVADO |
| Token sentinela no HTML/JS do web e nos `.hbc` Android e iOS; arquivo restaurado | encontrado nos três | APROVADO |
| Violação `features → widgets` no produto | `FSD-LAYER`, exit 1 | APROVADO |
| Atualização, conflito, edição local, drift, rollback, kill + recover, concorrência, Unicode, junções | testes do motor | APROVADO |
| Migração legada (`EV-legacy-e2e`): mesmos 7 casos de caracterização no legado e no migrado; migrado passa gate, typecheck, testes, build e bundles; inventário sem lacunas | 6/6 passos | APROVADO |
| Cópia limpa (599 arquivos): `pnpm install --frozen-lockfile` + `pnpm qa` | exit 0 | APROVADO |
| Build nativo (Gradle/Xcode) e execução em emulador/dispositivo | sem Android SDK e sem macOS | NÃO VERIFICADO |
| Migração dos perfis reais desta máquina (1.x → 2.0) | não autorizada | NÃO VERIFICADO |

## 7. Contexto, qualidade e regressões

- Contexto (o200k_base, instalação real do perfil `dev`): sempre ativo 730 tokens; lista 1.179
  (1.x: 2.144); corpo de skill 2.115–3.728; tarefa típica 4.024–5.583. Na 1.x, o Cursor anexava
  até 10.312 tokens de regras por arquivo aberto, sem contrato de arquitetura sempre ativo.
- Duplicação de código (janelas de 6 linhas entre arquivos): 41 → 0.
- Lint Markdown canônico: 0 erros em 83 arquivos (os registros verbatim de `acceptance/evidence/`
  ficam fora). Importados: 1.588 erros em 245 arquivos (`pnpm lint:md:imported`, só relatório).
- Roteador: 0/7 neutros e 0/5 ambíguos disparam; positivos acertam.
- Regressões corrigidas durante a validação: falso positivo de caminho de máquina
  (`pages/home/…`), `version: 1.0` virando `1` no render, `doctor` listando a pasta do usuário duas
  vezes e subindo acima da raiz git, backup ausente ao remover bloco com `--force-local`. Cada uma
  ganhou teste; três foram conferidas por mutação.

## 8. Nota, gates e limitações

Mesma rubrica do parecer (detalhe em `RUBRIC.md`):

| | Antes | Agora |
| --- | ---: | ---: |
| Nota comprovada | 3,7 | 8,69 |
| Limite superior | 4,4 | 9,28 |
| Critérios com veredito | 74/81 | 76/81 |
| Críticos não aprovados | 7 | 1 (CR-063) |

Não aprovados: CR-047, CR-055, CR-063†, CR-069, CR-073, CR-075. Não verificados: CR-021, CR-038,
CR-041, CR-049, CR-066.

| Gate | Estado | Motivo principal |
| --- | --- | --- |
| G01 Auditoria | REPROVADO | ACH-005 e ACH-024 abertos; 4 parciais |
| G02 Catálogo | APROVADO | 104/104 com destino |
| G03 Três clientes | REPROVADO | Cursor de projeto não verificado |
| G04 Fonte única | APROVADO | |
| G05 Distribuição | APROVADO | |
| G06 Arquitetura | APROVADO | |
| G07 Espelhamento | REPROVADO | execução nativa não verificada |
| G08 Legados | APROVADO | |
| G09 Conteúdo | APROVADO | eficácia com modelo não verificada |
| G10 Contexto | APROVADO | |
| G11 Proteção | APROVADO | |
| G12 Reprodução | APROVADO | CI remota não executada |

Requisitos novos (fora da rubrica, em `contract.json`): 12 APROVADOS, 2 REPROVADOS (NR-11 matriz
dos três clientes, NR-15 área Creative sem itens ativos na época R1), 1 NÃO VERIFICADO (NR-07 execução nativa).

Limitações: nenhuma chamada de modelo (eficácia e seleção reais não medidas); sem Android SDK,
emulador ou macOS; CI não executada; perfis reais (`~/.claude`, `~/.agents`, `~/.codex`, User Rules)
não alterados; `cw.mjs` tem 1.297 linhas e pode ser dividido por comando.

## 9. Comandos testados

Na biblioteca:

```bash
pnpm install
pnpm qa
node scripts/cw.mjs catalog --write-lock
node scripts/cw.mjs plan --target <projeto> --profile dev
node scripts/cw.mjs install --target <projeto> --profile dev --with-usage-policy --with-claude-hook
node scripts/cw.mjs verify --target <projeto>
node scripts/cw.mjs status --target <projeto>
node scripts/cw.mjs doctor --target <projeto> --strict
node scripts/cw.mjs uninstall --target <projeto> --dry-run
node scripts/cw.mjs recover --target <projeto>
node scripts/cw.mjs build --out <pasta-vazia>
node scripts/cw.mjs contract --format cursor-user-rules --with-usage-policy
pnpm secrets
pnpm lint:md:imported
```

Escopo de usuário (testado só em perfil isolado com `--home`):

```bash
node scripts/cw.mjs install --user --profile dev --home <sandbox>/home
```

Produto novo:

```bash
node saas-skills/engineering/multiplatform-platform-architecture/scripts/scaffold.mjs --out <pasta> --scope @empresa --name "Produto"
cd <pasta>
git init
pnpm install
pnpm verify
pnpm check:tokens
```

Legado:

```bash
node saas-skills/engineering/legacy-code-refactoring/scripts/legacy-inventory.mjs --root <repo>
```

## Decisão

Entrega integral aprovada: NÃO.

Critérios ainda não satisfeitos: CR-063† (credencial em `dist/`, ação do dono), CR-047 (perfis reais
com cópias 1.x divergentes), CR-055 (licença dos importados), CR-069 (sem resultados de avaliação),
CR-073 (`cursor-rule-profiles.json` sem uso, mantido pela edição local), CR-075 (2.0 sem commit/tag);
não verificados CR-021, CR-038, CR-041, CR-049, CR-066; gates G01, G03 e G07; requisitos NR-07, NR-11
e NR-15.

Condições e versões nas quais o funcionamento foi comprovado: Windows 11 10.0.26200, Node.js 25.2.1,
pnpm 12.5.1, Next.js 16.3.6, Expo SDK 57 (`expo export` Android e iOS, Hermes), React Native 0.86.3,
TypeScript 5.9.3, Vitest 5.0.1, Codex CLI 0.147.0-alpha.1.2 (escopo de projeto) e Claude Code 2.1.74
(projeto e usuário), em perfis isolados e sem chamadas de modelo; Cursor 3.22.7 apenas por observação
do escopo de usuário.
