# Runtime Capability Detection and Degradation

## Detection (before Stage 2)

1. Subagent tool available (Claude Code Agent/Task tool or equivalent parallel
   dispatch)? -> variant `parallel-subagents`.
2. No subagent tool (Codex CLI, Cursor, plain chat)? -> variant
   `sequential-protocol`.
3. Sequential protocol not completable (context nearly exhausted, output
   limits)? -> fall back to FAST mode and declare it. There is no silent third
   option.

Always declare the variant in the chairman header, e.g.:
`Mode: FULL | Variant: parallel-subagents` or
`Mode: FULL | Variant: sequential-protocol (no subagent tool in this runtime)`.

## Variant A - parallel-subagents (Claude Code)

- Dispatch 5 subagents, one per advisor. Payload per subagent: neutral frame +
  context digest + that advisor's prompt ONLY. No advisor sees another's
  output. Subagents are read-only.
- Orchestrator collects the 5 outputs, strips style/incarnation headers,
  assigns randomized labels A-E, and records the label->style map privately for
  the final header footnote.
- Peer review: EITHER 5 reviewer subagents (each ranks all five answers; tally
  by average rank) OR one reviewer pass in the main context using the Peer
  Reviewer Prompt - prefer subagent reviewers when budget allows; declare which
  was used.
- Devil's advocate and chairman run in the main context (they need the tallied
  consensus).
- Budget guard: if the digest exceeds ~150 lines, trim it before dispatch -
  never send raw files to all five subagents.

## Variant B - sequential-protocol (Codex CLI, Cursor)

Rigid script, same contracts, one context:

1. Write the neutral frame and digest ONCE at the top.
2. Generate advisor analyses ONE AT A TIME, in this fixed order: Outsider,
   Expansionist, First Principles, Executor, Contrarian (naive first, inversion
   last - reduces later advisors anchoring on the harshest early take). Label
   them A-E in a DIFFERENT random order than generation order.
3. Independence discipline: each advisor section must begin from the digest,
   not from the previous section. An advisor may not cite, agree with, or rebut
   another advisor.
4. Peer review is "blind by discipline": apply the Peer Reviewer Prompt;
   justify rankings only via the four published criteria; never reference
   styles or generation order.
5. Devil's advocate, then chairman, per their prompts.
6. Honesty clause: the chairman header must state that independence was
   procedural, not structural, in this variant.

## FAST mode (all runtimes, identical)

Five sequential lenses over the same digest, 3-6 anchored bullets each, same
specificity floors and banned phrases, no peer review, no devil's advocate,
compact chairman (see `references/output-templates.md`). Declare:
`Mode: FAST | five sequential lenses`.
