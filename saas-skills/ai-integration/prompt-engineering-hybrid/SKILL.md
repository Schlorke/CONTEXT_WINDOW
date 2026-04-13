---
name: prompt-engineering-hybrid
description: Master hybrid prompt engineering combining natural language narrative with structured schemas (JSON/YAML/XML) for LLMs. Craft effective prompts reducing hallucination via 10-component framework, format selection decision trees, chain-of-thought patterns, few-shot examples, and iterative refinement. Trigger when engineering prompts, choosing between text/XML/JSON formats, reducing AI hallucinations, creating structured output schemas, building reusable prompt templates, or optimizing token efficiency.
metadata:
  author: Claude Agent, SaaS Skills
  version: 1.0
  last_validated: 2026-04-12
  sources:
    - Anthropic Prompt Engineering Docs
    - references/format-selection-guide.md
    - JSON Schema and structured output patterns
---

# When to Use This Skill

Activate this skill whenever:

- Writing prompts for LLM inference (zero-shot, few-shot, chain-of-thought)
- Designing prompt templates for reuse across similar tasks
- Choosing between natural language, JSON, YAML, or XML output formats
- Experiencing hallucination or inconsistent LLM outputs
- Optimizing token efficiency in prompts
- Structuring multi-step reasoning tasks
- Building internal prompt libraries for your SaaS

This skill is MANDATORY and must be followed without exception when its trigger fires.

## Core Workflow

### Step 1: Structure with 10 Essential Components

Every professional prompt contains (in this order):

1. **Role/Persona** — Define what the LLM is playing (e.g., "You are a senior architect"). Anchors behavior and tone.
2. **Context/Background** — Why this task matters. Example: "We're designing a real-time payment system for fintech SaaS."
3. **Task Definition** — What the LLM must do. Be specific: "Extract validation rules" not "analyze this."
4. **Input Specification** — What data the LLM receives. Format + structure. Example: "YAML configuration file with 5-10 service definitions."
5. **Output Format** — Exact shape of response. Use schema notation (JSON, YAML structure, XML tags). Do not leave this ambiguous.
6. **Constraints** — Hard limits. Example: "Max 200 tokens. Must cite sources. Include confidence scores."
7. **Examples** — Few-shot samples (2-5 ideally). Show input and exact expected output.
8. **Chain-of-Thought Instruction** — Ask for step-by-step reasoning. Example: "Break this into 3 phases: analysis, design, validation."
9. **Fallback/Edge Case Handling** — Explicit instruction for unknowns. Example: "If data is missing, output `[DATA_UNAVAILABLE]` instead of guessing."
10. **Quality Criteria** — How to measure success. Example: "Rules must be testable. No vague requirements."

#### Example skeleton

```text
You are a strict data validator for healthcare SaaS.
Context: We ingest patient records from multiple EHR systems.
Task: Validate each field against schema and report errors.
Input: JSON object with fields {name, dob, ssn, address, provider_id}.
Output: JSON {field_name, is_valid: bool, error_message: string}.
Constraints: Halt on first critical error. No invented data.
Examples:
  Input: {name: "", dob: "1990-01-01"}
  Output: [{field_name: "name", is_valid: false, error: "Required"}]
Reasoning: First check type match, then domain rules, then cross-field consistency.
If data is missing or ambiguous, output {is_valid: false, error: "[DATA_NEEDED]"}.
Success = 100% of errors caught, zero false positives.
```

### Step 2: Choose Hybrid Approach — Narrative + Structure

**Core principle:** Free reasoning first, then format output.

**Pass 1 (Natural Language):** Ask the LLM to think freely without format constraints. This reduces hallucination because the model isn't fighting structure while reasoning.

Example:

```text
Think step by step: What are the security risks in this authentication flow?
(No output format required here — let it reason freely)
```

**Pass 2 (Structured Output):** Then ask to format the result into your schema.

Example:

```text
Now structure your analysis as JSON:
{
  "risks": [
    {"id": "R1", "name": string, "severity": "high"|"medium"|"low", "mitigation": string}
  ]
}
```

**Why this works:** The LLM doesn't sacrifice reasoning quality to fit JSON syntax. Hallucinations drop because free reasoning clarifies intent before formatting forces choices.

### Step 3: Select Format Using Decision Tree

Choose output format based on task:

#### Classification/Extraction tasks → JSON or XML

- Pro: Highly parseable. Enforces field presence.
- Con: Adds 1-2 tokens per field.
- Use: Data extraction, field validation, categorization.

#### Complex Reasoning → Plain Text First, Then Format

- Pro: Frees reasoning from structure. Model can explore contradictions.
- Con: Requires two-pass inference (cost/latency).
- Use: Strategic decisions, open-ended analysis, debate/synthesis.

#### Multi-Step Workflows with Validation → YAML

- Pro: Readable hierarchy. Schema-aware parsers exist.
- Con: Whitespace sensitivity, slightly higher token cost than JSON.
- Use: Configuration generation, step sequences, conditional logic.

#### Data Transformation (CSV→API) → JSON in, JSON out

- Pro: Schema alignment. Easy to automate chaining.
- Con: Verbose for sparse data.
- Use: ETL, API payload generation, data mapping.

#### Mixed Structured + Prose → XML with Mixed Content

- Pro: Can embed explanatory text alongside structured data.
- Con: Verbosity. Tag overhead (~2-4 tokens per tag pair).
- Use: Reports with reasoning inline, annotated documents.

### Step 4: Implement Hallucination Mitigation

Use all three tactics:

#### Tactic 1: Explicit "Don't Know" Instruction

```text
If you don't know the answer, output exactly: [INFORMATION_NEEDED: <what you need>]
Do NOT guess, invent, or approximate.
```

#### Tactic 2: Reference Anchoring

```text
Every claim must cite its source as [source:filename.md line N] or [source:conversation turn X].
If no source exists, prepend [UNVERIFIED].
```

#### Tactic 3: Structured Output with Required Fields

JSON with required fields forces completeness. Missing fields fail parsing, catching gaps before they cause downstream errors.

Example:

```json
{
  "recommendation": "required",
  "confidence": "required (0.0-1.0)",
  "reasoning": "required",
  "source": "required (cite or [UNVERIFIED])"
}
```

### Step 5: Apply Technique Layers

Stack these to increase robustness:

- **Zero-shot:** Raw prompt, no examples. Fast. Works for obvious tasks.
- **Few-shot:** 2-5 examples of input→output. Dramatically improves consistency.
- **Chain-of-thought:** Ask for step-by-step. Improves reasoning accuracy for complex tasks.
- **Self-consistency:** Generate 3-5 responses, pick the consensus. Expensive but highest quality.
- **Reflection/Meta-prompting:** After generating, ask: "Critique your own answer. What could be wrong?"

**Rule of thumb:** Few-shot + Chain-of-thought solves 80% of accuracy issues. Add Self-consistency for high-stakes decisions.

### Step 6: Iterate Systematically

1. **Draft** with minimal prompt + examples → Test on 3-5 cases.
2. **Identify failure modes** — Where does it hallucinate? Miss constraints? Misformat output?
3. **Add specific fixes** — More examples of failure case. Stricter constraint. Clearer output schema.
4. **Re-test** the 3-5 cases + 5 new cases.
5. **Stabilize** once 95%+ accuracy on diverse test set.
6. **Version lock** — Save the final prompt. Track changes.

## Advanced Cases

### Case 1: Long Context with Progressive Disclosure

If your input is 10K+ tokens, structure in layers:

```text
LAYER 1 (Always Include):
[Summary of entire system in 500 tokens]

LAYER 2 (If asked):
[Details of modules A, B, C]

LAYER 3 (Deep Dive):
[Full source code / implementation details]
```

This lets the LLM reason at appropriate granularity.

### Case 2: Multi-Turn Conversation with Memory

Inject previous decisions into system prompt:

```text
CONVERSATION HISTORY SUMMARY:
- Turn 1: Decided on JSON over XML (reason: easier parsing).
- Turn 2: Settled on "field_name" not "fieldName" for keys.
- Turn 3: Agreed confidence scores required.

Continue in this style for all future responses.
```

### Case 3: Format Negotiation (User Doesn't Know What They Want)

Start with this prompt:

```text
User's goal: [unclear goal]

I'll explain three format options. Pick which makes sense:

Option A (JSON): Pro = parseable, Con = verbose
Option B (YAML): Pro = human-readable, Con = whitespace-sensitive
Option C (CSV): Pro = lightweight, Con = flat structure only

Which do you want? Or would you prefer hybrid (split into multiple formats)?
```

Let the LLM explain trade-offs, then lock choice.

### Case 4: Schema Evolution (Output Format Keeps Growing)

Use versioning:

```json
{
  "version": "2.1",
  "data": {
    "fields_required_in_v2.0": "...",
    "fields_new_in_v2.1": "..."
  },
  "deprecations": ["old_field_name (use new_field instead)"]
}
```

### Case 5: Cost Optimization (Long Prompts, High Volume)

Cache expensive context:

```text
PROMPT STRUCTURE:
- System prompt: [CACHEABLE] 2K tokens of rules
- Project context: [CACHEABLE] 5K tokens of architecture
- User query: [NOT CACHED] 200 tokens (varies per request)
```

Use Anthropic prompt caching to cache the 7K static portion.

## Fallback Clause

If any of the following information is missing, output the requested marker and halt:

- **Output format undefined:** Output `[INFORMATION_NEEDED: exact_output_format (JSON/YAML/XML/text)]` and ask user.
- **Examples unavailable:** Output `[INFORMATION_NEEDED: at_least_two_input_output_examples]` and note that accuracy will be lower.
- **Task definition ambiguous:** Output `[INFORMATION_NEEDED: specific_task_definition_not_generic_goal]` with clarifying questions.
- **Constraints missing:** Output `[INFORMATION_NEEDED: explicit_constraints_token_limit_required_fields_etc]`.
- **Input specification vague:** Output `[INFORMATION_NEEDED: exact_input_format_schema_and_example]`.

Never invent missing components. Always request clarification.

## Anti-Patterns

### Anti-Pattern 1: "Just add more examples"

If hallucination persists with 10 examples, the problem is not examples. Likely causes: ambiguous task definition, conflicting constraints, or format fighting the reasoning. Add chain-of-thought or switch format instead.

#### Anti-Pattern 2: Cargo cult prompting

Copy another prompt verbatim without understanding its structure. This breaks when contexts differ. Instead: Understand the 10 components, adapt each to your task.

#### Anti-Pattern 3: Mixing multiple output formats in one prompt

"Output JSON for fields A-C, YAML for D-E, XML for F." This causes format confusion. Pick ONE format. If truly need hybrid, use top-level JSON with nested strings: `{"a": {...}, "b": "yaml-as-string", "c": "xml-as-string"}`.

#### Anti-Pattern 4: Chain-of-thought without constraints

"Think step by step" without limits leads to 5K-token reasoning when you need 200-token output. Add: "Reasoning must be max 3 sentences before output."

#### Anti-Pattern 5: Ignoring token budget

Lavish prompts with 10 examples + chain-of-thought + full codebase context = 50K tokens before response. At scale (1000s of requests), this explodes costs. Measure token usage early. Set budget from day 1.

## Enforcement

This skill is MANDATORY and must be followed without exception when its trigger fires.

When writing any production prompt:

1. All 10 components must be present (even if brief). If a component is truly not applicable, state "N/A: [reason]".
2. Fallback clause must be explicit in the prompt itself.
3. Output format must be defined with a schema or example, never as prose description.
4. Few-shot examples must include at least 2 real-world cases.
5. Iterate on prompts with a documented test set. Do not deploy on intuition.

Non-compliance leads to:

- High hallucination rate.
- Inconsistent formatting (parsing breaks downstream).
- Ballooning token costs (unchecked context growth).
- Silent failures (LLM appears to succeed but returns garbage).

Code review must verify all 10 components are present before merging prompt definitions.

**Reference Document:** See `references/format-selection-guide.md` when you need a deeper decision tree for JSON vs. XML vs. Markdown vs. plain-text outputs.

## Source References

- **Anthropic Prompt Engineering Best Practices** — System prompts, few-shot strategies, chain-of-thought patterns.
- **Reference file:** `references/format-selection-guide.md` — Format trade-offs, parser compatibility, and task-to-format decisions.
- **JSON Schema / structured output patterns** — Contracts for machine-readable responses and validation-friendly prompts.
- **Liu et al. (2024)** — Lost in the Middle; positional bias in context windows.
- **Anthropic Prompt Caching** — Technique for reducing cost of repeated expensive context.
