# Review Checklists

## Contents

- Architecture review
- Implementation PR review
- Security review
- RAG/memory review
- Migration review
- Production readiness
- Bug triage

## Architecture Review

- [ ] Core agent orchestration is domain-agnostic.
- [ ] Domain behavior is represented as instructions, schemas, skills, tool bindings, or memory data.
- [ ] LLM responsibilities are separated from deterministic guarantees.
- [ ] Tenant/user/project context is resolved before the agent loop.
- [ ] Tools wrap application use cases instead of duplicating business rules.
- [ ] Tool availability is scoped by tenant/project/user/workflow state.
- [ ] High-impact actions use durable approval outside chat.
- [ ] Prompt, tool, schema, skill, and model versions are traceable.
- [ ] Observability exists before major behavior migration.
- [ ] The design has a rollback or kill-switch path.

## Implementation PR Review

- [ ] No model-controlled `tenantId`, `userId`, role, approval flag, raw SQL, or unrestricted query shape.
- [ ] Every tool has runtime input validation.
- [ ] Every write has authorization, validation, audit, and idempotency.
- [ ] Expected failures return structured errors with human-readable reasons.
- [ ] Permission checks happen in code, not prompt text.
- [ ] Tenant/resource filters are present before retrieval and persistence.
- [ ] Tests cover permission denial, validation failure, tool failure, and a happy path.
- [ ] Evals cover model-judgment paths where feasible.
- [ ] Tracing includes tenant, project, user, conversation, model, and active config versions.
- [ ] Prompts, traces, tests, and fixtures contain no secrets or unnecessary PII.

## Security Review

- [ ] Direct and indirect prompt injection scenarios are considered.
- [ ] Retrieved/uploaded content is labeled and treated as untrusted data.
- [ ] The agent does not combine private data, untrusted content, and external communication without approval controls.
- [ ] RBAC and ABAC checks are enforced server-side.
- [ ] RLS or compensating tenant-isolation tests protect sensitive tables.
- [ ] Background jobs carry tenant context and set it before data access.
- [ ] Tool outputs are minimized before returning to the model.
- [ ] Audit logs are complete for sensitive reads, writes, approvals, and admin actions.
- [ ] Kill switches exist for global, tenant, and risky-tool disablement.
- [ ] Retention and deletion policies cover derived embeddings, memories, summaries, and traces.

## RAG and Memory Review

- [ ] Chunks and memories carry tenant/resource scope.
- [ ] Structured filters run before vector ranking.
- [ ] Source references are stored and surfaced for factual answers.
- [ ] Embedding model/version metadata is recorded.
- [ ] Deletion or tombstoning propagates to derived records.
- [ ] Top-k is small enough to avoid context distraction.
- [ ] Memory extraction uses a schema and stores confidence.
- [ ] Deduplication reinforces existing memories instead of duplicating them.
- [ ] Temporal validity is modeled for facts that change.
- [ ] Uploaded and retrieved content cannot override instructions.

## Migration Review

- [ ] Current behavior is traced before refactor.
- [ ] Hard-coded domain strings and branches are cataloged.
- [ ] Tools migrate to registry before prompt migration where EMPTY_RESPONSE is tool-related.
- [ ] Inline prompts migrate to hierarchical instructions with versioning.
- [ ] Configurable entities migrate one entity type at a time.
- [ ] Schema versions preserve old record readability.
- [ ] Skills are introduced only for procedural workflows, not generic tone or policy.
- [ ] Metrics compare before/after: empty responses, latency, cost, tool failures, user feedback.
- [ ] Rollback path exists for each migrated capability.

## Production Readiness

- [ ] Auth and tenant isolation are tested.
- [ ] Tool loop has step, retry, token, and cost caps.
- [ ] Rate limits and monthly budget controls are tenant-aware.
- [ ] Human approval exists for destructive, external, legal, financial, or irreversible actions.
- [ ] Traces support debugging by tenant/user/conversation.
- [ ] Audit logs are queryable and not sampled.
- [ ] Eval suite includes happy paths, edge cases, and adversarial cases.
- [ ] Provider/model fallback or graceful degradation is defined.
- [ ] Runbooks cover prompt injection, data leak, provider outage, runaway cost, and bad output.
- [ ] Dashboards expose latency, error rate, cost, cache hit ratio, and quality signals.

## Bug Triage

For bad or empty responses, collect trace ID, tenant, project, user, conversation, timestamp, composed prompt or prompt version hash, visible tool definitions, retrieved memory IDs, model/provider parameters, tool calls, tool results, denials, errors, retries, fallback path, and recent configuration changes.

Classify likely root cause: missing or over-filtered tool, conflicting instructions, missing graceful-failure instruction, retrieval noise, stale memory, unexplained permission denial, swallowed tool error, model/provider regression, or genuinely ambiguous user request.
