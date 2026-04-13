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
- instalação seletiva para apenas uma IA, quando necessário
- sincronização explícita para evitar drift entre instâncias
- política opcional para obrigar agentes a declararem as skills usadas ao final da tarefa
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
- runtimes instalados são cópias geradas, não o local correto para manutenção
- Codex usa `$CODEX_HOME/skills/<skill>/SKILL.md`
- Claude pode usar `.claude/skills/<skill>/SKILL.md` por projeto ou `~/.claude/skills/<skill>/SKILL.md` globalmente
- Cursor usa `.cursor/rules/*.mdc` como runtime oficial por projeto
- Cursor global fica dividido entre:
  - export de compatibilidade em `~/.cursor/rules/*.mdc`
  - bootstrap oficial em `Cursor Settings > Rules`, gerado por `pnpm export:cursor-user-rules`

Política de atualização:

- edite sempre `saas-skills/`
- reinstalar e sincronizar usam o mesmo mecanismo de escrita
- cada runtime instalado recebe um manifest `.saas-skills-manifest.json`
- `verify` e `status` usam esse manifest para detectar runtime ausente ou desatualizado

Pontos importantes:

- o `skill-installer` nativo da Codex instala skills na área da própria Codex; ele não instala rules do Cursor nem runtime do Claude por conta própria
- `.cursor/skills/` não é o runtime oficial do Cursor
- copiar a árvore agrupada por coleção para dentro de `.claude/skills/` não é o modo recomendado de runtime do Claude
- no Cursor, `Project Rules` e `User Rules` são superfícies diferentes; por isso o repositório gera rules em `~/.cursor/rules/` como compatibilidade e também exporta um bootstrap curto para `Cursor Settings > Rules`

Detalhes completos:

- [AGENTS.md](AGENTS.md)
- [CHANGELOG.md](CHANGELOG.md)
- [saas-skills/IDE_RUNTIME_GUIDE.md](saas-skills/IDE_RUNTIME_GUIDE.md)
- [saas-skills/CURSOR_USER_RULES_GUIDE.md](saas-skills/CURSOR_USER_RULES_GUIDE.md)
- [saas-skills/AGENT_SKILL_USAGE_REPORTING.md](saas-skills/AGENT_SKILL_USAGE_REPORTING.md)
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
- manifests e status dos runtimes gerenciados

## Comandos

| Comando                                              | O que faz                                                                                 | Quando usar                                                   |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `pnpm install`                                       | Instala dependências de tooling                                                           | Sempre após clonar                                            |
| `pnpm audit:skills`                                  | Valida frontmatter, seções obrigatórias, referências internas e cobertura mínima de evals | Antes de release                                              |
| `pnpm lint:md`                                       | Roda `markdownlint`                                                                       | Após editar documentação                                      |
| `pnpm export:flat-skills`                            | Gera `dist/flat-skills/` com uma pasta imediata por skill                                 | Para runtime do Claude e loaders rasos                        |
| `pnpm export:cursor-rules`                           | Gera `dist/cursor-rules/` com adapters `.mdc`                                             | Para runtime do Cursor                                        |
| `pnpm export:cursor-user-rules`                      | Gera `dist/cursor-user-rules/CURSOR_USER_RULES.md` para colar no `Settings > Rules`       | Para bootstrap global oficialmente alinhado do Cursor         |
| `pnpm install:codex -- <target-dir>`                 | Instala somente a Codex                                                                   | Quando você quer só o runtime global da Codex                 |
| `pnpm install:claude -- <target-dir>`                | Instala somente o Claude do projeto                                                       | Quando você quer só `.claude/skills/`                         |
| `pnpm install:cursor -- <target-dir>`                | Instala somente o Cursor do projeto                                                       | Quando você quer só `.cursor/rules/`                          |
| `pnpm install:claude-global`                         | Instala somente o Claude global                                                           | Quando você quer todas as skills em `~/.claude/skills/`       |
| `pnpm install:cursor-global`                         | Instala o export de compatibilidade global do Cursor e gera `CURSOR_USER_RULES.md`        | Quando você quer preparar o global do Cursor sem tocar na UI  |
| `pnpm install:skill-usage-reporting -- <target-dir>` | Instala a política de reporte de skills em `AGENTS.md`, `CLAUDE.md` e Cursor rule         | Quando você quer observabilidade obrigatória de uso de skills |
| `pnpm install:ide-runtime -- <target-dir>`           | Instala apenas os runtimes de projeto de Claude e Cursor                                  | Quando você não quer tocar na Codex                           |
| `pnpm verify:ide-runtime -- <target-dir>`            | Verifica apenas os runtimes de projeto de Claude e Cursor                                 | Depois da instalação de projeto                               |
| `pnpm install:agent-runtimes -- <target-dir>`        | Instala Codex global e Claude/Cursor no projeto                                           | Para instalação unificada multi-IA por projeto                |
| `pnpm verify:agent-runtimes -- <target-dir>`         | Verifica Codex global e Claude/Cursor no projeto                                          | Depois da instalação unificada por projeto                    |
| `pnpm verify:skill-usage-reporting -- <target-dir>`  | Verifica a política de reporte em `AGENTS.md`, `CLAUDE.md` e Cursor rule                  | Depois de instalar a política                                 |
| `pnpm sync:agent-runtimes -- <target-dir>`           | Reaplica a fonte de verdade nos runtimes selecionados                                     | Quando uma skill foi atualizada no repo                       |
| `pnpm sync:global-runtimes`                          | Reaplica a fonte de verdade nos três runtimes globais                                     | Quando você quer propagar updates para todo o ambiente        |
| `pnpm status:agent-runtimes -- <target-dir>`         | Mostra se cada runtime está `current`, `outdated`, `missing` ou `foreign`                 | Antes de atualizar ou para diagnosticar drift                 |
| `pnpm install:global-runtimes`                       | Instala Codex e Claude globalmente, mais o export global de compatibilidade do Cursor     | Para disponibilizar a biblioteca em todos os projetos         |
| `pnpm verify:global-runtimes`                        | Verifica a instalação global das três plataformas                                         | Depois da instalação global                                   |
| `pnpm evals:init -- <ambiente>`                      | Cria um template de replay                                                                | Só para benchmark/QA avançado                                 |
| `pnpm evals:score -- <arquivo-ou-diretorio>`         | Consolida replay e gera relatórios                                                        | Só para benchmark/QA avançado                                 |
| `pnpm qa:skills`                                     | Executa auditoria, lint, export, instalação smoke-test multi-IA, verificação e status     | Validação final da biblioteca                                 |

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

## Instalação Seletiva por IA

Isso é suportado e agora faz parte do fluxo documentado.

Exemplos:

```bash
pnpm install:codex -- .
pnpm verify:codex -- .

pnpm install:claude -- .
pnpm verify:claude -- .

pnpm install:cursor -- .
pnpm verify:cursor -- .
```

Para instalações globais seletivas:

```bash
pnpm install:claude-global
pnpm verify:claude-global

pnpm install:cursor-global
pnpm verify:cursor-global
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
- instala o export de compatibilidade do Cursor em `~/.cursor/rules/`
- gera `~/.cursor/rules/CURSOR_USER_RULES.md` para colar em `Cursor Settings > Rules`

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

Para o Cursor, o passo final oficial continua sendo colar o bootstrap exportado em `Settings > Rules`:

```bash
pnpm export:cursor-user-rules
```

## Qual Comando Usar

Use esta regra rápida:

- quer usar só neste repo: `pnpm install:agent-runtimes -- . --project-only`
- quer usar só na Codex: `pnpm install:codex -- .`
- quer usar só no Claude do projeto: `pnpm install:claude -- .`
- quer usar só no Cursor do projeto: `pnpm install:cursor -- .`
- quer usar no Cursor global com o caminho oficial: `pnpm install:cursor-global` e depois `pnpm export:cursor-user-rules`
- quer usar em todos os seus projetos: `pnpm install:global-runtimes` e, para o Cursor, também `pnpm export:cursor-user-rules`
- quer projeto atual + global ao mesmo tempo: `pnpm install:agent-runtimes -- . --global-all`
- quer provar que não vai tocar nos runtimes reais: adicione `--codex-home`, `--claude-home` e `--cursor-home`

## Como Atualizar sem Criar Drift

Esse é o problema que mais aparece no uso real.

Se você corrigir uma skill apenas dentro de um runtime instalado, a outra IA não recebe essa mudança sozinha. Por isso, o fluxo correto é:

1. editar a skill canônica em `saas-skills/`
2. rodar `pnpm sync:agent-runtimes -- <target-dir>` ou o sync seletivo da IA desejada
3. rodar `pnpm verify:agent-runtimes -- <target-dir>` ou `pnpm verify:<runtime>`
4. usar `pnpm status:agent-runtimes -- <target-dir>` para confirmar que tudo ficou `current`

Regras operacionais:

- não edite cópias já instaladas em `.claude/skills/`, `.cursor/rules/` ou `$CODEX_HOME/skills/`
- trate essas pastas como artefatos gerados
- se quiser sincronizar só uma IA, use os comandos seletivos
- se quiser propagar a correção para todas as IAs, use `sync:agent-runtimes` ou `sync:global-runtimes`
- se o escopo incluir Cursor global, regenere também `pnpm export:cursor-user-rules` e atualize o texto colado em `Settings > Rules` quando o bootstrap mudar

O instalador agora escreve `.saas-skills-manifest.json` em cada runtime gerenciado. Esse manifest registra a versão instalada e permite ao `verify` e ao `status` apontarem runtime desatualizado.

## Como Exigir que o Agente Declare as Skills Usadas

Se você quer controle real sobre adoção de skills, a solução mais confiável é instalar uma política de resposta final no repositório-alvo.

Comandos:

```bash
pnpm install:skill-usage-reporting -- <target-dir>
pnpm verify:skill-usage-reporting -- <target-dir>
```

Esse fluxo cria ou atualiza:

- `AGENTS.md`
- `CLAUDE.md`
- `.cursor/rules/skill-usage-reporting.mdc`

Resultado esperado ao final de cada tarefa:

```text
Skills Used
- <skill-name>: <short reason>
```

Se nenhuma skill foi usada:

```text
Skills Used: none
```

Documento-base:

- [saas-skills/AGENT_SKILL_USAGE_REPORTING.md](saas-skills/AGENT_SKILL_USAGE_REPORTING.md)

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
- gera e instala as rules corretas do Cursor no projeto
- gera o export de compatibilidade global do Cursor em `~/.cursor/rules/`
- gera um bootstrap curto para `Cursor Settings > Rules`
- verifica tudo
- marca cada runtime com manifest para detectar drift
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

- [CHANGELOG.md](CHANGELOG.md)
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
- [saas-skills/CURSOR_USER_RULES_GUIDE.md](saas-skills/CURSOR_USER_RULES_GUIDE.md)
- [saas-skills/AGENT_SKILL_USAGE_REPORTING.md](saas-skills/AGENT_SKILL_USAGE_REPORTING.md)
- [saas-skills/TARGET_REPO_AGENT_GUIDE.md](saas-skills/TARGET_REPO_AGENT_GUIDE.md)
- [CHANGELOG.md](CHANGELOG.md)
- [scripts/export-flat-skills.mjs](scripts/export-flat-skills.mjs)
- [scripts/export-cursor-rules.mjs](scripts/export-cursor-rules.mjs)
- [scripts/export-cursor-user-rules.mjs](scripts/export-cursor-user-rules.mjs)
- [scripts/install-agent-runtimes.mjs](scripts/install-agent-runtimes.mjs)
- [scripts/install-skill-usage-reporting.mjs](scripts/install-skill-usage-reporting.mjs)
- [scripts/verify-agent-runtimes.mjs](scripts/verify-agent-runtimes.mjs)
- [scripts/verify-skill-usage-reporting.mjs](scripts/verify-skill-usage-reporting.mjs)
- [scripts/status-agent-runtimes.mjs](scripts/status-agent-runtimes.mjs)

## Troubleshooting

- `A skill foi para .cursor/skills e não funcionou`: o runtime oficial do Cursor é `.cursor/rules/`; no escopo global, `~/.cursor/rules/` é apenas o export de compatibilidade.
- `As rules globais do Cursor não apareceram na UI`: isso é esperado se você só escreveu em `~/.cursor/rules/`. Gere o bootstrap com `pnpm export:cursor-user-rules` e cole em `Cursor Settings > Rules`.
- `A skill foi para .claude/skills/saas-skills/frontend/...`: isso está errado; Claude espera uma pasta imediata por skill.
- `Codex instalou, mas Claude e Cursor não`: isso é esperado se você usou apenas o `skill-installer` nativo da Codex.
- `Atualizei uma skill só na Codex e o resto não mudou`: isso é esperado se você alterou apenas a cópia instalada. Edite `saas-skills/` e rode `pnpm sync:agent-runtimes -- <target-dir>` ou o sync seletivo.
- `Não sei quais runtimes estão desatualizados`: rode `pnpm status:agent-runtimes -- <target-dir>` ou `pnpm status:global-runtimes`.
- `Quero validar sem tocar no meu ambiente real`: use homes isolados com `--codex-home`, `--claude-home` e `--cursor-home`.
- `Não sei se devo usar global ou projeto`: global para “todos os projetos”, projeto para “só este repo”.

## Resumo Prático

Se você quer o fluxo certo e curto:

1. rode `pnpm install`
2. rode `pnpm qa:skills`
3. para uso por projeto, rode `pnpm install:agent-runtimes -- <target-dir>`
4. para uso global, rode `pnpm install:global-runtimes`
5. para o Cursor global oficial, rode também `pnpm export:cursor-user-rules` e cole em `Settings > Rules`
6. se você quiser só uma IA, use `pnpm install:codex`, `pnpm install:claude` ou `pnpm install:cursor`
7. valide com `pnpm verify:agent-runtimes -- <target-dir>` ou `pnpm verify:global-runtimes`
8. para updates, use `pnpm sync:agent-runtimes -- <target-dir>` e confirme com `pnpm status:agent-runtimes -- <target-dir>`
9. para smoke seguro, use `--codex-home`, `--claude-home` e `--cursor-home`
10. use o playbook do agente para testar sem editar o app
