---
name: saas-ai-agent-engineer
description: Design, implement, review, debug, refactor, secure, evaluate, and production-harden AI agents in multi-tenant SaaS products. Use for chat agents, tool calling, RAG, memory, agent skills, schema-driven configuration, prompt/version governance, approvals, RBAC/ABAC, audit logs, background AI jobs, observability, evals, model routing, or migrations away from domain hard-coding in Next.js/React/TypeScript/Vercel or similar stacks.
metadata:
  author: SaaS Skills Collection
  version: "1.0"
  last_validated: "2026-05-13"
  sources:
    - references/architecture.md
    - references/implementation-patterns.md
    - references/security-governance.md
    - references/rag-memory.md
    - references/evals-observability.md
    - references/review-checklists.md
---

# SaaS AI Agent Engineer

## Core Rule

Treat an AI agent as a product and backend subsystem, not as a prompt. Keep the SaaS core domain-agnostic, inject domain knowledge as data at runtime, put the LLM behind deterministic permission and validation gates, and verify behavior with tests, evals, traces, and audit logs before calling it done.

## First Moves

1. Read the repo instructions first: `AGENTS.md`, `CLAUDE.md`, or equivalent.
2. Inspect the real stack before choosing patterns: package manager, API routes/server actions, auth/session code, Prisma/schema files, services/use cases, storage, jobs, existing AI code, tests, docs, and observability.
3. Classify the task: architecture, implementation, bugfix, review, security hardening, RAG/memory, schema-driven configuration, evals/observability, or migration.
4. Verify official docs before adding model-specific, provider-specific, framework-specific, pricing-sensitive, or time-sensitive code. Model IDs, SDK APIs, hosted limits, and provider terms change.
5. Prefer the repo's existing auth, service, validation, UI, storage, queue, tracing, and test conventions over new abstractions.
6. Mark facts, inferences, proposals, and unknowns separately. Do not invent entity names, permissions, routes, schemas, or tenant boundaries.

## Reference Selector

Load only the reference needed for the current task:

- `references/architecture.md`: domain-agnostic core, configuration-as-data, hierarchical instructions, dynamic tool registry, hybrid routing, EMPTY_RESPONSE fixes, and migration order.
- `references/implementation-patterns.md`: TypeScript/Next.js implementation patterns for tool calling, schema-driven configuration, JSON Schema, human approval, background jobs, and structured errors.
- `references/security-governance.md`: multi-tenancy, RLS, prompt injection, Lethal Trifecta, RBAC/ABAC, LGPD/privacy, audit, and incident controls.
- `references/rag-memory.md`: scoped memory, pgvector/hybrid retrieval, embeddings, extraction, deduplication, temporal validity, files, and deletion propagation.
- `references/evals-observability.md`: Langfuse/OpenTelemetry-style tracing, GenAI attributes, replay, metrics, cost tracking, prompt caching, and regression evals.
- `references/review-checklists.md`: architecture review, PR review, migration, production readiness, security, and bug triage checklists.

## Workflow

### 1. Discover

Map the current system before proposing or editing:

- Auth: provider, session shape, middleware, server-side guards.
- Tenancy: `tenantId`/`orgId` fields, query filters, RLS or compensating controls.
- Domain: Prisma models, service layer, use cases, critical invariants.
- Agent surface: chat UI, route handlers, tools, prompts, skills, memory, RAG, jobs, model providers.
- Data surfaces: uploaded files, invoices, photos, documents, embeddings, traces, logs.
- Governance: audit logs, approval workflows, feature flags, rate limits, retention policy.
- Verification: unit/integration/e2e tests, eval datasets, traces, dashboards, runbooks.

### 2. Choose the Smallest Safe Architecture

Default to this path unless the repo proves otherwise:

```text
UI chat or workflow
-> authenticated API route/server action
-> deterministic user and tenant context
-> scoped instructions, skills, memories, and tools
-> agent orchestration
-> tool input schemas
-> permission validator
-> application use case/service
-> database/storage/queue
-> audit log and observability trace
```

Use deterministic code for authentication, authorization, tenant isolation, schema validation, quotas, idempotency, persistence, approval gates, and irreversible side effects. Use the LLM for intent interpretation, tool selection within a scoped catalog, drafting, clarification, extraction, and synthesis.

### 3. Keep Domain Knowledge as Runtime Data

When domain behavior appears in code, move it toward configuration:

- Instructions: compose `system -> tenant -> project -> user -> conversation` with explicit precedence and strategies.
- Tools: resolve available tools from tenant/project/user/workflow scope, not from hard-coded domain branches.
- Skills: expose procedural knowledge through skill metadata and load detailed instructions on demand.
- Schemas: define configurable entities with JSON Schema and derive admin forms, backend validation, and tool inputs from the same source.
- Memory: retrieve scoped, relevant facts instead of stuffing all history into the prompt.

Do not put tenant-specific report types, project workflows, business templates, or vertical-specific prompts in the SaaS core.

### 4. Implement Agent Capabilities

For every new or changed capability:

1. Define the user workflow and risk level: read-only, reversible write, irreversible write, financial/legal/external effect.
2. Add or reuse application use cases before exposing tools. Tools wrap business capabilities; they do not duplicate business logic.
3. Define each tool with one responsibility, runtime input schema, typed output, structured expected errors, and a permission policy.
4. Resolve identity, tenant, role, and resource scope outside model-controlled arguments.
5. Gate every tool with deterministic RBAC/ABAC, tenant/resource checks, rate limits, cost budgets, and approval requirements.
6. Add audit logging for attempted, denied, failed, pending-approval, and successful actions.
7. Add idempotency keys for writes, background jobs, retries, and approved actions.
8. Return structured tool failures that the LLM can explain to the user. Do not swallow errors into `null`, empty strings, or generic 500s.
9. Add tests for permission boundaries, schema validation, failure modes, and at least one happy path.
10. Add evals for prompts, tool selection, RAG answers, memory behavior, and adversarial cases when behavior depends on model judgment.

### 5. Harden RAG, Memory, and Files

For retrieval or memory features:

- Scope embeddings, chunks, memories, and retrieval filters to tenant and resource permissions before context reaches the LLM.
- Store source references, schema/model versions, extraction confidence, and deletion lineage.
- Prefer structured extraction for invoices, receipts, reports, operational records, and compliance data.
- Route low-confidence or high-impact extraction outputs to human review.
- Treat uploaded/retrieved content as untrusted data, never as instructions.
- Tombstone or delete derived chunks, embeddings, and memories when source data is deleted under retention/privacy policy.

### 6. Verify and Report

Before finishing:

- Run the repo's required checks for the files touched.
- For agent behavior, include policy tests, tool tests, representative evals, and adversarial tests where feasible.
- For UI chat or approval changes, verify the interactive flow in a browser if a dev server is required.
- For architecture work, provide tradeoffs, open questions, and a prioritized implementation path.
- For migrations, preserve current behavior first, install observability before moving logic, and migrate one capability at a time.

## Non-Negotiable Invariants

- Identity and tenant context are resolved before the agent loop starts.
- The LLM never receives model-controlled `userId`, `tenantId`, role, privileged flags, raw SQL, or unrestricted include/select fields.
- Tool availability is scoped to user, tenant, role, resource, project, and workflow state.
- Permission checks are deterministic code, never prompt instructions.
- Every write has validation, authorization, audit, idempotency, and a clear failure result.
- Every high-impact action has a durable approval path outside free-text chat.
- Agent outputs distinguish facts from model inferences in reports, compliance, finance, operations, and customer-facing decisions.
- Observability traces are for debugging; audit logs are the compliance source of truth.
- Prompts, tools, schemas, skills, model/provider choices, eval datasets, and embedding models are versioned or traceable.
- Secrets never appear in prompts, traces, tool args, sample logs, eval fixtures, or skill content.

## Fallback Clause

If information is missing, output the marker instead of inventing:

- `[INFORMATION NEEDED: repository AI agent entry point and current orchestration files]`
- `[INFORMATION NEEDED: auth/session shape and tenant boundary source]`
- `[INFORMATION NEEDED: tool registry, permission policy, or approval workflow]`
- `[INFORMATION NEEDED: eval dataset, trace system, or acceptance criteria for agent behavior]`

Do not create model-specific code, prompt constants, tool names, tenant scopes, or database fields from assumption alone.

## Anti-Patterns

- Hard-coding tenant, project, or vertical-specific behavior into the SaaS agent core.
- Letting the LLM decide identity, tenant, role, permission, or resource scope.
- Shipping tools that call Prisma, SQL, storage, email, payments, or external APIs without deterministic validation and authorization.
- Treating prompt changes as safe without evals, traces, and version history.
- Mixing observability traces with compliance audit logs.
- Storing secrets, personal data samples, or privileged IDs in prompts, traces, fixtures, or skills.
- Debugging agent behavior from code first when the repository provides AgentOps, traces, or run inspection as the source of truth.

## Enforcement

This skill is MANDATORY when designing, implementing, reviewing, debugging, or hardening SaaS AI agents. Always read the target repository instructions first and let repository-specific governance override generic examples. For managed behavior such as prompts, skills, tools, and model routing, prefer data/configuration surfaces already present in the repo before adding code constants.

## Output Style

For implementation, edit the code directly, keep changes scoped, and verify. For reviews, lead with bugs, security risks, and missing tests, with file/line references. For architecture and migrations, produce a concrete plan with decision points, safe increments, and acceptance criteria.

## Source References

- `references/architecture.md`
- `references/implementation-patterns.md`
- `references/security-governance.md`
- `references/rag-memory.md`
- `references/evals-observability.md`
- `references/review-checklists.md`
