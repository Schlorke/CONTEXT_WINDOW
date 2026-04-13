# CONTEXT_WINDOW

Biblioteca operacional de `Agent Skills` para desenvolvimento SaaS, com instalação unificada para Codex, Claude e Cursor.

Este repositório não é um produto SaaS. Ele é a fonte de verdade de uma biblioteca de skills, referências e tooling para instalar runtimes corretos de IA em projetos reais sem tocar no código da aplicação.

## Propósito

O projeto existe para resolver este problema:

> "Quero uma biblioteca de habilidades para IA que seja reutilizável, auditável e instalável corretamente em Codex, Claude e Cursor."

Na prática, isso significa:

- skills procedurais, não genéricas
- fonte de verdade única em `saas-skills/`
- adapter específico por plataforma
- instalação segura em três runtimes diferentes
- verificação estrutural e smoke tests sem impacto no app

## Estrutura

```text
.
├── saas-skills/        # Biblioteca canônica
│   ├── frontend/
│   ├── backend/
│   ├── ai-integration/
│   ├── documentation/
│   ├── engineering/
│   ├── integrations/
│   ├── evals/
│   └── *.md
├── scripts/            # Export, instalação, verificação e QA
├── package.json
└── README.md
```

## Modelo Correto de Runtime

Esta biblioteca usa uma estratégia de adapters. Não existe um formato único de skill que Codex, Claude e Cursor consumam do mesmo jeito.

- `saas-skills/` é a fonte de verdade
- Codex usa `$CODEX_HOME/skills/<skill>/SKILL.md`
- Claude pode usar `.claude/skills/<skill>/SKILL.md` por projeto ou `~/.claude/skills/<skill>/SKILL.md` globalmente
- Cursor pode usar `.cursor/rules/*.mdc` por projeto ou `~/.cursor/rules/*.mdc` globalmente

Pontos importantes:

- o `skill-installer` nativo da Codex instala skills na área da própria Codex; ele não instala rules do Cursor nem runtime do Claude por conta própria
- `.cursor/skills/` não é o runtime oficial do Cursor
- copiar a árvore agrupada por coleção para dentro de `.claude/skills/` não é o modo recomendado de runtime do Claude
- no Cursor, a documentação oficial fala em `User Rules` globais nas configurações; este repositório materializa esse runtime global como arquivos em `~/.cursor/rules/`

Detalhes completos:

- [AGENTS.md](AGENTS.md)
- [saas-skills/IDE_RUNTIME_GUIDE.md](saas-skills/IDE_RUNTIME_GUIDE.md)
- [saas-skills/TARGET_REPO_AGENT_GUIDE.md](saas-skills/TARGET_REPO_AGENT_GUIDE.md)
- [saas-skills/PORTABILITY_MATRIX.md](saas-skills/PORTABILITY_MATRIX.md)

## Quick Start

```bash
pnpm install
pnpm qa:skills
```

Isso valida:

- estrutura das `SKILL.md`
- export do runtime achatado para Claude
- export do adapter `.mdc` para Cursor
- instalação smoke-test para Codex, Claude e Cursor em `dist/`

## Comandos

| Comando | O que faz | Quando usar |
| --- | --- | --- |
| `pnpm install` | Instala dependências de tooling | Sempre após clonar |
| `pnpm audit:skills` | Valida frontmatter, seções obrigatórias, referências internas e cobertura mínima de evals | Antes de release |
| `pnpm lint:md` | Roda `markdownlint` | Após editar documentação |
| `pnpm export:flat-skills` | Gera `dist/flat-skills/` com uma pasta imediata por skill | Para runtime do Claude e loaders rasos |
| `pnpm export:cursor-rules` | Gera `dist/cursor-rules/` com adapters `.mdc` | Para runtime do Cursor |
| `pnpm install:ide-runtime -- <target-dir>` | Instala apenas os runtimes de projeto de Claude e Cursor | Quando você não quer tocar na Codex |
| `pnpm verify:ide-runtime -- <target-dir>` | Verifica apenas os runtimes de projeto de Claude e Cursor | Depois da instalação de projeto |
| `pnpm install:agent-runtimes -- <target-dir>` | Instala Codex global e Claude/Cursor no projeto | Para instalação unificada multi-IA por projeto |
| `pnpm verify:agent-runtimes -- <target-dir>` | Verifica Codex global e Claude/Cursor no projeto | Depois da instalação unificada por projeto |
| `pnpm install:global-runtimes` | Instala Codex, Claude e Cursor globalmente | Para disponibilizar a biblioteca em todos os projetos |
| `pnpm verify:global-runtimes` | Verifica a instalação global das três plataformas | Depois da instalação global |
| `pnpm evals:init -- <ambiente>` | Cria um template de replay | Só para benchmark/QA avançado |
| `pnpm evals:score -- <arquivo-ou-diretorio>` | Consolida replay e gera relatórios | Só para benchmark/QA avançado |
| `pnpm qa:skills` | Executa auditoria, lint, export, instalação smoke-test multi-IA e verificação | Validação final da biblioteca |

## Instalação Unificada por Projeto

Esse é o fluxo mais próximo de um "executável único" para qualquer agente:

```bash
pnpm install:agent-runtimes -- C:\caminho\do\projeto
pnpm verify:agent-runtimes -- C:\caminho\do\projeto
```

Comportamento:

- instala Codex em `%CODEX_HOME%/skills` ou `~/.codex/skills`
- instala Claude em `<projeto>/.claude/skills/`
- instala Cursor em `<projeto>/.cursor/rules/`

Se você quiser apenas os runtimes de projeto:

```bash
pnpm install:agent-runtimes -- C:\caminho\do\projeto --project-only
pnpm verify:agent-runtimes -- C:\caminho\do\projeto --project-only
```

## Instalação Global para Todas as IAs

Se você quer que a biblioteca fique disponível de forma global para as três plataformas no mesmo usuário:

```bash
pnpm install:global-runtimes
pnpm verify:global-runtimes
```

Comportamento:

- instala Codex em `%CODEX_HOME%/skills` ou `~/.codex/skills`
- instala Claude em `~/.claude/skills/`
- instala Cursor em `~/.cursor/rules/`

Se você quiser instalar global e também manter o runtime do projeto:

```bash
pnpm install:agent-runtimes -- C:\caminho\do\projeto --global-all
pnpm verify:agent-runtimes -- C:\caminho\do\projeto --global-all
```

Depois que a skill [multi-agent-skill-installer](C:/Projetos/Context_Window/saas-skills/ai-integration/multi-agent-skill-installer/SKILL.md:1) estiver instalada, você também pode pedir isso em linguagem natural, por exemplo:

```text
$multi-agent-skill-installer
Instale esta biblioteca globalmente para Codex, Claude e Cursor e valide em sandbox antes de tocar nos runtimes reais.
```

## Qual Comando Usar

Use esta regra rápida:

- quer usar só neste repo: `pnpm install:agent-runtimes -- . --project-only`
- quer usar em todos os seus projetos: `pnpm install:global-runtimes`
- quer projeto atual + global ao mesmo tempo: `pnpm install:agent-runtimes -- . --global-all`
- quer provar que não vai tocar nos runtimes reais: adicione `--codex-home`, `--claude-home` e `--cursor-home`

## Validação Segura sem Tocar nos Runtimes Reais

Para testar a instalação completa sem mexer nos runtimes reais do usuário, use homes isolados:

```bash
pnpm install:agent-runtimes -- C:\caminho\do\projeto --global-all --codex-home C:\caminho\do\projeto\.agent-runtime-smoke\codex-home --claude-home C:\caminho\do\projeto\.agent-runtime-smoke\claude-home --cursor-home C:\caminho\do\projeto\.agent-runtime-smoke\cursor-home
pnpm verify:agent-runtimes -- C:\caminho\do\projeto --global-all --codex-home C:\caminho\do\projeto\.agent-runtime-smoke\codex-home --claude-home C:\caminho\do\projeto\.agent-runtime-smoke\claude-home --cursor-home C:\caminho\do\projeto\.agent-runtime-smoke\cursor-home
```

Esse fluxo é o recomendado para:

- smoke tests
- CI local
- validação por agentes
- auditoria sem tocar em Codex, Claude e Cursor reais do usuário

## Skill Installer da Codex vs Instalador do Repositório

O `skill-installer` nativo da Codex resolve isto:

- baixar uma skill de um repositório GitHub
- instalar em `$CODEX_HOME/skills`

Ele não resolve sozinho:

- gerar `.cursor/rules/*.mdc`
- instalar `.claude/skills/` local ou global
- instalar `.cursor/rules/` local ou global
- validar os três runtimes em conjunto

O instalador deste repositório resolve isso:

- copia as skills canônicas para a Codex
- instala o runtime correto do Claude no projeto ou globalmente
- gera e instala as rules corretas do Cursor no projeto ou globalmente
- verifica tudo
- permite smoke test com homes isolados

## Instalação Segura sem Impactar o Projeto

O fluxo recomendado para projeto-alvo é:

1. `pnpm install:agent-runtimes -- <target-dir> --dry-run`
2. revisar os caminhos planejados
3. `pnpm install:agent-runtimes -- <target-dir> --global-all --codex-home <sandbox> --claude-home <sandbox> --cursor-home <sandbox>`
4. `pnpm verify:agent-runtimes -- <target-dir> --global-all --codex-home <sandbox> --claude-home <sandbox> --cursor-home <sandbox>`
5. executar smoke tests que peçam apenas análise, sem editar arquivos

O playbook copiável para o agente está em:

- [saas-skills/TARGET_REPO_AGENT_GUIDE.md](saas-skills/TARGET_REPO_AGENT_GUIDE.md)

Para agentes trabalhando dentro deste próprio repositório, o ponto de entrada é:

- [AGENTS.md](AGENTS.md)

## O Que Existe em `saas-skills/`

A biblioteca canônica contém:

- `17` skills organizadas em `5` coleções
- `references/` e `assets/` por skill quando necessário
- matriz de evals
- perfis de adapter para Cursor em [cursor-rule-profiles.json](saas-skills/integrations/cursor-rule-profiles.json)
- documentação operacional

Catálogo e instruções detalhadas:

- [saas-skills/README.md](saas-skills/README.md)

## Qualidade e Validação

Os principais artefatos de qualidade são:

- [saas-skills/QA_REPORT.md](saas-skills/QA_REPORT.md)
- [saas-skills/EVALS_REPORT.md](saas-skills/EVALS_REPORT.md)
- [saas-skills/PRACTICAL_SKILL_TEST_REPORT.md](saas-skills/PRACTICAL_SKILL_TEST_REPORT.md)
- [saas-skills/IDE_RUNTIME_GUIDE.md](saas-skills/IDE_RUNTIME_GUIDE.md)

Hoje a biblioteca mantém:

- `17` skills auditadas
- `51` casos `should_trigger`
- `51` casos `should_not_trigger`
- `17` conflitos

## Arquivos Mais Importantes

- [saas-skills/README.md](saas-skills/README.md)
- [saas-skills/IDE_RUNTIME_GUIDE.md](saas-skills/IDE_RUNTIME_GUIDE.md)
- [saas-skills/TARGET_REPO_AGENT_GUIDE.md](saas-skills/TARGET_REPO_AGENT_GUIDE.md)
- [scripts/export-flat-skills.mjs](scripts/export-flat-skills.mjs)
- [scripts/export-cursor-rules.mjs](scripts/export-cursor-rules.mjs)
- [scripts/install-agent-runtimes.mjs](scripts/install-agent-runtimes.mjs)
- [scripts/verify-agent-runtimes.mjs](scripts/verify-agent-runtimes.mjs)

## Troubleshooting

- `A skill foi para .cursor/skills e não funcionou`: o runtime oficial do Cursor é `.cursor/rules/` ou `~/.cursor/rules/`.
- `A skill foi para .claude/skills/saas-skills/frontend/...`: isso está errado; Claude espera uma pasta imediata por skill.
- `Codex instalou, mas Claude e Cursor não`: isso é esperado se você usou apenas o `skill-installer` nativo da Codex.
- `Quero validar sem tocar no meu ambiente real`: use homes isolados com `--codex-home`, `--claude-home` e `--cursor-home`.
- `Não sei se devo usar global ou projeto`: global para “todos os projetos”, projeto para “só este repo”.

## Resumo Prático

Se você quer o fluxo certo e curto:

1. rode `pnpm install`
2. rode `pnpm qa:skills`
3. para uso por projeto, rode `pnpm install:agent-runtimes -- <target-dir>`
4. para uso global, rode `pnpm install:global-runtimes`
5. valide com `pnpm verify:agent-runtimes -- <target-dir>` ou `pnpm verify:global-runtimes`
6. para smoke seguro, use `--codex-home`, `--claude-home` e `--cursor-home`
7. use o playbook do agente para testar sem editar o app
