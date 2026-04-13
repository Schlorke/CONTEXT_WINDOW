# IDE RUNTIME GUIDE

Guia operacional para instalar `saas-skills` corretamente em Codex, Claude e Cursor.

**Objetivo:** transformar a biblioteca canônica em runtimes reais por plataforma, com instalação segura e validação sem tocar no código do projeto-alvo.

## Regra Central

Não existe hoje um formato único de "skill" que qualquer IDE consuma da mesma forma.

Para esta biblioteca, a estratégia correta é:

- **fonte de verdade:** `saas-skills/`
- **política de update:** edite `saas-skills/` e sincronize; não edite cópias instaladas
- **runtime Codex:** `$CODEX_HOME/skills/<skill>/SKILL.md`
- **runtime Claude:** `.claude/skills/<skill>/SKILL.md` ou `~/.claude/skills/<skill>/SKILL.md`
- **runtime Cursor por projeto:** `.cursor/rules/*.mdc`
- **compatibilidade global do Cursor:** `~/.cursor/rules/*.mdc`
- **bootstrap global oficial do Cursor:** `Cursor Settings > Rules`

Ou seja, a biblioteca precisa de adapters por ambiente.

Cada runtime gerenciado recebe `.saas-skills-manifest.json`. Esse manifest registra a versão instalada e permite verificar se uma instância ficou desatualizada em relação à fonte atual.

Se você quiser obrigar o agente a declarar quais skills usou em cada tarefa, aplique também a política de disclosure do projeto:

- `AGENTS.md` para Codex
- `CLAUDE.md` para Claude
- `.cursor/rules/skill-usage-reporting.mdc` para Cursor

## Codex

O `skill-installer` nativo da Codex instala skills em:

```text
$CODEX_HOME/skills/<skill>/SKILL.md
```

Na prática:

- se `CODEX_HOME` estiver definido, o destino é `<CODEX_HOME>/skills/`
- caso contrário, o padrão é `~/.codex/skills/`

Ponto importante:

- esse mecanismo resolve apenas a instalação da própria Codex
- ele não gera `.cursor/rules/`
- ele não instala `.claude/skills/` dentro do projeto

## Claude

Claude Code usa skills em:

```text
.claude/skills/<skill-name>/SKILL.md
```

e também suporta skills pessoais em:

```text
~/.claude/skills/<skill-name>/SKILL.md
```

Pontos importantes:

- as skills precisam ficar como diretórios imediatos dentro de `.claude/skills/`
- copiar a árvore canônica inteira com coleções (`frontend/`, `backend/`) para dentro de `.claude/skills/` não é o modo recomendado de runtime

Por isso, para Claude, o caminho mais seguro é usar o bundle achatado ou o instalador do repositório.

## Cursor

Cursor usa regras em:

```text
.cursor/rules/*.mdc
```

Como compatibilidade global neste repositório, as rules também podem ser materializadas em:

```text
~/.cursor/rules/*.mdc
```

Pontos importantes:

- `.cursor/skills/` não é o runtime oficial do Cursor
- o runtime real do Cursor é `.cursor/rules/`
- algumas regras funcionam melhor como **Agent Requested**
- outras podem ser **Auto Attached** quando existe um conjunto de `globs` bem definido
- a documentação oficial do Cursor descreve `User Rules` globais na interface
- por isso, neste repositório, `~/.cursor/rules/` é tratado como export de compatibilidade e não como equivalente perfeito da UI
- para o caminho global oficialmente alinhado, use também `pnpm export:cursor-user-rules` e cole o bootstrap em `Cursor Settings > Rules`

Nesta biblioteca, o adapter de Cursor é gerado a partir de:

- [cursor-rule-profiles.json](integrations/cursor-rule-profiles.json)

## Instalador Unificado

Se você quer um único comando que qualquer agente possa executar para instalar nos três destinos corretos, use:

```bash
pnpm install:agent-runtimes -- <target-dir>
pnpm verify:agent-runtimes -- <target-dir>
```

Equivalente portátil:

```bash
node scripts/install-agent-runtimes.mjs <target-dir>
node scripts/verify-agent-runtimes.mjs <target-dir>
```

Esse fluxo instala:

- Codex em `$CODEX_HOME/skills/`
- Claude em `<target-dir>/.claude/skills/`
- Cursor em `<target-dir>/.cursor/rules/`

Se você quiser instalar também as versões globais de Claude e Cursor:

```bash
pnpm install:agent-runtimes -- <target-dir> --global-all
pnpm verify:agent-runtimes -- <target-dir> --global-all
pnpm export:cursor-user-rules
```

Se você quiser apenas os runtimes globais:

```bash
pnpm install:global-runtimes
pnpm verify:global-runtimes
pnpm export:cursor-user-rules
```

## Modos Úteis

### Apenas projeto

```bash
pnpm install:agent-runtimes -- . --project-only
pnpm verify:agent-runtimes -- . --project-only
```

### Apenas Codex

```bash
pnpm install:agent-runtimes -- . --codex-only
pnpm verify:agent-runtimes -- . --codex-only
```

### Apenas Claude

```bash
pnpm install:agent-runtimes -- . --claude-only
pnpm verify:agent-runtimes -- . --claude-only
```

### Apenas Cursor

```bash
pnpm install:agent-runtimes -- . --cursor-only
pnpm verify:agent-runtimes -- . --cursor-only
```

### Apenas globais

```bash
pnpm install:global-runtimes
pnpm verify:global-runtimes
pnpm export:cursor-user-rules
```

### Status e sincronização

```bash
pnpm status:agent-runtimes -- .
pnpm status:global-runtimes

pnpm sync:agent-runtimes -- .
pnpm sync:global-runtimes
```

Use `status` para descobrir quais runtimes estão `current`, `outdated`, `missing` ou `foreign`.
Use `sync` para reaplicar a versão atual de `saas-skills/` nos runtimes desejados.
Se o escopo incluir Cursor global, regenere também `pnpm export:cursor-user-rules` e atualize o texto colado em `Cursor Settings > Rules` quando o bootstrap mudar.

## Política de Disclosure das Skills Usadas

Para exigir que o agente informe no final da tarefa quais skills realmente foram usadas, rode:

```bash
pnpm install:skill-usage-reporting -- .
pnpm verify:skill-usage-reporting -- .
```

Esse fluxo instala a política em:

- `AGENTS.md`
- `CLAUDE.md`
- `.cursor/rules/skill-usage-reporting.mdc`

Formato exigido:

```text
Skills Used
- <skill-name>: <short reason>
```

Se nenhuma skill foi usada:

```text
Skills Used: none
```

## Smoke Seguro dos Runtimes Globais

Se você quer validar o fluxo completo sem mexer nas instalações reais do usuário, use homes isolados:

```bash
pnpm install:agent-runtimes -- . --global-all --codex-home .agent-runtime-smoke/codex-home --claude-home .agent-runtime-smoke/claude-home --cursor-home .agent-runtime-smoke/cursor-home
pnpm verify:agent-runtimes -- . --global-all --codex-home .agent-runtime-smoke/codex-home --claude-home .agent-runtime-smoke/claude-home --cursor-home .agent-runtime-smoke/cursor-home
```

Isso é útil para:

- smoke tests
- CI local
- validação por agentes
- testes em repositório de terceiros

## Fluxo Seguro Recomendado

Use este fluxo quando quiser instalar a biblioteca sem comprometer o projeto:

1. Rode instalação em modo `dry-run`.
2. Confirme que só serão tocadas pastas `.claude/`, `.cursor/` e, se aplicável, o `CODEX_HOME` escolhido.
3. Rode a instalação real com homes isolados.
4. Rode a verificação estrutural.
5. Rode `status` para confirmar se a sandbox está `current`.
6. Execute smoke tests que peçam apenas análise, plano ou especificação.
7. Se tudo estiver bom, repita sem os homes isolados para instalar nos runtimes reais.

## Smoke Test Sem Impacto no Projeto

Depois de instalar, valide com prompts que não pedem edição.

Exemplos:

- Backend:
  `Analyze how you would design the invoices API in this repo with auth, validation, and pagination. Do not edit files.`
- Frontend:
  `Explain how you would organize the shared React layers and feature folders for this repo. Do not edit files.`
- Documentation:
  `Propose a README, AGENTS.md, and ADR structure for this repository. Do not edit files.`
- Testing:
  `Define the testing pyramid and tooling stack you would apply to this repo. Do not edit files.`

Critério de aprovação:

- a resposta foca no domínio certo
- a resposta cobre os elementos mínimos daquela skill
- a resposta não mistura de forma caótica duas ou três skills vizinhas

## Quando Considerar que "Funcionou"

Considere a instalação funcional quando:

- `pnpm verify:agent-runtimes` passar
- `pnpm status:agent-runtimes` ou `pnpm status:global-runtimes` mostrar `current`
- Codex encontrar as skills em `$CODEX_HOME/skills/`
- Claude encontrar as skills em `.claude/skills/` ou `~/.claude/skills/`
- Cursor carregar as regras geradas em `.cursor/rules/`
- se o escopo for Cursor global, o export de compatibilidade existir em `~/.cursor/rules/` e o bootstrap `CURSOR_USER_RULES.md` ter sido gerado para `Settings > Rules`
- smoke tests sem edição mostrarem comportamento coerente com a skill esperada

## O Que Esta Estratégia Evita

Ela evita:

- usar o `skill-installer` da Codex como se ele instalasse também Claude e Cursor
- instalar a árvore errada em `.claude/skills/`
- depender de `.cursor/skills/` como se fosse runtime nativo
- tratar `~/.cursor/rules/` como se fosse garantia de exibição na UI do Cursor
- tocar no código da aplicação para apenas validar a biblioteca
- misturar fonte de verdade com adapters específicos por plataforma
- deixar uma IA atualizada e as outras desatualizadas sem detecção

## Referências Operacionais

- Cursor Rules oficial: [docs.cursor.com/en/context/rules](https://docs.cursor.com/en/context/rules)
- Claude Skills oficial: [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills)
- Skill Installer da Codex: comportamento observado no skill nativo `skill-installer` da própria Codex, que instala em `$CODEX_HOME/skills`

## Troubleshooting

- **Cursor não aplicou a library:** confirme que os arquivos foram para `.cursor/rules/` ou `~/.cursor/rules/`, não para `.cursor/skills/`.
- **As rules globais do Cursor não apareceram na interface:** isso não invalida o export de compatibilidade. Gere `pnpm export:cursor-user-rules` e cole o bootstrap em `Cursor Settings > Rules`.
- **Claude não encontrou a skill:** confirme que existe uma pasta imediata por skill em `.claude/skills/` ou `~/.claude/skills/`.
- **Só a Codex recebeu as skills:** isso acontece quando o fluxo usou apenas o `skill-installer` nativo da Codex.
- **Atualizei uma cópia instalada e as outras IAs não acompanharam:** o fluxo correto é editar `saas-skills/` e rodar `sync`.
- **Não sei qual runtime está atrasado:** rode `pnpm status:agent-runtimes -- <target-dir>` ou `pnpm status:global-runtimes`.
- **Você quer testar sem tocar no ambiente real:** rode o instalador com `--codex-home`, `--claude-home` e `--cursor-home`.
- **Não sabe se usa projeto ou global:** projeto para escopo local; global para disponibilizar em todos os repositórios do usuário.
- **O agente quer editar o app para “testar”:** isso é erro de fluxo; a validação correta é estrutural + smoke prompt sem edição.

## Documentos Relacionados

- [README.md](README.md)
- [CURSOR_USER_RULES_GUIDE.md](CURSOR_USER_RULES_GUIDE.md)
- [PORTABILITY_MATRIX.md](PORTABILITY_MATRIX.md)
- [TARGET_REPO_AGENT_GUIDE.md](TARGET_REPO_AGENT_GUIDE.md)
