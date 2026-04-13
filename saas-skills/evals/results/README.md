# Replay Results

This folder stores environment-specific replay runs derived from `skill-trigger-matrix.json`.

## Provisioned Environments

- `claude-code.json`
- `cursor.json`
- `github-copilot.json`

Each JSON is a fillable replay template. The paired `*.report.md` files are scored snapshots derived from the current JSON content, and `SUMMARY.md` aggregates every scored environment in this folder.

## Recommended Workflow

1. Pick one environment file.
2. Replay the prompts and fill the `result` block for each case.
3. Run `pnpm evals:score` to regenerate the report and summary.
4. Commit only meaningful updates after a real replay round.

## Notes

- A `pending` baseline is expected before the first replay.
- `transcript_ref` should point to the evidence source for each evaluated case.
- `status` should reflect the evaluator decision, not just field completeness.
- `pnpm evals:score` only processes valid replay JSON files in this folder.
