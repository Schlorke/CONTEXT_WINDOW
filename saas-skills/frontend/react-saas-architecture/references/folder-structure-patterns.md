# Folder Structure Patterns for React/Next.js SaaS Projects

Reference file for `react-saas-architecture` SKILL.

## Pattern 1: Small Project (5-10k LOC, Solo or Pair)

Flat, simple layer-based architecture. Everything discoverable at a glance.

```text
project/
├── src/
│   ├── app/                    (Next.js App Router routes)
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx        (dashboard home)
│   │   │   ├── settings/page.tsx
│   │   │   ├── [profile]/page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── auth/route.ts
│   │   │   └── invoices/route.ts
│   │   ├── layout.tsx          (root layout)
│   │   └── page.tsx            (landing)
│   ├── components/             (all UI components)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── LoginForm.tsx
│   │   ├── Dashboard.tsx
│   │   └── Header.tsx
│   ├── hooks/                  (custom hooks)
│   │   ├── useAuth.ts
│   │   ├── useLocalStorage.ts
│   │   └── useFetch.ts
│   ├── lib/                    (utilities, helpers)
│   │   ├── cn.ts               (Tailwind class merge)
│   │   ├── api-client.ts
│   │   └── format.ts
│   ├── types/                  (TypeScript types/interfaces)
│   │   ├── auth.ts
│   │   └── invoice.ts
│   ├── constants/
│   │   └── config.ts
│   └── middleware.ts           (global auth, redirects)
├── public/
├── .env.local
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── package.json
```

## Pattern 4: Monorepo with Shared UI Package

```text
monorepo/
├── packages/
│   ├── ui/
│   ├── lib/
│   └── web/
└── turbo.json
```

Install `@org/ui` as a workspace dependency in `web/package.json` and keep the public surface in the package `index.ts`.

## Pattern 5: Large Feature with Sub-Routes

```text
features/billing/
├── components/
├── app/
│   ├── page.tsx
│   ├── invoices/page.tsx
│   └── invoices/[id]/page.tsx
└── layout.tsx
```

Mount the feature entrypoint from `src/app/billing/page.tsx` instead of leaking route logic across unrelated folders.

## Pattern 6: Feature Extraction to Package

When a feature becomes reusable across projects:

1. Move the feature into its own package.
2. Preserve named exports in `index.ts`.
3. Version the package independently.
4. Keep app-specific route wiring outside the package.

## Pattern 7: Composed UI — Flat Widgets, or Layouts + Widgets

Composed product UI sits between routes and features. Choose the shape by
counting **shells** (persistent structures spanning many routes).

### 7a. Single shell (default)

```text
src/
├── app/                         # routes and final composition
├── widgets/
│   ├── panel-shell/             # DESIGNATED SHELL: frame, header, navigation
│   ├── account-menu/            # leaf integration
│   └── notification-center/     # leaf integration
├── features/                    # independent product capabilities
├── shared/                      # domain-neutral UI and contracts
├── infrastructure/              # technical adapters
└── generated/                   # generated artifacts
```

Direction: `app -> widgets -> features -> shared`.

### 7b. Two or more shells

Only when a second persistent structure genuinely exists (for example an
authenticated app plus a public marketing site):

```text
src/
├── app/
├── layouts/
│   ├── panel/                   # persistent frame per shell
│   └── marketing/
├── widgets/
│   ├── panel/
│   │   └── account-menu/
│   └── marketing/
│       └── pricing-table/
└── ...
```

Direction: `app -> layouts -> widgets -> features -> shared`.

### Choosing and enforcing

Do not adopt 7b speculatively. A layer with one occupant — or a scope segment
whose value is always the same word — costs vocabulary and returns nothing.
Going 7a → 7b later is a mechanical move.

Both shapes must preserve the same invariant: **a leaf widget never imports a
sibling widget.** Someone has to compose siblings:

- 7a: the designated shell, allowed **by name** in the gate, never by a
  "looks like a shell" heuristic.
- 7b: the owning layout, one layer above.

Admit a widget only when it is composed product UI with no central business
rule. Component size, internal complexity, and reuse count are not admission
criteria. Keep business rules in features and generic primitives/compositions
in shared.

For Next.js repositories, distinguish route files from the presentation layer:
`app/**/layout.tsx` controls route hierarchy, while the shell module contains
the persistent implementation. Such components may still use names like
`PanelShell` when they provide shell-like behavior and integrations.

### Import aliases (tsconfig.json)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

#### Usage

```typescript
import { Button } from "@/components";
import { useAuth } from "@/hooks";
import { formatCurrency } from "@/lib/format";
```

---

## Pattern 2: Medium SaaS (30-50k LOC, 3-5 Devs, 3-5 Major Features)

Hybrid: feature-based for domain code, shared layer for cross-cutting.

```text
project/
├── src/
│   ├── app/                    (Next.js routes, mirrors features/)
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── billing/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [invoiceId]/page.tsx
│   │   │   ├── team/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [memberId]/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/
│   │   │   ├── auth/route.ts
│   │   │   ├── invoices/route.ts
│   │   │   └── team/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── features/                (domain-specific code)
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── SignupForm.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── useSession.ts
│   │   │   ├── lib/
│   │   │   │   └── auth-client.ts
│   │   │   ├── types/
│   │   │   │   └── auth.ts
│   │   │   └── index.ts        (barrel export)
│   │   ├── billing/
│   │   │   ├── components/
│   │   │   │   ├── BillingOverview.tsx
│   │   │   │   ├── InvoiceTable.tsx
│   │   │   │   └── InvoiceDetail.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useBillingData.ts
│   │   │   │   └── useInvoices.ts
│   │   │   ├── lib/
│   │   │   │   ├── invoice-api.ts
│   │   │   │   └── calculate-tax.ts
│   │   │   ├── types/
│   │   │   │   └── billing.ts
│   │   │   └── index.ts
│   │   └── team/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── lib/
│   │       ├── types/
│   │       └── index.ts
│   ├── shared/                 (used by 2+ features or globally)
│   │   ├── components/
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.test.tsx
│   │   │   │   ├── Button.stories.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Input/
│   │   │   ├── Card/
│   │   │   ├── Modal/
│   │   │   ├── DataTable/
│   │   │   ├── Header/
│   │   │   ├── Sidebar/
│   │   │   └── index.ts        (barrel)
│   │   ├── hooks/
│   │   │   ├── useLocalStorage.ts
│   │   │   ├── useIsMobile.ts
│   │   │   ├── useFetch.ts
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   ├── cn.ts
│   │   │   ├── api-client.ts
│   │   │   ├── format.ts
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── global.ts
│   │   │   └── api.ts
│   │   ├── constants/
│   │   │   └── config.ts
│   │   └── providers/
│   │       ├── AuthProvider.tsx
│   │       ├── ThemeProvider.tsx
│   │       └── index.tsx
│   ├── middleware.ts
│   └── env.ts                  (environment validation)
├── public/
├── .env.local
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── storybook/                  (Storybook config)
├── tests/
│   ├── unit/
│   └── integration/
├── .eslintrc.json
├── package.json
└── turbo.json                  (if monorepo)
```

### Barrel export examples

`src/features/billing/index.ts`:

```typescript
export { useBillingData, useInvoices } from "./hooks";
export { BillingOverview, InvoiceTable, InvoiceDetail } from "./components";
export type { Invoice, BillingContext } from "./types";
```

`src/shared/components/index.ts`:

```typescript
export { Button } from "./Button";
export { Input } from "./Input";
export { Card } from "./Card";
export { Modal } from "./Modal";
export { DataTable } from "./DataTable";
export type { ButtonProps, InputProps } from "./types";
```

#### Import usage

```typescript
// From feature
import { useBillingData, BillingOverview } from "@/features/billing";

// From shared
import { Button, Input, DataTable } from "@/shared/components";
import { useLocalStorage } from "@/shared/hooks";
import { cn, formatCurrency } from "@/shared/lib";
```

---

## Pattern 3: Large SaaS Monorepo (100k+ LOC, 10+ Devs, 8+ Major Features)

Multi-package monorepo with separate UI library, API library, and web app.

```text
monorepo/
├── packages/
│   ├── ui/                     (@org/ui: shared component library)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Button/
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Button.test.tsx
│   │   │   │   │   ├── Button.stories.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Input/
│   │   │   │   ├── Modal/
│   │   │   │   ├── DataTable/
│   │   │   │   ├── Navigation/
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useLocalStorage.ts
│   │   │   │   └── index.ts
│   │   │   ├── lib/
│   │   │   │   ├── cn.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts        (main barrel)
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── shared-lib/             (@org/lib: utilities, types, API client)
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   └── client.ts
│   │   │   ├── types/
│   │   │   │   ├── user.ts
│   │   │   │   ├── invoice.ts
│   │   │   │   └── index.ts
│   │   │   ├── utils/
│   │   │   │   └── format.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                    (main SaaS application)
│       ├── src/
│       │   ├── app/            (Next.js routes)
│       │   │   ├── (auth)/
│       │   │   ├── (dashboard)/
│       │   │   ├── api/
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx
│       │   ├── features/        (feature-specific code)
│       │   │   ├── auth/
│       │   │   ├── billing/
│       │   │   ├── team/
│       │   │   ├── workspace/
│       │   │   └── integrations/
│       │   ├── shared/          (app-specific shared code)
│       │   │   ├── components/  (composed from @org/ui)
│       │   │   ├── hooks/
│       │   │   ├── lib/
│       │   │   └── providers/
│       │   ├── middleware.ts
│       │   └── env.ts
│       ├── public/
│       ├── next.config.ts
│       ├── tsconfig.json
│       └── package.json        (depends on @org/ui, @org/lib)
├── turbo.json                  (monorepo tasks: build, test, lint)
├── package.json                (root)
└── pnpm-workspace.yaml         (pnpm workspaces)
```

### Root turbo.json (task orchestration)

```json
{
  "tasks": {
    "build": {
      "outputs": ["dist/**"],
      "cache": false
    },
    "test": {
      "outputs": ["coverage/**"]
    },
    "lint": {}
  }
}
```

#### Web app package.json (dependencies)

```json
{
  "dependencies": {
    "@org/ui": "*",
    "@org/lib": "*",
    "next": "^15.0.0",
    "react": "^19.0.0"
  }
}
```

#### Web app import usage

```typescript
// From monorepo packages
import { Button, Input, DataTable } from "@org/ui";
import { apiClient, formatCurrency } from "@org/lib";

// From local features
import { useBillingData } from "@/features/billing";

// From local shared
import { BillingLayout } from "@/shared/components";
```

---

## Best Practices Across All Patterns

1. **Keep folders consistent:** If `features/billing/` has `components/`, `hooks/`, `lib/`, then `features/auth/` should follow the same structure.

2. **Use co-location:** Store tests, stories, and types next to components.

   ```text
   Button/
   ├── Button.tsx
   ├── Button.test.tsx
   ├── Button.stories.tsx
   └── index.ts
   ```

3. **Limit folder depth:** Never go deeper than 4 levels without good reason.

   ```text
   // ❌ BAD
   src/features/billing/pages/invoices/components/table/rows/

   // ✅ GOOD
   src/features/billing/components/InvoiceTable/
   ```

4. **Use barrel exports:** Each folder with multiple exports should have an `index.ts`.

5. **Enforce naming conventions:** PascalCase for components, camelCase for utilities, kebab-case for folders.

6. **Avoid circular dependencies:** Feature A should not import from Feature B. Both should import from `shared/`.

7. **Scale incrementally:** Start with Pattern 1 (flat), move to Pattern 2 (hybrid) as the project grows, then to Pattern 3 (monorepo) if needed.

## Runtime-Specific Public Entrypoints

Do not solve browser/server reuse by making one barrel export everything. For a
module with mixed runtimes, prefer:

```text
modules/<module>/
├── index.ts            # UI or runtime-neutral public API
├── client/index.ts     # fetch adapters, browser services and client hooks
├── server/index.ts     # database, filesystem, secrets and server orchestration
└── contracts/index.ts  # DTOs, schemas and explicit framework-neutral types
```

- Client components, stories and presentation helpers import `/client`, never
  a bare `/server` barrel.
- Server Actions use a narrow `/server/actions/<action>` entrypoint.
- Types needed by browser or pure layers live in `/contracts`; `import type`
  does not make server ownership appropriate.
- Keep each surface curated. A large capability registry beside a small fetch
  service can force unrelated modules into the browser graph, weaken
  tree-shaking, create circular chunks and make bundlers fail even when
  TypeScript passes.
- Add an executable dependency gate for the runtime boundaries.

## Pattern B and Pattern C reference trees (moved from SKILL.md v1.3.0)

Pattern B — layer-based:

```text
src/
├── components/       (all UI components)
├── hooks/            (all custom hooks)
├── lib/              (all utilities)
├── types/            (all TypeScript types)
├── constants/
└── app/              (Next.js routes)
```

Pattern C — hybrid (recommended):

```text
src/
├── app/                         (Next.js App Router and API routes)
├── components/
│   ├── features/                (domain-specific UI: billing/, auth/, dashboard/)
│   └── ui/
│       ├── primitives/          (Button, Input, Badge)
│       └── composed/            (Dialog, DataTable, Combobox)
├── hooks/                       (cross-feature hooks)
├── lib/                         (utilities, auth, Prisma/client helpers)
└── types/                       (global TypeScript contracts)
```

## Naming convention examples (moved from SKILL.md v1.3.0)

```typescript
// Components: PascalCase
export const BillingOverview = () => {
  /* ... */
};
// Hooks: camelCase with use prefix
export const useBillingData = () => {
  /* ... */
};
// Utilities: camelCase
export const calculateTax = (amount: number) => {
  /* ... */
};
// Types: PascalCase
export type Invoice = { id: string; amount: number };
// Constants: UPPER_SNAKE_CASE
export const MAX_INVOICE_SIZE = 100;
```

## Circular-dependency solutions in detail (moved from SKILL.md v1.3.0)

1. Move shared code to the shared layer:

   ```text
   components/features/billing/  imports types/Invoice
   components/features/dashboard/ imports types/Invoice
   (no circular dependency)
   ```

2. Dependency injection — Feature A does not import Feature B; it receives the
   behavior via props/context:

   ```typescript
   <FeatureA handler={(invoice) => featureBLogic(invoice)} />
   ```

3. Public vs internal surfaces inside the feature:

   ```text
   features/billing/
   ├── public/         (what billing exports)
   └── internal/       (never imported by other features)
   ```
