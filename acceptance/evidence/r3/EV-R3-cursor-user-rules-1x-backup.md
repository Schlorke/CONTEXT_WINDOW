Use Context Window as a lightweight global router for Cursor.

- Treat project `.cursor/rules/*.mdc` as the authoritative runtime when present.
- Treat this global text as bootstrap guidance, not as a replacement for project rules.
- Do not use `.cursor/skills/` as runtime.
- If a repository also has `.claude/skills/`, those files are for Claude integrations, not Cursor native rules.
- If a request clearly matches one of the domains below and the repository does not have Context Window project rules installed yet, recommend installing or syncing the library instead of improvising from stale copies.
- If the repository installs a mandatory skill-usage disclosure policy, end the final response with the required `Skills Used` section.

Context Window routing domains:

- `ai-context-diagrams`: Mermaid and C4 diagram guidance for architecture communication, agent comprehension, and doc placement.
- `ai-interface-design`: AI product interface guidance for streaming, trust signals, memory, transparency, and recovery UX.
- `api-design-patterns`: REST and route-handler guidance for auth, validation, error envelopes, pagination, rate limiting, webhooks, and tenant isolation.
- `clean-architecture-ddd`: Domain-driven and clean architecture guidance for bounded contexts, use cases, entities, repositories, and layer separation.
- `component-reuse-portability`: Cross-project component porting workflow for dependency resolution, import rewriting, token adaptation, and registry maintenance.
- `context-window-optimization`: Context-window optimization for token and tool-output budgeting, validation scheduling, ordering, compression, retrieval boundaries, and drift prevention.
- `design-system-implementation`: Design system guidance for semantic tokens, Storybook, component governance, and shared UI contracts in frontend codebases.
- `intelligent-project-docs`: Project documentation governance for README, AGENTS.md, ADRs, module docs, ownership, and single source of truth.
- `legacy-code-refactoring`: Legacy refactoring workflow focused on hotspots, characterization tests, dependency risks, and incremental cleanup.
- `multi-agent-skill-creator`: Create and maintain one canonical Agent Skill with trigger evals and safe Codex, Claude, and Cursor adapters.
- `multi-agent-skill-installer`: Multi-agent install workflow for Codex, Claude, and Cursor runtimes, including global vs project scope, sandbox validation, and non-invasive verification.
- `multi-perspective-council`: Multi-perspective advisory council (LLM Council) that pressure-tests plans and large changes with five reasoning styles, anonymous peer review, a devil's advocate, and a chairman verdict closed in plain language.
- `multiplatform-platform-architecture`: Platform-level architecture for multiplatform SaaS: pnpm monorepo (apps clients/services/workers + packages + products), FSD on every frontend surface, modular API with boundary laws and 12-factor, Expo mobile, dual cookie+Bearer auth, contracts-first /api/v1.
- `prisma-database-design`: Prisma and PostgreSQL design guidance for schema modeling, indexes, migrations, query behavior, and multi-tenancy.
- `prompt-engineering-hybrid`: Prompt engineering guidance for structured output, schema contracts, fallback clauses, and output-format decisions.
- `react-saas-architecture`: React and Next.js App Router architecture for feature boundaries, runtime-specific client/server/contracts entrypoints, shared layers, co-location, and export discipline.
- `saas-ai-agent-engineer`: AI agent engineering guidance for SaaS products: tool calling, RAG, memory, prompt/version governance, permissions, evals, and observability.
- `saas-ui-specifications`: Frontend UI specification guidance for typography, color roles, spacing, density, responsive behavior, and accessibility.
- `systems-analysis-saas`: SaaS systems analysis guidance for requirements, MVP scope, business rules, models, and stakeholder validation.
- `technical-research-writing`: Technical research and report-writing guidance for scoping, source evaluation, citation quality, synthesis, and uncertainty handling.
- `testing-strategies`: Testing strategy guidance for Vitest, Testing Library, Playwright, focused-to-full validation cadence, incremental CI gates, and all-source coverage boundaries.

When global and project guidance conflict, prefer the project-local `.cursor/rules` for that repository.
