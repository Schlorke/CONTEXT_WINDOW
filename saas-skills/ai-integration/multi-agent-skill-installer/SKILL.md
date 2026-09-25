---
name: multi-agent-skill-installer
description: Install, update, verify, repair or remove the Context Window skill library for Claude Code, Codex and Cursor with the cw CLI — project or user scope, profiles, isolated sandbox profiles, conflict handling, legacy 1.x migration and the Cursor User Rules export. Use only when the user explicitly asks to install, sync, update, verify, repair or uninstall the library.
metadata:
  author: Context Window
  version: "2.0.0"
  last_validated: "2026-09-24"
  sources:
    - Context Window cw CLI help and test suite
    - Claude Code skills and memory documentation
    - Codex skills documentation and codex debug prompt-input
    - Cursor rules and skills documentation
---

# Multi-Agent Skill Installer

## Operational Contract

| Field | Contract |
| --- | --- |
| Objective | Put the right skills, contract blocks and hook in the right place for each selected client, safely and reversibly, and prove it with `verify`. |
| Use when | The user explicitly asks to install, update, sync, verify, repair or uninstall the library, or to validate it in an isolated profile. |
| Do not use when | Creating or editing a canonical skill (multi-agent-skill-creator), or changing application code. |
| Inputs | Destination (`--target <dir>` or `--user`), profile (`dev` or `creative`), clients (`claude,codex,cursor`), optional blocks (contract, usage policy, Claude hook). |
| Preconditions | Node.js 20 or newer; a Context Window checkout or a bundle made with `build --out`; the destination exists; the user approved the scope. |
| Tools | The `cw` CLI (`node scripts/cw.mjs` inside the checkout or bundle). |
| Procedure | Steps 1–7 below. |
| Output | Installed skills with `.cw-manifest.json` per skill directory, an install record in `.context-window/install.json`, managed text blocks, the `verify` result. |
| Validation | `verify` exits 0; `status` reports every skill as current; the plan printed before install matches the result. |
| Known failures | Exit 2 (conflicts, nothing written), exit 3 (busy or interrupted run), a hand-edited installed skill, a 1.x install in the same folders, the Cursor User Rules text not pasted. |

## Where each client reads skills

| Client | Project scope | User scope |
| --- | --- | --- |
| Claude Code | `.claude/skills/<id>/SKILL.md` | `$CLAUDE_CONFIG_DIR/skills` or `~/.claude/skills` |
| Codex | `.agents/skills/<id>/SKILL.md` | `~/.agents/skills` |
| Cursor | reads `.claude/skills` (compatibility) and `.agents/skills` | reads `~/.claude/skills` and `~/.agents/skills`; User Rules are pasted manually |

`cw` writes each skill once per sink: when Claude and Cursor are both selected, Cursor uses the Claude
copy instead of receiving a duplicate. The contract block goes to `AGENTS.md` (read by Codex and Cursor)
and `CLAUDE.md` imports it with `@AGENTS.md`. At user scope it goes to `~/.claude/CLAUDE.md` and
`$CODEX_HOME/AGENTS.md`.

## Step 1 — Confirm scope and profile

Ask the user when it is not explicit: one project (`--target <dir>`) or the whole user profile
(`--user`); which clients; which profile. The `dev` profile turns the architecture contract on by
default; pass `--without-contract` for repositories without a product frontend.

## Step 2 — Prove it in an isolated profile first

```bash
node scripts/cw.mjs plan --target <scratch-project> --profile dev --home <sandbox>/home
node scripts/cw.mjs install --target <scratch-project> --profile dev --home <sandbox>/home
node scripts/cw.mjs verify --target <scratch-project> --home <sandbox>/home
node scripts/cw.mjs doctor --target <scratch-project> --home <sandbox>/home
```

`--home` isolates `~`, `.claude` and `.codex`; `--claude-config-dir` and `--codex-home` override them
individually. Never point these options at the real profile to make a test pass.

## Step 3 — Plan, then install

```bash
node scripts/cw.mjs plan --target <project> --profile dev
node scripts/cw.mjs install --target <project> --profile dev
```

`plan` (or `install --dry-run`) lists every create, update, replace and remove before anything is
written. `install` re-plans under a lock and applies the same operations. Show the plan to the user
when it touches existing files.

## Step 4 — Resolve conflicts explicitly (exit code 2)

Nothing is written when a conflict exists. Read the reason and choose deliberately:

| Conflict | Meaning | Resolution |
| --- | --- | --- |
| `unmanaged-collision` | A folder with the same name exists and was not installed by cw | Keep it, or `--adopt <id>` / `--adopt-all` (backup kept) |
| `locally-modified` | An installed skill was edited by hand | Move the change to the library source, or `--force-local` (backup kept) |
| `legacy-managed` / `legacy-manifest` | A 1.x install (`.saas-skills-manifest.json`) is present | `--migrate-legacy` to replace it, or `--keep-legacy` |
| `link`, `case-mismatch`, `unsafe-root` | Symlink/junction, case clash or path outside the sink | Fix the filesystem; cw never follows links |
| `invalid-manifest` | Manifest tampered or corrupt | Inspect; reinstall after removing the folder deliberately |

## Step 5 — Verify and report

```bash
node scripts/cw.mjs status --target <project>
node scripts/cw.mjs verify --target <project>
node scripts/cw.mjs doctor --target <project> --strict
```

`verify` checks every file hash, manifest and block; `doctor` also reports duplicates between the
project and user scopes and leftovers of older installs. Report the exit codes, not impressions.

## Step 6 — Cursor User Rules (user scope only)

Cursor's User Rules live in the application settings, not in files. Print the text and ask the user to
paste it into Cursor Settings > Rules:

```bash
node scripts/cw.mjs contract --format cursor-user-rules --with-usage-policy
```

The header carries the library version and a hash; after an update, compare it with the pasted text.
This step is manual and cannot be verified by `cw`.

## Step 7 — Update, repair, remove

```bash
node scripts/cw.mjs install --target <project>
node scripts/cw.mjs recover --target <project>
node scripts/cw.mjs uninstall --target <project> --dry-run
node scripts/cw.mjs uninstall --target <project>
```

- Update: run `install` again after updating the library; the record keeps profile, clients and blocks.
- Exit code 3 means another run holds the lock or a previous run was interrupted: wait, then `recover`.
- `uninstall` removes only files it can prove it installed; hand-edited ones need `--force-local`.

## Distributing outside the checkout

```bash
node scripts/cw.mjs build --out <empty-dir>
node <empty-dir>/scripts/cw.mjs install --target <project> --profile dev
```

The bundle contains only active skills, the catalog lock and the CLI; imported or quarantined items are
never distributed.

## Rules

- Never copy skill folders by hand or patch installed copies; change the library source and reinstall.
- Never run install against real user profiles before the isolated run passes.
- Installing skills never migrates a project's code; adoption follows legacy-code-refactoring.
- Report "not verified" for anything that could not be executed (for example, a client that is not
  installed on the machine).
