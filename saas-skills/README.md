# saas-skills — Biblioteca de Agent Skills para Desenvolvimento SaaS

Biblioteca de 16 Agent Skills procedurais, prontas para uso em qualquer projeto SaaS com a stack Next.js / React / TypeScript / Prisma / PostgreSQL / Tailwind CSS.

Cada skill é carregada sob demanda quando seu trigger dispara, seguindo o [Agent Skills open standard](https://agentskills.io/specification). São ortogonais entre si (sem sobreposição de domínio), portáveis entre plataformas, e obrigatórias quando ativadas.

**Autor:** Harry Schlorke — Logical Solution  
**Versão:** 1.3.0  
**Data:** Abril 2026

---

## Skills Disponíveis

### frontend/ (4 skills)

| Skill                          | Descrição                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `design-system-implementation` | Construção e manutenção de design systems com tokens, Atomic Design, Storybook e governança                        |
| `react-saas-architecture`      | Organização de componentes e pastas em Next.js App Router com patterns avançados (Compound, Headless, Composition) |
| `saas-ui-specifications`       | Especificações concretas de UI: tipografia, cores, espaçamento, grid responsivo, dark mode, WCAG 2.2               |
| `component-reuse-portability`  | Extração, adaptação e instalação de componentes reutilizáveis entre projetos                                       |

### backend/ (3 skills)

| Skill                    | Descrição                                                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `clean-architecture-ddd` | Clean Architecture, SOLID e DDD (estratégico e tático) aplicados a TypeScript/Next.js/Prisma                          |
| `api-design-patterns`    | Design de API REST no Next.js: auth, validação Zod, error handling, paginação, rate limiting, webhooks, multi-tenancy |
| `prisma-database-design` | Schema PostgreSQL com Prisma: modelagem, migrations, queries otimizadas, índices, multi-tenancy                       |

### ai-integration/ (4 skills)

| Skill                         | Descrição                                                                                                      |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `prompt-engineering-hybrid`   | Engenharia de prompts híbridos (narrativa + schemas estruturados), seleção de formato, mitigação de alucinação |
| `ai-interface-design`         | Interfaces IA conversacionais: 6 pilares, Vercel AI SDK, streaming, memória persistente, MCP, compliance       |
| `context-window-optimization` | Otimização de janela de contexto: token budgeting, Lost in the Middle, context drift, compressão, RAG          |
| `ai-context-diagrams`         | Diagramas Mermaid e C4 Model para melhorar compreensão arquitetural por agentes IA                             |

### documentation/ (2 skills)

| Skill                        | Descrição                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `intelligent-project-docs`   | Documentação como memória persistente: hierarquia 3 camadas, AGENTS.md, Diátaxis, ADRs, Docs-as-Code               |
| `technical-research-writing` | Pesquisa técnica e escrita de relatórios: CRAAP Test, hierarquia de evidências, citações, diferenciação epistêmica |

### engineering/ (3 skills)

| Skill                     | Descrição                                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `legacy-code-refactoring` | Refatoração segura de código legado: audit, smells, characterization tests, hotspot analysis, Red-Green-Refactor |
| `systems-analysis-saas`   | Análise de sistemas SaaS B2B: requisitos, modelagem C4/BPMN/ER, MVP, roadmap, business rules, validação          |
| `testing-strategies`      | Estratégias de teste: TDD, Vitest, Testing Library, Playwright, testing pyramid, mocking, CI integration         |

---

## Instalação por Ambiente

Esta biblioteca mantém a estrutura canônica por collection (`frontend/`, `backend/`, etc.). Ferramentas que fazem descoberta recursiva podem usar essa árvore diretamente. Ferramentas que só leem subpastas imediatas devem usar o bundle achatado gerado por `pnpm export:flat-skills`.

### Claude Code / Claude.ai Projects

Copie a pasta `saas-skills/` para dentro do seu projeto ou para `~/.claude/skills/`:

```bash
# Projeto-específico
cp -r saas-skills/ seu-projeto/.claude/skills/saas-skills/

# Global (todos os projetos)
cp -r saas-skills/ ~/.claude/skills/saas-skills/
```

## Cursor IDE

Copie para `.cursor/skills/` na raiz do projeto:

```bash
cp -r saas-skills/ seu-projeto/.cursor/skills/saas-skills/
```

Ou referência global em `.cursorrules`:

```text
Para instruções de design system, consulte .cursor/skills/saas-skills/frontend/design-system-implementation/SKILL.md
```

### GitHub Copilot / Loaders sem descoberta recursiva

Gere primeiro um bundle achatado com uma pasta por skill na raiz:

```bash
pnpm export:flat-skills
cp -r dist/flat-skills/ seu-projeto/.github/skills/saas-skills-flat/
```

Se o loader esperar skills diretamente em subpastas imediatas, copie o conteúdo de `dist/flat-skills/` para o diretório configurado da ferramenta.

### Continue.dev / Uso Manual

Se a ferramenta não tiver descoberta nativa compatível com a árvore canônica, referencie o `SKILL.md` explicitamente no contexto ou use o bundle achatado gerado pelo script acima.

### Uso Manual (qualquer ferramenta)

Referencie o SKILL.md relevante no system prompt ou contexto do agente:

```text
Siga as instruções em saas-skills/backend/api-design-patterns/SKILL.md para este task.
```

---

## Validação Operacional

Use estes comandos para validar a biblioteca localmente:

```bash
pnpm audit:skills
pnpm lint:md
pnpm evals:init -- claude-code
pnpm evals:score -- saas-skills/evals/results/claude-code.json
pnpm export:flat-skills
pnpm qa:skills
```

- `pnpm audit:skills` valida estrutura, cobertura de evals, frontmatter, seções obrigatórias e caminhos `references/` / `assets/`.
- `pnpm lint:md` valida consistência de Markdown.
- `pnpm evals:init -- <ambiente>` gera um template de replay em `saas-skills/evals/results/`.
- `pnpm evals:score -- <arquivo-ou-diretorio>` consolida os resultados e gera `*.report.md`.
- `pnpm export:flat-skills` gera `dist/flat-skills/` para loaders sem descoberta recursiva.
- `pnpm qa:skills` executa a trilha consolidada de auditoria + lint + export.

### Replay por Ambiente

Para medir ativação real em uma ferramenta específica:

```bash
pnpm evals:init -- claude-code
```

Preencha o arquivo gerado em `saas-skills/evals/results/claude-code.json` com:

- `observed_primary_skill`
- `observed_secondary_skills`
- `minimum_output_covered`
- `notes`
- `transcript_ref`

Depois consolide:

```bash
pnpm evals:score -- saas-skills/evals/results/claude-code.json
```

O scorer gera um relatório Markdown ao lado do JSON de replay.

---

## Estrutura de Cada Skill

```text
skill-name/
├── SKILL.md           # Arquivo principal (max 500 linhas)
├── references/        # Documentos de referência (decision tree)
│   └── topic.md
├── scripts/           # Código executável (quando aplicável)
│   └── script.py
└── assets/            # Templates e recursos reutilizáveis
    └── template.md
```

---

## Documentos Operacionais

Estes documentos registram validação, portabilidade e manutenção da biblioteca:

- `saas-skills/QA_REPORT.md` — Relatório de qualidade com checklist por skill
- `saas-skills/EVALS_REPORT.md` — Cobertura da matriz de triggers, anti-triggers e conflitos
- `saas-skills/evals/README.md` — Operação do fluxo de replay e scoring por ambiente
- `saas-skills/PORTABILITY_MATRIX.md` — Modos de instalação por ambiente e status de validação
- `saas-skills/RELEASE_NOTES.md` — Histórico de mudanças relevantes da biblioteca

---

## Princípios da Biblioteca

1. **Procedural, não declarativa.** Cada skill contém passos ordenados, não apenas informação.
2. **Ortogonal.** Nenhuma skill invade o domínio de outra.
3. **Obrigatória quando ativada.** Se o trigger disparar, a skill DEVE ser seguida.
4. **Fallback contra alucinação.** Toda skill instrui o agente a sinalizar informação faltante em vez de inventar.
5. **Portável.** Funciona em Claude Code, Cursor, VS Code Copilot, Continue.dev, e qualquer ferramenta que suporte o Agent Skills standard.
   Para loaders sem descoberta recursiva, use `pnpm export:flat-skills`.
6. **Baseada em evidência.** Fontes do repositório Context_Window e autores canônicos referenciados em cada skill.
