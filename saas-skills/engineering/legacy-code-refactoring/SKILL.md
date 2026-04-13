---
name: legacy-code-refactoring
description: Operational manual for safely refactoring and reorganizing legacy code in Next.js/React/TypeScript SaaS projects, covering initial audit, code smell identification, characterization tests, SOLID application, hotspot analysis (git-based metrics), safe refactoring workflow (Red-Green-Refactor), and tooling automation. Use when inheriting a legacy codebase, planning a refactoring sprint, identifying code smells, writing characterization tests for untested code, analyzing git hotspots, or reorganizing a messy project structure.
metadata:
  author: Engineering Standards Team
  version: "1.0"
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

Trigger this skill when:

- You inherit a legacy codebase without comprehensive test coverage.
- You plan a refactoring sprint to reduce technical debt.
- You identify code smells (God Components, prop drilling, copy-paste code).
- You need to write characterization tests for untested code.
- You analyze git history to find hotspots (high-churn files).
- You reorganize a messy project structure.
- You apply SOLID principles to existing React/TypeScript code.

This skill is MANDATORY and must be followed without exception when its trigger fires.

## Definition

**Legacy code** = any code without tests that you are afraid to change (Michael Feathers). In React/TypeScript contexts, this includes components, hooks, utilities, or API routes that lack test coverage and have accumulated unclear behavior over time.

## Core Workflow

### Phase 1: Initial Audit (1–2 days)

1. **Map folder structure**: Run `tree -L 3 -I node_modules` or similar. Identify: core features, shared utilities, API routes, hooks, components.
2. **Run dependency analysis**: Use `madge --extensions ts,tsx src/` or `dependency-cruiser` to visualize import graphs. Flag circular dependencies.
3. **Count files and complexity**: Lines of code per file, number of components per folder. Files >300 lines are candidates for splitting.
4. **Run static analysis**: ESLint (code quality), TypeScript in strict mode (type safety), Prettier (consistency).
5. **Measure bundle size**: `npm run build && ls -lh .next/` or use `webpack-bundle-analyzer`. Identify large chunks.
6. **List untested code**: `vitest --coverage --run` or similar. Export files with 0% coverage.

**Output**: Audit report with file counts, circular dependencies, coverage gaps, bundle size.

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

- **ESLint**: Rules for code quality. Run `eslint src/ --fix` to auto-fix.
- **Prettier**: Auto-format code. Integrate into editor and CI.
- **TypeScript strict**: `tsconfig.json`: `strict: true`. Catches type errors early.
- **madge**: Dependency graph visualization. `madge --extensions ts,tsx src/`.
- **bundlesize**: Monitor bundle impact. Fail CI if bundle grows unexpectedly.
- **Vitest**: Fast unit test runner. Run with `--coverage` to track untested code.
- **Playwright**: E2E test automation. Validate refactorings don't break user flows.

## Advanced Cases

**Circular dependency resolution**: When A ↔ B circularly import, extract shared types/utilities to module C. Update A and B to import from C.

**Large migration**: Refactoring >50 files? Use feature flags. Migrate incrementally. Keep old code alongside new code until confident. Remove old code in separate PR after validation.

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

## Enforcement

This skill is MANDATORY and must be followed without exception when its trigger fires. Skipping characterization tests or hotspot analysis will result in regressions and wasted effort.

## Source References

- Feathers, Michael. _Working Effectively with Legacy Code_. Prentice Hall, 2004.
- Fowler, Martin. _Refactoring: Improving the Design of Existing Code_. Addison-Wesley, 2018.
- Martin, Robert C. _Clean Code: A Handbook of Agile Software Craftsmanship_. Prentice Hall, 2008.
- Beck, Kent. _Test-Driven Development: By Example_. Addison-Wesley, 2002.
- Tornhill, Adam. _Code as a Crime Scene_. Pragmatic Bookshelf, 2015.
- Metz, Sandi. _Practical Object-Oriented Design_. Addison-Wesley, 2018.
