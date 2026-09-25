---
name: multi-agent-skill-creator
description: "Create or update portable Agent Skills from one canonical source for Claude Code, Codex and Cursor: SKILL.md structure, operational contract, registry entry, triggers, evals and validation. Use when asked to create, scaffold, revise, validate or evaluate a skill."
metadata:
  author: Context Window
  version: "1.0.0"
  last_validated: "2026-07-21"
  sources:
    - references/runtime-contracts.md
    - Agent Skills specification
    - Codex skill-creator workflow
    - Context Window runtime adapters
---

# Multi-Agent Skill Creator

Create one reviewable canonical skill and derive runtime-specific artifacts from
it. Do not maintain three independent implementations.

## Operational Contract

| Field | Contract |
| --- | --- |
| Objective | Create or update one canonical skill with its registry entry, evals and generated client packages. |
| Use when | Adding or changing a skill in the Context Window library. |
| Do not use when | Installing skills into projects (use multi-agent-skill-installer) or editing installed copies. |
| Inputs | Purpose, triggers, non-triggers, required resources and target clients. |
| Preconditions | Working inside the Context Window source repository. |
| Tools | scripts/scaffold_portable_skill.py, node scripts/cw.mjs catalog, node --test. |
| Procedure | Follow the Core Workflow below in order. |
| Output | SKILL.md with Operational Contract, catalog/registry.json entry, eval matrix entry and a refreshed catalog lock. |
| Validation | `node scripts/cw.mjs catalog --check` and `node --test` pass. |
| Known failures | Name different from the folder, description over 1024 characters, missing eval cases, references outside the package. |

## When to Use

Use this skill when the request involves:

- creating or scaffolding a new skill;
- updating a `SKILL.md` or its bundled resources;
- improving trigger precision or resolving skill conflicts;
- adding Codex interface metadata, Claude routing, or Cursor rule profiles;
- adding eval cases and release documentation for a skill;
- validating or synchronizing skills across Codex, Claude, and Cursor.

For installation-only work on an already valid library, use
`multi-agent-skill-installer` as the primary skill.

## Canonical Model

Keep the editable source in the repository's declared canonical skills tree.
For Context Window this is:

```text
saas-skills/<collection>/<skill>/
├── SKILL.md
├── agents/openai.yaml       # when Codex UI metadata is useful
├── scripts/                 # deterministic helpers only
├── references/              # detailed material loaded on demand
└── assets/                  # output resources, not instructions
```

Runtime copies are generated artifacts:

```text
canonical SKILL.md (registered in catalog/registry.json)
├── Codex  -> .agents/skills/<skill>/ (project) or ~/.agents/skills/<skill>/ (user)
├── Claude -> .claude/skills/<skill>/ (project) or ~/.claude/skills/<skill>/ (user)
└── Cursor -> reads the .claude/skills or .agents/skills copy (no generated rules)
```

Read `references/runtime-contracts.md` before changing adapters, profiles, or
runtime targets.

## Workflow

### 1. Inspect Before Creating

1. Read the target repository's `AGENTS.md`, `CLAUDE.md`, local rules, package
   scripts, and skill governance.
2. Find existing `SKILL.md` files, profiles, eval matrices, installers, and
   manifests.
3. Decide whether this is a new skill, an update, or an overlap with an existing
   skill. Prefer extending a clear owner over creating a near-duplicate.
4. State the canonical source and the requested runtime scope.
5. Preserve unrelated dirty work and never patch installed runtime copies as
   the source of truth.

### 2. Initialize a New Skill

Use the platform's official scaffold when it is available. In Codex, use the
bundled `skill-creator/scripts/init_skill.py` first. In a portable environment,
use this skill's fallback scaffold:

```bash
python scripts/scaffold_portable_skill.py <skill-name> \
  --path <canonical-collection> \
  --resources scripts,references
```

The scaffold refuses to overwrite an existing directory. After initialization,
replace every placeholder with task-specific content.

### 3. Author for Progressive Disclosure

- Keep `SKILL.md` procedural and below the repository limit.
- Put trigger conditions in the frontmatter description, including explicit
  tasks and artifacts that should activate the skill.
- Put the minimum executable workflow in `SKILL.md`.
- Move long examples, specifications, and platform matrices to `references/`.
- Add scripts only for deterministic, repeatable work; run them at least once.
- Add `agents/openai.yaml` when supported. Quote strings, keep
  `short_description` between 25 and 64 characters, and mention `$skill-name`
  in `default_prompt`.
- Include fallback, anti-pattern, enforcement, and source-reference sections
  when the canonical library requires them.

### 4. Integrate the Library

When working in Context Window:

1. Register the skill in `catalog/registry.json` (status, origin, family,
   profiles, invocation, summary).
2. Use narrow multiword `triggers` for the Claude routing hook; a trigger that
   also matches everyday prompts is a defect (the router test checks neutral and
   ambiguous prompts).
3. Add at least the configured minimum positive, negative, and conflict cases
   to `saas-skills/evals/skill-trigger-matrix.json`.
4. Update catalog counts, release notes, changelog, and relevant operator docs.
5. Update related skills when the new decision changes their workflow; avoid
   copy-pasting the entire new skill into them.

### 5. Validate in Increasing Scope

Run the smallest validator first, then repository QA:

```bash
python <platform-skill-creator>/scripts/quick_validate.py <skill-directory>
node scripts/cw.mjs catalog --write-lock
pnpm qa
```

If the repository provides different commands, use those instead. Then install
into a scratch project with an isolated home and inspect what each client gets
(`node scripts/cw.mjs install --target <scratch> --profile dev --home <sandbox>/home`);
a green source audit does not prove that the rendered copies preserved the
contract.

### 6. Synchronize Safely

Use `multi-agent-skill-installer` for distribution. Always validate with
isolated homes before a real global sync. A request to create or edit a skill
does not by itself authorize overwriting real global runtimes; obtain or rely on
explicit installation/synchronization scope.

## Fallback Clause

If the canonical root, runtime scope, or ownership is unclear, stop before
writing runtime artifacts and ask for that decision. If the official scaffold
is unavailable, use `scripts/scaffold_portable_skill.py`. If a runtime adapter
cannot represent a field, keep the canonical source intact, document the gap,
and generate the closest non-lossy adapter instead of silently dropping intent.

## Anti-Patterns

- Editing installed copies (`.agents/skills`, `.claude/skills`, `~/.agents/skills`,
  `~/.claude/skills`) as the canonical source.
- Creating separate hand-maintained bodies for each runtime.
- Naming a skill after a vague technology without precise trigger conditions.
- Stuffing every reference and example into `SKILL.md`.
- Using broad prompt triggers such as `code`, `fix`, or `architecture`.
- Adding a skill without eval coverage or without checking overlap.
- Claiming cross-runtime support after validating only the canonical file.
- Overwriting an existing skill directory during scaffolding.

## Enforcement

When this skill triggers:

1. Inspect repository-specific instructions before editing.
2. Initialize new skills through an approved scaffold.
3. Maintain one canonical source and generated runtime adapters.
4. Add trigger, anti-trigger, and conflict coverage where the library supports
   evals.
5. Validate the skill source and all requested runtimes.
6. Never synchronize real global runtimes without explicit scope.

## Source References

- Runtime mapping and validation: `references/runtime-contracts.md`
- Portable fallback scaffold: `scripts/scaffold_portable_skill.py`
- External background: Agent Skills specification and each runtime's current
  official skill/rule documentation
