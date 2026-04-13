# Skill Evals

This folder contains the evaluation suite for `saas-skills`.

## Purpose

The goal is to make skill activation testable instead of relying on intuition:

- `should_trigger`: prompts that should activate the target skill as the primary workflow
- `should_not_trigger`: prompts that should route elsewhere or stay inactive
- `conflicts`: prompts that mention overlapping domains and require an explicit priority choice
- `minimum_output`: the minimum acceptable artifacts or decisions the agent should produce once the skill is active

## How to Use

1. Pick one target agent or environment.
2. Generate a replay template with `pnpm evals:init -- <environment>`.
3. Replay the prompts from `skill-trigger-matrix.json` or from the generated template file in `results/`.
4. Compare the observed primary skill choice against `expected_primary_skill`.
5. For conflict cases, verify the agent follows the `resolution` note instead of blending scopes vaguely.
6. Once the skill activates, verify the response covers every item in `expected_minimum_output`.
7. Score the run with `pnpm evals:score -- saas-skills/evals/results/<environment>.json`.

## Replay Files

Each replay JSON contains:

- environment metadata
- the full case list for that environment
- a `result` block per case with observed activation and coverage

Relevant `result` fields:

- `status`: `pending`, `passed`, `failed`, `partial`, or `not-run`
- `observed_primary_skill`: skill that actually won in the environment
- `observed_secondary_skills`: optional list of secondary skills used
- `minimum_output_covered`: items from `expected_minimum_output` that were actually covered
- `notes`: concise justification of the outcome
- `transcript_ref`: pointer to a thread, screenshot, or log

Pre-provisioned templates already exist in `results/` for:

- `claude-code`
- `cursor`
- `github-copilot`

## Scoring

`pnpm evals:score` compares replay results against the canonical matrix and writes:

- `<environment>.report.md` for each scored JSON
- `SUMMARY.md` when you score an entire directory

The scorer treats a case as approved only when:

- `result.status` is explicitly marked as `passed`
- the expected primary skill was selected
- required secondary skills were observed when applicable
- all expected minimum output items were marked as covered

Additional rules:

- `failed` and `partial` are always counted as failed executions
- `pending` and `not-run` stay pending
- when a directory is scored, only JSON files with a valid replay schema are processed

## Automation

Run `pnpm audit:skills` to verify that:

- every skill exists in the library
- every skill has eval coverage
- every `SKILL.md` keeps the structural quality gates intact
- every referenced `references/` or `assets/` path resolves correctly
