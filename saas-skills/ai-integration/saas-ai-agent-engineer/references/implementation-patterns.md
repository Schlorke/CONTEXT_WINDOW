# Implementation Patterns

## Contents

- Runtime path
- Tool contracts
- Schema-driven configuration
- Human approval
- Background jobs
- Structured failures
- Practical anti-patterns

## Runtime Path

For Next.js/Vercel-style TypeScript SaaS, prefer the repo's existing AI runtime and verify current official SDK docs before changing provider-specific APIs.

Default handler shape:

```text
parse request
-> authenticate
-> resolve tenant/user/project context
-> compose instructions
-> curate messages
-> resolve memories
-> resolve scoped tools and skills
-> run LLM/tool loop with step cap
-> persist turns and usage
-> emit trace and audit events
```

Keep provider SDK code behind a small application wrapper so model/provider changes do not leak through the product.

## Tool Contracts

Tools should wrap application use cases. They are not a place for domain-specific business logic.

Minimum tool design:

```ts
type ToolContract<Input, Output> = {
  name: string;
  description: string;
  inputSchema: unknown;
  risk: "read" | "reversible-write" | "high-impact";
  policy: ToolPolicy;
  execute: (
    input: Input,
    ctx: TrustedExecutionContext,
  ) => Promise<ToolResult<Output>>;
};

type ToolResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; reason: string; details?: unknown };
```

Rules:

- Do not expose `tenantId`, `userId`, role, approval flags, or permission scope as model-controlled arguments.
- Validate input at the tool boundary even if the provider enforces a schema.
- Re-check authorization inside the use case or policy layer.
- Return expected failures as structured results; reserve thrown errors for unexpected infrastructure failures.
- Add idempotency keys for writes, retries, and approvals.
- Audit attempted, denied, failed, pending, and successful tool executions.

## Schema-Driven Configuration

Use JSON Schema or an equivalent declarative contract when the product owner needs to configure domain entities.

One schema should drive admin form rendering, backend validation, tool input shape, serialization for LLM context, and versioned entity records.

Recommended records:

```text
EntitySchema
  tenantId
  projectId
  entityType
  schema
  uiSchema
  toolDescription
  enabled
  version
  parentId

EntityRecord
  tenantId
  projectId
  entityType
  payload
  schemaVersion
```

Implementation notes:

- Use a backend validator such as Ajv for JSON Schema.
- Keep UI schema separate from data schema.
- Add max lengths and max item counts to prevent runaway model output.
- Use `schemaVersion` on each record so old records remain readable after schema evolution.
- Use project-specific uniqueness such as `(tenantId, projectId, entityType)`.
- For relations, use explicit schema extensions such as `x-relation` and validate referenced records in code.

## Human Approval

Use calibrated autonomy:

```text
read-only -> autonomous after permission check
reversible write -> autonomous only if product risk accepts undo/audit
high-impact -> durable human approval
```

Approval must happen outside free-text chat:

- Store a proposed action with tool name, sanitized args, proposer, model, tenant, user, status, expiry, risk, and idempotency key.
- Render approve/edit/reject controls in UI.
- Re-check authorization at approval time and execution time.
- Execute only after explicit approval by an authorized user.
- Audit proposal, approval, rejection, expiry, and execution.

Never treat "yes" in chat as sufficient approval for destructive, financial, legal, external, or irreversible effects.

## Background Jobs

Use durable jobs for long report generation, memory extraction, memory consolidation, embedding and reindexing, upload extraction, external integrations with retries, and batch evaluations.

Job rules:

- Payload contains IDs and tenant/user context, not large files or secrets.
- Each step is idempotent.
- Each step records status transitions.
- Workers set tenant context before database access.
- User-facing status is persisted and queryable.

## Structured Failures

Expected failures should be explainable to the LLM:

```ts
return {
  ok: false,
  code: "MISSING_REQUIRED_FIELD",
  reason:
    "The entity schema requires visitDate before this record can be created.",
  details: { field: "visitDate" },
};
```

Avoid `return null`, empty strings, expected validation errors thrown as infrastructure errors, and raw provider/database errors in user responses.

## Practical Anti-Patterns

- Inline prompts with tenant language in route handlers.
- Tools with names like `createCommercialReport` when the real capability is `createEntity`.
- A router that filters tools by string matching before the LLM sees the full request.
- Storing prompts in the database but leaving tool selection hard-coded.
- Letting the LLM choose permissions, tenant scope, or approval state.
- Logging full prompts and tool args without redaction.
- Retrying agent loops without step, token, or cost caps.
- Shipping prompt changes without traceable versions or regression examples.
