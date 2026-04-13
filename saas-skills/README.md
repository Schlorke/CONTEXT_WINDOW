# saas-skills

Biblioteca portátil de `Agent Skills` para desenvolvimento SaaS.

Esta pasta é a fonte de verdade da biblioteca. Ela concentra as skills, os arquivos de referência por skill, os assets necessários e a documentação operacional para instalar, validar, exportar e testar a biblioteca em diferentes ambientes.

## O que Esta Biblioteca Resolve

`saas-skills` existe para transformar conhecimento recorrente de desenvolvimento SaaS em workflows acionáveis para agentes de IA.

Na prática, isso significa oferecer skills que:

- têm escopo claro e sem sobreposição desnecessária
- disparam por intenção de trabalho real
- carregam referência local quando precisam de profundidade
- evitam alucinação com fallback, anti-patterns e enforcement
- podem ser reaproveitadas em múltiplos projetos e ferramentas

## O que Está Incluído

Esta biblioteca contém:

- `16` skills organizadas em `5` coleções
- `references/` e `assets/` locais por skill quando aplicável
- suíte de avaliação com matriz de trigger, anti-trigger e conflito
- relatórios de QA, portabilidade, evals e release

## Coleções Disponíveis

| Coleção          | Skills | Finalidade                                                                              |
| ---------------- | -----: | --------------------------------------------------------------------------------------- |
| `frontend`       |      4 | Design system, arquitetura React, especificações visuais e portabilidade de componentes |
| `backend`        |      3 | Clean Architecture, APIs REST e modelagem Prisma/PostgreSQL                             |
| `ai-integration` |      4 | Prompt engineering, AI UX, contexto e diagramas para agentes                            |
| `documentation`  |      2 | Documentação persistente de projeto e escrita técnica                                   |
| `engineering`    |      3 | Refatoração, análise de sistemas e estratégia de testes                                 |

## Catálogo de Skills

### frontend

| Skill                          | Descrição                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `design-system-implementation` | Construção e manutenção de design systems com tokens, Storybook e governança        |
| `react-saas-architecture`      | Organização de componentes e pastas em Next.js App Router                           |
| `saas-ui-specifications`       | Especificações concretas de UI: tipografia, cores, grid, densidade e acessibilidade |
| `component-reuse-portability`  | Extração, adaptação e reinstalação de componentes entre projetos                    |

### backend

| Skill                    | Descrição                                                                    |
| ------------------------ | ---------------------------------------------------------------------------- |
| `clean-architecture-ddd` | Clean Architecture, SOLID e DDD para TypeScript, Next.js e Prisma            |
| `api-design-patterns`    | Design de APIs REST com auth, validação, paginação, rate limiting e webhooks |
| `prisma-database-design` | Modelagem PostgreSQL com Prisma, migrations, índices e multi-tenancy         |

### ai-integration

| Skill                         | Descrição                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------- |
| `prompt-engineering-hybrid`   | Prompts híbridos com narrativa, schema, fallback e seleção de formato         |
| `ai-interface-design`         | Interfaces conversacionais com transparência, streaming, memória e compliance |
| `context-window-optimization` | Token budgeting, compressão, prevenção de drift e decisão RAG                 |
| `ai-context-diagrams`         | Mermaid e C4 para reduzir ambiguidade arquitetural para agentes               |

### documentation

| Skill                        | Descrição                                                     |
| ---------------------------- | ------------------------------------------------------------- |
| `intelligent-project-docs`   | Documentação como memória persistente para humanos e agentes  |
| `technical-research-writing` | Pesquisa técnica, avaliação de fontes e escrita de relatórios |

### engineering

| Skill                     | Descrição                                                                         |
| ------------------------- | --------------------------------------------------------------------------------- |
| `legacy-code-refactoring` | Refatoração segura de código legado com characterization tests e hotspot analysis |
| `systems-analysis-saas`   | Requisitos, MVP, modelos C4/BPMN/ER e validação com stakeholders                  |
| `testing-strategies`      | TDD, testes unitários, integração, E2E e distribuição da pirâmide de testes       |

## Quando Usar a Árvore Canônica ou o Bundle Achatado

Existem dois modos oficiais de distribuição.

### Árvore canônica

Use `saas-skills/` diretamente quando a ferramenta:

- aceita descoberta recursiva
- permite apontar para um `SKILL.md` explicitamente
- funciona bem com a estrutura por coleção

Esse é o modo recomendado para:

- Claude Code
- Cursor
- uso manual
- qualquer fluxo em que você controla o contexto do agente

### Bundle achatado

Use `dist/flat-skills/` quando a ferramenta espera uma pasta imediata por skill.

Geração:

```bash
pnpm export:flat-skills
```

Esse é o modo recomendado para:

- GitHub Copilot
- loaders sem descoberta recursiva

## Instalação por Ambiente

### Claude Code / Claude.ai Projects

Copie a árvore canônica:

```powershell
Copy-Item -Recurse -Force saas-skills seu-projeto\.claude\skills\saas-skills
```

Ou instale globalmente:

```powershell
Copy-Item -Recurse -Force saas-skills $HOME\.claude\skills\saas-skills
```

Em shells POSIX, o equivalente é `cp -r saas-skills/ seu-projeto/.claude/skills/saas-skills/`.

### Cursor IDE

Copie a árvore canônica para o projeto:

```powershell
Copy-Item -Recurse -Force saas-skills seu-projeto\.cursor\skills\saas-skills
```

### GitHub Copilot / loaders sem descoberta recursiva

Gere o bundle achatado:

```powershell
pnpm export:flat-skills
Copy-Item -Recurse -Force dist\flat-skills seu-projeto\.github\skills\saas-skills-flat
```

Se a ferramenta exigir skills diretamente nas subpastas imediatas do diretório configurado, copie o conteúdo de `dist/flat-skills/`.

### Continue.dev / uso manual

Use a árvore canônica ou referencie explicitamente o `SKILL.md` necessário.

Exemplo:

```text
Follow saas-skills/backend/api-design-patterns/SKILL.md for this task.
```

## Se Você Quiser Levar a Biblioteca para Outro Repositório

Você tem dois cenários.

### Uso das skills apenas

Copie:

- `saas-skills/`

Isso é suficiente para usar a biblioteca.

### Uso + manutenção + QA + export

Copie:

- `saas-skills/`
- `scripts/`
- `package.json`
- `pnpm-lock.yaml`
- `.markdownlint-cli2.jsonc`
- `.markdownlint.yaml`
- `.prettierignore`
- `.gitignore`

Esse pacote completo é o que permite validar, exportar e pontuar replays no novo repositório.

## Quick Start

Depois de clonar:

```bash
pnpm install
pnpm qa:skills
```

Isso cobre:

- auditoria estrutural
- lint de Markdown
- export achatado da biblioteca

## Comandos Operacionais

| Comando                                      | O que faz                                                                                                           | Quando usar                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `pnpm install`                               | Instala dependências de tooling                                                                                     | Sempre após clonar                         |
| `pnpm audit:skills`                          | Valida estrutura das skills, frontmatter, seções obrigatórias, caminhos e cobertura mínima de evals                 | Antes de release ou revisão                |
| `pnpm lint:md`                               | Roda `markdownlint` em toda a documentação rastreada                                                                | Após editar Markdown                       |
| `pnpm lint:md:fix`                           | Tenta corrigir parte dos erros de lint                                                                              | Para ajustes rápidos                       |
| `pnpm format`                                | Formata o repositório com Prettier                                                                                  | Quando quiser padronizar estilo            |
| `pnpm format:check`                          | Verifica formatação sem alterar arquivos                                                                            | Em revisão final                           |
| `pnpm fix:md`                                | Executa correções auxiliares, lint fix e Prettier                                                                   | Saneamento rápido de docs                  |
| `pnpm export:flat-skills`                    | Gera `dist/flat-skills/` com uma pasta imediata por skill                                                           | Para distribuição em loaders simples       |
| `pnpm evals:init -- <ambiente>`              | Cria um template de replay em `saas-skills/evals/results/`                                                          | Antes de um replay real                    |
| `pnpm evals:score -- <arquivo-ou-diretorio>` | Consolida resultados e gera relatórios Markdown, respeitando `status` manual e ignorando JSONs sem schema de replay | Depois de preencher observações            |
| `pnpm qa:skills`                             | Executa `audit + lint + export` em sequência                                                                        | Validação final antes de commit ou release |

## Replay e Medição por Ambiente

Para medir ativação real das skills em uma ferramenta específica:

```bash
pnpm evals:init -- claude-code
```

Isso gera:

```text
saas-skills/evals/results/claude-code.json
```

Preencha o bloco `result` de cada caso com:

- `status`
- `observed_primary_skill`
- `observed_secondary_skills`
- `minimum_output_covered`
- `notes`
- `transcript_ref`

Depois consolide:

```bash
pnpm evals:score -- saas-skills/evals/results/claude-code.json
```

Saídas esperadas:

- `claude-code.report.md`
- `SUMMARY.md` quando a pontuação for feita no diretório inteiro

## Estrutura de Cada Skill

```text
skill-name/
├── SKILL.md
├── references/
│   └── topic.md
├── scripts/
│   └── script.py
└── assets/
    └── template.md
```

Regras práticas:

- `SKILL.md` é o ponto de entrada da skill
- `references/` guarda detalhes que não devem inflar o corpo principal
- `scripts/` existe quando a tarefa pede repetibilidade ou determinismo
- `assets/` existe quando a skill depende de um arquivo de saída reutilizável

## Documentos Operacionais da Biblioteca

| Documento                                          | Finalidade                                |
| -------------------------------------------------- | ----------------------------------------- |
| [QA_REPORT.md](QA_REPORT.md)                       | Estado auditado da biblioteca             |
| [EVALS_REPORT.md](EVALS_REPORT.md)                 | Cobertura da suíte de avaliação           |
| [PORTABILITY_MATRIX.md](PORTABILITY_MATRIX.md)     | Modo de instalação por ambiente           |
| [RELEASE_NOTES.md](RELEASE_NOTES.md)               | Histórico de mudanças                     |
| [evals/README.md](evals/README.md)                 | Operação do fluxo de replay e scoring     |
| [evals/results/README.md](evals/results/README.md) | Preenchimento dos resultados por ambiente |

## Princípios da Biblioteca

1. **Procedural.** Cada skill ensina um workflow, não só um tema.
2. **Ortogonal.** Skills diferentes não devem disputar o mesmo espaço sem motivo.
3. **Obrigatória quando ativada.** Se o trigger dispara, a skill deve ser seguida.
4. **Fallback explícito.** A biblioteca prioriza sinalizar lacuna em vez de inventar contexto.
5. **Portável.** A mesma base pode ser usada em múltiplos ambientes.
6. **Auditável.** A biblioteca foi desenhada para ser validada mecanicamente.

## Estado Atual

No estado atual do repositório, a biblioteca mantém:

- `16` skills auditadas
- `48` casos `should_trigger`
- `48` casos `should_not_trigger`
- `16` casos de conflito

Esse estado pode ser revalidado com:

```bash
pnpm qa:skills
```

## Resumo Prático

Se você precisa do caminho mais curto:

1. rode `pnpm install`
2. rode `pnpm qa:skills`
3. use `saas-skills/` diretamente ou gere `dist/flat-skills/`
4. copie a biblioteca para o projeto destino conforme o ambiente

Esse é o fluxo padrão para usar `saas-skills` com segurança e previsibilidade.
