---
name: multi-agent-skill-installer
description: Install and verify this skills library across Codex, Claude, and Cursor using the correct runtime targets for each platform. Trigger when the user wants global installation, project-local installation, sync across all three AI tools, safe sandbox validation, or a copyable workflow that lets any agent install the library without touching application code.
metadata:
  author: Codex Agent, SaaS Skills
  version: 1.2
  last_validated: 2026-04-13
  sources:
    - ../../README.md
    - ../../../README.md
    - ../../IDE_RUNTIME_GUIDE.md
    - ../../TARGET_REPO_AGENT_GUIDE.md
    - Codex skill-installer behavior
---

# When to Use This Skill

Activate this skill whenever:

- Installing this library into Codex, Claude, or Cursor
- Installing this library into only one of those runtimes
- Syncing the library across all three AI tools
- Syncing the library back into only one selected runtime
- Choosing between project-local and global installation
- Installing a mandatory policy that forces agents to disclose which skills they used at the end of the task
- Validating the installation in sandbox before touching real runtimes
- Generating a copyable `AGENTS.md` or operator workflow for multi-IA install
- Verifying that skills landed in the correct runtime directories

This skill is MANDATORY and must be followed without exception when its trigger fires.

## Core Workflow

### Step 1: Pick the Correct Installation Scope

Choose one of these scopes before writing anything:

1. **Project-only** — install only:
   - `.claude/skills/`
   - `.cursor/rules/`
2. **Codex-only** — install only:
   - `$CODEX_HOME/skills/`
3. **Claude-only** — install only:
   - `.claude/skills/` or `~/.claude/skills/`
4. **Cursor-only** — install only:
   - `.cursor/rules/` and, if global, also export the bootstrap for `Cursor Settings > Rules`
5. **Global-only** — install only:
   - `$CODEX_HOME/skills/`
   - `~/.claude/skills/`
   - `~/.cursor/rules/` as compatibility export
   - `Cursor Settings > Rules` via exported bootstrap
6. **Unified project install** — install:
   - `$CODEX_HOME/skills/`
   - project `.claude/skills/`
   - project `.cursor/rules/`
7. **Unified global + project install** — install everything above

If the user says "for all my projects," prefer the global flow.
If the user says "only in this repo," prefer the project flow.
If the user says "only for Codex", "only for Claude", or "only for Cursor", prefer the single-runtime flow.

### Step 2: Use the Repository Installer, Not Ad Hoc Copying

Prefer the runtime scripts in this repository:

- `scripts/install-agent-runtimes.mjs`
- `scripts/verify-agent-runtimes.mjs`
- `scripts/export-cursor-user-rules.mjs`

Canonical commands:

```bash
pnpm install:agent-runtimes -- <target-dir>
pnpm verify:agent-runtimes -- <target-dir>
```

Single-runtime aliases:

```bash
pnpm install:codex -- <target-dir>
pnpm verify:codex -- <target-dir>

pnpm install:claude -- <target-dir>
pnpm verify:claude -- <target-dir>

pnpm install:cursor -- <target-dir>
pnpm verify:cursor -- <target-dir>
```

Skill usage disclosure policy:

```bash
pnpm install:skill-usage-reporting -- <target-dir>
pnpm verify:skill-usage-reporting -- <target-dir>
```

Global-only:

```bash
pnpm install:global-runtimes
pnpm verify:global-runtimes
pnpm export:cursor-user-rules
```

Project-only:

```bash
pnpm install:agent-runtimes -- <target-dir> --project-only
pnpm verify:agent-runtimes -- <target-dir> --project-only
```

For updates and corrections, use the sync aliases:

```bash
pnpm sync:agent-runtimes -- <target-dir>
pnpm sync:global-runtimes
pnpm status:agent-runtimes -- <target-dir>
pnpm export:cursor-user-rules
```

If the install scope includes Cursor global, assume the bootstrap in `Cursor Settings > Rules` may need to be recopied after updates.

### Step 3: Always Start with Sandbox Validation

Do not install into real global runtimes first.

Run a dry-run and then a sandbox install using isolated homes:

```bash
pnpm install:agent-runtimes -- <target-dir> --global-all --dry-run --codex-home <sandbox>/codex-home --claude-home <sandbox>/claude-home --cursor-home <sandbox>/cursor-home
pnpm install:agent-runtimes -- <target-dir> --global-all --codex-home <sandbox>/codex-home --claude-home <sandbox>/claude-home --cursor-home <sandbox>/cursor-home
pnpm verify:agent-runtimes -- <target-dir> --global-all --codex-home <sandbox>/codex-home --claude-home <sandbox>/claude-home --cursor-home <sandbox>/cursor-home
```

Use sandbox validation to prove:

- Codex skills land in `$CODEX_HOME/skills/`
- Claude skills land in `.claude/skills/` or `~/.claude/skills/`
- Cursor rules land in `.cursor/rules/` or `~/.cursor/rules/`
- Cursor global bootstrap is generated for `Settings > Rules`
- no application code was touched

### Step 4: Verify the Runtime Targets Explicitly

Correct targets are:

- **Codex:** `$CODEX_HOME/skills/<skill>/SKILL.md`
- **Claude project:** `.claude/skills/<skill>/SKILL.md`
- **Claude global:** `~/.claude/skills/<skill>/SKILL.md`
- **Cursor project:** `.cursor/rules/*.mdc`
- **Cursor global compat:** `~/.cursor/rules/*.mdc`
- **Cursor global official:** `Cursor Settings > Rules` with the exported bootstrap

Every managed runtime should also contain:

- `.saas-skills-manifest.json`

If skill usage disclosure is requested, correct governance targets are:

- `AGENTS.md`
- `CLAUDE.md`
- `.cursor/rules/skill-usage-reporting.mdc`

Reject the install as wrong if:

- it uses `.cursor/skills/` as the Cursor runtime
- it claims Cursor global is fully configured without generating the bootstrap for `Settings > Rules`
- it nests `saas-skills/frontend/...` directly under `.claude/skills/`
- it assumes the Codex `skill-installer` automatically provisions Claude and Cursor

### Step 5: Run Non-Invasive Smoke Tests

After structural verification, test behavior with prompts that do not edit files.

Use prompts like:

```text
Analyze how you would design the invoices API in this repository with auth, validation, and pagination. Do not edit files.
```

```text
Explain how you would organize the shared React layers and feature folders for this repository. Do not edit files.
```

```text
Propose a README, AGENTS.md, and ADR structure for this repository. Do not edit files.
```

```text
Define the testing pyramid and tooling stack you would apply to this repository. Do not edit files.
```

Approve only if the response enters the correct domain and covers the expected essentials of the triggered skill.

### Step 6: Install for Real Only After Sandbox Passes

If the sandbox install and smoke tests pass, repeat the flow without sandbox homes.

For global install:

```bash
pnpm install:global-runtimes
pnpm verify:global-runtimes
```

For project + global:

```bash
pnpm install:agent-runtimes -- <target-dir> --global-all
pnpm verify:agent-runtimes -- <target-dir> --global-all
pnpm status:agent-runtimes -- <target-dir> --global-all
```

## Enforcement

You must enforce these rules:

- Never modify application code just to test installation
- Never treat `.cursor/skills/` as the official Cursor runtime
- Never use the Codex `skill-installer` as if it were a universal Claude/Cursor installer
- Never patch runtime copies directly when the real intent is to update the library
- Always verify runtime placement after install
- Always use sync after changing the canonical source
- If the user asks for observability of skill usage, install and verify the disclosure policy as part of the workflow
- Always prefer sandbox validation before writing to global runtimes

## Common Anti-Patterns

- Copying the canonical `saas-skills/` tree directly into `.claude/skills/`
- Installing only Codex and assuming Claude and Cursor will discover the same files
- Fixing a bug only inside `$CODEX_HOME/skills/`, `.claude/skills/`, or `.cursor/rules/` and assuming the other runtimes will magically update
- Writing global Cursor guidance into random docs or settings instead of generating `.mdc` rules
- Treating `~/.cursor/rules/` as if it guaranteed the same behavior and UI visibility as `User Rules`
- Running build, migrations, or app tests just to validate the library runtime
- Skipping verification because the files "look right"

## Fallback

If the runtime scripts are unavailable, fall back to manual placement with the same target rules:

- copy each skill folder into `$CODEX_HOME/skills/<skill>/`
- copy each skill folder into `.claude/skills/<skill>/` or `~/.claude/skills/<skill>/`
- generate one `.mdc` file per skill for `.cursor/rules/` or `~/.cursor/rules/`
- generate the Cursor global bootstrap text for `Settings > Rules`

State clearly that manual fallback is lower-confidence than the repository scripts and re-run structural verification after copying.

## Source References

- Repository runtime guide: `../../IDE_RUNTIME_GUIDE.md`
- Repository operator playbook: `../../TARGET_REPO_AGENT_GUIDE.md`
- Runtime matrix: `../../PORTABILITY_MATRIX.md`
- Root operator overview: `../../../README.md`
- Library overview: `../../README.md`
- Codex native installer behavior: `C:/Users/harry/.codex/skills/.system/skill-installer/SKILL.md`
