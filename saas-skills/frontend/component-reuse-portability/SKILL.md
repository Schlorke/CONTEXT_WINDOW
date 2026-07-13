---
name: component-reuse-portability
description: "Step-by-step procedure for extracting, adapting, and installing reusable React components from one project to another, including dependency resolution, import rewriting, design token adaptation, and registry maintenance. Use when porting components between projects, resolving component dependencies, adapting a component library to a new codebase, or maintaining a shared component registry. Triggers on: reuse component, port component, shared library, component adaptation, cross-project, component registry, component extraction."
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

## Internal Feature Structure (MANDATORY)

Feature-first does not stop at `src/features/`. Inside EVERY feature, the root
contains ONLY two top groups plus its public barrel and docs:

```text
src/features/<feature>/
├── modules/            # functional capabilities of the domain
│   └── <module>/       # e.g. workspace, overview, tracking, categories, chat
│       ├── components/ # UI owned by this capability (ownership BEFORE visual type)
│       ├── hooks/ services/ schemas/ contracts/ domain/ config/ server/ jobs/
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
   `src/infrastructure/...`.
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
   barrel or `features/<f>/modules/<m>` (plus its `server`/`contracts`).
   Never deep-import another feature's internals.


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

Inspect both repositories before copying: package manager and lockfile, `tsconfig.json` aliases, `components.json`, Tailwind version/config, Storybook version, component registry/manifest, and existing UI folder taxonomy. In OK Gas-style targets, prefer `src/components/ui/primitives`, `src/components/ui/composed`, and `src/components/features` over a generic `src/shared/components` destination, and use `pnpm` scripts when `pnpm-lock.yaml` is present.

### Step 1: Identify Component in Registry

#### Source identification

- Locate the component in the source project (e.g., `src/components/ui/primitives/button`, `src/components/ui/composed/dialog`, or the source repo's equivalent shared UI folder)
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

### Step 3: Copy Component to Shared Folder

#### Target location (recommended)

```text
target-project/<repo-ui-folder>/<component-name>/
```

For OK Gas-style targets:

```text
target-project/src/components/ui/primitives/<component-name>/
target-project/src/components/ui/composed/<component-name>/
target-project/src/components/features/<feature-name>/
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
cp -r source-project/src/components/ui/primitives/button \
      target-project/src/components/ui/primitives/
```

### Step 4: Rewrite Imports (Alias Adaptation)

#### Identify import aliases in source

```typescript
// Source project (tsconfig.json)
// "@/*": ["src/*"]

import { cn } from "@/shared/lib";
import { Button } from "@/shared/components";
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

## Step 5: Remove Source-Project-Specific Logic

### Things to NEVER copy

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

## Common issues

- Missing types (e.g., `import { ComponentProps }`)
- Mismatched type versions (e.g., `@types/react`)
- Undefined utility functions (e.g., `cn` not imported)

### Fix example

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
    "./src/components/**/*.{js,ts,jsx,tsx}", // Include copied components
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

## Step 9: Verify Radix UI Primitives are Installed

If component uses Radix UI (Dialog, Dropdown, etc.):

```typescript
// Button.tsx imports from Radix
import * as Dialog from "@radix-ui/react-dialog";
```

### Check target project

```bash
pnpm list --depth 0 | rg radix
# or
package.json: "@radix-ui/react-dialog": "^1.0.0"
```

## If missing, install

```bash
pnpm add @radix-ui/react-dialog
```

### Common Radix imports to check

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
import { Input } from "@/shared/components";

// ✅ GOOD: Copy both Button and Input, resolve in order
```

#### Hardcoding Design Token Values

```typescript
// ❌ BAD: hardcoded color
<button style={{ backgroundColor: '#6366F1' }}>

// ✅ GOOD: use CSS custom property
<button style={{ backgroundColor: 'var(--color-primary)' }}>
```

#### Not Removing Authentication Logic

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

#### Ignoring TypeScript Errors

```typescript
// ❌ BAD: compilation passes but types are loose
const [data]: any = useState();

// ✅ GOOD: proper types
const [data, setData] = useState<MyType[]>([]);
```

#### Not Testing Dark Mode

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
