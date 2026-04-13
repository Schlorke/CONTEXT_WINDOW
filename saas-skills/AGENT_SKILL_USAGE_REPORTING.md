# Agent Skill Usage Reporting

Política recomendada para repositórios que usam `saas-skills` e querem visibilidade real sobre adoção de skills.

## Objetivo

Exigir que o agente declare, no final de cada tarefa, quais skills realmente influenciaram a resposta.

Isso ajuda a responder:

- quais skills estão sendo usadas de verdade
- se uma skill está sendo acionada como esperado
- se a equipe está dependendo mais de uma skill do que de outra
- se uma skill parece instalada, mas não aparece nunca no trabalho real

## Regra Operacional

Ao final de toda tarefa concluída, o agente deve incluir uma seção chamada `Skills Used`.

Formato obrigatório:

- se uma ou mais skills foram usadas:
  - `- <skill-name>: <short reason>`
- se nenhuma skill foi usada:
  - `Skills Used: none`

## Regras de Qualidade

- relatar apenas skills realmente usadas
- não listar skills apenas disponíveis no ambiente
- usar o nome canônico da skill sempre que possível
- não omitir uma skill que influenciou materialmente a solução
- manter a justificativa curta e factual
- em tarefa parcial, bloqueada ou exploratória, reportar as skills usadas até aquele ponto

## Onde Aplicar

Para cobrir Codex, Claude e Cursor no mesmo projeto, a política deve ser instalada em:

- `AGENTS.md`
- `CLAUDE.md`
- `.cursor/rules/skill-usage-reporting.mdc`

Isso cobre:

- Codex: via `AGENTS.md`
- Claude: via `CLAUDE.md`
- Cursor: via `.cursor/rules/*.mdc`

## Comandos

Instalar a política no projeto-alvo:

```bash
pnpm install:skill-usage-reporting -- <target-dir>
```

Verificar se a política está aplicada:

```bash
pnpm verify:skill-usage-reporting -- <target-dir>
```

## Exemplo de Saída

```text
Skills Used
- multi-agent-skill-installer: used to choose the correct Codex, Claude, and Cursor runtime targets
- api-design-patterns: used to structure the API contract and validation guidance
```

Sem skill:

```text
Skills Used: none
```

## Observação

Essa política melhora observabilidade, mas não substitui avaliação de qualidade.  
Ela serve para transparência operacional, não para provar sozinha que uma skill foi bem aplicada.
