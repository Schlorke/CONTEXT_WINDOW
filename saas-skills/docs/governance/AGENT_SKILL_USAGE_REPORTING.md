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

A política é um bloco gerenciado (`<!-- BEGIN context-window:usage-policy ... -->`) instalado junto com
as skills:

- projeto: no `AGENTS.md` (lido por Codex e Cursor); o `CLAUDE.md` recebe `@AGENTS.md` para o
  Claude Code ler o mesmo texto
- usuário: em `$CLAUDE_CONFIG_DIR/CLAUDE.md` (Claude Code) e `$CODEX_HOME/AGENTS.md` (Codex); no
  Cursor, pelo texto de User Rules

O texto da política está em `catalog/contract/usage-policy.md`. O conteúdo do time fora dos
marcadores é preservado, e há backup antes de cada mudança.

## Comandos

Instalar a política no projeto-alvo (com as skills):

```bash
node scripts/cw.mjs install --target <projeto> --profile dev --with-usage-policy
```

Verificar se a política está aplicada e intacta:

```bash
node scripts/cw.mjs verify --target <projeto>
```

Texto para as User Rules do Cursor, com a política:

```bash
node scripts/cw.mjs contract --format cursor-user-rules --with-usage-policy
```

Instalações 1.x que usavam o bloco `SAAS_SKILLS_USAGE_REPORTING` são detectadas; a troca exige
`--migrate-legacy`.

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
