# PORTABILITY MATRIX

Matriz de portabilidade da biblioteca `saas-skills`.

**Data de referência:** 13 de abril de 2026  
**Objetivo:** registrar o runtime correto por ambiente e o modo seguro de instalação

## Visão Geral

`saas-skills` usa seis camadas:

1. **Fonte de verdade** em `saas-skills/`
2. **Runtime Codex** em `$CODEX_HOME/skills/`
3. **Runtime Claude por projeto** em `.claude/skills/`
4. **Runtime Claude global** em `~/.claude/skills/`
5. **Runtime Cursor por projeto** em `.cursor/rules/`
6. **Runtime Cursor global** em `~/.cursor/rules/`

Isso significa que portabilidade aqui não é "copiar a mesma pasta para todo lugar".  
Portabilidade, neste projeto, significa gerar ou instalar o adapter certo para cada ambiente.

## Matriz por Ambiente

| Ambiente | Runtime correto | Artefato de origem | Instalação recomendada | Status |
| --- | --- | --- | --- | --- |
| Codex | `$CODEX_HOME/skills/<skill>/SKILL.md` | `saas-skills/` -> install | `pnpm install:agent-runtimes -- <target-dir> --codex-only` | ✅ |
| Claude Code / Claude.ai Projects | `.claude/skills/<skill>/SKILL.md` | `saas-skills/` -> install/export | `pnpm install:agent-runtimes -- <target-dir> --claude-only` | ✅ |
| Claude global | `~/.claude/skills/<skill>/SKILL.md` | `saas-skills/` -> install | `pnpm install:global-runtimes` | ✅ |
| Claude dentro do Cursor | `.claude/skills/<skill>/SKILL.md` | `saas-skills/` -> install/export | `pnpm install:agent-runtimes -- <target-dir> --claude-only` | ✅ |
| Cursor IDE (agent nativo) | `.cursor/rules/*.mdc` | `saas-skills/` -> Cursor adapter | `pnpm install:agent-runtimes -- <target-dir> --cursor-only` | ✅ |
| Cursor global | `~/.cursor/rules/*.mdc` | `saas-skills/` -> Cursor adapter | `pnpm install:global-runtimes` | ✅ |
| Cursor com Claude + agent nativo | `.claude/skills/` + `.cursor/rules/` | `saas-skills/` -> dual install | `pnpm install:agent-runtimes -- <target-dir> --project-only` | ✅ |
| Codex + Claude + Cursor | `$CODEX_HOME/skills/` + `.claude/skills/` + `.cursor/rules/` | `saas-skills/` -> unified install | `pnpm install:agent-runtimes -- <target-dir>` | ✅ |
| Codex + Claude + Cursor globais | `$CODEX_HOME/skills/` + `~/.claude/skills/` + `~/.cursor/rules/` | `saas-skills/` -> unified install | `pnpm install:global-runtimes` | ✅ |
| GitHub Copilot / loaders rasos | subpastas imediatas por skill | `dist/flat-skills/` | `pnpm export:flat-skills` | ✅ |
| Uso manual / referência explícita | `saas-skills/.../SKILL.md` | árvore canônica | referência explícita ao arquivo | ✅ |

## O Que Está Errado como Estratégia

Estas estratégias não são recomendadas como runtime oficial desta biblioteca:

- pedir ao `skill-installer` da Codex para agir como instalador universal de Claude e Cursor
- copiar `saas-skills/` inteiro para `.claude/skills/`
- depender de `.cursor/skills/` como se fosse runtime nativo do Cursor
- presumir que Codex, Claude e Cursor usam a mesma estrutura de arquivos

## Garantias Verificadas

No estado atual do repositório:

- o runtime achatado para Claude é exportável
- o runtime `.mdc` para Cursor é exportável
- a instalação na Codex é automatizável
- a instalação conjunta em Codex, `.claude/` e `.cursor/` é automatizável
- a instalação global em `~/.claude/skills/` e `~/.cursor/rules/` é automatizável
- a verificação estrutural da instalação é automatizável
- o smoke install usado em `qa:skills` não toca os runtimes reais do usuário

## Instalação Segura

Fluxo recomendado:

```bash
pnpm install:agent-runtimes -- <target-dir> --dry-run
pnpm install:agent-runtimes -- <target-dir> --global-all --codex-home <sandbox> --claude-home <sandbox> --cursor-home <sandbox>
pnpm verify:agent-runtimes -- <target-dir> --global-all --codex-home <sandbox> --claude-home <sandbox> --cursor-home <sandbox>
```

Esse fluxo foi desenhado para permitir dois modos:

- **instalação real:** sem homes sobrescritos, usando os runtimes reais do usuário
- **validação segura:** com `--codex-home`, `--claude-home` e `--cursor-home`, usando runtimes isolados

## Smoke Test sem Impacto no App

Depois da instalação, o teste recomendado é:

- pedir análise, plano ou especificação
- não pedir patch
- não rodar build, migração ou dev server

Playbook:

- [TARGET_REPO_AGENT_GUIDE.md](TARGET_REPO_AGENT_GUIDE.md)

## Limites Desta Matriz

Esta matriz prova:

- empacotamento correto
- runtime correto por plataforma
- instalação segura
- verificação estrutural
- possibilidade de um instalador unificado

Ela não prova sozinha:

- qualidade da ativação em toda IDE possível
- equivalência perfeita de comportamento entre Codex, Claude e Cursor
- benchmark comportamental completo sem replay dedicado

## Resumo Prático

Se houver dúvida:

- Codex => `$CODEX_HOME/skills/`
- Claude => `.claude/skills/` ou `~/.claude/skills/`
- Cursor => `.cursor/rules/` ou `~/.cursor/rules/`
- biblioteca fonte => `saas-skills/`

Essa é a regra operacional correta deste projeto.
