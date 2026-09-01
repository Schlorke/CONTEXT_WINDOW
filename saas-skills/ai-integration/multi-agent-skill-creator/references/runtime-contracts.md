# Runtime Contracts for Portable Skills

## Source of Truth

Maintain one canonical directory. In Context Window it lives under
`saas-skills/<collection>/<skill>/`. Runtime directories are generated outputs
and must not be edited as the source.

## Mapping

| Concern         | Canonical                            | Codex            | Claude                                        | Cursor                                                              |
| --------------- | ------------------------------------ | ---------------- | --------------------------------------------- | ------------------------------------------------------------------- |
| Instructions    | `SKILL.md`                           | copied           | copied with supported frontmatter enrichment  | full body or short project stub generated in `.mdc`                 |
| Trigger summary | `description`                        | native discovery | native discovery plus optional router profile | rule `description`                                                  |
| File matching   | runtime profile                      | optional         | `paths` and/or routing hook                   | `globs`                                                             |
| UI metadata     | `agents/openai.yaml`                 | supported        | ignored safely                                | ignored safely                                                      |
| Resources       | `scripts/`, `references/`, `assets/` | copied           | copied                                        | canonical paths must remain resolvable from generated rule workflow |
| Drift state     | library version and manifest         | manifest         | manifest                                      | manifest                                                            |

Do not assume fields supported by one runtime are portable verbatim. Keep the
intent canonical and let the repository adapter perform the translation.

Use full Cursor project rules when the project is the only runtime location.
Use `--cursor-project-stubs` when global Claude/Codex skills already provide the
full body and the repository protects its context budget. A stub must keep
`alwaysApply: false`, use `globs: []`, remain small, and point to the canonical
global skill copies; global compatibility rules remain full adapters.

## Trigger Design

- Put the most important positive triggers in the canonical description.
- Use profile prompt triggers for deterministic routing only when the phrase is
  specific enough to avoid unrelated tasks.
- Use file globs only when merely editing that file type should activate the
  skill.
- Add negative cases for adjacent skills and one conflict case that defines
  which skill is primary.

## Validation Ladder

1. Validate the individual skill structure.
2. Run the canonical library audit and Markdown/format checks.
3. Generate flat skills and Cursor rules.
4. Install Codex, Claude, and Cursor into isolated homes.
5. Verify manifests, counts, paths, frontmatter, resources, and routing data.
6. Only then synchronize the explicitly requested real runtimes.

The sandbox should use explicit paths outside application source. Never point a
cleanup or recursive overwrite at a repository root, home directory, or an
unresolved environment variable.

## Update Contract

When updating an existing skill:

1. compare the canonical source with installed manifests;
2. edit only the canonical source, profiles, evals, and documentation;
3. preserve unrelated user changes;
4. validate in sandbox;
5. run the repository's managed sync command;
6. verify each selected runtime after synchronization.
