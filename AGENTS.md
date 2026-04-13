# AGENTS

Ponto de entrada para agentes que precisem usar, instalar ou validar a biblioteca `saas-skills`.

## Objetivo do Repositório

Este repositório é a fonte de verdade de uma biblioteca de skills SaaS.

Ele existe para:

- manter as skills canônicas em `saas-skills/`
- exportar runtimes corretos para Codex, Claude e Cursor
- instalar esses runtimes com segurança
- sincronizar updates a partir da fonte de verdade
- validar a instalação sem tocar no código da aplicação

## Regra Operacional Mais Importante

Não assuma que uma única estrutura de arquivos funciona para todas as plataformas.

Runtimes corretos:

- Codex: `$CODEX_HOME/skills/<skill>/SKILL.md`
- Claude projeto: `.claude/skills/<skill>/SKILL.md`
- Claude global: `~/.claude/skills/<skill>/SKILL.md`
- Cursor projeto: `.cursor/rules/*.mdc`
- Cursor global: `~/.cursor/rules/*.mdc`

Não use:

- `.cursor/skills/` como runtime oficial
- `saas-skills/frontend/...` diretamente dentro de `.claude/skills/`
- o `skill-installer` nativo da Codex como se ele instalasse Claude e Cursor
- cópias instaladas como se fossem a fonte correta para manutenção

## Política de Sync

Considere todo runtime instalado como artefato gerado.

- edite sempre `saas-skills/`
- depois sincronize os runtimes desejados
- confirme a versão com `status` e `verify`
- não faça hotfix diretamente em `.claude/skills/`, `.cursor/rules/` ou `$CODEX_HOME/skills/`

Cada runtime gerenciado recebe `.saas-skills-manifest.json`. Use esse manifest para detectar drift.

## Comandos Canônicos

### Validar a biblioteca

```bash
pnpm install
pnpm qa:skills
```

### Instalar no projeto atual

```bash
pnpm install:agent-runtimes -- .
pnpm verify:agent-runtimes -- .
```

### Instalar apenas em uma IA

```bash
pnpm install:codex -- .
pnpm verify:codex -- .

pnpm install:claude -- .
pnpm verify:claude -- .

pnpm install:cursor -- .
pnpm verify:cursor -- .
```

### Instalar globalmente para Codex, Claude e Cursor

```bash
pnpm install:global-runtimes
pnpm verify:global-runtimes
```

### Sincronizar updates

```bash
pnpm sync:agent-runtimes -- .
pnpm status:agent-runtimes -- .

pnpm sync:global-runtimes
pnpm status:global-runtimes
```

### Validar em sandbox antes de tocar nos runtimes reais

```bash
pnpm install:agent-runtimes -- . --global-all --dry-run --codex-home .agent-runtime-smoke/codex-home --claude-home .agent-runtime-smoke/claude-home --cursor-home .agent-runtime-smoke/cursor-home
pnpm install:agent-runtimes -- . --global-all --codex-home .agent-runtime-smoke/codex-home --claude-home .agent-runtime-smoke/claude-home --cursor-home .agent-runtime-smoke/cursor-home
pnpm verify:agent-runtimes -- . --global-all --codex-home .agent-runtime-smoke/codex-home --claude-home .agent-runtime-smoke/claude-home --cursor-home .agent-runtime-smoke/cursor-home
```

## Como Escolher o Fluxo

- Se o usuário disse "só neste repositório", use `install:agent-runtimes -- . --project-only`
- Se o usuário disse "só na Codex", use `install:codex -- .`
- Se o usuário disse "só no Claude", use `install:claude -- .` ou `install:claude-global`
- Se o usuário disse "só no Cursor", use `install:cursor -- .` ou `install:cursor-global`
- Se o usuário disse "em todos os meus projetos", use `install:global-runtimes`
- Se o usuário quer os dois, use `install:agent-runtimes -- . --global-all`
- Se o usuário pediu update de uma skill já instalada, edite a fonte canônica e rode `sync`, não patch na cópia instalada
- Se houver qualquer dúvida sobre impacto, comece com sandbox

## Smoke Test Permitido

Depois da instalação, só use prompts analíticos.

Pode:

- pedir análise de API
- pedir análise de arquitetura React
- pedir proposta de README/AGENTS/ADR
- pedir estratégia de testes

Não pode:

- editar código do app
- rodar build
- rodar migration
- subir dev server só para validar a biblioteca

## Skill Recomendada

Se a biblioteca já estiver instalada, prefira a skill:

- [multi-agent-skill-installer](C:/Projetos/Context_Window/saas-skills/ai-integration/multi-agent-skill-installer/SKILL.md:1)

Exemplo de uso:

```text
$multi-agent-skill-installer
Instale esta biblioteca globalmente para Codex, Claude e Cursor e valide em sandbox antes de tocar nos runtimes reais.
```

## Ordem de Leitura Recomendada

1. [README.md](C:/Projetos/Context_Window/README.md:1)
2. [saas-skills/README.md](C:/Projetos/Context_Window/saas-skills/README.md:1)
3. [saas-skills/IDE_RUNTIME_GUIDE.md](C:/Projetos/Context_Window/saas-skills/IDE_RUNTIME_GUIDE.md:1)
4. [saas-skills/TARGET_REPO_AGENT_GUIDE.md](C:/Projetos/Context_Window/saas-skills/TARGET_REPO_AGENT_GUIDE.md:1)

## Critério de Sucesso

Considere sucesso quando:

- as skills estão no runtime certo de cada plataforma
- os manifests de runtime estão presentes e na mesma versão da fonte atual
- `pnpm verify:agent-runtimes` ou `pnpm verify:global-runtimes` passa
- `pnpm status:agent-runtimes` ou `pnpm status:global-runtimes` mostra `current`
- o smoke test responde no domínio correto
- nenhum arquivo da aplicação foi alterado
