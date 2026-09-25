# Runtime Contracts for Portable Skills

## Source of Truth

Maintain one canonical directory. In Context Window it lives under
`saas-skills/<collection>/<skill>/` and is registered in `catalog/registry.json`.
Installed copies are generated outputs and must not be edited as the source.

## Mapping

| Concern | Canonical | Codex | Claude Code | Cursor |
| --- | --- | --- | --- | --- |
| Skill folder | `SKILL.md` + resources | `.agents/skills/<id>` (project), `~/.agents/skills` (user) | `.claude/skills/<id>`, `$CLAUDE_CONFIG_DIR/skills` | reads `.agents/skills` and `.claude/skills` natively |
| Rendered copy | — | same bytes for every sink: normalized frontmatter + `cw-id`, `cw-library-version`, `cw-source-hash` | same | same |
| Trigger summary | `description` (≤ 1024 chars) | skill listing | skill listing + optional routing hook (`triggers` in the registry) | skill listing |
| Explicit-only | `invocation: "explicit"` in the registry | `agents/openai.yaml` `policy.allow_implicit_invocation: false` | `disable-model-invocation: true` | frontmatter |
| Resources | `scripts/`, `references/`, `assets/` | copied | copied | copied |
| Drift state | catalog lock | `.cw-manifest.json` per sink | same | same |

Do not assume a field supported by one client is portable verbatim. Keep the
intent canonical (registry + frontmatter) and let the renderer translate it.

## Trigger Design

- Put the most important positive triggers in the canonical description.
- Registry `triggers` feed the Claude routing hook; use multiword phrases that
  everyday prompts do not contain (the router test checks neutral and ambiguous
  prompts).
- Add negative cases for adjacent skills and one conflict case that defines
  which skill is primary.

## Validation Ladder

1. `node scripts/cw.mjs catalog` — structure, references, operational contract,
   eval coverage, machine paths, secrets.
2. `node scripts/cw.mjs catalog --write-lock` and `pnpm qa`.
3. Install into a scratch project with an isolated home (`--home <sandbox>/home`)
   and run `verify` and `doctor`.
4. When the client binaries exist, `pnpm test` also runs the discovery tests
   (`test/clients.test.mjs`) that prove what Codex and Claude Code see.
5. Only then install into the explicitly requested real destinations.

Never point `--home`, `--claude-config-dir`, `--codex-home` or `--out` at a
repository root, a real profile, or an unresolved environment variable.

## Update Contract

1. Edit only the canonical source, registry, evals and documentation.
2. Preserve unrelated user changes.
3. Regenerate the lock and run `pnpm qa`.
4. Run `install` again on each destination; local edits in installed copies
   stop the install with a conflict until they are moved to the source.
5. Run `verify` on each destination.
