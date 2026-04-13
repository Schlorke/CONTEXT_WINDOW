# Changelog

Todos os ajustes relevantes desta biblioteca são registrados aqui.

Este arquivo segue a convenção de changelog público: histórico por versão, mudanças agrupadas por categoria e foco em impacto para usuário, mantenedor e agente.

Convenções deste projeto:

- formato inspirado em `Keep a Changelog`
- versionamento semântico como referência operacional
- `CHANGELOG.md` para visão pública e limpa
- `saas-skills/RELEASE_NOTES.md` para trilha operacional detalhada

## [Unreleased]

### Fixed in Unreleased

- Corrigido o frontmatter YAML de `4` skills de frontend para manter compatibilidade com parsers mais estritos da Codex:
  - `component-reuse-portability`
  - `design-system-implementation`
  - `react-saas-architecture`
  - `saas-ui-specifications`
- O `markdownlint` deixou de varrer `dist/**`, evitando falhas de QA causadas por artefatos gerados e caches temporários externos ao source-of-truth.

### Validation in Unreleased

- `pnpm qa:skills` voltou a passar integralmente depois dessas correções.

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
