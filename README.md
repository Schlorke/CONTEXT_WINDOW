# saas-skills Library

Repositório limpo da biblioteca `saas-skills`, com:

- as 16 skills organizadas por coleção
- scripts de auditoria, export achatado e replay/scoring
- documentação operacional para QA, portabilidade e release

## Estrutura principal

- `saas-skills/` — biblioteca canônica
- `scripts/` — tooling de auditoria, export e evals
- `package.json` — comandos operacionais

## Comandos principais

```bash
pnpm install
pnpm audit:skills
pnpm qa:skills
pnpm export:flat-skills
pnpm evals:init -- claude-code
pnpm evals:score -- saas-skills/evals/results/claude-code.json
```
