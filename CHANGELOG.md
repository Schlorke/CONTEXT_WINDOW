# Changelog

Todos os ajustes relevantes desta biblioteca são registrados aqui.

Este arquivo segue a convenção de changelog público: histórico por versão, mudanças agrupadas por categoria e foco em impacto para usuário, mantenedor e agente.

Convenções deste projeto:

- formato inspirado em `Keep a Changelog`
- versionamento semântico como referência operacional
- `CHANGELOG.md` para visão pública e limpa
- `saas-skills/RELEASE_NOTES.md` para trilha operacional detalhada

## [1.16.0] - 2026-07-28

### Added in 1.16.0

- Nova skill `multiplatform-platform-architecture` (coleção `engineering`):
  arquitetura de plataforma para SaaS multiplataforma — monorepo pnpm com apps
  agrupados por natureza de execução (`clients/services/workers`), packages pela
  regra de 2+ consumidores, camada `products/`, FSD em todas as superfícies
  frontend, API modular com 3 leis de fronteira + 12-factor, mobile Expo/React
  Native, auth dupla cookie+Bearer e contratos `/api/v1` com OpenAPI gerado de
  Zod. Inclui 3 references (árvore canônica, taxonomia FSD, anatomia da API) e
  proibição enfática de `!important`/modificador `!` do Tailwind como
  anti-pattern com enforcement em CI.
- Profile Cursor e casos de eval (4 positivos, 4 negativos, 1 conflito com
  `react-saas-architecture`) para a skill nova.

## [1.15.0] - 2026-07-25

### Changed in 1.15.0

- `react-saas-architecture`: a composição de UI deixou de prescrever a camada
  `layouts` como padrão. O SKILL e
  `references/folder-structure-patterns.md` passam a apresentar **duas formas**
  e o critério objetivo para escolher entre elas — contar **shells**
  (estruturas persistentes que atravessam muitas rotas):
  - **Forma A (padrão, um shell):** raiz `widgets` plana com um **shell
    designado** (`app -> widgets -> features -> shared`);
  - **Forma B (dois ou mais shells):** `layouts` + `widgets/<layout>`
    (`app -> layouts -> widgets -> features -> shared`).
- O invariante que as duas formas preservam ficou explícito: **widget folha
  nunca importa widget irmão**; quem compõe irmãos é o shell designado
  (permitido **por nome** no gate, nunca por heurística "parece um shell") ou o
  layout dono, uma camada acima.
- Aviso adicionado contra adotar a Forma B especulativamente: camada com um
  único ocupante — ou segmento de caminho cujo valor é sempre a mesma palavra —
  custa vocabulário e não devolve nada; migrar A → B depois é mecânico.

## [1.14.0] - 2026-07-22

### Changed in 1.14.0

- `clean-architecture-ddd`, `react-saas-architecture` e
  `legacy-code-refactoring` agora separam superfícies públicas
  `client`/`server`/`contracts`, mantêm tipos neutros fora de barrels server e
  alertam contra grafos client amplos que prejudiquem tree-shaking ou chunks.
- `testing-strategies` passou a exigir cobertura sobre toda a superfície de
  produção, baseline inicial medido e thresholds incrementais em vez de metas
  arbitrárias para código legado.
- `context-window-optimization` agora trata logs e comandos como parte do
  orçamento: checks focados durante as edições, gate completo somente no
  fechamento estável e obediência imediata a limites explícitos do usuário.
- Profiles e evals receberam casos para runtime boundaries, all-source coverage
  e orçamento de tool output. A matriz passa a `61/57/19` casos e o package a
  `1.14.0`.

## [1.13.1] - 2026-07-21

### Changed in 1.13.1

- A camada formal de composição passou a se chamar `layouts`, mantendo
  `widgets` agrupados pelo layout owner e a direção
  `app -> layouts -> widgets -> features -> shared`.
- `react-saas-architecture` agora distingue `app/**/layout.tsx` (hierarquia de
  rotas) de `src/layouts/**` (estrutura persistente) e permite nomes de
  componente como `PanelShell` quando há comportamento além da disposição
  visual. `clean-architecture-ddd` e os evals receberam a mesma taxonomia.
- O adapter do Cursor ganhou `--cursor-project-stubs`: projetos que já usam as
  skills globais podem manter `.cursor/rules` pequenas, sem globs amplos e sem
  duplicar os 19 corpos completos no contexto. A QA valida stub no projeto e
  adapter completo no runtime global.

## [1.13.0] - 2026-07-21

### Added in 1.13.0

- Nova skill canônica `multi-agent-skill-creator`, inicializada pelo scaffold oficial, com
  fluxo source-first, fallback portátil, `agents/openai.yaml`, referência de
  contratos de runtime, profile Cursor/Claude e cobertura de evals.

### Changed in 1.13.0

- `react-saas-architecture` e `clean-architecture-ddd` passaram a reconhecer
  uma camada formal de composição persistente com widgets agrupados pelo owner;
  a nomenclatura foi refinada em `1.13.1`.
- A biblioteca passa a ter `19` skills e versão `1.13.0`; adapters e instaladores
  continuam gerando os runtimes de Codex, Claude e Cursor a partir da mesma
  fonte canônica.

## [1.12.1] - 2026-07-21

### Changed in 1.12.1

- `react-saas-architecture` agora exige admissão explícita para novas raízes de
  feature: a IA deve inspecionar a taxonomia dos irmãos, manter mecanismos
  técnicos sob `modules/` do owner e parar quando não houver owner de produto.
  Reuso, volume de arquivos, contratos e testes deixaram de ser critérios
  suficientes. O novo caso `rsa-4` protege esse comportamento na matriz de
  triggers para Codex, Claude e Cursor.

## [1.12.0] - 2026-07-08

### Added in 1.12.0

- **Hook determinístico de roteamento para o Claude Code** (equivalente ao
  `alwaysApply`/`globs` do Cursor): novo template
  `scripts/templates/claude-skill-router.mjs` com normalização de acentos
  (triggers sem acento agora casam "segurança", "migração" etc.), máximo de 3
  sugestões por evento (anti alarm-fatigue), skills `mandatory` sempre primeiro,
  dedup por sessão e caminho do `SKILL.md` incluído no lembrete (fallback para
  skills gateadas por `paths:`). Globs ancorados no fim (`$`).
- Flags `--claude-hook` e `--hook-only` no `install-agent-runtimes.mjs` + alias
  `pnpm install:claude-hook -- <dir>`: instala o hook, gera
  `.claude/skill-routing.json` a partir dos profiles (novos `promptTriggers`;
  `pathGlobs` com expansão de chaves `{a,b}`) e registra os hooks em
  `.claude/settings.json` via merge idempotente. Arquivos personalizados do
  projeto (hook/tabela não gerenciados) são preservados com aviso.
- `buildClaudeSkillRouting()`, `expandGlobBraces()` e
  `detectDuplicateClaudeInstall()` em `scripts/runtime-adapter-utils.mjs`.
- Aviso de **duplicação de escopo do Claude** no instalador e no
  `verify-agent-runtimes.mjs`: biblioteca detectada em projeto E global ao mesmo
  tempo gera warning com instrução de correção (não fatal — o smoke de QA instala
  os dois escopos em sandbox de propósito).

### Changed in 1.12.0

- **Política oficial de escopo do Claude**: biblioteca genérica em UM escopo só
  (recomendado: global `~/.claude/skills`, espelhando o Codex); `.claude/skills/`
  de projeto fica reservado a skills específicas do projeto. Documentado no
  README (nova seção "Política de Escopo"), no `IDE_RUNTIME_GUIDE.md` e na skill
  `multi-agent-skill-installer` (novo fluxo recomendado por máquina/projeto).
- `cursor-rule-profiles.json` (v1.1.0): novos campos `claudePaths` (controle
  explícito do `paths:` do Claude — listas vazias fazem opt-out do fallback de
  `globs` para skills amplas: `react-saas-architecture`, `saas-ui-specifications`,
  `saas-ai-agent-engineer`, `ai-context-diagrams`) e `promptTriggers` (gatilhos
  específicos, sem acento, para o hook). Globs do `saas-ai-agent-engineer`
  corrigidos: `**/*ai*/**` casava pastas como `email/` e `detail/`; agora usa
  segmentos precisos (`**/ai/**`, `**/agent*/**`).
- `multi-agent-skill-installer`: `metadata.sources` e "Source References"
  deixaram de usar caminhos relativos que quebravam nas cópias instaladas;
  agora referenciam o repositório-fonte explicitamente.

### Incluído em 1.12.0 (vinha de "Unreleased")

- Instalador do runtime Claude (`scripts/install-agent-runtimes.mjs`) deixou de
  copiar o `SKILL.md` de forma literal e passou a reemitir o frontmatter com os
  campos nativos de auto-detecção da Claude via `buildClaudeSkillContent()`:
  skills com `globs`/`claudePaths` recebem o campo oficial `paths:` (equivalente
  nativo dos `globs` do Cursor) e `when_to_use:` opcional, sem sobrescrever
  campos já presentes na fonte. Arquivos anexos e corpo preservados.
- Aviso (não fatal) na instalação quando um `name` de skill não está em
  `kebab-case` minúsculo, alinhando ao requisito de `name` do Agent Skills spec.

## [1.10.0] - 2026-04-13

### Added in 1.10.0

- Export dedicado de bootstrap global do Cursor com `pnpm export:cursor-user-rules`.
- Documento `saas-skills/CURSOR_USER_RULES_GUIDE.md` para explicar a diferença entre `Project Rules`, `User Rules` e o export de compatibilidade.
- Geração automática de `CURSOR_USER_RULES.md` junto da instalação global compatível do Cursor.

### Changed in 1.10.0

- O runtime global do Cursor passou a ser documentado como dois componentes distintos:
  - export de compatibilidade em `~/.cursor/rules/`
  - bootstrap oficial para `Cursor Settings > Rules`
- `status` e `verify` agora deixam explícito que o global do Cursor validado estruturalmente não prova, por si só, a configuração da UI.
- `qa:skills` agora exporta também o bootstrap de `Cursor User Rules`.

### Fixed in 1.10.0

- A documentação deixou de prometer equivalência perfeita entre `~/.cursor/rules/` e as `User Rules` globais da interface do Cursor.

## [1.9.0] - 2026-04-13

### Added in 1.9.0

- Política instalável de disclosure de skills com `install:skill-usage-reporting`.
- Verificação dedicada da política com `verify:skill-usage-reporting`.
- Documento-base público em `saas-skills/AGENT_SKILL_USAGE_REPORTING.md`.
- Regra do Cursor para exigir disclosure em `.cursor/rules/skill-usage-reporting.mdc`.

### Changed in 1.9.0

- A documentação passou a cobrir explicitamente o fluxo de observabilidade de skills usadas.
- O instalador multi-IA passou a documentar o passo opcional de disclosure obrigatório.

### Fixed in 1.9.0

- O projeto agora oferece um mecanismo padronizado para saber se as skills estão sendo usadas de verdade nas respostas finais dos agentes.

## [1.8.0] - 2026-04-13

### Added in 1.8.0

- Comando de status por runtime com `scripts/status-agent-runtimes.mjs`.
- Manifests `.saas-skills-manifest.json` em cada runtime gerenciado para registrar versão instalada, artefatos gerados e política de update.
- Instalação seletiva por IA com aliases dedicados:
  - `install:codex`
  - `install:claude`
  - `install:cursor`
  - `install:claude-global`
  - `install:cursor-global`
- Sync seletivo e global:
  - `sync:agent-runtimes`
  - `sync:global-runtimes`
  - `sync:codex`
  - `sync:claude`
  - `sync:cursor`
  - `sync:claude-global`
  - `sync:cursor-global`
- Verificação seletiva por runtime:
  - `verify:codex`
  - `verify:claude`
  - `verify:cursor`
  - `verify:claude-global`
  - `verify:cursor-global`

### Changed in 1.8.0

- O instalador passou a tratar a instalação como sincronização gerenciada, limpando artefatos previamente gerados antes de reaplicar a fonte atual.
- A verificação passou a exigir manifest válido e versão alinhada com a fonte atual da biblioteca.
- A documentação principal passou a cobrir explicitamente:
  - instalação por IA
  - update sem drift
  - uso correto de manifest, verify e status

### Fixed in 1.8.0

- A biblioteca agora detecta runtimes desatualizados em vez de apenas confirmar a existência de arquivos.
- O fluxo de update passou a documentar e suportar propagação explícita de mudanças entre Codex, Claude e Cursor.

## [1.7.0] - 2026-04-13

### Added in 1.7.0

- Instalador unificado para Codex, Claude e Cursor com `scripts/install-agent-runtimes.mjs`.
- Verificação estrutural dos três runtimes com `scripts/verify-agent-runtimes.mjs`.
- Suporte a `--codex-home`, `--claude-home` e `--cursor-home` para validação em sandbox.
- Scripts de conveniência para instalação e verificação globais.
- Skill `multi-agent-skill-installer` para orientar agentes na instalação, verificação e smoke test da biblioteca.
- `AGENTS.md` na raiz como ponto de entrada operacional para agentes.

### Changed in 1.7.0

- A documentação foi reestruturada para deixar explícita a diferença entre:
  - `skill-installer` nativo da Codex
  - instalador unificado deste repositório
- O `qa:skills` passou a validar o fluxo multi-IA em sandbox.
- A matriz de evals foi ampliada para cobrir `17` skills.

### Fixed in 1.7.0

- A documentação deixou de sugerir implicitamente que runtimes de projeto e runtime da Codex eram equivalentes.
- A validação de instalação passou a provar o fluxo multi-IA sem depender dos runtimes reais do usuário.

## [1.4.0] - 2026-04-13

### Added in 1.4.0

- Export de rules do Cursor com `scripts/export-cursor-rules.mjs`.
- Instalação de runtimes de Claude e Cursor em projeto-alvo.
- Verificação estrutural de runtime por IDE.
- Utilitários centralizados para adapters de runtime.
- Perfis de geração de rules do Cursor em `cursor-rule-profiles.json`.
- `IDE_RUNTIME_GUIDE.md` e `TARGET_REPO_AGENT_GUIDE.md`.

### Changed in 1.4.0

- Os READMEs passaram a refletir corretamente a diferença entre fonte de verdade e runtime por IDE.
- A matriz de portabilidade passou a documentar `.claude/skills/` e `.cursor/rules/` como runtimes distintos.
- O `qa:skills` passou a validar export de Cursor e smoke install por IDE.

### Fixed in 1.4.0

- A árvore canônica deixou de ser apresentada como runtime direto recomendado para Claude.
- `.cursor/skills/` deixou de ser tratada como runtime oficial do Cursor.

## [1.3.1] - 2026-04-12

### Changed in 1.3.1

- O scorer de replay passou a respeitar `result.status`.
- O scoring passou a validar schema mínimo de replay antes de consolidar JSONs.
- A documentação de replay e instalação foi alinhada ao comportamento real do scorer.

### Fixed in 1.3.1

- Casos marcados como `failed` ou `partial` deixaram de ser promovidos a `pass` por derivação.
- JSONs arbitrários em diretórios de replay deixaram de gerar relatórios falsos.

## [1.3.0] - 2026-04-12

### Added in 1.3.0

- Templates de replay para `claude-code`, `cursor` e `github-copilot`.
- Documentação para preenchimento e scoring dos replays.
- Baseline consolidado em `saas-skills/evals/results/SUMMARY.md`.

### Changed in 1.3.0

- O scorer passou a compactar listas grandes de pendências.
- A matriz de triggers foi versionada como `1.3.0`.

## [1.2.0] - 2026-04-12

### Added in 1.2.0

- Geração de templates de replay por ambiente com `pnpm evals:init`.
- Consolidação de replays com `pnpm evals:score`.
- Módulo compartilhado `scripts/skill-eval-utils.mjs`.
- Pasta `saas-skills/evals/results/` para armazenar execuções por ambiente.

### Changed in 1.2.0

- O README passou a documentar o fluxo de replay por ambiente.
- `EVALS_REPORT.md` passou a registrar o tooling de replay e scoring.

## [1.1.0] - 2026-04-12

### Added in 1.1.0

- Auditoria estrutural da biblioteca com `pnpm audit:skills`.
- Fluxo consolidado de QA com `pnpm qa:skills`.
- Matriz de trigger, anti-trigger e conflitos.
- `EVALS_REPORT.md`, `PORTABILITY_MATRIX.md` e `RELEASE_NOTES.md`.

### Changed in 1.1.0

- O README passou a documentar validação operacional e bundle achatado.
- `QA_REPORT.md` foi refeito para refletir o estado real do repositório.

### Fixed in 1.1.0

- Frontmatter YAML corrigido em skills de frontend que ainda estavam fora do formato esperado.
- Skills acima do limite de `500` linhas foram reduzidas.
- Referência quebrada em `clean-architecture-ddd` foi relocada para dentro da própria skill.
- Seções de `Source References` foram reforçadas com fontes concretas do repositório.
- A instalação para loaders sem descoberta recursiva passou a ter suporte via `dist/flat-skills/`.

## [1.0.0]

### Added in 1.0.0

- Primeira consolidação da biblioteca com `16` skills organizadas por coleção.
