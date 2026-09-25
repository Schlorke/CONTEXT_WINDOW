---
name: legacy-code-refactoring
description: "Refactor legacy code safely and migrate existing products to the architecture contract: inventory, characterization tests, incremental moves, architecture gate, retirement of replaced code; code smells and hotspots. Use when modernizing a repo, adopting the contract or refactoring untested code."
metadata:
  author: Engineering Standards Team
  version: "1.1"
  last_validated: "2026-04-12"
  sources:
    - Michael Feathers, "Working Effectively with Legacy Code"
    - Martin Fowler, "Refactoring: Improving the Design of Existing Code"
    - Robert C. Martin, "Clean Code: A Handbook of Agile Software Craftsmanship"
    - Kent Beck, "Test-Driven Development: By Example"
    - Adam Tornhill, "Code as a Crime Scene"
    - Sandi Metz, "Practical Object-Oriented Design"
---

# When to Use This Skill

## Operational Contract

| Field | Contract |
| --- | --- |
| Objective | Refactor legacy code safely and, when adoption is authorized, migrate a product repository to the mandatory contract (thin web/mobile clients + packages/frontend in FSD + packages/ui + packages/design-tokens) without changing behavior. |
| Use when | Inheriting or modernizing a legacy codebase, adopting the architecture contract in an existing product, writing characterization tests, hotspot analysis, removing code smells. |
| Do not use when | Brand-new projects (use multiplatform-platform-architecture scaffold) or small edits that already fit the contract. |
| Inputs | The legacy repository, its routes and public contracts, approved design, integrations and data. |
| Preconditions | Explicit authorization to change the repository; a way to run its tests and build. Installing skills never authorizes a migration. |
| Tools | `scripts/legacy-inventory.mjs` (inventory and gap report), characterization tests, `tools/arch-check.mjs` from multiplatform-platform-architecture, git history for hotspots. |
| Procedure | Contract Adoption Procedure below, then the Core Workflow for refactorings inside each move. |
| Output | Migrated repository (or an explicitly labeled intermediate state), migration log, characterization tests passing before and after, retired legacy structures. |
| Validation | Same characterization cases pass on legacy and migrated code; `pnpm arch` passes (or lists only the violations of the declared intermediate state); web build and mobile bundle succeed. |
| Known failures | Moving folders without fixing ownership and imports, rewriting behavior during a move, deleting legacy code before the replacement passes, calling an intermediate state "conformant". |

## Contract Adoption Procedure (MANDATORY)

Applies when a task authorizes adopting or modernizing a product repository with a frontend.

1. **Inventory.** Run `node <this-skill>/scripts/legacy-inventory.mjs --root <repo>`. It lists
   framework, routes, type-based folders (`components/`, `hooks/`, `utils/`...), gaps against the
   topology and a first mapping proposal. Record public contracts that must not change: routes,
   URLs/SEO metadata, API calls, analytics events, persisted data.
2. **Characterize.** Before moving anything, write characterization tests against the current
   behavior: pure logic (inputs → outputs), rendered text and roles of each route, API payloads.
   Store the cases as data (for example `characterization/cases.json`) so the same cases run
   against the legacy and the migrated code through two thin adapters.
3. **Target skeleton.** Create the missing topology from the multiplatform template
   (`apps/clients/web`, `apps/clients/mobile`, `packages/frontend`, `packages/ui`,
   `packages/design-tokens`). The web client takes over the legacy routes; the mobile client
   renders the same pages.
4. **Move incrementally.** One concept at a time, following the mapping:
   generic UI primitives → `packages/ui` (contract + `.web` + `.native`); business views and models →
   `entities/<noun>`; user interactions → `features/<verb>`; composed blocks → `widgets/`; screen
   content → `pages/<page>`; route files → clients. Fix imports to public APIs in the same change,
   move tokens out of components into `packages/design-tokens`, keep behavior identical.
5. **Gate each step.** After each move run the characterization tests and `pnpm arch`. An
   intermediate state may keep a documented list of known violations; it is labeled
   "intermediate" in the migration log and never reported as final conformity.
6. **Retire.** Delete the legacy structure only after its replacement passes the same cases. The
   final state has no type-based folders, no duplicate component sources and a clean gate.
7. **Prove both clients.** `pnpm build:web` and `pnpm bundle:mobile` (and native builds when the
   environment allows) complete the migration evidence.

Mapping heuristics (always confirmed by reading the code):

| Legacy location | Destination |
| --- | --- |
| `components/Button.tsx`, generic inputs, layout primitives | `packages/ui` |
| `components/<BusinessThing>*.tsx` | `entities/<thing>/ui` or `widgets/<block>/ui` |
| `hooks/use<Action>.ts` with state changes | `features/<action>/model` |
| `hooks/use<Thing>Query.ts`, `services/<thing>.ts` | `entities/<thing>/api` |
| `utils/format*.ts` with business meaning | `entities/<thing>/model`; generic ones `shared/lib/<focus>` |
| `pages/<route>.tsx` / `app/<route>/page.tsx` | route file in `apps/clients/web` + `pages/<page>/ui` |
| hardcoded colors/spacing | `packages/design-tokens` |

## Definition

**Legacy code** = any code without tests that you are afraid to change (Michael Feathers). In React/TypeScript contexts, this includes components, hooks, utilities, or API routes that lack test coverage and have accumulated unclear behavior over time.

## Core Workflow

### Phase 1: Initial Audit (1–2 days)

1. **Map folder structure and ownership**: Inspect the real tree, Git state,
   consumers, domain vocabulary, route/API boundaries, tenant/RBAC scope and
   existing public entrypoints. Documentation and a green gate are supporting
   evidence, not proof of semantic ownership.
2. **Run dependency and runtime analysis**: Use the repository's graph tooling
   to flag cycles, upward imports, deep imports and browser code that reaches a
   server barrel. Distinguish public `client`, `server` and `contracts`
   surfaces when the module spans runtimes.
3. **Count files and complexity**: Lines of code per file, number of components per folder. Files >300 lines are candidates for splitting.
4. **Run static analysis**: ESLint (code quality), TypeScript in strict mode (type safety), Prettier (consistency).
5. **Measure bundle size**: use the repo build script, e.g. `pnpm build`, then inspect `.next/` or use `webpack-bundle-analyzer`. Identify large chunks.
6. **List untested code**: use the repo test script, e.g. `pnpm exec vitest run --coverage` or `pnpm test:run`. Export files with 0% coverage.

**Output**: Audit report with file counts, circular dependencies, coverage gaps, bundle size.

For structural-only work, record the invariants before editing: behavior,
markup, styles, animations, URLs, APIs, authorization, tenant filtering and
database effects. A move is complete only after old aliases are absent and the
new public entrypoints are exercised by real consumers.

### Phase 2: Hotspot Analysis (git-based metrics, 1 day)

Use git history to find high-risk files:

**Change frequency**: Files modified most often.

```text
git log --oneline --name-only | sort | uniq -c | sort -rn | head -20
```

**Temporal coupling**: Files changed together.

```text
git log --oneline --pretty="" --name-only | sort | uniq -c | sort -rn
```

**Knowledge distribution**: Files changed by most people.

```text
git log --pretty="%aN" --name-only -- src/ | sort | uniq -c | sort -rn
```

**Prioritize**: High change frequency + low test coverage + complex logic = hotspot. Focus refactoring efforts here.

### Phase 3: Characterization Tests (before refactoring)

Before refactoring untested code, capture its CURRENT behavior in tests (even if buggy):

1. **Run the code**: Call the function/hook/component with various inputs.
2. **Observe output**: Note the return value, side effects, rendered DOM, API calls.
3. **Write assertion**: Assert that output matches observed behavior.
4. **Example** (React component):

   ```text
   it("renders user list when data loads", async () => {
     render(<UserList />);
     await waitFor(() => {
       expect(screen.getByText("User 1")).toBeInTheDocument();
     });
   });
   ```

These tests are your safety net. They document current behavior and prevent accidental regressions during refactoring.

### Phase 4: Code Smell Identification

Common React/TypeScript code smells:

- **God Component**: Single component >300 lines. Mixes UI, business logic, API calls. Extract hooks and child components.
- **Prop Drilling**: Props passed through 4+ levels of intermediate components. Replace with Context, Zustand, or custom hook.
- **Copy-Paste Components**: Multiple similar components with duplicated JSX. Extract shared component or use composition.
- **Mixed Concerns**: Component handles UI rendering AND business logic AND state management. Separate: use custom hooks for logic.
- **Any-fest**: TypeScript `any` type used to bypass strict mode. Refactor to proper types; use generics if needed.
- **Dead Code**: Unused functions, components, imports. Run `ts-unused-exports` or ESLint rules.
- **Circular Dependencies**: A imports from B, B imports from A. Extract shared code to third module C.

### Phase 5: Safe Refactoring (Red-Green-Refactor)

**Principle**: Never refactor and change behavior simultaneously.

1. **RED**: Write a test for the DESIRED behavior (it fails).
2. **GREEN**: Make minimal code changes to pass the test. Behavior changes here.
3. **REFACTOR**: Improve code structure while tests pass. No behavior changes.

**Common refactoring moves**:

- Extract Component: Large component → smaller, focused component.
- Extract Hook: Repeated logic → custom hook (e.g., `useAuth`, `usePagination`).
- Extract Utility: Business logic → pure function (easier to test, reuse).
- Lift State Up: State in child → move to parent for shared access.
- Push State Down: State in parent → move to child if only child uses it.
- Replace Prop Drilling with Context/Zustand: Props through 4+ levels → shared state container.
- Rename for Clarity: Vague names → descriptive names (e.g., `data` → `cachedUserProfiles`).
- Split Route Handler: Single API route handling GET, POST, PUT → separate routes or internal functions.
- Convert Class Component to Function: Old React class → modern function + hooks.

### Phase 6: SOLID Principles in React/TypeScript

- **S (Single Responsibility)**: One component or hook per concern. A component renders; a hook manages one piece of state or side effect.
- **O (Open/Closed)**: Extend via composition (children, HOCs, render props) rather than modifying existing code.
- **L (Liskov Substitution)**: Components honor parent interface contracts. If parent expects `Comp<{ data: User[] }>`, child must accept that shape.
- **I (Interface Segregation)**: Pass only the props components need. Avoid passing 10 props when component uses 3.
- **D (Dependency Inversion)**: Inject services/functions rather than importing them directly. Easier to test and swap implementations.

### Phase 7: Tooling Automation

#### Validation cadence for large refactors

Keep feedback proportional while files are still moving:

1. During iteration, run only the smallest check that can inform the next edit
   (focused tests, type check for the touched boundary, or a narrow static
   search).
2. Finish code, imports, tests, docs, changelog and generated context before the
   expensive repository-wide gate.
3. Run the comprehensive gate once at the stable closeout point. If it fails,
   fix the specific cause and resume from the smallest relevant stage; do not
   repeatedly restart unchanged expensive suites.
4. Limit verbose command output and retain concise summaries with exit status,
   test counts and the first actionable failure. Tool logs consume agent context
   and user budget just like source files.
5. If the user restricts commands, cost or timing, that instruction overrides
   the default verification cadence immediately.

- **ESLint**: Rules for code quality. Run `eslint src/ --fix` to auto-fix.
- **Prettier**: Auto-format code. Integrate into editor and CI.
- **TypeScript strict**: `tsconfig.json`: `strict: true`. Catches type errors early.
- **madge**: Dependency graph visualization. `madge --extensions ts,tsx src/`.
- **bundlesize**: Monitor bundle impact. Fail CI if bundle grows unexpectedly.
- **Vitest**: Fast unit test runner. Run with `--coverage` to track untested code.
- **Playwright**: E2E test automation. Validate refactorings don't break user flows.

## Advanced Cases

**Circular dependency resolution**: When A ↔ B circularly import, extract shared types/utilities to module C. Update A and B to import from C.

**Large migration**: Refactoring >50 files? Preserve behavior through stable
public entrypoints, adapters and characterization tests. Migrate by semantic
owner, search removed aliases globally, and reserve the full quality gate for
the completed migration. Use feature flags only when runtime behavior changes;
purely structural moves do not need parallel implementations by default.

**Type-safe refactoring**: Use TypeScript `as const` assertions, conditional types, and generics to enforce correctness during refactoring.

**Performance-critical hotspots**: Profile with Lighthouse, Chrome DevTools, or `performance.measure()`. Refactor only after identifying bottleneck (e.g., unnecessary re-renders, expensive calculations).

## Fallback Clause

If the following information is missing, output `[INFORMATION NEEDED: X]` instead of inventing:

- `[INFORMATION NEEDED: current test coverage (%)]` if coverage metrics are unavailable.
- `[INFORMATION NEEDED: git hotspot data]` if git history is inaccessible.
- `[INFORMATION NEEDED: component dependency map]` if tooling cannot generate it.
- `[INFORMATION NEEDED: stakeholder approval for scope]` before refactoring production code.

## Anti-Patterns

- **Refactoring without tests**: Writing tests after refactoring defeats the purpose. Write characterization tests first.
- **Big-bang rewrite**: Rewriting entire codebase at once. Refactor incrementally, validating at each step.
- **Refactoring + feature development**: Never mix. Finish refactoring, deploy, stabilize, then add features.
- **Ignoring hotspots**: Refactoring code with zero git churn is waste. Use git metrics to prioritize.
- **Perfectionism**: Aim for "good enough," not perfect. Stop when code is testable and maintainable.
- **No stakeholder communication**: Refactoring takes time. Align with product team on timeline.
- **Bundle size regression**: Refactoring may increase bundle. Monitor and optimize imports (tree-shaking, lazy loading).
- **Full-gate thrashing**: Re-running the complete lint/test/build pipeline
  while imports and docs are still changing wastes time, tokens and attention.
  Use targeted feedback during edits and one comprehensive closeout.

## Enforcement

This skill is MANDATORY and must be followed without exception when its trigger fires. Skipping characterization tests or hotspot analysis will result in regressions and wasted effort.

## Source References

- Feathers, Michael. _Working Effectively with Legacy Code_. Prentice Hall, 2004.
- Fowler, Martin. _Refactoring: Improving the Design of Existing Code_. Addison-Wesley, 2018.
- Martin, Robert C. _Clean Code: A Handbook of Agile Software Craftsmanship_. Prentice Hall, 2008.
- Beck, Kent. _Test-Driven Development: By Example_. Addison-Wesley, 2002.
- Tornhill, Adam. _Code as a Crime Scene_. Pragmatic Bookshelf, 2015.
- Metz, Sandi. _Practical Object-Oriented Design_. Addison-Wesley, 2018.
