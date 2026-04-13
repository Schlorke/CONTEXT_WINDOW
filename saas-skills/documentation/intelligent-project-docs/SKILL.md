---
name: intelligent-project-docs
description: Procedural guide for structuring project documentation as persistent memory for both human developers and AI agents, using hierarchical organization (Global/System/Local layers), AGENTS.md as AI entry point, Diátaxis framework, Docs-as-Code methodology, Architecture Decision Records, and progressive disclosure.
metadata:
  author: SaaS Skills Library
  version: 1.0
  last_validated: "2026-04-12"
  sources:
    - "Daniele Procida's Diátaxis Framework"
    - "README-Driven Development (Tom Preston-Werner)"
    - "Architecture Decision Records (Michael Nygard)"
    - "ISO 5966 - Information and documentation"
    - "RFC 2119 - Key words for use in RFCs"
---

# When to Use This Skill

Use this skill when:

- Setting up project documentation from scratch
- Creating or updating AGENTS.md as an AI entry point
- Organizing documentation hierarchy across a project
- Writing Architecture Decision Records (ADRs)
- Applying the Diátaxis framework to existing docs
- Implementing Docs-as-Code methodology
- Structuring documentation to be consumable by AI agents between sessions
- Establishing documentation governance and update processes

**Triggers:** project documentation, AGENTS.md, documentation structure, ADR, Diátaxis, docs-as-code, documentation hierarchy, README-driven development, persistent memory, documentation governance.

## Core Workflow

### 1. Establish the Documentation Layer Hierarchy

Documentation operates at three layers:

**Global Layer** (Project-wide)

- README.md — project purpose, quick start, contribution guidelines
- AGENTS.md — AI agent entry point (under 500 lines)
- CONTRIBUTING.md — contributor workflow
- LICENSE — legal framework

**System Layer** (Module/subsystem level)

- Module READMEs — subsystem purpose, exports, dependencies
- Architecture documentation — system design, component relationships
- ADR folder — decisions and their rationale

**Local Layer** (File/function level)

- Code comments — "why" not "what"
- JSDoc/docstrings — function signatures and intent
- Inline explanations — complex logic

### 2. Create AGENTS.md as Primary AI Entry Point

AGENTS.md is the first document an AI agent reads. It must answer:

- What is this project and why does it exist?
- What is the technology stack?
- How is the codebase organized?
- What are the key conventions?
- Where do I find deeper information?

Keep AGENTS.md under 500 lines. Update it whenever architecture changes materially. Use the provided template in assets/agents-md-template.md.

#### Required sections

- Project Overview (2-3 sentences)
- Tech Stack (with versions)
- Project Structure (folder tree with descriptions)
- Key Conventions (naming, patterns, standards)
- Architecture Overview (C4 Level 1 diagram)
- Important Files (critical file map)
- Known Issues (link to tracking)
- Further Reading (links to module docs, ADRs)

### 3. Implement Documentation Principles

#### Principle 1: Single Source of Truth

Each piece of information lives in exactly one authoritative location. Reference that location rather than duplicate. Example: API endpoint behavior documented once in API reference, not repeated in multiple guides.

#### Principle 2: Modularity

Each document is self-contained and can be read independently. Include necessary context rather than forcing readers to read prerequisites. Provide links for deeper exploration.

#### Principle 3: Metadata

Every non-trivial document must include: publication date, author/maintainer, status (draft/accepted/deprecated), scope (what it covers), and update frequency. Example:

```text
---
title: Database Schema Design
status: accepted
date: 2024-08-15
author: Backend Team
scope: Schema changes, migration procedures
updated: Monthly or when schema changes
---
```

#### Principle 4: Normative Language (RFC 2119)

Use precise language to indicate requirement strength:

- MUST/MUST NOT — absolute requirement
- SHOULD/SHOULD NOT — strong recommendation, deviation only with good reason
- MAY — genuinely optional
- CAN — technical capability without requirement

#### Principle 5: Traceability

Link backwards and forwards: Requirements → Decisions (ADRs) → Implementation → Tests. Enable navigation between abstraction levels.

### 4. Apply Diátaxis Framework

Organize documentation into four types:

**Tutorials** (Learning-oriented)

- Goal: Enable beginners to accomplish a basic task
- Structure: Step-by-step, assume minimal prior knowledge
- Example: "Getting Started with Project Setup"

**How-to Guides** (Task-oriented)

- Goal: Help someone accomplish a specific goal
- Structure: Steps toward goal, assume domain knowledge
- Example: "How to Add a New API Endpoint"

**Reference** (Information-oriented)

- Goal: Provide accurate, complete technical information
- Structure: Organized for lookup, not narrative
- Example: "Configuration Options Reference"

**Explanation** (Understanding-oriented)

- Goal: Deepen understanding of design decisions and tradeoffs
- Structure: Discuss context, alternatives, reasoning
- Example: "Why We Chose PostgreSQL Over MongoDB"

Every section of your documentation belongs in exactly one category. Mixing categories confuses readers.

### 5. Implement Docs-as-Code

- **Location:** Documentation lives in the repository alongside code
- **Format:** Markdown for all documentation
- **Versioning:** Docs are versioned with code (same commit SHAs)
- **Review:** Documentation changes reviewed in pull requests
- **CI Checks:** Automated link validation, spell check, orphaned doc detection
- **Publishing:** Build system generates HTML/PDF from source
- **Branching:** Apply same branching strategy to docs as code

### 6. Create ADRs for Significant Decisions

Use Architecture Decision Records to document "why" decisions were made. Store in `docs/adr/` folder, numbered sequentially (0001-xxx.md, 0002-yyy.md).

#### ADR Structure

- **Title:** Brief noun phrase describing the decision
- **Date:** When the decision was made
- **Status:** proposed, accepted, deprecated, superseded by ADR-XXXX
- **Context:** Problem statement, constraints, background
- **Decision:** What was decided and why (the "why" is critical)
- **Consequences:** Positive outcomes and tradeoffs

Example context: "We needed to cache user sessions across microservices without a shared database."
Example decision: "We chose Redis with JSON serialization because it provides sub-millisecond lookup and handles serialization transparently."
Example consequences: "Positive: 99th percentile latency improved 40ms. Negative: added Redis operational overhead; requires cache invalidation strategy."

### 7. Establish Documentation Update Process

- Add docs/ folder to PR template: "Does this PR require documentation changes?"
- Require docs updates for: API changes, config option changes, architectural changes, new deployment procedures
- Use automation to flag stale docs (last updated >6 months ago for fast-moving areas)
- Assign documentation review to appropriate team member in code review

### 8. Implement Known Issues Tracking

Maintain a KNOWN_ISSUES.md file to prevent AI (and humans) from "fixing" documented limitations. Format:

```text
## Issue: Slow Query on Reports Dashboard

Description: Generating reports >10K rows takes >30 seconds.
Impact: Users experience timeouts on large datasets.
Workaround: Filter dataset before report generation.
Planned Fix: Database indexing strategy (Q3 2026).
Status: Active
```

## Advanced Cases

**Multi-Team Projects:** Create team-specific READMEs within subsystem folders. AGENTS.md points to team entry points. Prevents documentation proliferation while maintaining clarity.

**Distributed Documentation:** When docs span multiple platforms (wiki, API docs, runbooks), create a "documentation manifest" that maps each doc type to its location and owner. Link from AGENTS.md to manifest.

**Evolving Architecture:** When planning architectural changes, write ADR before implementation. Update ADR.status to "proposed" first, gather feedback in PR, accept after discussion. This creates a decision history.

**Onboarding Scale:** As team grows, move role-specific docs (DevOps runbooks vs. frontend contributor guides) into separate docs but hyperlink from AGENTS.md. Progressive disclosure prevents cognitive overload.

**Legacy Code:** When documenting legacy systems, ADRs become even more critical. Document "why is it this way?" rather than "why isn't it the better way?" This respects existing knowledge and constrains refactoring.

## Fallback Clause

If critical information is missing from the documentation:

- Output `[INFORMATION NEEDED: {specific info}]` rather than inventing or guessing
- Flag in the document itself: `<!-- TODO: Architecture diagram pending -->` with date and owner
- Create tracking issue linked from doc
- Do not let missing information become an excuse to skip documentation; document what you know and mark gaps clearly

## Anti-Patterns

### Anti-Pattern 1: Documentation Separate from Code

Documentation in a wiki that's never updated with code changes. Result: stale, untrustworthy docs. Instead: docs live in repo, versioned with code.

#### Anti-Pattern 2: No AGENTS.md

AI agents must spend cycles inferring project structure. Result: inconsistent navigation, missed dependencies. Solution: provide AGENTS.md.

#### Anti-Pattern 3: ADRs Without Context

ADR reads "Decision: Use PostgreSQL" with no context. Result: decision is meaningless to future readers. Solution: include constraints, alternatives considered, and reasoning.

#### Anti-Pattern 4: Monolithic Documentation

Single 50-page "Architecture Guide." Result: defeats progressive disclosure; AI loads unnecessary context. Solution: split by concern; link between docs.

#### Anti-Pattern 5: No Metadata

No publication date on docs. Result: reader can't assess freshness. Solution: include date, status, author, and update frequency on all docs.

#### Anti-Pattern 6: Mixing Diátaxis Categories

"How to" section that includes explanation of _why_. Result: tutorial readers get confused. Solution: keep categories pure; link between them.

#### Anti-Pattern 7: Documentation Debt

"We'll document it after launch." Result: never happens. Solution: document during development (README-Driven Development).

## Enforcement

This skill is MANDATORY and must be followed without exception when its trigger fires. Specifically:

- AGENTS.md must exist at project root before any AI agent onboarding
- AGENTS.md must be reviewed and updated in every PR that materially changes architecture
- ADRs must be created for decisions with long-term implications (database choice, API design, auth strategy)
- Every documentation layer (Global/System/Local) must follow the principles outlined in Section 3
- Documentation updates must be part of the code review process (not a separate, optional step)
- Known issues must be tracked and linked to prevent incorrect "fixes" by AI or humans

## Source References

- Daniele Procida. "Diátaxis Framework" — <https://diataxis.fr>
- Tom Preston-Werner. "README Driven Development" — <https://tom.preston-werner.com/2010/08/23/readme-driven-development.html>
- Michael Nygard. "Documenting Architecture Decisions" (ADR format) — <https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions>
- IETF RFC 2119. "Key words for use in RFCs to Indicate Requirement Levels" — <https://tools.ietf.org/html/rfc2119>
- ISO 5966:2020. "Information and documentation — Presentation of scientific and technical reports"
- Write the Docs. "Good Documentation" — <https://www.writethedocs.org/guide/>
