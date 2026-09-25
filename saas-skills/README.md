# saas-skills

Fonte canônica das skills da biblioteca Context Window. Cada skill é uma pasta com `SKILL.md`
(frontmatter `name` + `description`, corpo com `## Operational Contract`) e, quando precisa,
`references/`, `scripts/` e `assets/`. O catálogo (`catalog/registry.json`) decide o que é
distribuído; esta pasta guarda o conteúdo.

## Coleções ativas (perfil `dev`)

| Coleção | Skills |
| --- | --- |
| `frontend/` | `react-saas-architecture` (FSD estrito), `design-system-implementation`, `component-reuse-portability`, `saas-ui-specifications` |
| `engineering/` | `multiplatform-platform-architecture` (template, scaffold, gate), `legacy-code-refactoring`, `testing-strategies`, `systems-analysis-saas` |
| `backend/` | `clean-architecture-ddd` (monólito modular ou portas e adaptadores), `api-design-patterns`, `prisma-database-design` |
| `ai-integration/` | `ai-context-diagrams`, `ai-interface-design`, `context-window-optimization`, `prompt-engineering-hybrid`, `saas-ai-agent-engineer`, `multi-perspective-council`, `multi-agent-skill-creator`, `multi-agent-skill-installer` (só invocação explícita) |
| `documentation/` | `intelligent-project-docs`, `technical-research-writing` |

## Coleções ativas (perfil `creative`)

| Coleção | Skills |
| --- | --- |
| `creative/` | `blender-scene-production`, `spline-web-scenes`, `audiovisual-production` |

## Material importado

Imports locais (pasta `imported-skills/`, não versionada) guardam acervo de
outros projetos com status fora de `canonical:active`: não são distribuídos.
O conhecimento útil já promovido está nas skills canônicas acima. Promover um
item novo exige revisão, gate do catálogo limpo, casos de avaliação e mudança
de status com justificativa no registry — sem publicar inventário de cliente.

## Manutenção

1. Crie ou altere a skill aqui (use `multi-agent-skill-creator`).
2. Registre ou atualize a entrada em `catalog/registry.json` (status, perfis, gatilhos).
3. Adicione os casos em `saas-skills/evals/skill-trigger-matrix.json` (mínimo 3 de disparo,
   3 de não disparo, 3 saídas mínimas).
4. Rode `node scripts/cw.mjs catalog --write-lock` e `pnpm qa`.
5. Reinstale nos destinos com `node scripts/cw.mjs install --target <projeto>`.

Nunca corrija uma cópia instalada: o `verify` do destino acusa a edição local e a próxima
instalação para com conflito até a mudança voltar para a fonte.

## Documentos

- [docs/governance/CLIENT_FSD_MIRROR.md](docs/governance/CLIENT_FSD_MIRROR.md) — contrato web + mobile
- [docs/governance/AGENT_SKILL_USAGE_REPORTING.md](docs/governance/AGENT_SKILL_USAGE_REPORTING.md) — disclosure `Skills Used`
- [docs/governance/PROJECT_RULES.md](docs/governance/PROJECT_RULES.md) — regras sempre ativas copiáveis
- [docs/runtime/IDE_RUNTIME_GUIDE.md](docs/runtime/IDE_RUNTIME_GUIDE.md) — clientes, pastas, versões testadas
- [docs/runtime/CURSOR_USER_RULES_GUIDE.md](docs/runtime/CURSOR_USER_RULES_GUIDE.md) — User Rules do Cursor
- [docs/runtime/TARGET_REPO_AGENT_GUIDE.md](docs/runtime/TARGET_REPO_AGENT_GUIDE.md) — roteiro para instalar em um projeto
- [docs/adr/](docs/adr/) — decisões de arquitetura
- [evals/README.md](evals/README.md) — matriz de avaliação de disparo
