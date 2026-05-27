# RAG and Memory Reference

## Contents

- Memory types
- Scope model
- Hybrid retrieval
- Extraction and consolidation
- Temporal validity
- Files and untrusted context
- When not to use vectors

## Memory Types

Separate memory by purpose:

- Working memory: current conversation window, scratchpad, recent tool results.
- Episodic memory: events, decisions, outcomes, turn summaries.
- Semantic memory: durable facts detached from a single conversation.
- Procedural memory: workflows, instructions, and skills.
- Reflection memory: lessons, evaluations, or model-generated improvement notes.

Do not mix raw transcripts, facts, project instructions, and workflow procedures in the same retrieval pool without filters.

## Scope Model

Every memory and chunk must carry visibility scope:

```text
tenantId required
projectId optional
userId optional
conversationId optional
resourceId optional
permission metadata optional
```

Runtime query should include memories visible to the current context:

```text
tenantId matches
AND projectId is null or matches
AND userId is null or matches
AND conversationId is null or matches
AND enabled
AND valid now
```

Conflict rule:

1. More specific scope wins.
2. Newer valid fact wins.
3. Higher confidence or reinforcement wins.
4. If still conflicting, show uncertainty or ask for confirmation.

## Hybrid Retrieval

Prefer Postgres plus pgvector for many SaaS systems unless scale or latency proves otherwise. Use structured filters before vector ranking:

```sql
SELECT id, title, content, metadata, confidence,
       1 - (embedding <=> $1::vector) AS similarity
FROM "Memory"
WHERE "tenantId" = $2
  AND ("projectId" IS NULL OR "projectId" = $3)
  AND "type" = 'SEMANTIC'
  AND "enabled" = TRUE
  AND ("validUntil" IS NULL OR "validUntil" > NOW())
ORDER BY embedding <=> $1::vector
LIMIT 5;
```

Rules:

- Filter tenant and permissions before context reaches the LLM.
- Store text, source metadata, and embedding together.
- Store embedding model name/version and content hash.
- Re-embed only when embedding source text changes materially.
- Keep top-k small by default, usually 5 to 10.
- Prefer exact lookup, SQL, or full-text search when the query is not semantic.

## Extraction and Consolidation

Memory creation sources:

- Manual: product owner or admin writes a durable fact.
- Tool result: trusted tool output becomes an episodic or semantic record.
- Turn extraction: a smaller or cheaper model extracts candidate memories after relevant turns.
- Batch consolidation: old episodic memories become compact semantic summaries.

Extraction rules:

- Use structured output with schema validation.
- Preserve names, IDs, dates, amounts, decisions, and missing fields exactly.
- Attach source turn/tool IDs.
- Store confidence and extraction method.
- Deduplicate against existing memories before insert.

Deduplicate by reinforcing semantically similar records when scopes overlap instead of duplicating the same fact many times.

## Temporal Validity

Recommended fields:

```text
validFrom
validUntil
enabled
confidence
reinforcedAt
reinforceCount
source
metadata
```

When a fact changes, close or disable the old memory and insert a new one. Do not silently overwrite if audit or replay matters.

## Files and Untrusted Context

Treat uploaded files, retrieved documents, web pages, emails, OCR text, and webhook payloads as untrusted data.

When sending retrieved content to the LLM:

- Label it as untrusted source data.
- Keep it separate from instructions.
- Do not let embedded instructions override system/developer instructions.
- Strip or flag obvious prompt-injection phrases when appropriate.
- Avoid sending secrets, tokens, credentials, or irrelevant PII.

For multimodal extraction, persist source metadata and checksum, store raw extraction only if allowed, route low-confidence or high-impact extraction to human review, and propagate deletion to derived records.

## When Not to Use Vectors

Use normal database queries instead of embeddings for counts, aggregations, known IDs, exact names, codes, short identifiers, permission checks, small configuration sets, and compliance queries that need deterministic reproducibility.
