# Security and Governance Reference

## Contents

- Threat model
- Multi-tenancy layers
- RLS and tenant context
- RBAC/ABAC and tool policy
- Prompt injection
- Lethal Trifecta
- Privacy and LGPD
- Audit and incident controls

## Threat Model

Model the LLM as an untrusted planner that can propose actions to trusted code.

Trusted code must enforce authentication, authorization, tenant isolation, schema validation, business invariants, rate and cost limits, approval requirements, auditability, retention, and deletion policy.

The model can misunderstand, hallucinate, be manipulated by direct user text, or be manipulated by retrieved/uploaded content.

## Multi-Tenancy Layers

Tenant isolation for agentic SaaS must cover:

- Data: tenant A cannot read or write tenant B rows.
- Prompts: tenant/project instructions do not leak across contexts.
- Tools: enabled tools and permissions are scoped per tenant/project/user.
- Memory/RAG: chunks, embeddings, and memories are filtered before prompt injection.
- Costs: usage events, budgets, and rate limits are tenant-aware.
- Observability: traces and audit records include tenant and have access controls.

Every cache key that contains tenant-specific behavior must include tenant scope.

## RLS and Tenant Context

Use database-level isolation where the stack supports it.

Rules:

- Every sensitive table has `tenantId`, `orgId`, or equivalent.
- Application queries include tenant filters.
- Postgres RLS or equivalent policies provide defense in depth.
- The app runtime role must not bypass RLS.
- Migration/admin roles are separate from app runtime roles.
- Workers and background jobs receive tenant context in payloads and set it before database access.

If RLS is not available, compensate with centralized repository/query helpers and integration tests that deliberately attempt cross-tenant access.

## RBAC/ABAC and Tool Policy

Use both:

- RBAC: which roles can perform a class of actions.
- ABAC: whether this actor can perform this action on this resource in this context.

Policy shape:

```ts
type ToolPolicy = {
  action: string;
  roles: Role[];
  risk: "read" | "reversible-write" | "high-impact";
  scopeCheck: (ctx: UserContext, args: unknown) => Promise<{ allowed: boolean; reason?: string }>;
  approval?: { reason: string; approverRoles: Role[] };
};
```

Do not rely on hidden UI controls or prompt text as security. The server/tool layer is authoritative.

## Prompt Injection

Mitigations:

- Expose only tools the current actor may use.
- Validate resource scope in code.
- Label retrieved/uploaded content as untrusted data.
- Keep instructions separate from source content.
- Use structured extraction for untrusted documents before privileged decisions.
- Add adversarial evals for direct and indirect injection.
- Require human approval for destructive or external effects.

## Lethal Trifecta

High-risk agents combine private data access, untrusted content, and external communication. When all three exist, prompt injection can become data exfiltration.

Mitigations:

- Limit external communication tools.
- Require approval for email, webhooks, exports, payments, deletion, and external API writes.
- Use quarantined extraction for untrusted content where feasible.
- Minimize tool outputs sent back to the model.
- Audit every external effect.

## Privacy and LGPD

For Brazilian or LGPD-sensitive SaaS:

- Define purpose, legal basis, retention, and deletion policy before production.
- Minimize personal data in prompts, tool results, traces, eval fixtures, and logs.
- Redact CPF/CNPJ personal identifiers, emails, phones, tokens, and secrets unless explicitly needed and approved.
- Support data subject requests for conversations, memories, embeddings, extracted text, and derived summaries where applicable.
- Review provider data processing terms and no-training/data-use settings with the responsible business/legal owner.

Never put secrets, credentials, API keys, or raw auth headers into prompts, traces, memories, skills, or eval fixtures.

## Audit vs Observability

Audit is the compliance record. Tracing is debugging telemetry.

Audit must be complete for instruction, schema, tool, skill, permission changes, writes, sensitive reads, proposed actions, approvals, rejections, expiry, execution, bulk exports, external communications, admin impersonation, and tenant-switch events.

Traces may be sampled and redacted. Audit should not depend on sampling.

## Incident Controls

Every production agent needs global kill switch, tenant/project/tool kill switches, budget controls, rate-limit controls, model/provider fallback, trace lookup, incident runbooks, and the ability to disable risky tools without disabling read-only assistance.

Check kill switches before the agent loop and before high-impact jobs execute.
