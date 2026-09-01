---
name: context-window-optimization
description: Procedural guide for structuring and optimizing LLM context windows in SaaS development, covering token and tool-output budgeting, positional bias mitigation, context drift prevention, validation scheduling, smart compression, progressive disclosure, and RAG integration. Trigger when optimizing context for agents, managing token or command-log costs, structuring long prompts, preventing context drift, choosing between RAG and in-context approaches, or compressing documentation for LLM consumption.
metadata:
  author: Claude Agent, SaaS Skills
  version: 1.1
  last_validated: 2026-04-12
  sources:
    - references/compression-strategies.md
    - references/rag-decision-guide.md
    - Liu et al. 2024 (Lost in the Middle)
---

# When to Use This Skill

Activate this skill whenever:

- Optimizing context for AI agents running on large codebases or documents.
- Managing token limits in LLM calls (cost or latency constraints).
- Structuring long prompts (>5K tokens) for better reasoning quality.
- Experiencing context drift (initial instructions forgotten mid-conversation).
- Choosing between RAG (Retrieval-Augmented Generation) and in-context learning.
- Compressing documentation for LLM consumption without losing critical information.
- Debugging why an LLM is "hallucinating" or forgetting constraints.
- Planning memory/caching strategies for multi-turn conversations.
- Building agents that query large knowledge bases.
- Reducing context consumed by verbose tool output, repeated builds, test logs,
  or validation commands in long-running coding tasks.

This skill is MANDATORY and must be followed without exception when its trigger fires.

## Core Workflow

### Step 1: Understand Context Window Mechanics

#### Token Counting

- 1 English word ≈ 1.3 tokens (varies by language).
- 1 line of code ≈ 2-4 tokens (operators, punctuation).
- JSON/YAML overhead ≈ 1-2 tokens per field.

#### Token counting tool

```text
Use the official tokenizer or SDK for the provider/model in package.json or runtime configuration.
Record: provider, model ID, SDK version, measured input tokens, and output reserve.
```

#### Context Window Limits by Model

Exact model limits change. Verify current limits in official provider documentation before hard-coding budgets, model IDs, or output caps. Record the date and model version used for any production budget.

**Key Insight:** Longer context ≠ better accuracy. Beyond ~50K tokens, accuracy often degrades due to:

- Attention dilution (model spreads attention across more content).
- Positional bias (critical info in middle gets ignored).
- Increased hallucination (model confuses similar details).

**Rule:** Use only context needed. Remove irrelevant data aggressively.

---

### Step 2: Mitigate Positional Bias (Lost in the Middle)

#### The Problem: U-Shaped Attention Curve (Liu et al. 2024)

LLMs attend most to:

1. **Beginning of context** (system prompt, critical instructions) — HIGH
2. **End of context** (recent messages, user query) — HIGH
3. **Middle of context** (supporting details, examples) — LOW

#### Strategic Ordering

1. **TIER 1** — System prompt + role definition.
2. **TIER 2** — Critical context needed for task.
3. **TIER 3** — Supporting details, examples, documentation.
4. **TIER 4** — Large reference material, file contents.
5. **TIER 5** — User query (LAST for highest attention!).

Both beginning and end get maximum attention. Middle is low attention.

```text
[SYSTEM_PROMPT] (Tier 1 — highest)
↓
[CRITICAL_CONTEXT] (Tier 2)
↓
[EXAMPLES] (Tier 3)
↓
[SUPPORTING_DOCS] (Tier 4)
↓
[USER_QUERY] (Tier 5 — also high attention!)
```

---

### Step 3: Prevent Context Drift

#### What is Context Drift?

Over a long conversation, initial constraints are forgotten. Example:

```text
Turn 1: User: "Generate Python code. Style: Minimal, 2 spaces indent, no comments."
Turn 10: AI: [Generates verbose code with 4-space indent and comments]
→ Drifted from original constraint!
```

#### Mitigation: Periodic Re-injection

Every 5-10 turns, re-inject core constraints:

```text
REMINDER: Continue following these rules:
- Output in Python
- Minimal style (2 spaces, no comments)
- No external dependencies
- Always use type hints

[Continue with next task...]
```

#### Mitigation: Anchor with Structured Markers

Use XML tags or clear delimiters to mark immutable rules:

```text
<IMMUTABLE_RULES>
  <rule>Language: Python 3.9+</rule>
  <rule>Style: Minimal (2 spaces, no comments)</rule>
  <rule>Format: Return JSON, not prose</rule>
</IMMUTABLE_RULES>

[Conversation continues...]
```

The structured format and visual prominence help the model remember.

---

### Step 4: Implement Token Budgeting

#### Example: 100K Token Budget Allocation

```text
System Prompt           5K    (5%)    — Role, instructions, critical rules
Project Context        15K   (15%)   — Architecture, key decisions
Relevant Files         35K   (35%)   — Code snippets, config files
Conversation History   25K   (25%)   — Past turns (summarized)
Tool Output            10K   (10%)   — Searches, tests, builds, diagnostics
User Query              5K    (5%)    — Current request
Response Buffer         5K    (5%)    — Reserve for output
────────────────────────────────
TOTAL                 100K  (100%)
```

#### Allocation Strategy

1. **System Prompt (3-10%)** — Never cut here. Be precise: "You are a security code reviewer for Python. Find OWASP Top 10 vulnerabilities."
2. **Project Context (10-20%)** — Architecture, key constraints, tech stack. Cut ruthlessly: Remove history, exploratory notes.
3. **Relevant Files (30-50%)** — Code snippets, configs. Use progressive disclosure (load on demand).
4. **Conversation History (20-40%)** — Keep recent turns verbatim. Summarize old turns.
5. **User Query (3-10%)** — Keep clear and complete. Don't skimp.
6. **Response Buffer (5-10%)** — Reserve for output. Prevents "context full" cutoffs.
7. **Tool Output (5-15%)** — Budget searches, diagnostics and validation logs;
   retain summaries and actionable failures instead of unbounded success logs.

#### Token Auditing Tool

```text
For each component (system, project context, files, history, query), call the official token counter for the active model and log the count before deployment.
```

---

### Step 4.1: Budget Agentic Tool Output

For coding agents, terminal and tool results are part of the context window.
Treat command scheduling as a context decision:

1. Finish the current edit batch before running a repository-wide quality gate,
   unless that gate is needed to decide the next edit.
2. During iteration, prefer narrow searches, type checks or focused tests whose
   result can change the next action.
3. At closeout, run the comprehensive gate once. On failure, isolate and rerun
   only the failed stage until the fix is stable.
4. Cap output, suppress repetitive success lines and preserve exit status, test
   counts and the first actionable error.
5. Reuse still-valid evidence: a documentation-only fix does not justify
   rerunning an unchanged browser suite. Reverify only surfaces affected by the
   latest change.
6. Explicit user constraints about commands, time, paid providers or token cost
   override the default validation plan immediately. Stop an active command when
   asked; do not reinterpret the restriction as permission for another “final”
   run.

---

### Step 5: Apply Compression Strategies

For detailed compression strategies, see `references/compression-strategies.md`.

Quick summary:

1. **Summarize Older Turns** — Keep last 10 verbatim, summarize turns 1-10 into bullet points.
2. **Extract Key Facts** — Replace discussion with concise decisions.
3. **Hierarchical Documentation** — Level 1 always, levels 2-3 on demand.
4. **Skills as Compressed Knowledge** — Use SKILL: notation instead of raw content.

**Example token savings:** 93K → 32K (66% reduction) without quality loss.

---

### Step 6: Progressive Disclosure for Documentation

Provide necessary context, load deep details on demand.

#### Architecture

```text
LAYER 1 (Always loaded):
  Project Overview (200 tokens)
  File Tree (300 tokens)

LAYER 2 (Load by relevance):
  Module Summaries (2K each, loaded on request)

LAYER 3 (Deep dive):
  Full Source Code (5K per file, loaded only if needed)
```

#### Prompt Pattern

```text
<DOCUMENTS>
  <layer level="1">
    <item>Project Overview (embedded)</item>
  </layer>
  <layer level="2">
    <item name="auth-module">Summary (200 tokens).
           Full docs: [RETRIEVE_AUTH_MODULE_DOCS]</item>
  </layer>
</DOCUMENTS>
```

---

### Step 7: RAG vs. In-Context Decision

For detailed decision guide, see `references/rag-decision-guide.md`.

#### Quick Decision

```text
< 10 docs, stable?          → Use IN-CONTEXT
10-50 docs, >50K budget?    → Use IN-CONTEXT
> 50 docs, frequently updated? → Use RAG
Otherwise?                  → Use HYBRID (RAG + embed top-5)
```

#### Hybrid Pattern (Recommended)

```python
# 1. Index documents with embeddings
db = Chroma.from_documents(all_docs, embeddings)

# 2. Retrieve top-5 relevant
docs = db.similarity_search("How to authenticate?", k=5)

# 3. Embed in context
prompt = f"Answer using: {[d.content for d in docs]}\nQ: {query}"
response = llm.call(prompt)
```

---

## Step 8: Optimization Workflow

### Audit Phase (15 min)

1. Measure current token usage per component.
2. Identify waste (history too large? files redundant?).
3. Check positional strategy (system at start? query at end?).

#### Optimization Phase (30 min)

1. Cut system prompt fat (be precise).
2. Compress history (summarize old turns).
3. Progressive disclosure on files (load on demand).
4. Validate positional order.
5. Re-audit and verify savings.

#### Deploy Phase

- Test on 5-10 representative queries.
- Measure: Does accuracy stay the same? (Token savings with no quality loss = win.)

---

## Advanced Cases

### Case 1: Agent with Long-Running State

Initial instructions must not drift over many turns.

#### Solution: Immutable Instruction Block

```text
<IMMUTABLE_INSTRUCTIONS>
  Goal: Analyze security of Python code.
  Output: JSON with {line_no, vulnerability, fix}.
  Do NOT deviate from JSON format.
</IMMUTABLE_INSTRUCTIONS>

[Conversation history]
User message: [Latest input]
```

Re-inject immutable block every turn to anchor the agent.

### Case 2: Multi-Document Context with Conflicts

Multiple docs say different things (e.g., outdated vs. updated spec).

#### Solution: Explicit Priority

```text
CONTEXT_SOURCES (Ordered by Priority):
1. CURRENT_SPEC.md (2026-04-12) ← USE THIS
2. OLD_DESIGN.md (2025-06-01) [DEPRECATED]
3. DISCUSSION.md (Exploratory, not binding)

If conflicting, prioritize CURRENT_SPEC.
```

### Case 3: Prompt Caching (Anthropic)

For repeated queries on the same large docs, cache context.

```python
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    system=[{"type": "text", "text": "[DOCS]", "cache_control": {"type": "ephemeral"}}],
    messages=[{"role": "user", "content": "Review code..."}]
)
```

Savings: 90% on cached content tokens.

---

## Fallback Clause

If any of the following is missing, output the marker and halt:

- **Context structure undefined:** Output `[INFORMATION_NEEDED: context_ordering_strategy_tier1_to_5]`.
- **Token budget not set:** Output `[INFORMATION_NEEDED: maximum_token_budget_and_allocation_plan]`.
- **No drift prevention:** Output `[INFORMATION_NEEDED: mechanism_to_prevent_context_drift]`.
- **Compression strategy missing:** Output `[INFORMATION_NEEDED: how_to_compress_large_contexts]`.
- **RAG vs. in-context decision not made:** Output `[INFORMATION_NEEDED: knowledge_base_size_and_frequency_of_updates]`.

Never deploy large-context AI agents without addressing all 5 above.

## Anti-Patterns

### Anti-Pattern 1: Dump Everything in Context

"It's only 100K tokens, Claude supports 200K." Longer ≠ better. Accuracy degrades after ~50K. Cut ruthlessly.

#### Anti-Pattern 2: Middle-Heavy Context

Large file in the middle. Lost in the Middle problem. Move to end or summarize to 500 tokens.

#### Anti-Pattern 3: No Re-injection of Constraints

Long conversation, initial instruction forgotten by turn 10. Re-inject every 5 turns.

#### Anti-Pattern 4: Streaming Without Budget Reserve

Use 95% of context for input. LLM hits "context full" mid-response. Always reserve 5-10%.

#### Anti-Pattern 5: RAG Without Relevance Checking

Retrieved docs irrelevant to query. Wastes tokens, confuses LLM. Verify relevance before embedding.

#### Anti-Pattern 6: No Versioning of Context

System prompt changes daily. LLM behavior unpredictable. Version everything. Track changes.

#### Anti-Pattern 7: Full-Gate Thrashing

Running lint, all tests and all builds after every small edit repeatedly injects
mostly duplicate logs into context. Use targeted feedback while editing and one
comprehensive closeout after the change is stable.

---

## Enforcement

This skill is MANDATORY and must be followed without exception when its trigger fires.

For all context windows > 10K tokens:

1. [ ] Context ordered by tier (system → critical → supporting → files → query).
2. [ ] Positional bias mitigated (critical info at start/end, not middle).
3. [ ] Token budget allocated explicitly.
4. [ ] Drift prevention mechanism in place (re-injection or anchors).
5. [ ] Compression strategy applied.
6. [ ] Fallback clause implemented.
7. [ ] Tool-output budget and validation cadence defined.

Code review:

- [ ] Measure tokens in each component.
- [ ] Verify tier ordering.
- [ ] Check immutable blocks (if multi-turn).
- [ ] Test on 5 queries to ensure no accuracy loss.

Non-compliance risks:

- Accuracy drops (Lost in the Middle, context drift).
- Hallucination increases (too much context, confusion).
- Costs spiral (poor token optimization).
- Silent failures (context overflow, mid-response cutoff).

---

## Source References

- **Liu et al. 2024** — "Lost in the Middle: How Language Models Use Long Contexts." Positional bias research.
- **Anthropic Docs** — Token counting, prompt caching, streaming API.
- **LangChain Docs** — RAG patterns, vector stores, retrieval strategies.
- **references/compression-strategies.md** — Detailed compression techniques (summarize, extract, hierarchical, skills).
- **references/rag-decision-guide.md** — RAG vs. in-context decision matrix, quality checks, hybrid recommendation.
