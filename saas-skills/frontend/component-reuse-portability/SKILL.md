---
name: component-reuse-portability
description: "Port components between projects into the right destination: primitives to packages/ui with .web/.native variants, product components to FSD slices, resolving dependencies, imports and tokens. Use when reusing, extracting or adapting a component from another codebase."
metadata:
  author: SaaS Frontend Team
  version: 1.0.0
  last_validated: 2026-04-12
  sources:
    - references/registry-and-advanced-cases.md
    - TypeScript module resolution
    - Tailwind content scanning
    - Node.js module resolution
---

# When to Use This Skill

## Operational Contract

| Field | Contract |
| --- | --- |
| Objective | Port a component between projects so that it lands in the right package or slice of the target, with its dependencies, tokens, platform variants and tests. |
| Use when | Reusing, extracting or adapting a component from another codebase, or maintaining a cross-project component registry. |
| Do not use when | Building a primitive from scratch (design-system-implementation) or deciding the folder structure (react-saas-architecture). |
| Inputs | Source component and its imports, target repository, target tokens and aliases. |
| Preconditions | Target follows the contract (packages/ui, packages/design-tokens, packages/frontend in FSD) or a migration is authorized. |
| Tools | Dependency listing (`rg` on imports), the target's package manager, typecheck, tests, `pnpm arch` in the target. |
| Procedure | Placement rule below, then the Core Workflow. |
| Output | Component in its destination with contract/web/native files when it is a primitive, tests, catalog entry, registry update. |
| Validation | Target typecheck, tests and architecture gate pass; web build and mobile bundle still succeed. |
| Known failures | Copying a primitive into a feature slice, duplicating a component source, hardcoded colors, web-only component rendered by mobile. |

## Placement in the Target (MANDATORY)

| What is being ported | Destination |
| --- | --- |
| Domain-neutral primitive (Button, Input, Dialog shell) | `packages/ui`: `src/contract/<name>.ts`, `src/web/<Name>.web.tsx`, `src/native/<Name>.native.tsx`, exported by both entry points and listed in `catalog.ts` |
| Business view of an entity (ProductCard) | `packages/frontend/src/entities/<entity>/ui` |
| User interaction (AddToCartButton) | `packages/frontend/src/features/<feature>/ui` + `model` |
| Composed block (Header, PricingTable) | `packages/frontend/src/widgets/<widget>/ui` |
| Colors, spacing, radius, typography used by the component | `packages/design-tokens` (never literals in components) |

Rules:

1. One source per component: never keep a second copy in `packages/frontend` or in a client app.
2. A web-only source (DOM elements, Radix, CSS classes) gets a native counterpart before it is used
   by pages rendered on mobile; until then it stays in a web-only package and the gate reports
   `RUNTIME-WEB-ONLY` if shared code imports it.
3. Imports inside the target go through public APIs (`@scope/ui`, slice `index.ts`).

This skill applies when:

- Extracting a component from one project to reuse in another
- Porting a component library between codebases
- Resolving component dependencies when copying code
- Adapting a component to work with new design tokens or styling
- Maintaining a shared component registry across projects
- Updating imports and aliases for a new codebase
- Creating a component from a reference implementation

Do NOT use this skill for: initial component building (see `design-system-implementation`), folder structure decisions (see `react-saas-architecture`).

## Core Workflow

Inspect both repositories before copying: package manager and lockfile, `tsconfig.json` aliases, `components.json`, Tailwind version/config, Storybook or catalog, component registry/manifest, and the target's packages (`packages/ui`, `packages/design-tokens`, `packages/frontend`). Destinations follow the placement table above; use `pnpm` scripts when `pnpm-lock.yaml` is present.

### Step 1: Identify Component in Registry

#### Source identification

- Locate the component in the source project (its UI package, `packages/ui/src/...`, or the source repo's equivalent shared UI folder)
- Verify it exists and is mature (not in-progress)
- Check CHANGELOG or git history for stability

#### Component checklist

- TypeScript types defined
- Storybook stories exist
- Tests pass
- Accessibility compliance verified (WCAG 2.2 AA)
- No hard dependencies on source project's auth/API/database

### Step 2: Resolve Dependencies

#### Dependency types (in order of resolution)

1. **Utilities (cn, format, etc.)**

   ```typescript
   // Source project: src/shared/lib/cn.ts
   export const cn = (...classes) => clsx(...classes);

   // Required in target. Copy or create equivalent.
   ```

2. **Primitive components (Button, Input, etc.)**

   ```typescript
   // Button depends on Input? Resolve Input first.
   // Each component may depend on cn(), accessible-react, or Radix primitives.
   ```

3. **Composed components (Dialog, DataTable, etc.)**

   ```typescript
   // Dialog depends on Button, Overlay, and Portal.
   // Resolve in dependency order: Overlay → Portal → Button → Dialog.
   ```

#### Dependency graph mapping (example)

```text
DataTable
├── Button (primitive)
├── Input (primitive)
├── Dropdown (composed)
│   ├── Button (primitive)
│   └── Portal (utility)
└── cn utility
```

#### Process

1. List all imports in the component's `.tsx` file
2. Identify internal imports vs. external (npm packages)
3. Check if internal imports exist in target project
4. If missing, add them to the copy list (recursive)

### Step 3: Copy Component to Its Destination

#### Target location (recommended)

```text
target-project/packages/ui/src/contract/<name>.ts            (primitive props contract)
target-project/packages/ui/src/web/<Name>.web.tsx            (web implementation)
target-project/packages/ui/src/native/<Name>.native.tsx      (native implementation)
target-project/packages/frontend/src/<layer>/<slice>/ui/     (product components)
```

#### Files to copy (co-located structure)

```text
Button/
├── Button.tsx           (component code)
├── Button.test.tsx      (tests)
├── Button.stories.tsx   (Storybook stories)
├── Button.types.ts      (TypeScript types, if complex)
└── index.ts             (barrel export)
```

#### Example copy command

```bash
cp source-project/packages/ui/src/web/Button.web.tsx target-project/packages/ui/src/web/
# then add the contract, the native variant, both entry-point exports and the catalog entry
```

### Step 4: Rewrite Imports (Alias Adaptation)

#### Identify import aliases in source

```typescript
// Source project (tsconfig.json)
// "@/*": ["src/*"]

import { cn } from "@/shared/lib";
import { Button } from "@/components/ui/button";
```

#### Check target project's aliases

```typescript
// Target project (tsconfig.json)
// "@/*": ["src/*"]  (same)
// OR
// "@app/*": ["app/*"]  (different)
```

#### Rewrite if needed

```typescript
// If target uses different base path
import { cn } from "@/lib"; // same
import { cn } from "@app/lib"; // different base
```

#### Automation (find & replace)

```bash
# Find all @/ imports in Button.tsx
grep -n "@/" Button/Button.tsx

# If target uses different alias, replace
sed -i 's/@\//@app\//g' Button/Button.tsx
```

### Step 5: Remove Source-Project-Specific Logic

#### Things to NEVER copy

- Authentication logic (e.g., `useAuth()`, tokens)
- API calls or data fetching (e.g., `fetch('/api/users')`)
- Environment variables or secrets
- Database queries or schema validation
- Business-specific validation rules
- Project-specific context providers

#### Example refactoring

```typescript
// ❌ BAD: source-project-specific
export const InvoiceTable = () => {
  const { token } = useAuth();
  const [invoices] = useFetch('/api/invoices', { headers: { Authorization: `Bearer ${token}` } });
  return <table>{/* ... */}</table>;
};

// ✅ GOOD: generic, reusable
export const DataTable = ({ data, columns }) => {
  return (
    <table>
      {/* ... */}
    </table>
  );
};

// Usage in target project:
const [invoices] = useFetch('/api/invoices');
<DataTable data={invoices} columns={invoiceColumns} />
```

### Step 6: Adapt Design Tokens

#### Token mapping (source → target)

Source project design tokens:

```css
/* source/src/shared/tokens.css */
:root {
  --color-primary: #6366f1;
  --color-text: #1f2937;
  --space-sm: 8px;
  --space-md: 16px;
}
```

Target project design tokens:

```css
/* target/src/shared/tokens.css */
:root {
  --color-primary: #3b82f6; /* Different blue */
  --color-text: #1f2937; /* Same */
  --space-sm: 8px; /* Same */
  --space-md: 16px; /* Same */
}
```

#### Component adjustment

```typescript
// Source component uses --color-primary
<button style={{ backgroundColor: 'var(--color-primary)' }}>

// If target has different semantics:
// Option 1: Update button to use target's color role
<button style={{ backgroundColor: 'var(--color-accent)' }}>

// Option 2: Add token alias in target
// target/src/shared/tokens.css: --color-primary: var(--color-accent);
```

#### Tailwind CSS classes (if used)

```typescript
// Source: uses Tailwind classes
<button className="bg-indigo-600 text-white">

// Target (if same Tailwind config): no change needed
// If different config, rewrite:
<button className="bg-blue-500 text-white">
```

### Step 7: Verify TypeScript Compilation

#### Type checking

```bash
cd target-project
pnpm exec tsc --noEmit
# or use the repo script, e.g. pnpm typecheck

# Should show no errors in the copied component
```

#### Common issues

- Missing types (e.g., `import { ComponentProps }`)
- Mismatched type versions (e.g., `@types/react`)
- Undefined utility functions (e.g., `cn` not imported)

#### Fix example

```typescript
// ❌ Error: cn is not defined
<button className={cn('base-class', isActive && 'active')}>

// ✅ Fixed: import cn
import { cn } from '@/shared/lib';
```

### Step 8: Verify Tailwind Classes Render

#### Check Tailwind config includes the component path

```javascript
// target/tailwind.config.js
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "../../../packages/ui/src/**/*.{ts,tsx}", // shared primitives
    "../../../packages/frontend/src/**/*.{ts,tsx}", // FSD slices
  ],
};
```

#### Test in browser

```bash
pnpm dev
# Navigate to component in Storybook or test page
# Visual inspection: do classes render correctly?
```

**Common issue:** Tailwind classes not applying = Tailwind config doesn't scan component folder. Add to `content` array.

### Step 9: Verify Radix UI Primitives are Installed

If component uses Radix UI (Dialog, Dropdown, etc.):

```typescript
// Button.tsx imports from Radix
import * as Dialog from "@radix-ui/react-dialog";
```

#### Check target project

```bash
pnpm list --depth 0 | rg radix
# or
package.json: "@radix-ui/react-dialog": "^1.0.0"
```

#### If missing, install

```bash
pnpm add @radix-ui/react-dialog
```

#### Common Radix imports to check

- `@radix-ui/react-dialog` (Dialog)
- `@radix-ui/react-dropdown-menu` (Dropdown)
- `@radix-ui/react-popover` (Popover)
- `@radix-ui/react-tooltip` (Tooltip)
- `@radix-ui/react-accordion` (Accordion)

### Step 10: Update Shared README & Registry

Record the component in your shared components inventory immediately after the port:

1. Update the repo's component inventory (`COMPONENT_MANIFEST.md`, `.storybook/AI_CONTEXT.md`, generated registry, or `README.md`) instead of inventing a new registry location.
2. Run the repo's registry command when present, for example `pnpm ai:context`.
3. Add dependency metadata to the shared registry JSON if your project uses one.
4. Mark optional peer dependencies, known caveats, and dark mode verification status.
5. Link back to the original source project or package if traceability matters.

**Reference Document:** See `references/registry-and-advanced-cases.md` for a reusable README template, registry JSON example, optional dependency handling, feature flag replacement, and monorepo package guidance.

## Fallback Clause

If the following information is missing, output `[INFORMATION NEEDED: X]` instead of inventing:

- Source component location (path in source project)
- Target project's TypeScript alias configuration
- Target project's design token definitions
- List of installed peer dependencies in target (@radix-ui versions, etc.)
- Target's Tailwind CSS configuration (if using classes)

Do NOT guess import aliases, design token values, or dependency versions.

## Anti-Patterns

### Copying Without Dependency Resolution

```typescript
// ❌ BAD: Copies Button, but Button imports Input
// Target project now has Button without Input
import { Input } from "@acme/ui";

// ✅ GOOD: Copy both Button and Input, resolve in order
```

### Hardcoding Design Token Values

```typescript
// ❌ BAD: hardcoded color
<button style={{ backgroundColor: '#6366F1' }}>

// ✅ GOOD: use CSS custom property
<button style={{ backgroundColor: 'var(--color-primary)' }}>
```

### Not Removing Authentication Logic

```typescript
// ❌ BAD: copied from source with auth
const { token } = useAuth();
const response = await fetch('/api/data', {
  headers: { Authorization: `Bearer ${token}` }
});

// ✅ GOOD: component receives data as prop
export const DataDisplay = ({ data }) => (
  <div>{data}</div>
);
```

### Ignoring TypeScript Errors

```typescript
// ❌ BAD: compilation passes but types are loose
const [data]: any = useState();

// ✅ GOOD: proper types
const [data, setData] = useState<MyType[]>([]);
```

### Not Testing Dark Mode

```text
// ❌ BAD: component works in light mode, breaks in dark
// ✅ GOOD: test component with [data-theme="dark"]
```

## Enforcement

This skill is MANDATORY and must be followed without exception when its trigger fires.

When reusing or porting a component:

1. Always resolve dependencies recursively (utilities first, then primitives, then composed).
2. Always verify TypeScript compiles with zero errors in target project.
3. Always rewrite imports to match target project's alias configuration.
4. Always remove authentication, API, and business logic before copying.
5. Always adapt design tokens or add token aliases for style compatibility.
6. Always update shared component README and registry.
7. Never hardcode colors, spacing, or other design values; use tokens.
8. Never assume Tailwind or other build tools are configured; verify.

## Source References

- **Reference file:** `references/registry-and-advanced-cases.md`
- **External background:** TypeScript module paths, Tailwind config scanning, Node.js module resolution
