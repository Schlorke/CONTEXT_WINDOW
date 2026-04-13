# Color System Reference

Reference file for `saas-ui-specifications` SKILL.

## Semantic Color Roles

Define colors by role (what they communicate), not by raw hex value.

### Primary

- **Use:** Main CTAs, brand identity, active states, focused elements
- **Light:** Often a vibrant blue (e.g., `hsl(214, 99%, 50%)`)
- **Dark mode:** Lighter shade (e.g., `hsl(214, 100%, 55%)`)
- **Contrast:** Must pass 4.5:1 on white background (WCAG AA)

### Secondary

- **Use:** Alternative actions, supporting elements, accents
- **Light:** Often purple, teal, or a complementary color
- **Dark mode:** Adjust for sufficient contrast
- **Contrast:** Must pass 4.5:1 (AA)

### Neutral (Grayscale)

- **Use:** Backgrounds, borders, text, dividers
- **Levels:** 50 (very light), 100, 200, ..., 900, 950 (very dark)
- **Common roles:**
  - `neutral-50` or `neutral-100`: Page background (light)
  - `neutral-200`: Card backgrounds, light borders
  - `neutral-400`: Secondary text, disabled states
  - `neutral-600`: Primary text
  - `neutral-900`: Dark backgrounds (dark mode)

### Danger

- **Use:** Destructive actions (delete, remove), errors, critical alerts
- **Light:** Red (e.g., `hsl(0, 100%, 50%)`)
- **Dark mode:** Lighter red
- **Contrast:** Must pass 4.5:1 on white background

### Warning

- **Use:** Cautions, alerts, pending actions
- **Light:** Orange or amber (e.g., `hsl(36, 100%, 50%)`)
- **Dark mode:** Lighter orange
- **Contrast:** Often fails 4.5:1 with white; pair with icon/text

### Success

- **Use:** Confirmations, completions, valid states
- **Light:** Green (e.g., `hsl(134, 100%, 40%)`)
- **Dark mode:** Lighter green
- **Contrast:** Must pass 4.5:1

### Info

- **Use:** Informational messages, help text
- **Light:** Cyan or light blue (e.g., `hsl(188, 100%, 50%)`)
- **Dark mode:** Lighter cyan
- **Contrast:** Must pass 4.5:1

## HSL-Based Color Generation

HSL (Hue, Saturation, Lightness) is better for systematic color generation than RGB/Hex.

```text
HSL(hue, saturation%, lightness%)
- Hue: 0-360 (0=red, 120=green, 240=blue, 360=red again)
- Saturation: 0-100% (0=gray, 100=fully saturated)
- Lightness: 0-100% (0=black, 50=pure color, 100=white)
```

### Blue Scale (for Primary Role)

```hsl
Primary 50   : hsl(214, 95%, 95%)    /* Very light blue background */
Primary 100  : hsl(214, 96%, 89%)
Primary 200  : hsl(214, 95%, 80%)
Primary 300  : hsl(214, 97%, 69%)
Primary 400  : hsl(214, 98%, 58%)
Primary 500  : hsl(214, 99%, 50%)    /* Base primary color */
Primary 600  : hsl(214, 100%, 44%)   /* Hover state (darker) */
Primary 700  : hsl(214, 100%, 36%)   /* Active state (darker still) */
Primary 800  : hsl(214, 89%, 26%)    /* Very dark */
Primary 900  : hsl(214, 84%, 14%)    /* Near black */
```

### Gray Scale (Neutral)

```hsl
Gray 50    : hsl(0, 0%, 98%)        /* Nearly white */
Gray 100   : hsl(0, 0%, 96%)
Gray 200   : hsl(0, 0%, 93%)
Gray 300   : hsl(0, 0%, 89%)
Gray 400   : hsl(0, 0%, 82%)        /* Medium gray */
Gray 500   : hsl(0, 0%, 74%)
Gray 600   : hsl(0, 0%, 62%)        /* Primary text color on light bg */
Gray 700   : hsl(0, 0%, 48%)
Gray 800   : hsl(0, 0%, 24%)
Gray 900   : hsl(0, 0%, 13%)        /* Nearly black */
```

## WCAG Contrast Requirements by Role

### Normal Text (≤18px)

Requires **4.5:1 contrast ratio** (WCAG AA).

| Text Color  | Background | Ratio | WCAG AA | Notes                     |
| ----------- | ---------- | ----- | ------- | ------------------------- |
| Primary 600 | White      | 4.8:1 | ✓ Pass  | Safe for body text        |
| Primary 500 | White      | 4.2:1 | ✓ Pass  | Borderline; use carefully |
| Gray 600    | White      | 5.1:1 | ✓ Pass  | Recommended for body text |
| Gray 500    | White      | 3.2:1 | ✗ Fail  | Do not use for body text  |
| Red 600     | White      | 4.6:1 | ✓ Pass  | Error messages            |

### Large Text (≥18px or ≥14px bold)

Requires **3:1 contrast ratio** (WCAG AA).

| Text Color  | Background | Ratio | WCAG AA | Notes                   |
| ----------- | ---------- | ----- | ------- | ----------------------- |
| Primary 500 | White      | 4.2:1 | ✓ Pass  | Safe for headings       |
| Gray 500    | White      | 3.2:1 | ✓ Pass  | Safe for large text     |
| Gray 400    | White      | 2.0:1 | ✗ Fail  | Only for disabled state |

### Graphical Elements (icons, borders, focus indicators)

Requires **3:1 contrast ratio** (WCAG AA).

| Element       | Background | Color       | Ratio | WCAG AA                              |
| ------------- | ---------- | ----------- | ----- | ------------------------------------ |
| Icon          | White      | Primary 600 | 4.8:1 | ✓ Pass                               |
| Border        | White      | Gray 300    | 5.1:1 | ✓ Pass                               |
| Focus outline | White      | Primary 600 | 4.8:1 | ✓ Pass                               |
| Disabled text | White      | Gray 400    | 2.0:1 | ✗ Fail (but acceptable for disabled) |

**Tip:** Use WebAIM's Contrast Checker (<https://webaim.org/resources/contrastchecker/>) to verify combinations.

## Dark Mode Color Mapping

Two strategies:

### Strategy 1: Inverse Lightness (Recommended)

For each color, invert the lightness value for dark mode:

```text
Light mode  : hsl(214, 99%, 50%)  (50% lightness)
Dark mode   : hsl(214, 99%, 55%)  (similar hue/sat, lighter value ~55%)
```

For neutrals, invert more aggressively:

```text
Light gray (200) : hsl(0, 0%, 93%)
Dark mode gray   : hsl(0, 0%, 18%)  (inverse: 100 - 93 + adjustment)
```

### Strategy 2: Role Swapping

Use different hues for dark mode to match user expectations:

```text
Light:
  --color-primary: hsl(214, 99%, 50%)     (vibrant blue)

Dark:
  --color-primary: hsl(200, 100%, 60%)    (lighter cyan-blue)
```

### CSS Implementation

```css
:root {
  /* Light mode (default) */
  --color-primary: hsl(214, 99%, 50%);
  --color-primary-light: hsl(214, 96%, 89%);
  --color-text: hsl(0, 0%, 13%);
  --color-surface: hsl(0, 0%, 100%);
  --color-border: hsl(0, 0%, 93%);
}

[data-theme="dark"] {
  /* Dark mode */
  --color-primary: hsl(214, 100%, 55%);
  --color-primary-light: hsl(214, 100%, 25%);
  --color-text: hsl(0, 0%, 93%);
  --color-surface: hsl(0, 0%, 13%);
  --color-border: hsl(0, 0%, 24%);
}
```

## Tailwind CSS Color Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    colors: {
      primary: {
        50: "hsl(214, 95%, 95%)",
        100: "hsl(214, 96%, 89%)",
        200: "hsl(214, 95%, 80%)",
        300: "hsl(214, 97%, 69%)",
        400: "hsl(214, 98%, 58%)",
        500: "hsl(214, 99%, 50%)",
        600: "hsl(214, 100%, 44%)",
        700: "hsl(214, 100%, 36%)",
        800: "hsl(214, 89%, 26%)",
        900: "hsl(214, 84%, 14%)",
      },
      gray: {
        50: "hsl(0, 0%, 98%)",
        100: "hsl(0, 0%, 96%)",
        200: "hsl(0, 0%, 93%)",
        300: "hsl(0, 0%, 89%)",
        400: "hsl(0, 0%, 82%)",
        500: "hsl(0, 0%, 74%)",
        600: "hsl(0, 0%, 62%)",
        700: "hsl(0, 0%, 48%)",
        800: "hsl(0, 0%, 24%)",
        900: "hsl(0, 0%, 13%)",
      },
      danger: {
        50: "hsl(0, 95%, 95%)",
        600: "hsl(0, 100%, 45%)",
        700: "hsl(0, 100%, 35%)",
      },
      success: {
        50: "hsl(134, 95%, 93%)",
        600: "hsl(134, 87%, 40%)",
        700: "hsl(134, 87%, 32%)",
      },
      warning: {
        50: "hsl(36, 100%, 95%)",
        600: "hsl(36, 100%, 50%)",
        700: "hsl(36, 100%, 40%)",
      },
      info: {
        50: "hsl(188, 100%, 95%)",
        600: "hsl(188, 100%, 45%)",
        700: "hsl(188, 100%, 35%)",
      },
    },
  },
};
```

### Usage

```jsx
<button className="bg-primary-600 text-white hover:bg-primary-700">
  Primary Action
</button>

<div className="text-danger-600 bg-danger-50">
  Error message
</div>
```

## Color Accessibility Checklist

- [ ] Primary color passes 4.5:1 contrast on white background
- [ ] Secondary color passes 4.5:1 contrast on white background
- [ ] Body text color (gray-600 or darker) passes 4.5:1 on white
- [ ] All text colors tested against light and dark backgrounds
- [ ] Danger color passes 4.5:1 on white (important for safety-critical content)
- [ ] Focus indicator color passes 3:1 contrast
- [ ] Color not used alone to convey status (pair with icon/pattern)
- [ ] Dark mode colors tested for contrast
- [ ] Tested with Contrast Checker or Chrome DevTools Lighthouse Accessibility audit

## Common Color Palettes (Ready-to-Use)

### Tech/SaaS (Blue Primary)

```text
Primary: hsl(214, 99%, 50%)    (vibrant blue)
Secondary: hsl(262, 100%, 50%) (purple)
Danger: hsl(0, 100%, 45%)      (red)
Success: hsl(134, 87%, 40%)    (green)
Warning: hsl(36, 100%, 50%)    (amber)
```

### Professional (Teal Primary)

```text
Primary: hsl(188, 100%, 40%)   (teal)
Secondary: hsl(200, 100%, 45%) (cyan)
Danger: hsl(0, 100%, 45%)      (red)
Success: hsl(134, 87%, 40%)    (green)
Warning: hsl(36, 100%, 50%)    (amber)
```

### Minimal (Gray Primary)

```text
Primary: hsl(0, 0%, 20%)       (dark gray)
Secondary: hsl(0, 0%, 50%)     (medium gray)
Danger: hsl(0, 100%, 45%)      (red)
Success: hsl(134, 87%, 40%)    (green)
Warning: hsl(36, 100%, 50%)    (amber)
```

## Tools

- **Colormind:** Auto-generate harmonious palettes (<http://colormind.io/>)
- **Coolors.co:** Interactive palette builder
- **WebAIM Contrast Checker:** Verify contrast ratios
- **Chroma.js:** Programmatic color manipulation
- **Accessible Colors:** Pre-made accessible palettes (<https://accessible-colors.com/>)
