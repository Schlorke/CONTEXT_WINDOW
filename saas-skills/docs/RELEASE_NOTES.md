# RELEASE NOTES — Biblioteca saas-skills

## 1.16.0 — 28 de julho de 2026

### Added in 1.16.0

- `engineering/multiplatform-platform-architecture` v1.0.0: skill de
  arquitetura de plataforma multiplataforma (monorepo apps/packages/products,
  FSD nos clients, API modular com leis de fronteira e 12-factor, Expo mobile,
  auth dupla, contratos-first). Origem: consenso arquitetural do projeto OkGas
  (ADR-061, 2026-07-28), generalizado como molde para novos projetos.
- Registros: +1 profile em `integrations/cursor-rule-profiles.json` (v1.3.0),
  +9 casos em `evals/skill-trigger-matrix.json` (v1.11.0; totais 65/61/20),
  contagens do catálogo atualizadas (20 skills).
- Regra reforçada em anti-patterns e enforcement: `!important` (CSS) e
  modificador `!` (Tailwind) são proibidos em qualquer projeto novo; exceção
  só com ADR aprovado por humano; stylelint/lint em CI deve falhar o build.

## 1.14.0 — 22 de julho de 2026

### Changed in 1.14.0

- Skills de arquitetura/refatoração ganharam entrypoints explícitos
  `client`/`server`/`contracts`, incluindo proteção contra dependências de
  Prisma/`node:*` no browser e contra barrels amplos que criem chunks cíclicos.
- A estratégia de testes agora diferencia cobertura de arquivos importados de
  cobertura de toda a produção e recomenda baseline incremental para projetos
  legados.
- A otimização de contexto passou a orçar tool output e a programar validação:
  checks focados durante o trabalho, gate completo uma vez no fechamento e
  interrupção imediata quando o usuário restringir comandos ou custo.
- Package elevado para `1.14.0`; profiles Cursor/Claude e matriz de evals foram
  atualizados para `61/57/19` casos.

## 1.13.1 — 21 de julho de 2026

### Changed in 1.13.1

- A taxonomia portátil passou a usar `layouts` e `widgets`, com direção
  `app -> layouts -> widgets -> features -> shared`.
- A documentação diferencia o mecanismo `app/**/layout.tsx` da camada
  `src/layouts/**` e preserva `*Shell` como nome válido para componentes
  persistentes que também coordenam comportamento e integrações.
- Package elevado para `1.13.1`; skills, referências e evals foram alinhados
  para Codex, Claude e Cursor.
- O novo modo `--cursor-project-stubs` separa regras completas globais de
  gatilhos curtos por projeto e é verificado na sandbox multi-runtime.

## 1.13.0 — 21 de julho de 2026

### Added in 1.13.0

- Skill portátil `multi-agent-skill-creator` para criar e atualizar uma única fonte
  canônica e materializá-la com segurança em Codex, Claude e Cursor.
- Scaffold fallback, contrato de runtimes, profile de roteamento e matriz de
  evals para autoria de skills.

### Changed in 1.13.0

- `react-saas-architecture` e `clean-architecture-ddd` passaram a reconhecer
  uma camada persistente e widgets pertencentes ao seu owner como camadas
  formais de apresentação; a nomenclatura foi refinada em `1.13.1`.
- Biblioteca elevada para `19` skills e package `1.13.0`.

## 1.11.0 — 13 de maio de 2026

### Added in 1.11.0

- Skill gerenciada `saas-ai-agent-engineer`, migrada como guia genérico para agentes IA SaaS com tools, RAG/memória, governança de prompts, permissões, auditoria, evals e observabilidade.
- Perfil Cursor e matriz de evals para a nova skill, elevando a biblioteca para `18` skills e `54/54/18` casos de trigger, anti-trigger e conflito.

### Changed in 1.11.0

- Skills backend agora priorizam a realidade do repositório-alvo antes dos exemplos: `AGENTS.md`/`CLAUDE.md`, `package.json`, auth helpers, `src/app/api`, `@/lib/prisma`, `auth()`, `can()` e `orgId`/`tenantId` reais vencem padrões genéricos.
- Skills de frontend/design system foram alinhadas a estruturas com `src/components/features`, `src/components/ui/{primitives,composed}`, Storybook 10, Tailwind v4, registries e comandos `pnpm ai:context`, `pnpm verify:ai` e `pnpm build-storybook`.
- Skills de teste, refatoração e portabilidade passaram a preferir scripts e package manager do repo, com `pnpm`, Vitest projects, Storybook tests e Playwright em `tests/e2e` quando esse for o padrão local.
- `intelligent-project-docs` agora permite `AGENTS.md` curto redirecionando para `CLAUDE.md` ou manual operacional equivalente.

### Fixed in 1.11.0

- Removidas orientações que induziam middleware/proxy, headers artificiais, Prisma middleware, repository pattern obrigatório, comandos `npm`/`npx` e caminhos `src/features` como se fossem universais.
- Context-window guidance deixou de hard-codear limites de modelos e passou a exigir verificação em documentação oficial antes de codificar IDs, limites ou budgets.
- `package.json` foi elevado para `1.11.0`.

## 1.10.0 — 13 de abril de 2026

### Added in 1.10.0

- `scripts/export-cursor-user-rules.mjs` para gerar um bootstrap curto e copiável para `Cursor Settings > Rules`.
- `CURSOR_USER_RULES_GUIDE.md` para documentar o modelo correto do Cursor global.
- Geração automática de `CURSOR_USER_RULES.md` dentro do export global compatível do Cursor.

### Changed in 1.10.0

- `install-agent-runtimes.mjs` agora trata o Cursor global como export de compatibilidade e informa explicitamente o passo oficial de `User Rules`.
- `verify-agent-runtimes.mjs` e `status-agent-runtimes.mjs` agora explicam que a validação estrutural do Cursor global não substitui a configuração da UI do Cursor.
- `README.md`, `AGENTS.md`, `saas-skills/README.md`, `IDE_RUNTIME_GUIDE.md`, `TARGET_REPO_AGENT_GUIDE.md`, `PORTABILITY_MATRIX.md` e `multi-agent-skill-installer` passaram a documentar a diferença entre:
  - `.cursor/rules/` por projeto
  - `~/.cursor/rules/` como compatibilidade
  - `Cursor Settings > Rules` como superfície global oficialmente documentada
- `package.json` foi elevado para `1.10.0`.

### Fixed in 1.10.0

- A biblioteca deixou de sugerir que o global do Cursor funcionaria de forma equivalente a Codex e Claude apenas pela presença de arquivos em `~/.cursor/rules/`.

## 1.9.0 — 13 de abril de 2026

### Added in 1.9.0

- `scripts/install-skill-usage-reporting.mjs` para instalar uma política obrigatória de disclosure das skills usadas no projeto-alvo.
- `scripts/verify-skill-usage-reporting.mjs` para verificar a presença da política em `AGENTS.md`, `CLAUDE.md` e `.cursor/rules/skill-usage-reporting.mdc`.
- `scripts/skill-usage-reporting-utils.mjs` para centralizar a geração e atualização do bloco gerenciado de disclosure.
- `AGENT_SKILL_USAGE_REPORTING.md` como documento-base copiável para governança de uso de skills.
- Scripts `pnpm install:skill-usage-reporting` e `pnpm verify:skill-usage-reporting`.

### Changed in 1.9.0

- `README.md`, `AGENTS.md`, `saas-skills/README.md`, `IDE_RUNTIME_GUIDE.md`, `TARGET_REPO_AGENT_GUIDE.md` e `multi-agent-skill-installer` passaram a documentar explicitamente o fluxo de disclosure obrigatório de skills.
- `package.json` foi elevado para `1.9.0`.

### Fixed in 1.9.0

- A biblioteca agora oferece um mecanismo padronizado para medir adoção real de skills nas respostas dos agentes, sem depender apenas de inferência manual.

## 1.8.0 — 13 de abril de 2026

### Added in 1.8.0

- `scripts/status-agent-runtimes.mjs` para inspecionar se cada runtime está `current`, `outdated`, `missing` ou `foreign`.
- Manifests `.saas-skills-manifest.json` em cada runtime gerenciado para registrar versão instalada, artefatos gerados e política de update.
- Aliases de conveniência para instalação seletiva por IA: `install:codex`, `install:claude`, `install:cursor`, `install:claude-global` e `install:cursor-global`.
- Aliases de sync seletivo e global: `sync:agent-runtimes`, `sync:global-runtimes`, `sync:codex`, `sync:claude`, `sync:cursor`, `sync:claude-global` e `sync:cursor-global`.
- Aliases de verificação seletiva: `verify:codex`, `verify:claude`, `verify:cursor`, `verify:claude-global` e `verify:cursor-global`.

### Changed in 1.8.0

- `install-agent-runtimes.mjs` agora trata a instalação como sincronização gerenciada, limpando artefatos previamente gerados antes de reaplicar a fonte atual.
- `verify-agent-runtimes.mjs` passou a exigir manifest válido e versão alinhada com a fonte atual da biblioteca.
- `README.md`, `AGENTS.md`, `saas-skills/README.md`, `IDE_RUNTIME_GUIDE.md`, `TARGET_REPO_AGENT_GUIDE.md` e `PORTABILITY_MATRIX.md` agora documentam explicitamente instalação por IA e o fluxo correto de update sem drift.
- `package.json` foi elevado para `1.8.0`.

### Fixed in 1.8.0

- A biblioteca agora detecta runtimes desatualizados em vez de apenas confirmar que os arquivos existem.
- O fluxo de update passou a documentar e suportar propagação explícita de mudanças para Codex, Claude e Cursor sem depender de edição manual nas cópias instaladas.

## 1.7.0 — 13 de abril de 2026

### Added in 1.7.0

- `scripts/install-agent-runtimes.mjs` para instalar a biblioteca em Codex, Claude e Cursor em um único fluxo.
- `scripts/verify-agent-runtimes.mjs` para verificar estruturalmente os três runtimes.
- Suporte a `--codex-home` para validar o runtime da Codex em sandbox, sem tocar na instalação real do usuário.
- Suporte a `--claude-home` e `--cursor-home` para validar instalações globais de Claude e Cursor em sandbox.
- Scripts de conveniência `pnpm install:global-runtimes` e `pnpm verify:global-runtimes`.
- Nova skill `multi-agent-skill-installer` para orientar qualquer agente a instalar, verificar e fazer smoke test da biblioteca em Codex, Claude e Cursor.

### Changed in 1.7.0

- `AGENTS.md` foi adicionado na raiz como ponto de entrada operacional para agentes que precisem instalar, validar ou usar a biblioteca.
- `README.md`, `saas-skills/README.md`, `IDE_RUNTIME_GUIDE.md`, `PORTABILITY_MATRIX.md` e `TARGET_REPO_AGENT_GUIDE.md` foram reescritos para documentar explicitamente a diferença entre o `skill-installer` nativo da Codex e o instalador unificado deste repositório.
- `TARGET_REPO_AGENT_GUIDE.md` agora funciona como playbook copiável para instalação segura em três runtimes, com validação em sandbox antes da instalação real.
- `qa:skills` passou a validar Codex, Claude e Cursor em `dist/agent-runtime-smoke-test`, usando homes isolados para os três runtimes globais.
- `saas-skills/evals/skill-trigger-matrix.json` foi ampliado para cobrir `17` skills.
- `package.json` foi elevado para `1.7.0`.

### Fixed in 1.7.0

- A documentação deixou de sugerir implicitamente que o runtime da Codex e os runtimes de projeto são equivalentes.
- A validação de instalação agora consegue provar o fluxo multi-IA sem depender dos runtimes globais reais do usuário.

## 1.4.0 — 13 de abril de 2026

### Added in 1.4.0

- `scripts/export-cursor-rules.mjs` para gerar adapters `.mdc` de Cursor a partir das skills canônicas.
- `scripts/install-ide-runtime.mjs` para instalar runtimes de Claude e Cursor em um projeto-alvo.
- `scripts/verify-ide-runtime.mjs` para verificar a instalação estrutural dos runtimes.
- `scripts/runtime-adapter-utils.mjs` para centralizar a lógica de adapter runtime.
- `saas-skills/integrations/cursor-rule-profiles.json` para mapear skills canônicas para runtime do Cursor.
- `IDE_RUNTIME_GUIDE.md` para documentar o runtime correto de Claude e Cursor.
- `TARGET_REPO_AGENT_GUIDE.md` como playbook copiável para agentes instalarem e validarem a biblioteca sem tocar no app.

### Changed in 1.4.0

- `README.md` e `saas-skills/README.md` foram reescritos para refletir corretamente a diferença entre fonte de verdade e runtime por IDE.
- `PORTABILITY_MATRIX.md` passou a documentar explicitamente `.claude/skills/` e `.cursor/rules/` como runtimes distintos.
- `qa:skills` agora valida export de Cursor e executa um smoke install em `dist/ide-runtime-smoke-test`.
- `package.json` foi elevado para `1.4.0`.

### Fixed in 1.4.0

- A documentação deixou de tratar a árvore canônica como runtime direto recomendado para Claude.
- A documentação deixou de tratar `.cursor/skills/` como runtime oficial do Cursor.

## 1.3.1 — 12 de abril de 2026

### Changed in 1.3.1

- `scripts/score-skill-replays.mjs` passou a respeitar `result.status` durante o scoring.
- O scorer agora valida schema mínimo de replay antes de consolidar arquivos JSON.
- A documentação de replay foi alinhada ao comportamento real do scorer.
- A documentação de instalação passou a incluir exemplos em PowerShell.
- `package.json` foi elevado para `1.3.1`.

### Fixed in 1.3.1

- Casos marcados manualmente como `failed` ou `partial` deixaram de ser promovidos a `pass` por derivação automática.
- JSONs arbitrários em diretórios de replay deixaram de gerar relatórios falsos.

## 1.3.0 — 12 de abril de 2026

### Added in 1.3.0

- Templates de replay pré-provisionados para `claude-code`, `cursor` e `github-copilot`.
- `saas-skills/evals/results/README.md` para orientar o preenchimento e o ciclo de scoring.
- Baseline consolidado em `saas-skills/evals/results/SUMMARY.md`.

### Changed in 1.3.0

- `score-skill-replays.mjs` passou a compactar listas grandes de pendências.
- `skill-trigger-matrix.json` foi versionado como `1.3.0`.
- `package.json` foi elevado para `1.3.0`.

## 1.2.0 — 12 de abril de 2026

### Added in 1.2.0

- Script `pnpm evals:init` para gerar templates de replay por ambiente.
- Script `pnpm evals:score` para consolidar replays e produzir relatórios Markdown.
- Módulo compartilhado `scripts/skill-eval-utils.mjs` para centralizar o modelo canônico de casos.
- Pasta `saas-skills/evals/results/` para armazenar execuções por ambiente.

### Changed in 1.2.0

- `README.md` passou a documentar o fluxo de replay por ambiente.
- `EVALS_REPORT.md` agora inclui o tooling de replay e scoring.
- `package.json` foi elevado para `1.2.0`.

## 1.1.0 — 12 de abril de 2026

### Added in 1.1.0

- Script `pnpm audit:skills` para auditoria estrutural da biblioteca.
- Script `pnpm qa:skills` para fluxo consolidado de auditoria, lint e export.
- Pasta `saas-skills/evals/` com matriz de trigger, anti-trigger e conflitos para as `16` skills.
- `EVALS_REPORT.md` para registrar a cobertura da suíte de avaliação.
- `PORTABILITY_MATRIX.md` para formalizar modos de instalação e limites de validação.
- `RELEASE_NOTES.md` para versionamento operacional da biblioteca.

### Changed in 1.1.0

- `README.md` passou a documentar validação operacional e bundle achatado.
- `package.json` foi elevado para `1.1.0`.
- `QA_REPORT.md` foi refeito para refletir o estado real do repositório.

### Fixed in 1.1.0

- Frontmatter YAML corrigido nas skills de frontend que ainda usavam bloco cercado.
- Skills acima do limite de 500 linhas foram reduzidas com disclosure progressivo.
- Referência quebrada em `clean-architecture-ddd` foi relocada para dentro da própria skill.
- Seções de `Source References` foram reforçadas com fontes concretas do repositório `Context_Window`.
- Instalação para loaders sem descoberta recursiva passou a ter suporte operacional via `dist/flat-skills/`.

## 1.0.0 — Base Inicial

- Primeira consolidação da biblioteca com `16` skills organizadas por collection.
