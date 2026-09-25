---
name: design-system-implementation
description: "Build one design system for web and mobile: tokens in packages/design-tokens, primitives in packages/ui with a shared contract and .web/.native files, catalog on both platforms, dark mode, token-propagation proof. Use when defining tokens or creating shared components."
metadata:
  author: SaaS Frontend Team
  version: 1.0.0
  last_validated: 2026-04-12
  sources:
    - Design Tokens Community Group (DTCG) specification
    - Atomic Design methodology (Brad Frost)
    - Storybook documentation for the version declared in package.json
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

## Operational Contract

| Field | Contract |
| --- | --- |
| Objective | Build and govern one design system shared by web and mobile: tokens in `packages/design-tokens`, primitives in `packages/ui` with a platform-neutral contract and `.web`/`.native` implementations, a catalog on both platforms. |
| Use when | Defining tokens, creating or changing primitives, setting up the catalog or Storybook, dark mode, token governance, migrating hardcoded styles. |
| Do not use when | Concrete UI values (saas-ui-specifications), folder structure (react-saas-architecture), porting from another project (component-reuse-portability). |
| Inputs | Brand/design decisions, the approved screens, the current packages/ui and design-tokens. |
| Preconditions | The repository follows the contract topology or a migration is authorized. |
| Tools | TypeScript, Vitest with Testing Library (web), `expo export` (native bundle), `pnpm check:tokens`, optional Storybook web and React Native Storybook. |
| Procedure | Core Workflow below. |
| Output | Tokens, primitives with contract + web + native files, catalog entries with every state, tests, changelog entry. |
| Validation | `pnpm verify` (gate, typecheck of web and native projects, tests, web build, mobile bundle) and `pnpm check:tokens` proving a token change reaches both clients. |
| Known failures | Web-only primitive rendered on mobile, color literals in components, a second copy of a primitive in a feature, catalog that only exists on the web, browser preview presented as native proof. |

## Core Workflow

Inspect the target repository first: `AGENTS.md`/`CLAUDE.md`, `package.json`, `packages/design-tokens`, `packages/ui` (entry points `index.web.ts` and `index.native.ts`, `catalog.ts`), Storybook configuration if present, and existing registries. Repository conventions override generic examples as long as they respect the contract.

### Step 1: Define Design Token Architecture (3 Layers)

**Layer 1 — Primitive tokens:** raw values (`palette.brand600 = "#1D4ED8"`, `space.md = 16`).

**Layer 2 — Semantic tokens:** roles per theme (`themes.light.color.primary`, `surface`, `text`, `muted`, `danger`).

**Layer 3 — Component tokens:** bindings used inside a primitive (`button.background.primary`), derived from semantic tokens.

**Storage:** `packages/design-tokens/src/` as TypeScript objects so that web and native read the same values:

```text
packages/design-tokens/src/
├── tokens.ts       palette, light/dark themes, space, radius, typography (split into files as it grows)
└── index.ts        public API
```

Web may additionally emit CSS custom properties from these objects; native reads them through the theme provider. There is never a second source of values.

### Step 2: Implement the Shared Primitive Package

```text
packages/ui/src/
├── contract/<name>.ts           props contract shared by both platforms
├── web/<Name>.web.tsx           DOM implementation ("use client" when interactive)
├── native/<Name>.native.tsx     React Native implementation
├── theme/ThemeProvider.tsx      theme context over design-tokens
├── catalog.ts                   entries with every state of every primitive
├── index.web.ts                 web entry point
└── index.native.ts              native entry point
```

`package.json` exposes both entry points with conditions so Next.js and Metro resolve the right file:

```json
{ "exports": { ".": { "react-native": "./src/index.native.ts", "default": "./src/index.web.ts" } } }
```

Rules: primitives are domain-neutral; business components live in FSD slices of `packages/frontend`; there is exactly one source per primitive; both implementations satisfy the same contract type.

### Step 3: Catalog on Both Platforms (Storybook Equivalent)

The catalog is mandatory; Storybook is optional.

- `catalog.ts` lists each primitive with all states (default, variants, disabled, loading, error, long text).
- `packages/frontend/src/pages/catalog` renders the catalog; the web client exposes it at `/catalog` and the mobile client as the `catalog` screen, so every state is visible on both platforms.
- If Storybook is added, web stories and React Native stories import from the same package entry points; they never copy components.
- Browser previews (react-native-web) are not native proof. Native evidence is an `expo export` bundle at minimum, and an emulator/device run when available.

#### Essential checks per primitive

- Contract type shared by both implementations (typecheck of web and native projects).
- Web test with Testing Library for roles, disabled and loading states.
- Catalog entry for each state.
- Accessibility: roles/labels on web, `accessibilityRole`/`accessibilityState` on native.

### Step 3b: Prove Token Propagation

Two complementary checks, both in the template:

- `pnpm tokens` (`tools/token-check.mjs`, part of `pnpm verify`) rejects design values written outside `packages/design-tokens`: color literals, named colors, literal sizes in style properties, local constants used as design values and redefinitions of canonical token names, in TS/TSX and CSS of both clients, `packages/ui` and `packages/frontend`. Tests and fixtures are out of scope; a deliberate exception carries `// token-check-allow: <reason>`.
- `pnpm check:tokens` (`tools/token-propagation-check.mjs`) temporarily replaces `brand600` with a sentinel color and requires it at three levels: the value resolved by the web and native `Button` implementations (Vitest, `react-native` replaced by recording host components), the `background-color` of the buttons in the prerendered Next.js HTML, and the Hermes bundles of the Expo export for Android and iOS. It restores the file and exits 1 unless the three levels pass.

Neither check runs the native app: execution on a device or emulator is a separate proof. Run `check:tokens` on a clean working tree. A token change that does not reach both clients is a defect.

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

Strategy: one set of semantic themes (`themes.light`, `themes.dark`) in `packages/design-tokens`, selected by the theme provider on both platforms.

#### Approach

1. Primitives read colors from `useTheme()`, never literals.
2. Native: the provider picks the theme (for example from `useColorScheme()`), components apply it through `StyleSheet`/style props.
3. Web: the same provider drives the components; when CSS is preferred, generate custom properties from the same theme objects (`:root` and `[data-theme="dark"]`) instead of writing values by hand.

**Do NOT:** use different component files for dark mode, hard-code colors in component files, or keep a CSS-only palette that native cannot read.

### Step 6: Verify WCAG 2.2 AA Compliance

#### Contrast requirements

- Normal text: 4.5:1 (black/white, primary/white)
- Large text (18+ px or 14+ px bold): 3:1
- Graphical elements: 3:1

**Check every catalog state** for contrast; when Storybook is present, run its a11y addon on every story.

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
- **Storybook Docs:** Storybook official documentation for the installed version, CSF3 format
- **WCAG 2.2:** W3C Web Content Accessibility Guidelines 2.2, Level AA conformance
- **Design Tokens in Design Systems:** Token taxonomy and organization patterns
