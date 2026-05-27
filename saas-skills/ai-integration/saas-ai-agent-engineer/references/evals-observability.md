# Evals and Observability Reference

## Contents

- Trace hierarchy
- What to capture
- Privacy and redaction
- Metrics
- Replay
- Evals
- Prompt caching and cost

## Trace Hierarchy

Instrument each agent turn as a causal tree:

```text
agent.turn
├── instructions.compose
├── memory.search
├── skills.resolve
├── tools.resolve
├── gen_ai.chat
│   ├── execute_tool <toolName>
│   └── execute_tool <toolName>
├── memory.extract
└── usage.record
```

Use OpenTelemetry-style attributes and GenAI semantic conventions where the stack supports them. Verify current convention names before formal instrumentation because GenAI conventions continue to evolve.

Minimum span attributes:

```text
app.tenant_id
app.project_id
app.user_id
app.conversation_id
app.instructions_version
app.tools_version
app.skills_version
gen_ai.system
gen_ai.request.model
gen_ai.operation.name
gen_ai.usage.input_tokens
gen_ai.usage.output_tokens
gen_ai.usage.cache_read_tokens
```

## What to Capture

For debugging and replay, capture active instruction layers, composed prompt or prompt hash, visible tool definitions, visible skill metadata, retrieved memory IDs and scores, model/provider parameters, tool calls, sanitized tool IO, token usage, cost, latency, retry count, and fallback path.

Use span events for large prompt/completion payloads instead of huge attributes.

## Privacy and Redaction

Production defaults:

- Always capture metadata.
- Capture raw prompts/completions only behind an explicit debug flag or sampling policy.
- Redact CPF/CNPJ personal identifiers, emails, phones, tokens, credentials, secrets, and auth headers before export.
- Keep audit logs complete but sanitized.
- Respect tenant access control on trace viewers.

Treat trace storage as sensitive data.

## Metrics

Operational:

- P50/P95/P99 latency by route, model, tenant, and tool.
- Error rate by type.
- Throughput by turns, tool calls, and jobs.
- Step count per turn.

Cost:

- Input, output, and cached tokens by tenant/model/project.
- Cost per turn.
- Monthly spend by tenant.
- Cache hit ratio for stable prompts.

Quality:

- Empty response rate.
- Retry/repair rate.
- Tool selection accuracy.
- Tool failure rate by tool.
- Negative feedback rate.
- Retrieval citation accuracy.
- Memory extraction precision and duplicate rate.

Health:

- Queue lag.
- Embedding backlog.
- Handoff count for multi-agent systems.
- Prompt/schema/skill version adoption.

## Replay

A useful trace should answer "why did the agent do that?"

Replay requirements:

- Active versions of instructions, tools, schemas, skills, and model/provider.
- Original user message and curated history.
- Retrieved memory IDs and content snapshot or source version.
- Tool result snapshots or deterministic mocks.
- Prompt and completion payloads when privacy policy allows.

If full replay is too expensive, implement "show composed prompt and tool path by trace ID" first.

## Evals

Use evals as regression gates for behavior that depends on model judgment.

Eval categories:

- Intent and route classification.
- Tool selection.
- Required clarification before action.
- Permission denial explanation.
- RAG answer groundedness and citation correctness.
- Memory extraction and deduplication.
- Prompt injection resistance.
- Empty response prevention.
- Report generation structure and factuality.

Dataset rules:

- Include real anonymized examples when allowed.
- Include edge cases and adversarial prompts.
- Version datasets with prompt/tool/schema changes.
- Store expected behavior, not only expected wording.
- Run small smoke evals in PRs and larger evals on schedule.

## Prompt Caching and Cost

Prompt caching behavior is provider-specific and changes over time. Verify current official docs before implementation.

General rules:

- Keep stable content first: tool definitions, system instructions, long project context.
- Keep variable content later: timestamps, request IDs, user turn, volatile tool results.
- Avoid non-deterministic ordering of tool definitions or instruction sections.
- Track cache read/write token counts from provider responses.
- Alert when cache hit ratio drops unexpectedly for stable workloads.

Cost controls should cap steps, retries, max output tokens, tenant spend, and tool calls. Route cheaper models to classification, summarization, extraction, and eval prechecks when quality allows.
