# Chairman Output Templates

## Severity scale

- **blocker** - ship this and a real user or real data is harmed; must be
  resolved before implementation.
- **major** - will surface as a production incident or costly rework within
  weeks.
- **minor** - friction or debt; schedule it, do not block on it.

## Verdict definitions (forced choice)

- **PROCEED** - no unmitigated blocker or major consensus risks.
- **PROCEED WITH CHANGES** - sound direction; required changes list must be
  applied first.
- **RETHINK** - the goal is right, the approach fails the council; needs a new
  plan.
- **STOP** - the goal itself is wrong or the timing is; do not invest further
  now.

PROCEED with an unmitigated blocker consensus risk is a protocol violation.

## FULL mode template

```text
# Council Verdict: {plan, one line}
Mode: FULL | Variant: {parallel-subagents | sequential-protocol} | Advisors: A-E ({label->style map})

## Verdict: {PROCEED | PROCEED WITH CHANGES | RETHINK | STOP} (confidence: {high|medium|low})
{2-3 sentences: why this verdict, driven by the top-ranked findings}

## Consensus risks
| # | Risk | Severity | Raised by | Platform | Second-order? |
|---|------|----------|-----------|----------|---------------|

## Embedded-AI impact
{how product-AI behavior changes; "none" must be argued from the digest, never assumed}

## Platform gaps (desktop vs mobile vs offline)
{explicit differences the plan ignores; "none identified" requires naming what was checked}

## Devil's advocate outcome
{did the consensus survive? what changed because of the attack}

## Dissent worth keeping
- {minority position} - becomes right if {condition}.

## Required changes before implementing
1. {action} -> mitigates risk #{n}

## Recommendation in plain language
{3-6 sentences. For a non-programmer owner. Opinionated, first person, zero
jargon, zero unexplained acronyms, no hedging. What I would do if this were my
product and my money.}
```

## FAST mode template

```text
# Council (fast): {plan, one line}
Mode: FAST | five sequential lenses

## Verdict: {...} (confidence: {...})

## Top risks (max 5)
| Risk | Severity | Lens | Platform |
|------|----------|------|----------|

## One dissent worth keeping

## Recommendation in plain language
{same rules as FULL}
```

## Plain-language recommendation - worked example

Bad (hedged, jargony): "The migration presents non-trivial risks around LWW
conflict semantics; consider additional validation."

Good: "I would not ship this next week. The plan changes how the app decides
which version of a record wins when a phone reconnects, and today nothing warns
you when it picks wrong - you would only find out when the product owner spots
wrong numbers weeks later. Do the two required changes first (a warning when
versions conflict, and a way to undo the migration), then this becomes a good
change worth shipping."
