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
- Cursor global compat: `~/.cursor/rules/*.mdc`
- Cursor global oficial: `Cursor Settings > Rules` com o bootstrap exportado por `pnpm export:cursor-user-rules`

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
- se o update envolver Cursor global, regenere o bootstrap com `pnpm export:cursor-user-rules` e informe que o texto em `Settings > Rules` pode precisar ser recopiado

Cada runtime gerenciado recebe `.saas-skills-manifest.json`. Use esse manifest para detectar drift.

## Política de Disclosure de Skills

Quando uma tarefa usar uma ou mais skills, a resposta final deve incluir uma seção `Skills Used`.

Formato:

- se houve uso de skill: `- <skill-name>: <short reason>`
- se nenhuma skill foi usada: `Skills Used: none`

Regras:

- relatar apenas skills realmente usadas
- não listar skills apenas disponíveis no ambiente
- não omitir uma skill que influenciou materialmente a solução
- manter a justificativa curta e factual

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
pnpm export:cursor-user-rules
```

### Instalar política obrigatória de disclosure

```bash
pnpm install:skill-usage-reporting -- .
pnpm verify:skill-usage-reporting -- .
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

- **Regra de escopo do Claude (sempre):** a biblioteca genérica deve existir em
  UM escopo só do Claude — recomendado GLOBAL (`~/.claude/skills`), como no
  Codex. Escopo de projeto fica para skills específicas do projeto. Duplicar
  dobra a lista de skills que o modelo vê e degrada o disparo automático (o
  instalador e o `verify` avisam quando detectam os dois escopos).
- **Fluxo recomendado:** `install:global-runtimes` uma vez por máquina; por
  projeto, `install:cursor -- <dir>` + `install:claude-hook -- <dir>` (hook
  determinístico de roteamento, sem duplicar skills).
- Se o usuário disse "só neste repositório", use `install:agent-runtimes -- . --project-only` (e garanta que o Claude global não tenha a biblioteca)
- Se o usuário disse "só na Codex", use `install:codex -- .`
- Se o usuário disse "só no Claude", use `install:claude-global` (preferido) ou `install:claude -- .` (apenas se não houver cópia global)
- Se o usuário disse "só no Cursor", use `install:cursor -- .` ou `install:cursor-global`
- Se o usuário disse "em todos os meus projetos", use `install:global-runtimes` e gere também `export:cursor-user-rules`
- Se o usuário quer os dois, `install:agent-runtimes -- . --global-all` gera aviso de duplicação no Claude — só use com motivo explícito
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

## Skills Recomendadas

Se a biblioteca já estiver instalada, prefira a skill:

- [multi-agent-skill-installer](C:/Projetos/Context_Window/saas-skills/ai-integration/multi-agent-skill-installer/SKILL.md:1)
- [multi-agent-skill-creator](C:/Projetos/Context_Window/saas-skills/ai-integration/multi-agent-skill-creator/SKILL.md:1)

Exemplo de uso:

```text
$multi-agent-skill-installer
Instale esta biblioteca globalmente para Codex, Claude e Cursor e valide em sandbox antes de tocar nos runtimes reais.

$multi-agent-skill-creator
Crie uma skill canônica, adicione os adapters e evals e valide Codex, Claude e Cursor.
```

## Ordem de Leitura Recomendada

1. [README.md](C:/Projetos/Context_Window/README.md:1)
2. [saas-skills/README.md](C:/Projetos/Context_Window/saas-skills/README.md:1)
3. [saas-skills/docs/runtime/IDE_RUNTIME_GUIDE.md](C:/Projetos/Context_Window/saas-skills/docs/runtime/IDE_RUNTIME_GUIDE.md:1)
4. [saas-skills/docs/runtime/CURSOR_USER_RULES_GUIDE.md](C:/Projetos/Context_Window/saas-skills/docs/runtime/CURSOR_USER_RULES_GUIDE.md:1)
5. [saas-skills/docs/runtime/TARGET_REPO_AGENT_GUIDE.md](C:/Projetos/Context_Window/saas-skills/docs/runtime/TARGET_REPO_AGENT_GUIDE.md:1)

## Critério de Sucesso

Considere sucesso quando:

- as skills estão no runtime certo de cada plataforma
- os manifests de runtime estão presentes e na mesma versão da fonte atual
- `pnpm verify:agent-runtimes` ou `pnpm verify:global-runtimes` passa
- `pnpm status:agent-runtimes` ou `pnpm status:global-runtimes` mostra `current`
- se o escopo incluir Cursor global, o bootstrap exportado para `Settings > Rules` foi gerado e informado ao usuário
- o smoke test responde no domínio correto
- nenhum arquivo da aplicação foi alterado
