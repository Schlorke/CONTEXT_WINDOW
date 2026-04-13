---
name: design-system-implementation
description: Build and maintain design systems with design tokens, Atomic Design methodology, Storybook documentation, and component governance in React/Next.js/Tailwind CSS projects. Use when creating design systems, defining design tokens, setting up Storybook, establishing governance, or migrating to token-based architecture. Triggers on: design system, design tokens, Storybook setup, atomic design, component library, token architecture.
metadata:
  author: SaaS Frontend Team
  version: 1.0.0
  last_validated: 2026-04-12
  sources:
    - Design Tokens Community Group (DTCG) specification
    - Atomic Design methodology (Brad Frost)
    - Storybook 8.x documentation
    - W3C WCAG 2.2 AA guidelines
---

# When to Use This Skill

This skill applies when:

- Creating a new design system from scratch
- Defining or restructuring design tokens
- Setting up Storybook for component documentation
- Establishing governance rules for design decisions
- Migrating from hardcoded styles to a token-based architecture
- Implementing dark mode with semantic tokens
- Ensuring WCAG 2.2 AA compliance across all components

Do NOT use this skill for: concrete UI value specifications (see `saas-ui-specifications`), folder structure decisions (see `react-saas-architecture`), or component implementation details.

## Core Workflow

### Step 1: Define Design Token Architecture (3 Layers)

Design tokens form a pyramid:

**Layer 1 — Primitive Tokens:** Raw, context-free values.

- Colors: `#6366F1`, `#EC4899`
- Sizes: `4px`, `8px`, `16px`, `24px`
- Type sizes: `12px`, `14px`, `16px`, `18px`
- Named plainly: `color-blue-500`, `space-4`, `font-size-base`

**Layer 2 — Semantic Tokens:** Map primitives to purpose.

- `--color-primary`: points to `--color-blue-600`
- `--color-surface-default`: points to `--color-neutral-50`
- `--space-component-padding`: points to `--space-4`
- Named by role: `primary`, `secondary`, `danger`, `surface`, `border`

**Layer 3 — Component Tokens:** Bind semantic tokens to specific UI.

- `--button-bg-default`: points to `--color-primary`
- `--button-padding`: points to `--space-component-padding`
- `--input-border-color`: points to `--color-border-default`
- Named: `--<component>-<property>-<state>`

**Storage:** Organize in `src/design-tokens/` as JSON or TypeScript:

```text
├── primitives.json       (raw values)
├── semantic.json         (semantic mappings)
├── component-levels.json (UI-specific)
└── index.ts             (exports all)
```

### Step 2: Implement Atomic Design Structure

Map Atomic Design layers to Next.js App Router:

```text
src/components/
├── atoms/                 (Button, Input, Badge, Icon, Tag)
├── molecules/            (InputGroup, ButtonGroup, Card, SearchBar)
├── organisms/            (Header, Footer, Sidebar, DataTable, Modal)
├── layouts/              (Main layout, Dashboard layout, Auth layout)
└── pages/                (app/page.tsx, app/dashboard/page.tsx)
```

**Atoms:** Single purpose, no internal dependencies. Example: Button accepts `variant` and `size` props.

**Molecules:** Combine 2+ atoms. Example: SearchBar = Input + Button + Icon.

**Organisms:** Complex, domain-aware components. Example: DataTable = header + rows + pagination.

**Layouts:** Next.js `layout.tsx` files that wrap pages.

**Pages:** `page.tsx` files that compose layouts + organisms.

### Step 3: Configure Storybook (CSF3 Format)

Install and initialize:

```sh
npx storybook@latest init --type react
```

#### Mandatory stories per component

- Default: base state
- Variants: all `variant` prop options (if applicable)
- States: all interactive states (hover, focus, disabled, loading)
- Edge Cases: empty state, max-length text, error states
- Composition: how it combines with other components

#### Example story structure

```typescript
export default {
  title: "atoms/Button",
  component: Button,
  parameters: { layout: "centered" },
};

export const Default = { args: { children: "Click me" } };
export const Primary = { args: { ...Default.args, variant: "primary" } };
export const Loading = { args: { ...Default.args, isLoading: true } };
```

#### Essential Storybook addons

- `@storybook/addon-a11y` — Accessibility audits
- `@storybook/addon-interactions` — Test interactions
- `@storybook/addon-viewport` — Responsive testing
- `@storybook/addon-backgrounds` — Light/dark theme preview

**Autodocs:** Enable in `.storybook/main.ts`:

```typescript
docs: {
  autodocs: "tag";
}
```

### Step 4: Establish Governance Model

**Version your design system** using semantic versioning: `MAJOR.MINOR.PATCH`

- MAJOR: breaking changes (token rename, component API change)
- MINOR: new tokens, new variants, new components
- PATCH: documentation, bug fixes

**Create CONTRIBUTING.md** with:

- Process for proposing new tokens
- Approval workflow for token changes
- How to deprecate old tokens (6-month sunset period recommended)
- Token naming conventions
- Required story coverage per component

**Write Architecture Decision Records (ADRs)** for:

- Why 3-layer token architecture (not 2 or 4)
- Why HSL for color generation (not RGB)
- Dark mode strategy (CSS custom properties vs. Tailwind classes)

**Maintain CHANGELOG.md** documenting:

- Each token addition/removal/rename
- New component releases
- Breaking changes with migration guide

### Step 5: Implement Dark Mode via Semantic Tokens

Strategy: Use CSS custom properties to switch token values by theme.

#### Approach

1. Semantic tokens point to CSS custom properties: `color: var(--color-surface-default);`
2. Define two sets of custom properties in CSS:
   - `:root { --color-surface-default: #FFFFFF; }` (light)
   - `[data-theme="dark"] { --color-surface-default: #1F2937; }` (dark)
3. Toggle theme via `document.documentElement.setAttribute('data-theme', 'dark')`

**Do NOT:** Use different component files for dark mode. Do NOT hard-code colors in component files.

### Step 6: Verify WCAG 2.2 AA Compliance

#### Contrast requirements

- Normal text: 4.5:1 (black/white, primary/white)
- Large text (18+ px or 14+ px bold): 3:1
- Graphical elements: 3:1

**Run Storybook a11y addon** on every story to catch violations early.

#### Mandatory checklist

- All interactive elements focusable via keyboard
- Focus indicators visible (outline/underline, >3px contrast, 2px width)
- Touch targets ≥44x44px (WCAG 2.1 AAA; 44x44 is mobile best practice)
- Colors not sole means of information (pair color with icon/pattern)
- Error messages linked to form fields

## Advanced Cases

### Case: Token Rename Without Breaking Existing Code

Use **deprecation aliases**:

```json
{
  "new-name": { "value": "#6366F1" },
  "old-name": {
    "value": "{new-name}",
    "description": "DEPRECATED: use new-name"
  }
}
```

Export both, document sunset (e.g., "removed in v2.0"), remove in next major.

### Case: Multi-Brand Design System

Create separate token files per brand:

```text
├── tokens/
│   ├── base.json       (shared: spacing, type, neutral colors)
│   ├── brand-a.json    (primary color, secondary, dark mode)
│   ├── brand-b.json
```

Load appropriate brand at build time or runtime.

### Case: Component with Multiple Design Token Sets

Example: Button with `size` variants that affect padding, font-size, and border-radius:

```json
{
  "button-sm-padding": "0.5rem 1rem",
  "button-sm-font-size": "0.875rem",
  "button-md-padding": "0.75rem 1.5rem",
  "button-md-font-size": "1rem",
  "button-lg-padding": "1rem 2rem",
  "button-lg-font-size": "1.125rem"
}
```

Or use **Component Set Tokens** (DTCG level):

```json
{
  "button": {
    "sm": { "padding": "0.5rem 1rem", "fontSize": "0.875rem" },
    "md": { "padding": "0.75rem 1.5rem", "fontSize": "1rem" },
    "lg": { "padding": "1rem 2rem", "fontSize": "1.125rem" }
  }
}
```

## Fallback Clause

If the following information is missing, output `[INFORMATION NEEDED: X]` instead of inventing:

- Target WCAG conformance level (AA vs. AAA)
- Brand color palette or primary/secondary color definitions
- Typography scale ratios or specific font families
- Dark mode requirements or strategy
- Component governance approval workflow
- Token naming convention rules

Do NOT guess token values, color ratios, or accessibility targets.

## Anti-Patterns

### Hardcoded Colors in Components

```typescript
// ❌ BAD
<button style={{ backgroundColor: '#6366F1' }} />

// ✅ GOOD
<button style={{ backgroundColor: 'var(--color-primary)' }} />
```

#### Skipping the Semantic Layer

```json
// ❌ BAD: only 2 layers
primitives: { "blue-500": "#6366F1" }
components: { "button-bg": "{blue-500}" }

// ✅ GOOD: 3 layers
primitives: { "blue-500": "#6366F1" }
semantic: { "color-primary": "{blue-500}" }
components: { "button-bg": "{color-primary}" }
```

**Storybook as Afterthought:** Add stories _during_ component development, not after. Stories guide design decisions.

**No Deprecation Policy:** Renaming or removing tokens without warning breaks consuming projects. Always provide a 6-month sunset period and migration guide.

#### Mixing Token and Component Concerns

```json
// ❌ BAD
"button-primary-with-icon-padding": "0.5rem"

// ✅ GOOD
"button-padding-sm": "0.5rem"
// Icon handling is Button component's responsibility
```

#### Dark Mode via Component Duplication

```typescript
// ❌ BAD
export const ButtonLight = () => { ... }
export const ButtonDark = () => { ... }

// ✅ GOOD
export const Button = () => (
  <button style={{ color: 'var(--color-text)' }} />
)
```

## Enforcement

This skill is MANDATORY and must be followed without exception when its trigger fires.

When implementing a design system or defining design tokens:

1. Use the 3-layer token architecture (primitive → semantic → component).
2. Write stories for every component (Default, Variants, States, Edge Cases, Composition).
3. Ensure WCAG 2.2 AA compliance before shipping.
4. Establish governance rules before tokens diverge.
5. Test dark mode with real token switching, not CSS conditionals.
6. Never skip the semantic layer; it is the binding layer between primitives and UI.

## Source References

- **DTCG Specification:** Design Tokens Community Group specification (latest)
- **Atomic Design:** Brad Frost, "Atomic Design" methodology
- **Storybook Docs:** Storybook 8.x official documentation, CSF3 format
- **WCAG 2.2:** W3C Web Content Accessibility Guidelines 2.2, Level AA conformance
- **Design Tokens in Design Systems:** Token taxonomy and organization patterns
