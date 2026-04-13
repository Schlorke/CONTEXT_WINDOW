# CONTEXT_WINDOW

Biblioteca operacional de `Agent Skills` para desenvolvimento SaaS com foco em Next.js, React, TypeScript, Prisma, PostgreSQL, Tailwind CSS e integração com IA.

Este repositório não é um produto SaaS. Ele é uma base reutilizável de skills, referências e tooling para agentes de código e times que querem aplicar workflows consistentes em projetos reais.

## Propósito

O objetivo do projeto é fornecer uma biblioteca de skills:

- procedurais, não genéricas
- portáveis entre ambientes
- auditáveis estruturalmente
- fáceis de instalar em novos repositórios
- validadas com matriz de trigger, anti-trigger e conflito

Em termos práticos, o repo existe para responder a esta necessidade:

> "Quero que um agente de IA trabalhe em projetos SaaS com padrões claros, escopo bem definido e qualidade verificável."

## O que Existe Neste Repositório

O pacote principal está em `saas-skills/` e contém:

- `16` skills organizadas por coleção
- `references/` e `assets/` locais por skill
- documentação operacional de QA, replay, portabilidade e release
- suíte de avaliação com casos de trigger e scoring por ambiente

O repositório também inclui `scripts/` para:

- auditar a biblioteca
- gerar bundle achatado para loaders sem descoberta recursiva
- criar templates de replay por ambiente
- consolidar relatórios de replay

## Para Quem Serve

Este projeto é útil para:

- desenvolvedores que usam agentes como Claude Code, Cursor ou Copilot
- times que querem padronizar como IA atua em projetos SaaS
- mantenedores que precisam validar a biblioteca antes de distribuí-la
- pessoas que querem levar a biblioteca para outros repositórios sem arrastar arquivos legados

## Estrutura do Repositório

```text
.
├── saas-skills/        # Biblioteca canônica
│   ├── frontend/
│   ├── backend/
│   ├── ai-integration/
│   ├── documentation/
│   ├── engineering/
│   ├── evals/
│   ├── README.md
│   ├── QA_REPORT.md
│   ├── EVALS_REPORT.md
│   ├── PORTABILITY_MATRIX.md
│   └── RELEASE_NOTES.md
├── scripts/            # Tooling operacional
├── package.json        # Scripts pnpm
└── README.md           # Documento de entrada do projeto
```

## Coleções de Skills

As skills estão divididas em 5 coleções:

| Coleção          | Foco                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------ |
| `frontend`       | Design system, arquitetura React, especificações de UI e reutilização de componentes |
| `backend`        | Clean Architecture, APIs REST e modelagem Prisma/PostgreSQL                          |
| `ai-integration` | Prompt engineering, AI UX, contexto e diagramas para agentes                         |
| `documentation`  | Documentação de projeto e escrita técnica de pesquisa                                |
| `engineering`    | Refatoração segura, análise de sistemas e estratégia de testes                       |

Detalhes completos estão em [saas-skills/README.md](saas-skills/README.md).

## Quick Start

Se você acabou de clonar o repositório:

```bash
pnpm install
pnpm qa:skills
```

Isso instala as dependências de desenvolvimento e valida a biblioteca com:

- auditoria estrutural
- lint de Markdown
- export achatado para `dist/flat-skills`

## Comandos Disponíveis

| Comando                                      | O que faz                                                                                                      | Quando usar                                     |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `pnpm install`                               | Instala as dependências locais de tooling                                                                      | Sempre após clonar                              |
| `pnpm audit:skills`                          | Valida frontmatter, seções obrigatórias, referências internas e cobertura mínima de evals                      | Antes de publicar mudanças                      |
| `pnpm lint:md`                               | Roda `markdownlint` em toda a documentação rastreada                                                           | Após editar Markdown                            |
| `pnpm lint:md:fix`                           | Tenta corrigir problemas automáticos de lint                                                                   | Quando houver erros simples de estilo           |
| `pnpm format:check`                          | Verifica formatação com Prettier                                                                               | Em revisão final                                |
| `pnpm format`                                | Aplica Prettier no repositório                                                                                 | Quando quiser normalizar formatação             |
| `pnpm fix:md`                                | Executa correções auxiliares + lint fix + Prettier                                                             | Para saneamento rápido de Markdown              |
| `pnpm export:flat-skills`                    | Gera `dist/flat-skills/` com uma pasta imediata por skill                                                      | Para Copilot e loaders sem descoberta recursiva |
| `pnpm evals:init -- <ambiente>`              | Cria um template de replay em `saas-skills/evals/results/`                                                     | Para iniciar replay real por ferramenta         |
| `pnpm evals:score -- <arquivo-ou-diretorio>` | Consolida replays e gera `*.report.md` e `SUMMARY.md`, respeitando `status` manual e filtrando JSONs inválidos | Depois de preencher resultados observados       |
| `pnpm qa:skills`                             | Executa `audit + lint + export` em sequência                                                                   | Validação final antes de commit ou release      |

## Como Usar a Biblioteca em Outro Projeto

Existem dois modos principais.

### 1. Árvore canônica

Use a pasta `saas-skills/` diretamente quando o ambiente aceita descoberta recursiva ou referência explícita.

Esse é o caminho recomendado para:

- Claude Code
- Cursor
- uso manual
- qualquer ambiente em que você consiga apontar para um `SKILL.md`

### 2. Bundle achatado

Use o export achatado quando o loader espera uma pasta imediata por skill:

```bash
pnpm export:flat-skills
```

Depois use o conteúdo de `dist/flat-skills/`.

Esse é o caminho recomendado para:

- GitHub Copilot
- loaders sem descoberta recursiva

## Fluxo de Uso por Ambiente

### Claude Code / Claude.ai Projects

Copie `saas-skills/` para dentro do projeto ou para a pasta global de skills da ferramenta.

### Cursor

Copie `saas-skills/` para o projeto e referencie as skills conforme a convenção do ambiente.

### GitHub Copilot

Gere o bundle achatado com `pnpm export:flat-skills` e use `dist/flat-skills/`.

### Continue.dev / uso manual

Use a árvore canônica e referencie explicitamente o `SKILL.md` necessário.

As instruções específicas por ambiente estão documentadas em [saas-skills/README.md](saas-skills/README.md) e [saas-skills/PORTABILITY_MATRIX.md](saas-skills/PORTABILITY_MATRIX.md).

## Qualidade e Validação

O repositório foi estruturado para ser verificável, não apenas legível.

Os principais mecanismos de qualidade são:

- [saas-skills/QA_REPORT.md](saas-skills/QA_REPORT.md): estado estrutural auditado da biblioteca
- [saas-skills/EVALS_REPORT.md](saas-skills/EVALS_REPORT.md): cobertura da matriz de avaliação
- [saas-skills/evals/README.md](saas-skills/evals/README.md): como operar replay e scoring
- [saas-skills/evals/results/README.md](saas-skills/evals/results/README.md): como preencher os resultados por ambiente

Hoje a biblioteca possui:

- `16` skills auditadas
- `48` casos `should_trigger`
- `48` casos `should_not_trigger`
- `16` casos de conflito

## Replay por Ambiente

Para medir ativação real em uma ferramenta específica:

```bash
pnpm evals:init -- claude-code
```

Isso cria um JSON preenchível em:

```text
saas-skills/evals/results/claude-code.json
```

Depois de executar os prompts no ambiente real, preencha por caso:

- `status`
- `observed_primary_skill`
- `observed_secondary_skills`
- `minimum_output_covered`
- `notes`
- `transcript_ref`

Em seguida:

```bash
pnpm evals:score -- saas-skills/evals/results/claude-code.json
```

O script gera o relatório Markdown correspondente e, ao pontuar um diretório inteiro, também gera `SUMMARY.md`.

O scoring só aprova casos marcados como `passed` e com cobertura completa dos critérios esperados. Arquivos JSON sem schema de replay válido são ignorados quando você pontua um diretório.

## Arquivos Mais Importantes

Se você quer se orientar rápido no repositório, comece por estes arquivos:

- [README.md](README.md): visão geral do projeto
- [saas-skills/README.md](saas-skills/README.md): catálogo da biblioteca
- [package.json](package.json): comandos disponíveis
- [scripts/audit-skills.mjs](scripts/audit-skills.mjs): auditoria estrutural
- [scripts/export-flat-skills.mjs](scripts/export-flat-skills.mjs): export achatado
- [scripts/init-skill-replay.mjs](scripts/init-skill-replay.mjs): bootstrap de replay
- [scripts/score-skill-replays.mjs](scripts/score-skill-replays.mjs): scoring dos resultados

## Estado do Projeto

O repositório foi limpo para distribuição. Isso significa que ele contém apenas:

- biblioteca operacional
- tooling necessário
- documentação relevante para uso e manutenção

Arquivos históricos de descoberta, relatórios intermediários e insumos legados não fazem mais parte da distribuição.

## Versionamento

O histórico de mudanças da biblioteca está em [saas-skills/RELEASE_NOTES.md](saas-skills/RELEASE_NOTES.md).

## Resumo Prático

Se você quer só o essencial:

1. clone o repo
2. rode `pnpm install`
3. rode `pnpm qa:skills`
4. use `saas-skills/` diretamente ou gere `dist/flat-skills/`

Esse é o fluxo padrão para começar a usar a biblioteca com segurança.
