---
name: react-saas-architecture
description: "Procedural guide for organizing React components and folder structure in SaaS applications using Next.js App Router, feature-first architecture, formal layouts and widgets when adopted by the repository, top-level feature admission, co-location, and advanced React patterns. Use when scaffolding or reorganizing a Next.js project, creating or promoting a feature root, defining layout/widget ownership, choosing feature-based vs. layer-based organization, deciding where page sections live when a project has no business capabilities (marketing site or landing page), keeping app/ limited to route files, or implementing advanced component patterns."
metadata:
  author: SaaS Frontend Team
  version: 1.3.0
  last_validated: 2026-07-28
  sources:
    - references/folder-structure-patterns.md
    - references/advanced-component-patterns.md
    - Next.js App Router documentation for the version declared in package.json
    - React composition patterns (Kent C. Dodds)
---

# When to Use This Skill

This skill applies when:

- Scaffolding a new Next.js project
- Reorganizing folder structure in an existing project
- Creating, renaming, splitting, or promoting a top-level feature root
- Choosing between feature-based vs. layer-based architecture
- Implementing Compound Components, Headless Components, or Render Props
- Setting up barrel exports and import aliases
- Resolving circular dependencies between features
- Moving to co-located tests, styles, and stories
- Defining naming conventions for the team

Do NOT use this skill for: design system specifications (see `design-system-implementation`), concrete UI value specifications (see `saas-ui-specifications`).

**Platform scope:** for NEW multiplatform platforms (monorepo with
`apps/clients|services|workers` + `packages`, mobile/desktop surfaces, backend
extraction), the platform level belongs to `multiplatform-platform-architecture`
— there, the default taxonomy inside each client app is FSD, not the patterns
below. This skill governs single-app organization and brownfield repos whose
declared architecture is feature-first (repo rules always win).

## Core Workflow

**Reference Document:** See `references/folder-structure-patterns.md` for small-project and monorepo variants, large-feature route layouts, and package extraction examples.

### Step 1: Choose Architecture Pattern

Inspect the repository first. `AGENTS.md`/`CLAUDE.md`, `package.json`,
`tsconfig.json`, `components.json`, `src/app`, existing feature/shared roots,
registries, Storybook files and import aliases override the examples below.
Never invent or replace a feature root before classifying the semantics of its
current siblings.

Two primary patterns exist; hybrid approach recommended for most SaaS projects.

#### Pattern A: Feature-Based (Domain-Driven)

```text
src/
├── features/
│   ├── billing/
│   │   ├── modules/
│   │   │   ├── invoices/
│   │   │   │   ├── components/InvoiceTable.tsx
│   │   │   │   ├── hooks/useInvoices.ts
│   │   │   │   └── index.ts
│   │   │   └── overview/
│   │   │       ├── components/BillingOverview.tsx
│   │   │       └── index.ts
│   │   ├── shared/
│   │   │   ├── lib/calculateTax.ts
│   │   │   └── types/invoice.ts
│   │   ├── index.ts
│   │   └── README.md
│   ├── auth/
│   └── dashboard/
├── app/
└── shared/
```

**Advantages:** Clear feature boundaries, easy to understand "what belongs to billing", simpler to extract or reuse features.
**Disadvantages:** Repeated patterns across features (e.g., each feature has its own hooks folder).

#### Top-Level Feature Admission (MANDATORY)

Feature-first has two different scales:

1. The top level expresses the repository's established product taxonomy —
   usually product areas, bounded contexts or explicitly approved structural
   contexts.
2. Capability-first organization continues inside each owner, usually under
   `modules/`.

Before creating or promoting `features/<name>`:

1. Inspect every existing sibling and state what the first level represents in
   this repository.
2. Identify the product concept and long-term owner for the proposed root.
3. Reject consumer count, file count, independent contracts, tests or internal
   complexity as sufficient admission criteria.
4. Place a technical mechanism — editor, composer, component family, hook,
   adapter or formatter — in the owning area's `modules/<capability>`.
5. If the repository has a formal widget layer, place only layout-owned visual
   integrations in `widgets/<layout-owner>/<widget>`; a business capability is
   never admitted there merely because it renders a large component.
6. Use the shared layer only when the mechanism is domain-neutral; use
   infrastructure only for non-UI technical adapters.
7. If no recognized owner exists, stop and request a product-boundary decision
   instead of inventing a new top-level feature.
8. When repository governance exists, require explicit human approval, an ADR
   or equivalent decision record, and an executable allowlist/gate update.

```text
# BAD when siblings are product areas
features/{billing,crm,fleet,rich-text-composer}

# GOOD: capability remains inside its product owner
features/assistant/modules/composer

# GOOD: a domain-neutral composer can become shared UI
shared/ui/composed/rich-text-composer
```

A capability may expose a stable module entrypoint and serve many consumers
without becoming a top-level feature.

#### Composed UI: Widgets, and When a Layouts Layer Earns Its Keep

Composed product UI — persistent chrome plus the visual integrations placed
inside it — sits between `app` and `features`. There are two valid shapes. Pick
by counting **shells** (persistent structures spanning many routes), not by
taste.

**Shape A — single shell (default).** One shell, so a flat widgets root:

```text
app -> widgets -> features -> shared
```

```text
src/widgets/
├── <app>-shell/         # DESIGNATED SHELL: frame, header, sidebar, navigation
├── account-menu/        # leaf visual integration
└── notification-center/ # leaf visual integration
```

**Shape B — two or more shells** (e.g. authenticated app + public marketing
site). Only then does a separate layer, or a scope segment, carry information:

```text
app -> layouts -> widgets -> features -> shared
```

```text
src/layouts/<layout>/          # persistent structure per shell
src/widgets/<layout>/<widget>/ # widgets scoped by owning layout
```

Do not adopt Shape B speculatively. A layer with one occupant, or a path
segment whose value is always the same word, costs vocabulary and returns
nothing. Migrating A → B later is mechanical.

**Shape 0 — no business capabilities (marketing site, landing page,
documentation site).** Some projects have no `features` at all. A landing page
has sections — hero, pricing, testimonials, footer — and none of them is a
business capability: they hold no domain rule, own no data, expose no user
operation. They are composed product UI, which is the definition of a widget.

```text
app -> widgets -> shared
```

```text
src/widgets/hero/
src/widgets/pricing/
src/widgets/footer/
```

Do NOT create an empty `features/` beside them, and do NOT put page sections
in `features/` because "feature-first" is in the brief. Feature-first is about
ownership, not about the folder being named `features`: in Shape 0 the owner of
each section is the widget.

The tell is a question, not a shape: **what business rule would break if this
folder were deleted?** If the answer is "none, a piece of the page would
disappear", it is a widget.

#### `app/` Contains Only Routes

`app/` holds `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`
and nothing else. Not components, not probes, not stylesheets, not fixtures.

Next.js permits colocating arbitrary files inside `app/` — only reserved
filenames become routes — and that permission is the leak. Colocation is
convenient at the moment of writing and invisible afterwards: a component in
`app/products/` is unreachable to every other route, and nobody notices until
a second consumer needs it.

Two consequences to enforce:

- the global stylesheet belongs in `src/styles/`, not `app/globals.css`; it is
  the design-token system, not a route;
- development-only routes (visual harnesses, token galleries, probe pages)
  belong in a route group whose `layout.tsx` returns `notFound()` outside
  development, and their components belong outside `app/` entirely. A published
  marketing site should resolve exactly the routes it advertises.

Verify by listing: every file under `app/` must be a reserved Next.js filename.

**The rule both shapes must preserve.** A leaf widget never imports a sibling
widget — sideways coupling is what makes a UI graph unverifiable. Something must
be allowed to compose siblings:

- Shape A: the **designated shell**, granted by name in the gate
  (`designatedShellWidget === "<app>-shell"`), never by heuristics like "it
  looks like a shell".
- Shape B: the owning layout, which sits a layer above.

Also enforce downward dependencies: `features` and `shared` never import
composed UI; nothing imports `app`. Consumer count and component size do not
determine placement — a widget is admitted because it is composed product UI
with no central business rule, not because it is visually large.

In Next.js, document the naming boundary explicitly: `app/**/layout.tsx`
controls route hierarchy, while the shell module implements the persistent
structure that routes mount. A principal component may retain a `Shell` suffix
when it represents behavior and integration beyond visual arrangement.

#### Internal Feature Structure (MANDATORY)

Feature-first does not stop at `src/features/`. Inside EVERY feature, the root
contains ONLY two top groups plus its public barrel and docs:

```text
src/features/<feature>/
├── modules/            # functional capabilities of the domain
│   └── <module>/       # e.g. workspace, overview, tracking, categories, chat
│       ├── components/ # UI owned by this capability (ownership BEFORE visual type)
│       ├── hooks/ services/ schemas/ contracts/ domain/ config/ client/ server/ jobs/
│       └── index.ts    # curated public barrel of the module
├── shared/             # ONLY what 2+ modules of THIS feature consume
│   └── components/ hooks/ schemas/ services/ domain/ config/ ...
├── index.ts            # feature public API
└── README.md
```

Non-negotiable rules:

1. NO loose `components/`, `hooks/`, `schemas/`, `services/`, `domain/`, `data/`
   at the feature root — every artifact belongs to a module or to the feature's
   `shared/`. Create folders only when they hold real files.
2. Ownership decides placement: consumed by 1 module → `modules/<m>/...`;
   by 2+ modules of the feature → `<feature>/shared/...`; by 2+ features and
   domain-neutral → `src/shared/...`; global technical mechanism →
   `src/infrastructure/...`; layout-owned visual integration → the repository's
   formal `src/widgets/<layout-owner>/...` layer when one exists.
3. Ownership beats visual type: never organize primarily by
   `dialogs/ cards/ forms/ tables/` — first the owning module, then (optionally,
   with real volume) visual grouping inside it
   (`modules/categories/components/dialogs/{create,edit,delete}`).
4. Module names express capability: `workspace` (full operational area:
   actions, filters, state, flows), `overview` (summary view: KPIs, cards,
   previews), `tracking`, `workflow`, `categories`, `planning`... Avoid `hub`
   as a permanent name and avoid `dashboard` when it collides with a Dashboard
   feature.
5. Cross-feature imports go through public entrypoints only: the feature root
   barrel or `features/<f>/modules/<m>` (plus its
   `client`/`server`/`contracts`).
   Never deep-import another feature's internals.
6. Naming inside modules is responsibility-first: never a generic `root/`
   folder; never repeat the parent's name without need; use the shortest
   precise semantic name for the responsibility. Homonym file/folder
   (`view/view.tsx`) is the DEFAULT for a module's main artifact, not an
   obligation — `shell/frame.tsx` is correct when the file is only the frame.

#### Pattern B: Layer-Based (Type-Based)

All UI in `components/`, all hooks in `hooks/`, all utilities in `lib/`.
Flat and easy to scan, but monolithic: features are hard to extract and names
collide across domains. Avoid for anything beyond a small project. Reference
tree: `references/folder-structure-patterns.md`.

#### Pattern C: Hybrid (Recommended)

Feature-based for domains (billing, auth, dashboard) plus a layer-based shared
tier for cross-cutting concerns (ui primitives/composed, cross-feature hooks,
lib, global types). Reference tree with the full hybrid layout:
`references/folder-structure-patterns.md`.

### Step 2: Apply Co-Location Principle

Store tests, styles, stories, and types **next to** the component, not in separate folders.

```text
src/components/ui/primitives/button/
├── button.tsx
├── button.test.tsx
├── button.stories.tsx
├── button.module.css   (or .css file if using CSS Modules)
├── button.types.ts     (if types are complex)
└── index.ts
```

**Why:** Reduces cognitive load, easier refactoring (move one folder), clear dependencies.

**Alternative for shared styles:** Use Tailwind CSS with `cn()` utility (eliminates need for `.css` files for many projects).

### Step 3: Configure Next.js App Router Structure

```text
src/app/
├── (auth)/                 (route group: shared layout for auth pages)
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   └── layout.tsx
├── (dashboard)/            (route group: shared layout for app pages)
│   ├── layout.tsx
│   ├── page.tsx            (dashboard home)
│   ├── billing/
│   │   └── page.tsx
│   └── settings/
│       └── page.tsx
├── layout.tsx              (root layout)
└── page.tsx                (landing page)
```

#### Rules

- Use **route groups** `(auth)`, `(dashboard)` to share layouts without affecting URL.
- Place `layout.tsx` at the level where layout is first needed.
- Colocate API routes in `src/app/api/` when the repo uses a `src/` root (e.g., `src/app/api/invoices/route.ts`).
- Use `middleware.ts` or `proxy.ts` only when the repo already has one for global auth, redirects, or routing policy.

### Step 4: Set Up Barrel Exports (index.ts)

**Barrel Export Pattern:** Single `index.ts` re-exports all public APIs from a folder.

```typescript
// src/components/ui/primitives/index.ts
export { Button } from "./Button";
export { Input } from "./Input";
export { DataTable } from "./DataTable";
export type { ButtonProps, InputProps } from "./types";
```

#### Import from barrel

```typescript
import { Button, Input, DataTable } from "@/components/ui/primitives";
```

**Advantage:** Clean imports, easier refactoring (move files without changing imports).

**Caveat — Tree-Shaking:** Barrels can break tree-shaking if they export side effects. Use **named exports only**; avoid default exports in barrels.

#### Runtime-specific entrypoints

Mixed-runtime modules expose curated `client`, `server` and `contracts`
entrypoints. Client code and stories never import a bare server barrel; neutral
types live in contracts. Keep large registries out of small client adapters and
enforce the split mechanically. See the runtime-boundary checklist in
`references/folder-structure-patterns.md`.

```typescript
// ❌ BAD: default export can break tree-shaking
export { default as Button } from "./Button";

// ✅ GOOD: named export
export { Button } from "./Button";
```

### Step 5: Establish Naming Conventions

| Element          | Convention                         | Example                         |
| ---------------- | ---------------------------------- | ------------------------------- |
| Folders          | kebab-case                         | `ui/composed/invoice-table/`    |
| Components       | PascalCase                         | `InvoiceTable`                  |
| Hooks            | camelCase with `use` prefix        | `useInvoices`                   |
| Utilities        | camelCase                          | `calculateTax`                  |
| Types/interfaces | PascalCase                         | `Invoice`, `BillingContextType` |
| Constants        | UPPER_SNAKE_CASE (team-consistent) | `MAX_INVOICE_SIZE`              |

Enforce consistently across the team; code examples live in
`references/folder-structure-patterns.md`.

### Step 6: Implement Advanced React Patterns

Use composition over inheritance. Choose compound components for coordinated
children, headless hooks/components for reusable behavior, controlled and
uncontrolled APIs where both are useful, and ref forwarding only when the
consumer needs DOM access. Detailed examples live in
`references/advanced-component-patterns.md`.

### Step 7: Resolve Circular Dependencies

**Problem:** Feature A imports from Feature B, Feature B imports from Feature A.

Solutions, in order of preference: (1) move the shared code down to the repo's
shared layer (`src/types`, `src/hooks`, `src/lib`, `src/components/ui`) so
both features import it; (2) invert with dependency injection — pass the other
feature's behavior via props/context instead of importing it; (3) split the
feature into public vs internal surfaces so only the public entrypoint is
importable. Worked examples: `references/folder-structure-patterns.md`.

## Advanced Cases

For monorepo package layouts, feature sub-routes, and extraction-to-package workflows, use `references/folder-structure-patterns.md` instead of expanding the main skill. Keep this `SKILL.md` focused on the default SaaS architecture path.

## Fallback Clause

If the following information is missing, output `[INFORMATION NEEDED: X]` instead of inventing:

- Primary architecture pattern preference (feature-based vs. layer-based vs. hybrid)
- Team size and project complexity (influences pattern choice)
- Monorepo vs. single repo decision
- Shared component library requirements
- CI/CD constraints (affects folder structure)

Do NOT guess folder structure without understanding project scope.

## Anti-Patterns

### Deeply Nested Folders (>4 levels)

```text
// ❌ BAD
src/components/features/billing/pages/components/ui/forms/inputs/

// ✅ GOOD
src/components/features/billing/
```

#### God Components (>300 lines)

```typescript
// ❌ BAD: single 500-line BillingPage component
// ✅ GOOD: BillingPage imports BillingOverview, InvoiceTable, etc.
```

#### Prop Drilling Through 3+ Levels

```typescript
// ❌ BAD
<Page user={user}><Section user={user}><Card user={user} /></Section></Page>

// ✅ GOOD
<UserContext.Provider value={user}><Page /></UserContext.Provider>
```

#### Circular Dependencies Between Features

```typescript
// ❌ BAD
features/billing imports features/auth
features/auth imports features/billing

// ✅ GOOD
Both import from src/types, src/hooks, or src/lib
```

#### Mixed Named and Default Exports / Barrels with Side Effects

Named exports only (`export { Button }`, `export type { ButtonProps }`);
never `export default` in barrels, and never re-export a module that executes
side effects on import — both break tree-shaking and refactoring.

## Enforcement

This skill is MANDATORY and must be followed without exception when its trigger fires.

When organizing React/Next.js code:

1. Follow the repository's declared architecture; for a formal composition
   model, enforce `app -> layouts -> widgets -> features -> shared`.
2. Co-locate tests, styles, and types with components.
3. Use barrel exports (index.ts) with named exports only.
4. Keep folders to max 4 levels deep.
5. Limit components to ~300 lines; extract if larger.
6. Never prop-drill beyond 2 levels; use context.
7. Establish naming conventions and enforce consistently.
8. Require semantic admission rules and executable import/allowlist gates for
   top-level features, layouts, and widgets.
9. Use curated `client`/`server`/`contracts` entrypoints for mixed-runtime
   modules; never expose server implementation through a client barrel.

## Source References

- **Reference file:** `references/folder-structure-patterns.md`
- **Component patterns:** `references/advanced-component-patterns.md`
- **External background:** Next.js App Router docs, React composition patterns, TypeScript module resolution
