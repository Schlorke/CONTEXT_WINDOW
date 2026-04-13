# Context Compression Strategies

## Strategy 1: Summarize Older Turns

Keep recent turns verbatim, summarize older ones.

### Before (keep ALL history — 40K tokens)

```text
Turn 1: User: [500 tokens of context]
        AI: [600 tokens response]
Turn 2: User: [200 tokens]
        AI: [800 tokens]
...
Turn 15: User: [300 tokens]
         AI: [400 tokens response]
```

#### After (keep recent + summarize old — 15K tokens)

```text
CONVERSATION_SUMMARY (Turns 1-10):
- Turn 1: User provided project requirements (SaaS payment system).
- Turns 2-5: Discussed authentication strategy (JWT preferred).
- Turns 6-10: Designed API endpoints (POST /charges, GET /status).
- Key decisions: PostgreSQL for data, Redis for cache, Node.js backend.

RECENT_TURNS (Turns 11-15):
Turn 11: User: [Full turn 11 text]
         AI: [Full response]
...
Turn 15: User: [Full turn 15 text]
         AI: [Full response]
```

**Token savings:** ~25K. Quality maintained because recent context is preserved.

---

## Strategy 2: Extract Key Facts, Discard Discussion

Replace verbose exploration with concise decisions and reasoning.

### Before (verbose exploration — 30K tokens)

```text
Turn 3:
User: "Should we use REST or GraphQL?"
AI: "REST pros: Simpler, standard. GraphQL pros: Flexible queries..."
User: "Hmm, but our clients are mostly mobile..."
AI: "Good point. Mobile-first argues for GraphQL efficiency..."
User: "OK, let's go with GraphQL."
```

#### After (decision + reasoning only — 3K tokens)

```text
DECISION_LOG:
- CHOSEN: GraphQL API (Reason: Mobile-first client base benefits from reduced payload sizes)
- RATIONALE: 40% of users on mobile networks; GraphQL query specificity reduces data transfer by ~30%
- REJECTED_ALTERNATIVES: REST (too verbose for mobile clients)
```

**Token savings:** ~27K. All important context preserved.

---

## Strategy 3: Hierarchical Documentation (Load on Demand)

Separate documents by layer (overview, details, deep-dive). Load only what's needed.

### Before (include all docs — 50K tokens)

```text
[Complete API documentation: 8000 tokens]
[Complete architecture guide: 12000 tokens]
[Complete testing guide: 6000 tokens]
[All examples and edge cases: 24000 tokens]
```

#### After (layered loading — initial 8K tokens, expanded on demand)

```text
LEVEL 1 (Always loaded — 8K):
PROJECT_OVERVIEW:
- SaaS payment processing system
- Tech stack: Node.js, PostgreSQL, Redis
- 3 microservices: auth, payments, webhooks
- 50K daily transactions

LEVEL 2 (Loaded if user asks about API):
[Link: "Retrieve full API_DOCUMENTATION.md (12K tokens)"]

LEVEL 3 (Loaded if user asks about specific endpoint):
[Link: "Retrieve GET_CHARGES_SCHEMA.md (2K tokens)"]
```

**Implementation:** Use prompt structure like:

```text
If the user needs detailed API info, say: "I can retrieve the full API docs. Should I load [DETAILED_API_DOCS]?"
```

**Token savings:** ~42K initially. Can be loaded on demand without blowing budget.

---

## Strategy 4: Skills as Compressed Knowledge

Instead of including raw knowledge, reference a **skill** (pre-synthesized expertise).

### Before (raw prompt example — 20K tokens)

```text
"Here's how to design scalable databases:
1. Normalize schema...
2. Choose partitioning strategy...
[30 paragraphs of guide]"
```

#### After (reference a skill — 200 tokens)

```text
"For database design, use SKILL: database-design-patterns.
Reference: Sharding strategy for >1M records, index optimization for queries >100ms."
```

The LLM loads the skill definition (pre-cached) instead of raw content.

**Token savings:** ~19.8K. Knowledge is available but not consuming context.

---

## Strategy 5: Compression Checklist

When optimizing context, apply in order:

1. **Summarize history** — Keep last 10 turns verbatim. Summarize turns 1-10 into 5 bullet points.
2. **Extract decisions** — Replace discussion with conclusions.
3. **Layer documentation** — Level 1 always, levels 2-3 on demand.
4. **Reference skills** — Use SKILL: notation instead of raw content.
5. **Re-audit tokens** — Measure savings. Target 30-50% reduction without quality loss.
