---
name: saas-ui-specifications
description: Reference-driven skill providing concrete UI/UX specifications for SaaS applications: typographic scales, color systems, spacing tokens, responsive grid, dark mode, and WCAG 2.2 accessibility patterns. Use when defining typography, choosing color palettes, establishing spacing systems, setting up responsive grid, implementing dark mode, or verifying accessibility compliance. Triggers on: typography scale, color palette, spacing system, grid layout, dark mode, WCAG accessibility, responsive design, SaaS UI specifications.
metadata:
  author: SaaS Frontend Team
  version: 1.0.0
  last_validated: 2026-04-12
  sources:
    - W3C WCAG 2.2 guidelines
    - Modular Scale (Tim Brown)
    - Tailwind CSS framework
    - Material Design 3 specifications
    - Accessible Colors (APCA, WCAG contrast)
---

# When to Use This Skill

This skill applies when:

- Establishing a typographic scale for a SaaS application
- Choosing a color palette and defining semantic color roles
- Setting up spacing tokens and a consistent spacing system
- Configuring responsive breakpoints and grid layout
- Implementing or adapting dark mode
- Verifying WCAG 2.2 AA compliance for text, colors, and interactions
- Deciding between compact vs. comfortable density for UI
- Creating design tokens for Tailwind CSS or CSS custom properties

Do NOT use this skill for: design system governance (see `design-system-implementation`), folder structure decisions (see `react-saas-architecture`).

## Core Workflow

### Step 1: Establish Typography Scale

Use a **modular scale** with consistent ratios for predictability. Recommended: 1.25 ratio (major third).

**Ratio:** Each font size is 1.25x the previous one.

- Base: 16px
- 16 × 1.25 = 20px
- 20 × 1.25 = 25px
- 25 × 1.25 = 31px (typically capped)

#### Scale (common SaaS sizes)

```text
xs   : 12px (75%)
sm   : 14px
base : 16px (100%, body text)
lg   : 20px
xl   : 25px
2xl  : 31px
3xl  : 39px (headings)
4xl  : 49px (page titles)
```

**Responsive adjustment:** Font sizes should decrease on mobile, increase on desktop using CSS `clamp()`:

```css
/* xs: 12px, base: 14px, xl: 16px */
font-size: clamp(12px, 1vw + 11px, 16px);
```

For reference file details on modular scales, font pairings, line-height rules, and letter-spacing guidance, see `references/typography-scale.md`.

### Step 2: Build a Color System

Start with **semantic roles**, not raw hex values.

#### Semantic Roles

- `primary` — Main CTA, active states, brand identity (usually blue)
- `secondary` — Alternative CTAs, supporting actions (often purple, green, or gray)
- `neutral` — Backgrounds, borders, text (grays/blacks)
- `danger` — Destructive actions, errors (red)
- `warning` — Cautions, alerts (orange/yellow)
- `success` — Confirmations, completions (green)
- `info` — Informational messages (blue/cyan)

**Structure:** Define primitives, then map to semantic.

```text
Primitives:
  blue-50, blue-100, ..., blue-950

Semantic (light mode):
  --color-primary: blue-600
  --color-primary-light: blue-100
  --color-danger: red-600
  --color-success: green-600

Dark mode override:
  --color-primary: blue-400
  --color-primary-light: blue-900
```

#### WCAG Contrast Requirements

- Normal text (≤18px): 4.5:1 contrast ratio (AA)
- Large text (≥18px or ≥14px bold): 3:1 (AA)
- Graphical elements (borders, icons): 3:1 (AA)

For detailed color system guidance, HSL-based generation, Tailwind config example, and dark mode mapping, see `references/color-system.md`.

### Step 3: Define Spacing & Grid

Use a **4px base unit** (common in digital design). Scale: 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32.

#### Spacing scale (in px)

```text
sp-0  : 0
sp-1  : 4px
sp-2  : 8px
sp-3  : 12px
sp-4  : 16px
sp-5  : 20px
sp-6  : 24px
sp-8  : 32px
sp-10 : 40px
sp-12 : 48px
sp-16 : 64px
```

#### Usage

- Button padding: `sp-3` (12px) vertical, `sp-4` (16px) horizontal
- Card padding: `sp-6` (24px)
- Section margin: `sp-8` to `sp-12`
- Page padding: `sp-6` mobile, `sp-8` desktop

#### 12-Column Grid (responsive)

```text
Mobile (< 640px)    : 4px gutter, full width
Tablet (640-1024px) : 8px gutter, 8 columns
Desktop (> 1024px)  : 16px gutter, 12 columns
Max-width          : 1280px (xl breakpoint)
```

For spacing scale, grid specifications, density modes, and responsive breakpoint details, see `references/spacing-grid.md`.

### Step 4: Configure Responsive Breakpoints

Standard Tailwind breakpoints (widely adopted):

```text
sm   : 640px   (small phones)
md   : 768px   (tablets)
lg   : 1024px  (small desktops)
xl   : 1280px  (standard desktops)
2xl  : 1536px  (large screens)
```

**Mobile-first approach:** Start with mobile styles, add `md:`, `lg:` for larger screens.

```jsx
<div className="text-sm md:text-base lg:text-lg">Responsive text</div>
```

### Step 5: Implement Dark Mode

**Strategy:** Use CSS custom properties that switch values on theme toggle.

#### Setup

1. Define two sets of custom properties (light + dark).
2. Toggle via `data-theme` attribute on `<html>` or `<body>`.
3. Semantic tokens point to custom properties.

#### Light mode (default)

```css
:root {
  --color-surface: #ffffff;
  --color-text: #1f2937;
  --color-border: #e5e7eb;
}
```

#### Dark mode

```css
[data-theme="dark"] {
  --color-surface: #111827;
  --color-text: #f3f4f6;
  --color-border: #374151;
}
```

#### Toggle function

```typescript
function toggleDarkMode() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  document.documentElement.setAttribute(
    "data-theme",
    isDark ? "light" : "dark",
  );
  localStorage.setItem("theme", isDark ? "light" : "dark");
}
```

### Step 6: Verify WCAG 2.2 AA Compliance

#### Mandatory checks

1. **Text Contrast (4.5:1 for normal text):**
   - Black text on white: ✓ (21:1)
   - Primary color (blue) on white: check with contrast checker
   - Light gray text: may fail; use darker gray

2. **Focus Indicators:**
   - Keyboard focus must be visible (outline, underline, highlight)
   - Contrast ≥3:1 between focused and unfocused
   - Outline width ≥2px, offset ≥2px

3. **Touch Targets (44x44px minimum):**
   - All clickable/tappable elements ≥44x44px
   - Spacing of ≥8px between targets

4. **Color Not Sole Information:**
   - Do NOT use color alone to convey status (pair with icon or pattern)
   - Example: ✓ Green button + checkmark + "Success" text

5. **Form Labels & Error Messages:**
   - Every input must have an associated `<label>`
   - Error messages must be linked to input (`aria-describedby`)

6. **Keyboard Navigation:**
   - All functionality must be keyboard accessible
   - Tab order must be logical (left-to-right, top-to-bottom)

**Quick audit tool:** Chrome DevTools > Lighthouse > Accessibility, or run axe DevTools.

## Advanced Cases

### Case: B2B Dashboard vs. B2C Landing Page Density

#### B2B Dashboard (compact density)

- Smaller font sizes (sm, base)
- Tighter spacing (sp-2, sp-3)
- Denser information layout
- More columns, less whitespace

#### B2C Landing Page (comfortable density)

- Larger font sizes (base, lg)
- Generous spacing (sp-6, sp-8)
- Clear visual hierarchy
- Breathing room around content

Choose density based on use case; implement via CSS variable overrides or Tailwind config variants.

### Case: Multi-Brand Color Adaptation

Define brand-specific color palettes while maintaining semantic roles.

```text
Brand A:
  --color-primary: blue-600
  --color-secondary: purple-600

Brand B:
  --color-primary: green-600
  --color-secondary: teal-600
```

Load brand-specific tokens at runtime or build time.

### Case: High-Contrast Mode

Some users require higher contrast. Provide an option:

```css
[data-contrast="high"] {
  --color-text: #000000;
  --color-surface: #ffffff;
  --color-border: #000000;
}
```

## Fallback Clause

If the following information is missing, output `[INFORMATION NEEDED: X]` instead of inventing:

- Target audience (B2B vs. B2C; power users vs. casual)
- Brand color constraints or primary color requirement
- Accessibility conformance level (AA vs. AAA)
- Dark mode requirement
- Mobile-first vs. desktop-first priority
- Existing typography or color system to match

Do NOT guess color values, font sizes, or accessibility requirements.

## Anti-Patterns

### Hardcoded Colors Without Semantic Layer

```css
/* ❌ BAD */
button {
  background: #6366f1;
}
.error {
  color: #ef4444;
}

/* ✅ GOOD */
button {
  background: var(--color-primary);
}
.error {
  color: var(--color-danger);
}
```

#### Inconsistent Spacing

```jsx
/* ❌ BAD */
<div style={{ padding: '12px 20px 16px 18px' }}>

/* ✅ GOOD */
<div className="p-4">  {/* sp-4 = 16px */}
```

#### Insufficient Focus Indicators

```css
/* ❌ BAD */
button:focus {
  outline: 1px solid blue;
}

/* ✅ GOOD */
button:focus {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
}
```

#### Color as Sole Information

```jsx
/* ❌ BAD */
<span style={{ color: 'red' }}>Error</span>

/* ✅ GOOD */
<span role="alert" className="flex items-center gap-2">
  <Icon name="error" /> Error
</span>
```

#### Responsive Without Testing

```jsx
/* ❌ BAD: assumes desktop layout, untested on mobile */
<div className="grid grid-cols-4">

/* ✅ GOOD: mobile-first, tested at md:/lg: breakpoints */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
```

#### Dark Mode Hardcoding

```css
/* ❌ BAD */
@media (prefers-color-scheme: dark) {
  body {
    background: #111827;
  }
}

/* ✅ GOOD: uses semantic tokens */
body {
  background: var(--color-surface);
}
[data-theme="dark"] {
  --color-surface: #111827;
}
```

## Enforcement

This skill is MANDATORY and must be followed without exception when its trigger fires.

When establishing UI specifications:

1. Use a modular typographic scale (1.25 ratio or similar).
2. Define semantic color roles (primary, secondary, danger, success, warning, info, neutral).
3. Implement a 4px-based spacing system with consistent tokens.
4. Test dark mode with CSS custom properties (not duplicate components).
5. Ensure WCAG 2.2 AA compliance: 4.5:1 contrast, 44x44px touch targets, keyboard navigation.
6. Never use color as the sole means of conveying information.
7. Responsive design must be mobile-first with tested breakpoints (sm, md, lg, xl, 2xl).

## Source References

- **W3C WCAG 2.2:** Web Content Accessibility Guidelines Level AA
- **Modular Scale:** Tim Brown, "Modular Scale" (website and methodology)
- **Tailwind CSS:** Official documentation, spacing scale, breakpoints, color system
- **Material Design 3:** Google Material Design 3, color system and typography
- **APCA (Advanced Perceptual Contrast Algorithm):** Modern contrast calculation method
- **Accessible Colors:** WebAIM contrast checker, accessible color palettes
