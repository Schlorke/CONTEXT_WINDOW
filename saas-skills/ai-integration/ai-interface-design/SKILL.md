---
name: ai-interface-design
description: Procedural guide for designing and implementing AI-powered conversational interfaces in SaaS products. Master 6 pillars (transparency, predictability, control, error recovery, perceived performance, context visibility), implement streaming with Vercel AI SDK, persistent memory, MCP tool integration, and compliance (WCAG, ISO 42001, EU AI Act). Trigger when building AI chat interfaces, implementing streaming, adding conversation memory, integrating external tools, designing AI UX patterns, or ensuring AI transparency.
metadata:
  author: Claude Agent, SaaS Skills
  version: 1.0
  last_validated: 2026-04-12
  sources:
    - references/implementation-roadmap.md
    - references/compliance-checklist.md
    - Amershi et al. (Guidelines for Human-AI Interaction)
    - Google PAIR
    - Nielsen/Norman NN Group
---

# When to Use This Skill

Activate this skill whenever:

- Designing or building an AI chat interface in a SaaS product.
- Implementing streaming token responses (Vercel AI SDK, native APIs).
- Adding persistent conversation history and memory.
- Integrating external tools or APIs via MCP (Model Context Protocol).
- Making architectural decisions about AI UX (client-side vs. server-side state, memory storage).
- Ensuring accessibility compliance for AI chat (WCAG 2.2 AA).
- Addressing user trust concerns about AI transparency.
- Planning a phased rollout of AI features.
- Handling errors or edge cases in AI interactions.

This skill is MANDATORY and must be followed without exception when its trigger fires.

## Core Workflow

### The 6 Pillars of Trustworthy AI Interface Design

Every production AI interface must implement all 6 pillars. Omitting any one creates user friction or distrust.

#### Pillar 1: Transparency

**Principle:** Users understand what the AI is doing, why, and what they're talking to.

#### Implementation

- **Explicit AI Label** — Always show "AI" badge or icon. Never disguise AI responses as human.
- **Show Thinking States** — Indicate what the AI is doing: "Analyzing...", "Retrieving context...", "Generating response...".
- **Citation and Source Attribution** — Every claim should cite source. Format: "According to [source:filename.md]" or "[source: conversation turn 5]".
- **Confidence Indicators** — For high-stakes outputs, include confidence: "Confidence: 85% based on 3 sources."
- **Capability Boundaries** — Explicitly state what the AI can/cannot do. Example: "I can analyze data. I cannot access external internet."

#### Code Pattern (React)

```jsx
function AIMessage({ content, thinking, sources, confidence }) {
  return (
    <div className="ai-message">
      <Badge>AI Assistant</Badge>
      {thinking && <div className="thinking-phase">{thinking}</div>}
      <div className="content">{content}</div>
      {sources && <SourceCitations sources={sources} />}
      {confidence && <ConfidenceBar value={confidence} />}
    </div>
  );
}
```

#### Pillar 2: Predictability

**Principle:** Users know what to expect. Consistent behavior builds trust.

#### Implementation: (2)

- **Consistent Formatting** — Same input shape always produces similar output structure.
- **Clear Capability Boundaries** — Scope is stable. Don't suddenly refuse or change behavior.
- **Reproducibility** — Same question asked twice should yield similar answers. Use temperature/randomness deliberately.
- **Deterministic System Prompt** — Lock your system prompt versioning. Changes = version bump + user notification + testing.

#### Pillar 3: User Control

**Principle:** Users can interrupt, edit, or redirect the AI at any time.

#### Implementation: (3)

- **Stop/Interrupt Button** — During streaming, show stop button. Halt generation immediately.
- **Edit Capability** — User can click message, edit it, re-submit. Conversation updates downstream.
- **Regenerate Button** — "Regenerate this response" with optional parameters (e.g., "Make it shorter").
- **Explicit Choices** — When AI offers options ("Option A", "Option B"), make each clickable.
- **Memory Control** — User can view, edit, or delete stored memories/context.

#### Pillar 4: Error Recovery

**Principle:** When things break, users have a clear path forward.

#### Implementation: (4)

- **Graceful Error Messages** — Never: "Error: HTTP 500". Instead: "I ran into a problem retrieving your data. Try again or email <support@example.com>."
- **Actionable Recovery** — After error, offer: (a) Retry, (b) Edit your message, (c) Check prerequisites, (d) Escalate to human.
- **Timeout Handling** — If LLM request hangs >30s, show "Taking longer than expected. You can wait or try a shorter request."
- **Fallback Responses** — For non-critical features, have fallback: Return basic analysis if advanced analysis unavailable.
- **Error Logging** — Log all errors server-side. Link error to user session. User sees error code "ERR_20260412_abc123" for support.

#### Pillar 5: Perceived Performance

**Principle:** Responses feel fast, even if they're not. Streaming is key.

#### Implementation: (5)

- **Token-by-Token Streaming** — Send tokens as they generate. Text appears in real-time (feels 30% faster).
- **Skeleton Loading** — Show animated placeholder of response shape during wait.
- **Typing Indicator** — During initial latency, show "AI is thinking..." or animated dots.
- **Progress Indicators** — For multi-step tasks: "Step 1/3: Retrieving... (0.5s)".
- **Local Optimism** — User message appears instantly (client-side), not after server round trip.
- **Caching** — Repeat questions answered instantly from cache. Label as "Based on previous response".

#### Streaming Pattern (Vercel AI SDK)

```typescript
const response = await streamText({
  model: anthropic("claude-3-5-sonnet-20241022"),
  messages,
});
return response.toAIStreamResponse();

// Client: Use useChat hook
const { messages, input, handleSubmit } = useChat({ api: "/api/chat" });
```

#### Pillar 6: Visible Context

**Principle:** Users see what data the AI can access and what it's using.

#### Implementation: (6)

- **Context Window Display** — Show what's "in scope": "Using files: project.md, architecture.md. History: last 10 messages."
- **Attached Files/Data** — Show uploaded files or provided data in chat UI.
- **Knowledge Base Coverage** — If AI uses a knowledge base: "Searched 150 docs. Top 5 relevant sources below."
- **Memory/History Visibility** — Show what you remember: "I remember: You're building a payment system. Tech: Node.js + PostgreSQL."
- **Scope Limitations** — "Note: I cannot access external URLs or real-time data. Knowledge current as of April 2024."

---

### Step 1: Choose Architecture (Client vs. Server State)

#### Option A: Client-Side State (Vercel AI SDK Default)

- Conversation array stored in React state.
- Pro: Fast, offline-aware, simple.
- Con: State lost on refresh (unless persisted to localStorage).

#### Option B: Server-Side State (Persisted)

- Conversation stored in database (Prisma + PostgreSQL).
- Pro: Survives session end. Multi-device sync possible.
- Con: More latency. Requires database design.

**Recommendation:** Start with client-side (fast MVP). Add server persistence when users demand saved history.

---

### Step 2: Implement Persistent Memory

Memory ≠ history. History is all messages. Memory is extracted key facts.

#### Memory Flow

1. After each exchange, ask LLM: "What should I remember from this conversation?"
2. LLM responds: "The user is building SaaS for insurance agents. Tech: React + Node.js."
3. Store as: `{type: "project_description", content: "..."}`
4. Before each response, inject recent memories into system prompt.

#### Memory UI

- Show memories in sidebar, editable.
- "Forget this" button to delete.
- "Update this" to modify.

---

### Step 3: Integrate External Tools via MCP

MCP (Model Context Protocol) lets the LLM call external tools (APIs, databases, services).

#### Basic Pattern

```typescript
import { MCPServer } from "@modelcontextprotocol/sdk";
const mcp = new MCPServer();
mcp.define_tool("get_files", {
  input: { projectId: "string" },
  handler: async ({ projectId }) => {
    return { files: await db.file.find({ projectId }) };
  },
});
```

Display tool calls in UI with results. Show badges for tool names, JSON blocks for results.

---

### Step 4: Implement Accessibility (WCAG 2.2 AA)

For detailed WCAG compliance requirements, see `references/compliance-checklist.md`.

Key points:

- Use ARIA live regions for streaming responses.
- Ensure keyboard navigation (Tab, Ctrl+Enter to send).
- Manage focus after response completes.
- Maintain 4.5:1 color contrast minimum.
- Test with real screen readers.

---

### Step 5: Handle Compliance (ISO 42001, EU AI Act)

For detailed compliance checklist, see `references/compliance-checklist.md`.

**ISO 42001:** Document model versions, prompt changes, audit trail.

**EU AI Act:** Transparency obligations, high-risk registration, data retention policies.

---

### Step 6: Phased Rollout

For detailed implementation roadmap, see `references/implementation-roadmap.md`.

Summary: Start MVP (Week 1-2) with basics. Expand to persistence, files, RAG, memory, tools, and compliance over 13+ weeks.

---

## Advanced Cases

### Case 1: Long-Running Analysis with Progress

User asks: "Analyze all 500 of my project files for security issues."

**Implementation:** Server streams progress + results via JSON messages. Client parses stream and updates UI with progress percentage, phase name, and partial results.

### Case 2: Branching Conversations

User: "I want to compare two design approaches."

**Implementation:** Support branches instead of linear history. At any message, user can "Create alternative response". Show side-by-side. Merge branches later.

### Case 3: Multi-Turn with Validation

For high-stakes decisions, ask AI to validate its own output.

```typescript
const draft = await generateResponse(userQuery);
const validation = await validateResponse(draft);
if (!validation.isValid) {
  const revised = await generateResponse(userQuery, {
    feedback: validation.issues,
  });
  setMessage(revised);
} else {
  setMessage(draft);
}
```

---

## Fallback Clause

If any of the following is missing, output the marker and halt:

- **Streaming implementation missing:** Output `[INFORMATION_NEEDED: streaming_capability_to_reduce_perceived_latency]` and note that responses will feel slow.
- **Error recovery paths undefined:** Output `[INFORMATION_NEEDED: error_handling_and_recovery_flows]` and flag as critical.
- **Memory extraction logic missing:** Output `[INFORMATION_NEEDED: memory_extraction_mechanism]` and note that context will be lost between sessions.
- **Accessibility not reviewed:** Output `[INFORMATION_NEEDED: WCAG_2.2_accessibility_audit]` and recommend third-party audit.
- **MCP tools not integrated:** Output `[INFORMATION_NEEDED: external_tool_integration_via_MCP]` and note limited capabilities.

Never deploy an AI interface without all 6 pillars. Test with real users before rollout.

## Anti-Patterns

### Anti-Pattern 1: Hiding AI Status

Disguising AI as human erodes trust when discovered. Always label as AI.

#### Anti-Pattern 2: Non-Streaming Responses

Waiting 5-10 seconds for full response feels slow. Use streaming for any response >20 tokens.

#### Anti-Pattern 3: No Stop Button During Generation

User sees bad response mid-stream. They're stuck watching. Always provide Stop.

#### Anti-Pattern 4: Losing Context After Refresh

User refreshes page. Entire conversation gone. Defeats trust. Persist to database from day 1 (even in MVP).

#### Anti-Pattern 5: Inaccessible Chat Interfaces

Building for sighted users only. Screen readers can't navigate. WCAG compliance is non-negotiable.

#### Anti-Pattern 6: System Prompt Instability

System prompt changes daily. User gets different behavior. Lock it. Version it. Test changes before rollout.

---

## Enforcement

This skill is MANDATORY and must be followed without exception when its trigger fires.

All 6 pillars must be implemented before any AI interface goes to production:

1. [ ] Transparency implemented (labels, thinking states, citations, confidence).
2. [ ] Predictability enforced (consistent system prompt, versioning, A/B testing).
3. [ ] User control available (stop, edit, regenerate, memory control).
4. [ ] Error recovery paths defined (graceful errors, actionable recovery).
5. [ ] Perceived performance optimized (streaming, skeleton loading, progress).
6. [ ] Context visible to user (file list, memory, knowledge base scope).

Code review checklist:

- [ ] All messages labeled as "AI" or "You", never ambiguous.
- [ ] Stop button wired to generation cancellation.
- [ ] Streaming implemented (not synchronous wait).
- [ ] Accessibility audit passed (WCAG 2.2 AA).
- [ ] Conversation persisted to database (localStorage minimum for MVP).
- [ ] System prompt versioned and documented.
- [ ] Error boundary catches and displays gracefully.
- [ ] Memory extraction and storage working.

Non-compliance risks:

- Users distrust AI (hidden status, no error recovery).
- Interfaces feel slow (no streaming).
- Accessibility failures (legal liability in many regions).
- Silent data loss (no persistence).
- Debugging nightmare (no audit trail).

---

## Source References

- **Amershi et al. (2019)** — "Guidelines for Human-AI Interaction". ACM CHI. Essential reading on user expectations.
- **Google PAIR (People + AI Research Institute)** — Foundational work on AI interface design and trust.
- **Nielsen/Norman NN Group** — WCAG compliance and accessibility UX patterns.
- **Vercel AI SDK Docs** — `useChat`, `streamText`, integration patterns.
- **Anthropic Docs** — Streaming API, system prompts, Claude capabilities.
- **references/implementation-roadmap.md** — Detailed phased rollout plan (MVP to V1.0).
- **references/compliance-checklist.md** — WCAG, ISO 42001, EU AI Act requirements and implementation guides.
