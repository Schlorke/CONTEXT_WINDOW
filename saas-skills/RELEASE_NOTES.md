# RELEASE NOTES — Biblioteca saas-skills

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
