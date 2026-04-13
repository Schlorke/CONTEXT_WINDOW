# RELEASE NOTES — Biblioteca saas-skills

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
