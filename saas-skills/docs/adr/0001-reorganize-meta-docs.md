# ADR 0001 — Reorganizar meta-documentação em `saas-skills/docs/`

## Status

Aceito — 2026-05-13.

## Contexto

A raiz de `saas-skills/` acumulava, ao lado das coleções de skills (`frontend/`,
`backend/`, `ai-integration/`, `documentation/`, `engineering/`, `evals/`,
`integrations/`), 10 documentos de governança, runtime e relatórios:

- `IDE_RUNTIME_GUIDE.md`
- `CURSOR_USER_RULES_GUIDE.md`
- `TARGET_REPO_AGENT_GUIDE.md`
- `PORTABILITY_MATRIX.md`
- `AGENT_SKILL_USAGE_REPORTING.md`
- `PROJECT_RULES.md`
- `QA_REPORT.md`
- `EVALS_REPORT.md`
- `PRACTICAL_SKILL_TEST_REPORT.md`
- `RELEASE_NOTES.md`

Esses ficheiros são **meta-documentação** (sobre como instalar, governar e
validar a biblioteca), não conteúdo de skill. A convivência na mesma raiz
dificultava:

- separar visualmente conteúdo (skills) e meta (governança/runtime/qa)
- onboarding de novos agentes/devs no repositório
- crescer a biblioteca sem poluir a raiz

## Decisão

Mover esses 10 ficheiros para uma estrutura `saas-skills/docs/` com 3
pastas semânticas:

```text
saas-skills/
  docs/
    runtime/
      IDE_RUNTIME_GUIDE.md
      CURSOR_USER_RULES_GUIDE.md
      TARGET_REPO_AGENT_GUIDE.md
      PORTABILITY_MATRIX.md
    governance/
      AGENT_SKILL_USAGE_REPORTING.md
      PROJECT_RULES.md
    qa/
      QA_REPORT.md
      EVALS_REPORT.md
      PRACTICAL_SKILL_TEST_REPORT.md
    adr/
      0001-reorganize-meta-docs.md
    RELEASE_NOTES.md
  README.md
  ai-integration/
  backend/
  documentation/
  engineering/
  frontend/
  evals/
  integrations/
```

`README.md` permanece na raiz de `saas-skills/` como entry point.

A movimentação foi feita com `git mv` para preservar o histórico dos ficheiros.

## Implementação

Atualizações de links foram aplicadas em:

- `saas-skills/README.md` — links para meta-docs (9 substituições)
- `README.md` (raiz do repositório) — links para meta-docs (5 substituições)
- `AGENTS.md` (raiz do repositório) — links absolutos para meta-docs
- `saas-skills/ai-integration/multi-agent-skill-installer/SKILL.md` — frontmatter
  `sources` e seção `Source References`
- `saas-skills/docs/runtime/IDE_RUNTIME_GUIDE.md` — caminhos relativos
  `integrations/` e `README.md`
- `saas-skills/docs/qa/QA_REPORT.md` — caminhos relativos `scripts/` e `evals/`
- `saas-skills/docs/qa/EVALS_REPORT.md` — caminhos relativos `evals/`

## Validação

- `pnpm qa:skills` passou (audit, markdownlint, exports, smoke install,
  verify e status com 5 runtimes em sandbox).
- `pnpm sync:global-runtimes` aplicado nos runtimes globais reais.
- `pnpm sync:agent-runtimes` aplicado em `C:\Projetos\OkGasLandingPage`
  e `C:\Projetos\OkGas`.
- `pnpm status:global-runtimes` e `pnpm status:agent-runtimes` reportam
  `current` em todos os manifests, versão `1.10.0`.

## Consequências

### Positivas

- Raiz de `saas-skills/` fica focada em coleções e em `README.md`.
- Separação clara entre conteúdo (skills) e meta-documentação.
- Espaço estabelecido para futuros ADRs em `docs/adr/`.
- Navegação mais previsível para agentes novos (`docs/runtime`,
  `docs/governance`, `docs/qa`).

### Negativas

- Links externos (issues, posts, bookmarks) que apontavam para os caminhos
  antigos param de funcionar e precisam ser atualizados manualmente.
- Quem mantinha cópias parciais da biblioteca em outros repositórios precisa
  rodar `sync:agent-runtimes` para alinhar manifests e SKILL.md atualizados.

### Neutras

- Versão da biblioteca permaneceu `1.10.0`. A reorganização é considerada
  refactor estrutural sem mudança no contrato público das skills.

## Alternativas consideradas

1. **Manter tudo na raiz** — descartado por não escalar com o crescimento da
   meta-documentação.
2. **Mover para `docs/` na raiz do repositório** (`/docs/saas-skills/...`) —
   descartado para preservar a portabilidade de `saas-skills/` como pasta
   auto-contida que pode ser copiada inteira para outros repositórios.
3. **Subpastas planas em `saas-skills/`** (sem o nível `docs/`) — descartado
   porque ainda misturaria pastas de meta-doc com pastas de coleções.
