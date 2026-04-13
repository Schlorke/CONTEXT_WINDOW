---
name: react-saas-architecture
description: "Procedural guide for organizing React components and folder structure in SaaS applications using Next.js App Router, feature-based architecture, co-location principles, and advanced React patterns. Use when scaffolding a new Next.js project, reorganizing folder structure, choosing between feature-based vs. layer-based, or implementing advanced component patterns. Triggers on: folder structure, project organization, feature-based architecture, component patterns, App Router structure, barrel exports, code organization."
metadata:
  author: SaaS Frontend Team
  version: 1.0.0
  last_validated: 2026-04-12
  sources:
    - references/folder-structure-patterns.md
    - Next.js 15.x App Router documentation
    - React composition patterns (Kent C. Dodds)
---

# When to Use This Skill

This skill applies when:

- Scaffolding a new Next.js project
- Reorganizing folder structure in an existing project
- Choosing between feature-based vs. layer-based architecture
- Implementing Compound Components, Headless Components, or Render Props
- Setting up barrel exports and import aliases
- Resolving circular dependencies between features
- Moving to co-located tests, styles, and stories
- Defining naming conventions for the team

Do NOT use this skill for: design system specifications (see `design-system-implementation`), concrete UI value specifications (see `saas-ui-specifications`).

## Core Workflow

**Reference Document:** See `references/folder-structure-patterns.md` for small-project and monorepo variants, large-feature route layouts, and package extraction examples.

### Step 1: Choose Architecture Pattern

Two primary patterns exist; hybrid approach recommended for most SaaS projects.

#### Pattern A: Feature-Based (Domain-Driven)

```text
src/
├── features/
│   ├── billing/
│   │   ├── components/
│   │   │   ├── BillingOverview.tsx
│   │   │   └── InvoiceTable.tsx
│   │   ├── hooks/
│   │   │   └── useBillingData.ts
│   │   ├── lib/
│   │   │   └── calculateTax.ts
│   │   ├── types/
│   │   │   └── invoice.ts
│   │   └── index.ts
│   ├── auth/
│   └── dashboard/
├── app/
└── shared/
```

**Advantages:** Clear feature boundaries, easy to understand "what belongs to billing", simpler to extract or reuse features.
**Disadvantages:** Repeated patterns across features (e.g., each feature has its own hooks folder).

#### Pattern B: Layer-Based (Type-Based)

```text
src/
├── components/       (all UI components)
├── hooks/           (all custom hooks)
├── lib/             (all utilities)
├── types/           (all TypeScript types)
├── constants/
└── app/             (Next.js routes)
```

**Advantages:** Flat, simple, easy to scan for patterns.
**Disadvantages:** Monolithic; hard to extract a feature; naming conflicts across domains.

#### Pattern C: Hybrid (Recommended)

```text
src/
├── features/            (domain-specific code)
│   ├── billing/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── types/
│   │   └── index.ts
│   ├── auth/
│   └── dashboard/
├── shared/              (used by 2+ features or globally)
│   ├── components/      (Button, Input, DataTable, etc.)
│   ├── hooks/           (useLocalStorage, useIsMobile, etc.)
│   ├── lib/             (cn utility, API client, etc.)
│   └── types/           (GlobalUser, GlobalSettings, etc.)
├── app/                 (Next.js App Router)
└── middleware.ts        (auth, redirects, etc.)
```

**Recommendation:** Use hybrid. Feature-based for billing, auth, dashboard, etc. Layer-based (shared) for cross-cutting concerns.

### Step 2: Apply Co-Location Principle

Store tests, styles, stories, and types **next to** the component, not in separate folders.

```text
src/shared/components/Button/
├── Button.tsx
├── Button.test.tsx
├── Button.stories.tsx
├── Button.module.css   (or .css file if using CSS Modules)
├── Button.types.ts     (if types are complex)
└── index.ts
```

**Why:** Reduces cognitive load, easier refactoring (move one folder), clear dependencies.

**Alternative for shared styles:** Use Tailwind CSS with `cn()` utility (eliminates need for `.css` files for many projects).

### Step 3: Configure Next.js App Router Structure

```text
app/
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
- Colocate API routes in `app/api/` (e.g., `app/api/invoices/route.ts`).
- Use `middleware.ts` at root for global auth, redirects.

### Step 4: Set Up Barrel Exports (index.ts)

**Barrel Export Pattern:** Single `index.ts` re-exports all public APIs from a folder.

```typescript
// src/shared/components/index.ts
export { Button } from "./Button";
export { Input } from "./Input";
export { DataTable } from "./DataTable";
export type { ButtonProps, InputProps } from "./types";
```

#### Import from barrel

```typescript
import { Button, Input, DataTable } from "@/shared/components";
```

**Advantage:** Clean imports, easier refactoring (move files without changing imports).

**Caveat — Tree-Shaking:** Barrels can break tree-shaking if they export side effects. Use **named exports only**; avoid default exports in barrels.

```typescript
// ❌ BAD: default export can break tree-shaking
export { default as Button } from "./Button";

// ✅ GOOD: named export
export { Button } from "./Button";
```

### Step 5: Establish Naming Conventions

**Folders:** kebab-case

```text
src/features/billing/
src/shared/components/invoice-table/
```

**Components:** PascalCase

```typescript
export const BillingOverview = () => { ... }
export const InvoiceTable = () => { ... }
```

**Hooks:** camelCase, prefix with `use`

```typescript
export const useBillingData = () => { ... }
export const useInvoices = () => { ... }
```

**Utilities:** camelCase

```typescript
export const calculateTax = (amount) => { ... }
export const formatCurrency = (value) => { ... }
```

**Types:** PascalCase

```typescript
export type Invoice = { id: string; amount: number };
export interface BillingContextType { ... }
```

**Constants:** UPPER_SNAKE_CASE or camelCase (consistent within team)

```typescript
export const MAX_INVOICE_SIZE = 100;
export const API_BASE_URL = "https://api.example.com";
```

### Step 6: Implement Advanced React Patterns

#### Pattern 1: Compound Components

Structure: Related components work together; parent manages state, children consume context.

```typescript
export const Select = ({ children, ...props }) => {
  const [open, setOpen] = useState(false);
  return (
    <SelectContext.Provider value={{ open, setOpen }}>
      <div {...props}>{children}</div>
    </SelectContext.Provider>
  );
};

Select.Trigger = ({ children }) => {
  const { open, setOpen } = useContext(SelectContext);
  return <button onClick={() => setOpen(!open)}>{children}</button>;
};

Select.Item = ({ value, children }) => {
  const { setOpen } = useContext(SelectContext);
  return <option value={value} onClick={() => setOpen(false)}>{children}</option>;
};

// Usage:
<Select>
  <Select.Trigger>Choose an option</Select.Trigger>
  <Select.Item value="a">Option A</Select.Item>
  <Select.Item value="b">Option B</Select.Item>
</Select>
```

#### Pattern 2: Headless Components

Separate logic from UI. Return render function or slots for full customization.

```typescript
export const useDropdown = () => {
  const [open, setOpen] = useState(false);
  return { open, setOpen, toggle: () => setOpen(o => !o) };
};

export const Dropdown = ({ children, renderTrigger }) => {
  const dropdown = useDropdown();
  return (
    <div>
      {renderTrigger(dropdown)}
      {dropdown.open && children}
    </div>
  );
};
```

#### Pattern 3: Controlled vs. Uncontrolled

Provide both APIs for maximum flexibility.

```typescript
// Uncontrolled: component manages its own state
<Input defaultValue="John" onChange={handler} />

// Controlled: parent manages state
<Input value={name} onChange={(e) => setName(e.target.value)} />
```

#### Pattern 4: forwardRef + Polymorphic Components

Allow ref forwarding and element polymorphism.

```typescript
export const Button = forwardRef<
  HTMLButtonElement,
  ButtonProps & { as?: React.ElementType }
>(({ as: Component = 'button', children, ...props }, ref) => (
  <Component ref={ref} {...props}>{children}</Component>
));
```

Usage: `<Button as="a" href="/home">Link</Button>`

#### Pattern 5: Render Props (Legacy but Useful)

Pass a function as child to avoid prop drilling.

```typescript
<DataProvider>
  {(data, loading) => (
    <>
      {loading && <Spinner />}
      {data && <List items={data} />}
    </>
  )}
</DataProvider>
```

#### Pattern 6: Composition Over Inheritance

Prefer composing small components over inheriting from large ones.

```typescript
// ❌ BAD: inherited Button
class PrimaryButton extends Button { ... }

// ✅ GOOD: composed Button
const PrimaryButton = (props) => <Button variant="primary" {...props} />;
```

### Step 7: Resolve Circular Dependencies

**Problem:** Feature A imports from Feature B, Feature B imports from Feature A.

#### Solutions

1. **Move shared code to `shared/`:**

   ```text
   features/billing/ imports shared/types/Invoice
   features/dashboard/ imports shared/types/Invoice
   (no circular dependency)
   ```

2. **Use dependency injection:**

   ```typescript
   // Feature A doesn't import Feature B; passes it via context or props
   <FeatureA handler={(invoice) => Feature_B_Logic(invoice)} />
   ```

3. **Separate by layer within features:**

   ```text
   features/billing/
   ├── public/         (what billing exports)
   └── internal/       (internal to billing, don't import from other features)
   ```

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
src/features/billing/pages/components/ui/forms/inputs/

// ✅ GOOD
src/features/billing/components/
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
Both import from shared/types, shared/hooks
```

#### Mixed Named and Default Exports

```typescript
// ❌ BAD
export default Button;
export { ButtonProps };

// ✅ GOOD
export { Button };
export type { ButtonProps };
```

#### Barrel Exports with Side Effects

```typescript
// ❌ BAD
export { default as trackingService } from "./tracking"; // executes on import

// ✅ GOOD
export { trackingService } from "./tracking"; // lazy-loaded when needed
```

## Enforcement

This skill is MANDATORY and must be followed without exception when its trigger fires.

When organizing React/Next.js code:

1. Adopt hybrid architecture (feature-based + shared layers).
2. Co-locate tests, styles, and types with components.
3. Use barrel exports (index.ts) with named exports only.
4. Keep folders to max 4 levels deep.
5. Limit components to ~300 lines; extract if larger.
6. Never prop-drill beyond 2 levels; use context.
7. Establish naming conventions and enforce consistently.

## Source References

- **Reference file:** `references/folder-structure-patterns.md`
- **External background:** Next.js App Router docs, React composition patterns, TypeScript module resolution
