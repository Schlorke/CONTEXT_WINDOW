# RAG vs. In-Context: Decision Guide

## Decision Matrix

### When to Use RAG (Retrieval-Augmented Generation)

Use RAG when:

```text
Knowledge Base Size     > 50 documents
Knowledge Stability     Frequently updated
Context Budget         < 20K tokens
Use Case              Q&A, search, knowledge lookup
Example               "Answer user questions about our API docs" (100+ docs)
```

#### Advantages

- Scales to large knowledge bases (100+ docs).
- Fast: Retrieve top-5 relevant instead of embedding all.
- Updates: New docs automatically indexed, no prompt rewrites needed.
- Cost-effective: Only relevant context in token budget.

#### Disadvantages

- Retrieval can fail (irrelevant results if embedding model weak).
- Two-step process: Retrieve → Reason (adds latency).
- Requires vector DB setup (Chroma, Weaviate, etc.).

---

### When to Use In-Context

Use in-context when:

```text
Knowledge Base Size     < 10 documents
Knowledge Stability     Stable (rarely changes)
Context Budget         > 50K tokens
Use Case              Reasoning, analysis, code review
Example               "Review this PR against our architecture guidelines" (5 docs)
```

#### Advantages: (2)

- Simple: No retrieval complexity.
- Accurate: Full documents available for reasoning.
- Low latency: No retrieval call overhead.
- Predictable: Same docs always available.

#### Disadvantages: (2)

- Doesn't scale: >50 docs bloats context.
- Requires rewrites: Adding/removing docs means prompt changes.
- Context drift: Important docs in middle get ignored (Lost in the Middle).

---

### Hybrid Approach (Recommended for Most SaaS)

Combine best of both:

```text
1. RAG retrieves top-5 most relevant docs (semantic similarity).
2. Embed those in-context (now 5K tokens instead of 100K).
3. LLM reasons over retrieved docs, not entire knowledge base.

Benefits:
- Accuracy of RAG (find relevant info quickly).
- Reasoning quality of in-context (full text, not just summary).
- Token efficiency (retrieve relevant, not all).
```

#### Implementation Pattern

```python
# 1. Index documents with embeddings
db = Chroma.from_documents(all_docs, embeddings)

# 2. Retrieve relevant (5 most similar)
docs = db.similarity_search("How to authenticate?", k=5)

# 3. Embed in context and query
prompt = f"Answer using: {[d.content for d in docs]}\nQ: {query}"
response = llm.call(prompt)
```

---

## Decision Tree

```text
START: How much knowledge do you have?
├─ < 10 documents
│  └─ Is knowledge stable?
│     ├─ Yes → USE IN-CONTEXT
│     └─ No → Use RAG (for flexibility)
├─ 10-50 documents
│  └─ Is token budget >50K?
│     ├─ Yes → USE IN-CONTEXT (all docs + reasoning)
│     └─ No → USE HYBRID (RAG + embed top-5)
└─ > 50 documents
   └─ USE RAG (only retrieve relevant)
```

---

## Quality Checks for RAG

Before deploying RAG, verify:

1. **Relevance:** Does retrieval return relevant docs for test queries?
   - Test: Query "How to authenticate?" Should return auth-related docs.
   - If not: Improve embedding model, chunking strategy, or query preprocessing.

2. **Coverage:** Can retrieval find docs for all expected questions?
   - Test: Run 20 typical questions. Should hit >80% expected docs.
   - If not: Index more docs or improve metadata tags.

3. **Latency:** Is retrieval fast (<500ms)?
   - If not: Optimize vector DB indices, reduce doc size, or cache frequent queries.

4. **Accuracy:** Does LLM reasoning over retrieved docs beat raw hallucination?
   - Test: Compare "RAG answer" vs. "no-doc answer". RAG should be more accurate.
   - If not: Retrieved docs may be poor quality or irrelevant.

---

## Hybrid Recommendation for SaaS

### Typical SaaS scenario

- 20-100 docs (API docs, architecture guides, pricing, etc.).
- Docs updated monthly (somewhat stable).
- Context budget: 100K tokens available.

**Recommended approach:** Hybrid

1. RAG retrieves top-5 most relevant docs (~5K tokens).
2. Add system prompt and examples (~2K tokens).
3. User query and conversation history (~8K tokens).
4. Total used: ~15K. Reserve: ~85K for response and future content.

#### Implementation

```python
# System prompt with RAG instruction
system = """You are a helpful assistant. Use the retrieved documents below to answer accurately.
If info is not in docs, say "I don't have that information in my knowledge base." Do not hallucinate.

RETRIEVED_DOCS:
{retrieved_docs}

"""

# Query with RAG
docs = retriever.get_relevant_docs(user_query, k=5)
prompt = system + f"DOCS_EMBEDDED\n\n" + "\n".join([d.content for d in docs]) + f"\n\nUser: {user_query}"
response = llm.call(prompt)
```

This gives you the safety of RAG with the reasoning power of in-context.
