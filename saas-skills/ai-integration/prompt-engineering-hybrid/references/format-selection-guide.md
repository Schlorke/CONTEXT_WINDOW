# Format Selection Decision Guide

## Overview

This reference matrix helps you choose the optimal output format (plain text, JSON, YAML, XML) for LLM prompts based on task type, constraints, and trade-offs.

## Quick Decision Tree

```text
START: What is your task?
├─ Classification, extraction, field validation?
│  └─> USE JSON or XML (high parseability)
├─ Complex reasoning, open-ended analysis?
│  └─> USE Plain Text First, then format results
├─ Configuration generation, multi-step workflows?
│  └─> USE YAML (hierarchical, readable)
├─ Data transformation (CSV→API payload)?
│  └─> USE JSON in, JSON out
├─ Annotations with inline explanations?
│  └─> USE XML with mixed content
└─ Highly constrained (ultra-low token budget)?
   └─> USE Plain text or compact XML
```

## Format Comparison Matrix

| **Aspect**               | **Plain Text** | **JSON**              | **YAML**       | **XML**           |
| ------------------------ | -------------- | --------------------- | -------------- | ----------------- |
| **Parseability**         | Low            | Very High             | High           | High              |
| **Token Overhead**       | Baseline       | +1-2 per field        | +0-1 per field | +2-4 per tag pair |
| **Human Readability**    | Excellent      | Good                  | Excellent      | Moderate          |
| **Reasoning Freedom**    | Excellent      | Constrained           | Constrained    | Constrained       |
| **Whitespace Sensitive** | No             | No                    | Yes\*          | No                |
| **Nesting Support**      | Limited        | Excellent             | Excellent      | Excellent         |
| **Sparse Data**          | Efficient      | Verbose               | Efficient      | Very Verbose      |
| **Mixed Content**        | N/A            | Strings only          | Strings only   | Native support    |
| **Schema Enforcement**   | None           | JSON Schema available | Weak           | DTD/XSD available |
| **Learning Curve**       | None           | Very Low              | Low            | Moderate          |

\*YAML: Indentation must be spaces, not tabs. Fragile to whitespace errors.

## Detailed Task-to-Format Mapping

### 1. Data Extraction & Classification

**Examples:** Extract entities from text, classify documents, parse fields.

**Recommended Format:** JSON

#### Rationale

- Clearly defined fields. No ambiguity about structure.
- Parsers are ubiquitous. Minimal downstream integration risk.
- JSON Schema can validate completeness.
- Token overhead is small relative to output size.

#### Example

```json
{
  "entities": [
    {
      "text": "John Doe",
      "type": "PERSON",
      "confidence": 0.95
    }
  ],
  "document_sentiment": "NEUTRAL"
}
```

**Token Cost:** ~15 tokens per entity (field names + braces + punctuation).

---

### 2. Complex Reasoning & Analysis

**Examples:** Debate pros/cons, strategic recommendations, design trade-off analysis.

**Recommended Format:** Plain text first, then optionally format results.

#### Rationale: (2)

- Reasoning quality drops if the model fights JSON syntax while thinking.
- Let it reason freely (narrative, contradiction, exploration), then structure for downstream use.
- Two-pass approach: Generate reasoning (plain text) → Format conclusions (JSON).

#### Workflow

#### Pass 1 (Reasoning)

```text
Analyze this architectural decision. What are the trade-offs?
(No format requirement — let it think.)
```

#### Pass 2 (Structured Output)

```text
Based on your analysis, format as JSON:
{
  "recommendation": "...",
  "pros": ["..."],
  "cons": ["..."],
  "confidence": 0.0-1.0
}
```

**Token Cost:** First pass is variable (reasoning length). Second pass adds ~20 tokens for structure.

#### When to Skip Formatting

If the analysis IS the output (e.g., internal research), stop after Pass 1. Don't format just for the sake of it.

---

### 3. Configuration Generation & Multi-Step Workflows

**Examples:** Generate Terraform/Helm configs, CI/CD pipelines, API request sequences.

**Recommended Format:** YAML

#### Rationale: (3)

- YAML mirrors human-readable config syntax. Feels natural.
- Hierarchy is explicit (indentation). Less verbose than JSON.
- Widely used in DevOps tooling.

#### Example: (2)

```yaml
services:
  - name: auth-service
    replicas: 3
    image: myregistry/auth:v1.2.0
    healthcheck:
      path: /health
      interval: 10s
  - name: api-gateway
    replicas: 5
    dependencies: [auth-service]
```

**Caution:** Indentation must be spaces (2 or 4). Tabs break parsing. This is a common LLM failure mode. Add explicit constraint: "Use exactly 2 spaces for indentation. No tabs."

**Token Cost:** Slightly lower than JSON for equivalent data (fewer braces/quotes). ~12 tokens per config block.

---

### 4. Data Transformation (Structured In → Structured Out)

**Examples:** Convert CSV to API payload, transform REST request to GraphQL.

**Recommended Format:** JSON ↔ JSON

#### Rationale: (4)

- Input and output schemas aligned. No conversion step.
- Easy to chain multiple LLM calls (output of one feeds input of next).
- JSON Schema validates both input and output.

#### Example: (3)

```text
Input:
{
  "csv_data": [
    {"name": "Alice", "age": 30, "department": "Engineering"}
  ]
}

Output:
{
  "users": [
    {
      "full_name": "Alice",
      "age": 30,
      "department_code": "ENG",
      "status": "active"
    }
  ]
}
```

**Token Cost:** Moderate. Schema overhead on both sides, but direct mapping reduces hallucination.

---

### 5. Annotations & Explanations (Code Review, Document Markup)

**Examples:** Annotate code with review comments, mark up a legal contract with explanations.

**Recommended Format:** XML with mixed content

#### Rationale: (5)

- Can embed explanations alongside original content.
- Hierarchical structure mirrors document structure.
- Tags are semantic (don't need separate metadata object).

#### Example: (4)

```xml
<contract>
  <clause id="c1">
    <text>The Vendor shall maintain 99.9% uptime SLA.</text>
    <annotation type="risk">
      <comment>Penalty clause missing. Add: "If SLA breached, customer can terminate with 30 days notice."</comment>
      <severity>HIGH</severity>
    </annotation>
  </clause>
</contract>
```

**Token Cost:** Higher overhead (~2-4 tokens per tag pair). Use only when mixed content is essential.

**Alternative:** If annotations are secondary, use JSON with nested comments:

```json
{
  "clause": "The Vendor shall maintain 99.9% uptime SLA.",
  "annotations": [{ "type": "risk", "comment": "Penalty clause missing." }]
}
```

---

### 6. Highly Constrained Environments (Minimal Tokens)

**Examples:** Mobile inference, edge compute, billing by token.

**Recommended Format:** Compact plain text or minimal JSON

#### Rationale: (6)

- Every token costs money. Overhead must be justified.
- Plain text: No tag/bracket overhead. But harder to parse.
- Minimal JSON: Use short field names, drop unnecessary nesting.

#### Example — Verbose JSON (70 tokens)

```json
{
  "classification_result": {
    "document_type": "INVOICE",
    "confidence_score": 0.98,
    "processing_status": "SUCCESS"
  }
}
```

#### Example — Compact JSON (40 tokens)

```json
{ "type": "INVOICE", "conf": 0.98, "status": "OK" }
```

#### Example — Plain Text (25 tokens)

```text
TYPE:INVOICE|CONF:0.98|STATUS:OK
```

**Trade-off:** Compact formats are harder to parse. Only use if downstream is machine-only (no human reading).

---

## Context Window Impact

### How Format Choice Affects Context

#### Large outputs (1K+ results)

- JSON overhead multiplies. 1000 entities in JSON = +1000-2000 tokens of braces/quotes.
- Plain text is more efficient BUT harder to validate.
- Strategy: Use JSON schema on server side, send plain text from LLM, validate on parse.

#### Streaming responses

- JSON and YAML are hard to stream incrementally (incomplete JSON until final bracket).
- Plain text streams naturally (sentence by sentence).
- XML can stream (each tag closes cleanly).
- Strategy: For streaming, use newline-delimited JSON (one object per line) or plain text.

#### Few-shot examples

- Larger format = fewer examples fit in context.
- Plain text: Can fit 10 examples in 2K tokens.
- JSON: Can fit 5-6 examples in 2K tokens.
- If low on context, use plain text examples then add structure instruction.

---

## Hybrid Format Strategies

### Strategy 1: Two-Pass (Reasoning + Formatting)

#### When to use

- Complex analysis where reasoning quality matters.
- Output will be used both by humans (read reasoning) and machines (parse structure).

#### Process

```text
Pass 1: "Analyze X. Explain your reasoning in plain language."
Output: Plain prose

Pass 2: "Now structure your conclusions as JSON: {decision, rationale, confidence}."
Output: Structured

Cost: 2× inference. Benefit: Higher quality reasoning + machine-readable output.
```

---

### Strategy 2: Primary + Metadata

#### When to use: (2)

- Reasoning is primary output. Structure is metadata.

#### Process: (2)

```text
Output plain text analysis, but wrap in minimal JSON:
{
  "analysis": "...full prose reasoning...",
  "metadata": {
    "confidence": 0.85,
    "sources": ["doc1", "doc2"]
  }
}
```

**Token Cost:** Minimal overhead. Reasoning kept in plain text (efficient). Metadata structured.

---

### Strategy 3: Hierarchical (Summary + Details)

#### When to use: (3)

- Large outputs need progressive disclosure.

#### Process: (3)

```json
{
  "summary": "Brief 1-sentence conclusion",
  "details": {
    "expanded": "Paragraph-length explanation",
    "structured_results": [...]
  },
  "raw_data": "Full text output if needed"
}
```

**Benefit:** Client can render summary without parsing details. Lazy-load on demand.

---

## Common LLM Errors by Format

### JSON

- **Missing closing braces:** Incomplete output.
  - Mitigation: Require output to end with `}` or request final null field.
- **Duplicate keys:** Only last one is valid.
  - Mitigation: Use JSON Schema validator.
- **Unescaped quotes in strings:** Breaking quotes.
  - Mitigation: Constraint: "Escape all quotes with backslash: `\"`, not `"`."

### YAML

- **Tabs instead of spaces:** Parsing fails silently.
  - Mitigation: Explicit constraint: "Use exactly 2 spaces per indent level. No tabs."
- **Inconsistent indentation:** Silently loses data.
  - Mitigation: Validate with strict YAML parser.

### XML

- **Unmatched tags:** Parsing fails.
  - Mitigation: Use self-closing tags where possible: `<field/>`.
- **Reserved characters in content:** `<`, `>`, `&` break if not escaped.
  - Mitigation: Constraint: "Use `&lt;`, `&gt;`, `&amp;` for special chars."

### All Formats

- **Hallucinated field names:** LLM adds fields not in schema.
  - Mitigation: JSON Schema validation. Reject unknown fields.
- **Format requested but ignored:** LLM outputs prose instead.
  - Mitigation: Few-shot examples with exact format. Explicit: "Your response MUST be valid JSON."

---

## Decision Checklist

Before choosing a format, answer:

- [ ] **Is the output primarily for machines or humans?**
  - Machines → JSON/YAML. Humans → Plain text.

- [ ] **Does reasoning quality matter, or is output accuracy paramount?**
  - Reasoning → Plain text first. Accuracy → Structured format.

- [ ] **Is the output sparse (few fields) or dense (many results)?**
  - Sparse → YAML/JSON-LD. Dense → Plain text or newline-delimited JSON.

- [ ] **Will this output be streamed to users in real time?**
  - Yes → Plain text or line-delimited JSON. No → Any format.

- [ ] **Do I have a parser/validator ready for this format?**
  - No → Use plain text. Yes → Any format.

- [ ] **How many tokens can I spare for overhead?**
  - <100 tokens budget → Plain text. Unlimited → Any.

- [ ] **Does the task require inline annotations/explanations?**
  - Yes → XML. No → JSON/YAML.

---

## Examples by Task Type

### Example 1: API Documentation Generation

**Task:** Generate OpenAPI spec.

**Format:** JSON (OpenAPI uses JSON/YAML natively)

**Constraint:** "Output must be valid JSON matching OpenAPI 3.1 schema."

### Example 2: Risk Assessment

**Task:** Assess software security risks.

**Format:** Plain text first (reasoning), then JSON (structured results)

**Pass 1:** "Analyze this code for security risks. Explain your reasoning."

**Pass 2:** "Structure as JSON: {risk_id, title, severity, mitigation}"

### Example 3: Content Moderation

**Task:** Flag inappropriate posts and explain.

**Format:** JSON with explanation inline

```json
{
  "post_id": 12345,
  "is_flagged": true,
  "violation_type": "HATE_SPEECH",
  "explanation": "Post uses racial slurs. Confidence: 0.98.",
  "recommended_action": "REMOVE"
}
```

### Example 4: Configuration Migration

**Task:** Convert Kubernetes YAML to Terraform.

**Format:** HCL (not JSON/YAML/XML) — but use plain text with high-quality prompt.

**Constraint:** "Output valid Terraform HCL syntax. Include comments."

### Example 5: Meeting Summarization

**Task:** Summarize meeting transcript.

**Format:** Plain text (primary), JSON (metadata only)

```json
{
  "summary": "Meeting discussed Q2 roadmap priorities...",
  "duration_minutes": 45,
  "attendees": ["Alice", "Bob"],
  "action_items": "See summary above"
}
```

---

## Token Budgeting per Format

Assume average LLM output: 200 tokens of content.

| **Format**        | **Overhead** | **Total Tokens** | **Use If**                   |
| ----------------- | ------------ | ---------------- | ---------------------------- |
| Plain Text        | 0%           | 200              | Reasoning-heavy, streaming   |
| JSON (10 fields)  | 15%          | 230              | Machine parsing required     |
| YAML (10 fields)  | 10%          | 220              | DevOps config, readability   |
| XML (10 elements) | 20%          | 240              | Annotations, complex nesting |

**Key:** Overhead is small (10-20%). Pick based on task fit, not token savings.

---

## Testing Your Format Choice

Before deploying, run this test:

1. **Write 5 diverse examples** of the task.
2. **Use your prompt + format** on all 5.
3. **Check:**
   - All outputs parse without error? (Yes → Format is safe)
   - Any hallucinated fields? (If yes, add JSON Schema validation)
   - Any fields missing? (If yes, add explicit required-field constraint)
   - Reasoning quality OK? (If low, switch to plain text first pass)

Pass 5/5? Deploy. Fail? Iterate format choice.

---

## Summary

- **Default choice:** JSON for structured output, plain text for reasoning.
- **Second choice:** YAML for configs, XML for annotations.
- **Token constrained:** Plain text with careful parsing.
- **Quality critical:** Two-pass (plain text reasoning + JSON results).
- **Always test** on 5 diverse cases before deploying.
