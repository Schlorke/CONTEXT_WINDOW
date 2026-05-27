# Architecture Reference

## Contents

- Baseline shape
- Configuration-as-data
- Domain-agnostic core
- Hierarchical instructions
- Dynamic tool registry
- Hybrid routing and EMPTY_RESPONSE
- Migration order

## Baseline Shape

Use a layered monolith for most SaaS products until scale or ownership requires services:

```text
app/routes/ui
application use cases
domain contracts and policies
infrastructure adapters
agent orchestration
```

The agent layer belongs at the product boundary. It interprets language, selects tools, loads context, and drafts responses. It must not own business rules. Business rules live in services/use cases that normal UI routes can call without the LLM.

Recommended runtime path:

```text
Client chat/workflow
-> POST /api/agent/chat or server action
-> auth/session guard
-> tenant/user/project context
-> instruction/tool/skill/memory resolvers
-> LLM/tool loop
-> permission validator
-> use case/service
-> DB/storage/queue
-> audit event
-> trace and usage event
```

## Configuration-as-Data

Keep mechanisms in code and tenant/domain policy in data.

Code owns authentication, authorization, validation, LLM calls, streaming, retries, tool execution, storage, queues, tracing, audit, and limits.

Runtime data owns tenant/project instructions, entity schemas, UI schemas, tool availability, tool descriptions, skills, memory records, retrieval metadata, prompt versions, model versions, tool versions, and schema versions.

Use this test: if a product owner reasonably needs to change it without engineering or deployment, it is probably data.

## Domain-Agnostic Core

The SaaS core can know abstractions such as Tenant, Project, Instruction, Tool, Skill, Memory, Conversation, EntitySchema, EntityRecord, UsageEvent, and AuditEvent. It should not know tenant-specific categories such as "Commercial Report", "Engineering Visit", or any current customer's vertical.

Red flags:

- Domain strings in agent orchestration files.
- `if/else` routing by tenant, project type, report type, category, or vertical.
- Inline system prompts with tenant-specific wording.
- Tool registries keyed by business domain.
- Migrations that create tenant-specific tables for configurable entities.

Core must not import domain templates. Templates populate storage; runtime resolvers read storage.

## Hierarchical Instructions

Compose instructions in a deterministic hierarchy:

```text
SYSTEM -> TENANT -> PROJECT -> USER -> CONVERSATION
```

Use explicit composition strategies:

- `APPEND`: add non-conflicting guidance.
- `OVERRIDE`: replace a named section from a less-specific layer.
- `SCOPED`: apply only when a condition is true.

Implementation rules:

- Store instruction records with scope, precedence, strategy, section, condition, content, enabled flag, version, and parent version.
- Define a stable conflict order, usually `(precedence, scope specificity, createdAt or version)`.
- Cache the composed prompt by tenant/project/user/conversation plus instruction version hash.
- Include the active instruction version hash in traces.
- Keep the system layer domain-agnostic and failure-aware.

## Dynamic Tool Registry

Tools are contracts, not business branches. Each tool should expose a stable name, description, input schema, output schema or structured result, implementation key, permission policy, approval metadata, and rate-limit metadata.

Use project/tenant bindings to decide availability:

```text
Tool
ProjectToolBinding
ToolPermission
TOOL_IMPLEMENTATIONS[implementationKey]
```

The implementation map stays in code. Availability, descriptions, approval requirements, and config overrides are data.

For configurable entities, prefer a generic tool such as `createEntity({ entityType, payload })` that validates against the active project schema.

## Hybrid Routing

Use deterministic code for guarantee and the LLM for semantic judgment.

Code decides authentication, authorization, tenant/resource scope, schema validation, approval and risk policy, quotas, rate limits, idempotency, persistence, step caps, and retry caps.

LLM decides user intent when not an exact ID lookup, which available tool or skill best matches the request, whether to ask clarification, and how to synthesize tool results.

Hybrid pattern:

```text
User request
-> optional LLM classifier for generic route class
-> scoped instructions/tools/skills/memory
-> main LLM/tool loop
-> deterministic guard before every tool execution
-> structured tool result
-> assistant response or graceful fallback
```

## EMPTY_RESPONSE Prevention

Treat empty model output as an architectural signal, not just a UI bug.

Common causes:

- Tool set was filtered too aggressively before the LLM saw the request.
- System prompt constrained the agent to categories that do not cover the user's request.
- No instruction tells the model how to fail gracefully.
- Tool errors were swallowed into empty or unhelpful results.

Fixes:

- Resolve tools by project/user permission, not by brittle domain string matching.
- Include a domain-agnostic fallback instruction: explain what is missing and ask for the next needed fact.
- Return structured tool failures with human-readable reasons.
- Retry empty/invalid outputs at most a small fixed number of times with a repair instruction.
- Trace the composed prompt, tool definitions, model, finish reason, and retries.

## Migration Order

1. Install observability and capture current prompt/tool behavior.
2. Add or confirm tenant isolation and permission checks.
3. Move tools into a dynamic registry without changing business behavior.
4. Move inline prompts into hierarchical instructions.
5. Introduce schema-driven entities one vertical/entity at a time.
6. Add scoped memory after core behavior is measurable.
7. Move long procedural workflows into skills.
8. Add eval gates, cost dashboards, replay, and rollout controls.
