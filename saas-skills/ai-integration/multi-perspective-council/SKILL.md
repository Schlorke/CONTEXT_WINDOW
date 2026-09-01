---
name: multi-perspective-council
description: Convene a multi-perspective advisory council (LLM Council style) that pressure-tests a plan, idea, or implementation BEFORE code is written. Five fixed reasoning styles (Contrarian, First Principles, Expansionist, Outsider, Executor) incarnated with the open project's context analyze independently, anonymously peer-review each other, face a devil's advocate, and a chairman delivers a verdict with consensus, preserved dissent, second-order risks (future bugs, embedded-AI misbehavior, desktop vs mobile vs offline gaps) and a plain-language recommendation. Use on request for a second opinion or before large implementations. Trigger phrases include convoca o conselho, conselho completo, conselho rapido, segunda opiniao, multiplas perspectivas, llm council, advogado do diabo, pressure test, second opinion, council review, plano de grande implementacao, mudanca estrutural grande, migracao de schema em producao, refatoracao que afeta varios modulos, mudar o comportamento da IA do produto.
metadata:
  author: "Claude Agent, SaaS Skills"
  version: "1.0"
  last_validated: "2026-08-31"
  sources:
    - "Andrej Karpathy, LLM Council pattern (karpathy/llmcouncil)"
    - "ngmeyer council-review fork (reasoning-style advisors, staged protocol)"
    - "references/advisor-prompts.md"
    - "references/runtime-degradation.md"
    - "references/output-templates.md"
---

# Multi-Perspective Council

## When to Use

Convene the council when:

- The user explicitly asks for it ("convoca o conselho", "segunda opiniao",
  "advogado do diabo", "pressure test", "multiple perspectives", "llm council").
- You are about to receive or produce an implementation plan that matches the
  LARGE CHANGE heuristic below and the council was not requested. In that case,
  SUGGEST it in one line ("This qualifies as a large change - want me to convene
  the council before implementing? [full/fast/skip]") and wait. Never silently
  run the FULL council uninvited; you MAY run FAST mode unprompted only when the
  user asked an evaluative question ("is this a good idea?", "o que acha desse
  plano?").

This skill reviews and decides. It NEVER implements. When the council ends,
hand the verdict back; implementation is a separate task.

The council exists to cure sycophancy - the failure mode where an AI implements
exactly what was imagined and never surfaces second-order problems: bugs that
appear weeks later, embedded-AI features behaving wrong in production, desktop
behavior that silently diverges on mobile or offline. Every rule below serves
that goal.

## Workflow

### Stage 0 - Pre-Flight and Mode Selection

First decide if a council is warranted at all. Skip it (answer directly, say
why) when the question is factual, reversible in minutes, or already settled by
project rules or an ADR.

Then select the mode and DECLARE it with a one-line justification before
proceeding.

**FULL mode** (parallel advisors + anonymous peer review + devil's advocate +
chairman) when ANY hard signal is true:

- Irreversible or hard-to-roll-back change (database schema or data migration,
  public API contract, billing, destructive data operation).
- Changes offline/sync behavior or any local-first persistence path.
- Changes embedded-AI product behavior (system prompts, tools, retrieval,
  memory, agent config).

...or when TWO OR MORE soft signals are true:

- Touches three or more features/modules or a cross-cutting concern (auth, data
  model, routing, design system).
- Affects more than one platform surface (desktop web, mobile web/PWA, native
  app).
- Introduces a new dependency, service, or third-party integration.
- Realistic implementation effort is more than one working day.
- Changes a workflow that a product owner or end customer relies on in
  production.

**FAST mode** (five sequential lenses, no peer review, compact chairman) for
everything else that still deserves multiple perspectives. The user can always
override ("conselho completo" / "conselho rapido").

### Stage 1 - Frame and Gather Context

1. Restate the plan under review in ONE neutral sentence. Strip the user's
   enthusiasm and adjectives; do not import their framing ("simple", "quick",
   "obvious").
2. Gather bounded project context (hard cap ~12 files - the council needs
   anchors, not the whole codebase):
   - The plan itself, verbatim (user message or referenced file).
   - Project instruction files if present, in priority order: `CLAUDE.md`,
     `AGENTS.md`, `.cursor/rules/`.
   - `specs/`, `docs/adr/` or equivalent - list titles/headings only, then open
     at most 2 documents directly relevant to the plan.
   - `git log --oneline -15` for recent direction.
   - A 2-level file tree of the areas the plan touches.
3. Compress everything into a CONTEXT DIGEST of at most ~150 lines - named
   files, flows, screens, tables, personas, platform surfaces, known
   constraints, recent changes. Every advisor receives this SAME digest. If a
   critical anchor is missing, record it as `[INFORMATION NEEDED: ...]` inside
   the digest instead of guessing.

### Stage 2 - Convene the Council (Dynamic Cast)

The five reasoning styles are FIXED. Their incarnation is DYNAMIC: dress each
style as a concrete stakeholder or surface of the open project, derived from
the context digest.

| Style            | Fixed reasoning move                                                           | Incarnation rule (bind to project)                                                 |
| ---------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Contrarian       | Assumes the shipped plan FAILED in production weeks later; works backwards     | Bind to the highest-stakes surface (production data, embedded AI runtime, money)   |
| First Principles | Decomposes the plan into atomic claims; tests each against documented limits   | Bind to the architect role - the person who carries specs, ADRs, boundary rules    |
| Expansionist     | Imports failure/success patterns from adjacent domains and analogous products  | Bind to whoever sees real usage data (product owner, analytics, support tickets)   |
| Outsider         | Asks the naive question an expert is embarrassed to ask; simulates a real user | Bind to the least-instrumented real user and worst device/network conditions       |
| Executor         | Builds the dependency graph and critical path; finds sequencing traps          | Bind to the person who must ship and roll back this change with the repo's tooling |

Example incarnation (an offline-first field-service PWA): Contrarian = "the
incident report the product owner files three weeks after launch, written
backwards"; First Principles = architect enforcing specs and module-boundary
rules; Expansionist = product owner reading real production data; Outsider =
field technician on a cheap Android phone, offline, gloves on; Executor = the
solo owner who implements everything through AI agents and must be able to
roll back.

Full advisor prompt templates, incarnation procedure, and per-advisor output
contracts: `references/advisor-prompts.md`.

Each advisor MUST comply with the Anti-Sycophancy Rules below. Run advisors as
genuinely parallel subagents when the runtime supports it, otherwise
sequentially under the discipline protocol - see Runtime Capability and
Degradation.

**FAST mode variant:** apply the five styles as sequential lenses over the same
digest, 3-6 bullet findings each, same specificity floors, then jump directly
to a compact chairman synthesis (Stage 5). No peer review, no devil's advocate.

### Stage 3 - Anonymous Peer Review (FULL only)

1. Strip advisor identities. Present the five analyses labeled A-E in
   randomized order, with style names and incarnation headers removed.
2. Each reviewer ranks all five answers 1-5. NO TIES. Rankings must be
   justified ONLY by the published criteria: (a) specificity of anchors (named
   file/flow/screen/scenario), (b) depth of second-order reasoning, (c)
   actionability of counter-proposals, (d) fidelity to the context digest.
3. For every answer reviewed, the reviewer must name its single strongest
   specific insight AND its single weakest or most generic claim. An answer
   with no named weakest claim is an invalid review.
4. In runtimes without subagents, reviews are "blind by discipline": the model
   is instructed to evaluate content only and is forbidden from referencing
   which style or persona produced an answer.

### Stage 4 - Devil's Advocate (FULL only)

After tallying rankings, identify the top 1-2 emerging consensus positions. The
devil's advocate must QUOTE each consensus claim verbatim, then build the
strongest concrete case that following it leads to failure - anchored to the
context digest, not hypotheticals - and propose at least one alternative path
the council did not consider. The devil's advocate attacks the CONSENSUS,
never the user.

### Stage 5 - Chairman Synthesis

The chairman squeezes the pulp and delivers the cream. Required output, in
order (full templates in `references/output-templates.md`):

1. **Header** - mode used, runtime variant (parallel-subagents or
   sequential-protocol), plan under review in one line.
2. **Verdict** - forced choice: PROCEED / PROCEED WITH CHANGES / RETHINK /
   STOP, plus confidence (high/medium/low).
3. **Consensus risk table** - Risk | Severity (blocker/major/minor) | Raised by
   (A-E labels) | Platform (desktop/mobile/offline/all) | Second-order?
   (yes/no).
4. **Embedded-AI impact** - how the change alters the behavior of AI features
   inside the product; "none" must be argued, not assumed.
5. **Platform gaps** - explicit desktop vs mobile vs offline differences the
   plan ignores.
6. **Dissent worth keeping** - at least ONE minority position preserved with
   the condition under which it becomes right. Never average disagreement away.
7. **Required changes before implementing** - numbered, actionable, each mapped
   to the risk it mitigates.
8. **Recommendation in plain language** - ALWAYS the final section. Three to
   six sentences addressed to a non-programmer owner. Opinionated, no hedging,
   no jargon, no acronyms without explanation. Say what you would do if it were
   your product and your money.

**Convergence check:** if three or more advisors raised substantively the same
top risk, inspect their anchors. Different anchors converging on one risk =
strong signal, raise severity. Identical anchor (same sentence of the plan) =
diversity collapse; flag it and lower the confidence rating.

## Runtime Capability and Degradation

Detect capability before Stage 2 and declare the variant in the chairman
header:

- **Subagent-capable runtime (Claude Code with the Agent/Task tool):** dispatch
  the five advisors as parallel subagents. Each receives ONLY the neutral
  framing, the context digest, and its own advisor prompt - never the other
  advisors' outputs. The orchestrator strips identities before peer review.
- **Single-context runtime (Codex CLI, Cursor, or any runtime without
  subagents):** run the rigid sequential protocol - write each advisor's
  analysis one at a time under its own contract, label outputs A-E, then
  perform peer review blind-by-discipline, then devil's advocate, then
  chairman. Slightly weaker independence; compensate by enforcing the
  specificity floors harder.

There is no third fallback tier for FULL mode: if the sequential protocol
cannot be completed (context exhaustion, tool limits), degrade to FAST mode and
say so. Detection procedure, dispatch payload spec, and the sequential script:
`references/runtime-degradation.md`.

## Anti-Sycophancy Rules (MANDATORY)

These floors are what separate a council from theater. Violating any of them
invalidates the advisor's output; regenerate it.

1. Every advisor produces AT LEAST 3 concrete risks or findings, each anchored
   to a NAMED file, flow, screen, table, API route, or user scenario present in
   the context digest. If the digest lacks the anchor, the advisor writes
   `[INFORMATION NEEDED: ...]` instead of inventing one.
2. Generic risk phrasing is BANNED: "might have bugs", "could be slow",
   "consider edge cases", "test thoroughly", "overall solid plan", "great idea,
   but". A risk must state WHAT breaks, WHERE, FOR WHOM, and WHEN it would be
   noticed.
3. No advisor may open with agreement, praise, or a restatement of the user's
   framing. The first sentence must be the advisor's own strongest claim.
4. Every advisor includes at least ONE counter-proposal - something they would
   do differently, not just criticize.
5. Peer review uses forced ranking with no ties, and every review names a
   weakest claim per answer.
6. The devil's advocate must quote the consensus it attacks.
7. The chairman must preserve at least one dissent and must never soften the
   verdict to please the user. PROCEED given to a plan with an unmitigated
   blocker-severity consensus risk is a protocol violation.

## Fallback Clause

If required inputs are missing, degrade explicitly instead of improvising:

- No plan text or referenced file to review: ask for it; do not convene on
  vibes.
- No project instruction files, specs, or git history: run the council anyway,
  but every advisor must flag `[INFORMATION NEEDED: project context]` and the
  chairman must cap confidence at "low".
- Runtime cannot complete FULL (no subagents AND context too small for the
  sequential protocol): fall back to FAST mode and declare the fallback in the
  header.
- The topic is outside pressure-testing (writing code, eliciting requirements,
  isolated prompt tuning): hand off to the appropriate skill and say which one.

## Anti-Patterns

- **Theater council:** five paragraphs that agree with each other and with the
  user. If all five advisors reach the same conclusion with the same anchors,
  the convening failed - regenerate with harder incarnations.
- **Cargo-cult personas:** giving advisors job titles ("the CTO", "the
  designer") instead of fixed reasoning styles. Titles produce vibes; reasoning
  moves produce findings.
- **Context flooding:** feeding advisors the whole repository. They drown and
  generalize. The bounded digest IS the mechanism that forces specific anchors.
- **Council as implementation gate for everything:** convening FULL mode for a
  copy change or a one-file fix. Pre-flight exists to say "no council needed".
- **Averaging the verdict:** chairman blending five positions into mush.
  Verdict is a forced choice; dissent is preserved separately.
- **Skipping the plain-language close:** ending on a risk table. The decision
  maker is a non-programmer; the last word is always the opinionated
  plain-language recommendation.
- **Auto-running FULL uninvited:** the skill suggests; the user convenes.

## Enforcement

This skill is MANDATORY when its triggers fire. The mode declaration, the
five-style cast, the anonymization protocol, the anti-sycophancy floors, and
the chairman output contract are non-negotiable in both modes and all runtimes.
Repository-specific instruction files (CLAUDE.md, AGENTS.md, .cursor/rules)
override the incarnation examples but never the protocol. The council's output
is advisory input for the user's decision - it never triggers implementation by
itself.

## Source References

- Andrej Karpathy, LLM Council pattern (karpathy/llmcouncil) - multi-model
  council with anonymous cross-review and chairman synthesis.
- ngmeyer council-review fork - reasoning-style advisors (Contrarian, First
  Principles, Expansionist, Outsider, Executor) and the staged protocol this
  skill adapts.
- `references/advisor-prompts.md` - incarnation procedure and full prompt
  templates per advisor, reviewer, devil's advocate, and chairman.
- `references/runtime-degradation.md` - capability detection and the parallel
  vs sequential execution scripts.
- `references/output-templates.md` - chairman output templates for FULL and
  FAST modes, severity and verdict definitions, plain-language examples.
