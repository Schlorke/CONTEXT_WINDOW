# Typography Scale Reference

Reference file for `saas-ui-specifications` SKILL.

## Modular Scale (1.25 Ratio)

Base: 16px (100%)
Ratio: 1.25 (major third)

### Font Sizes

| Name   | Size | Ratio   | Use Case                         |
| ------ | ---- | ------- | -------------------------------- |
| `xs`   | 12px | 0.75x   | Form hints, captions, badges     |
| `sm`   | 14px | 0.875x  | Secondary text, labels, small UI |
| `base` | 16px | 1.00x   | Body text, default               |
| `lg`   | 20px | 1.25x   | Subheadings, prominent text      |
| `xl`   | 25px | 1.5625x | Section headings                 |
| `2xl`  | 31px | 1.953x  | Page subheadings                 |
| `3xl`  | 39px | 2.44x   | Feature headings                 |
| `4xl`  | 49px | 3.05x   | Page titles, hero text           |
| `5xl`  | 61px | 3.81x   | Landing page hero (rarely used)  |

## Responsive Font Sizes (CSS clamp)

Use `clamp(min, current, max)` for fluid typography that scales with viewport.

```css
/* xs: 12px on small, 14px on large */
font-size: clamp(12px, 1vw + 10px, 14px);

/* base: 14px on small, 16px on large */
font-size: clamp(14px, 1vw + 12px, 16px);

/* lg: 18px on small, 20px on large */
font-size: clamp(18px, 1vw + 14px, 20px);

/* xl: 20px on small, 25px on large */
font-size: clamp(20px, 1.5vw + 16px, 25px);

/* 2xl: 25px on small, 31px on large */
font-size: clamp(25px, 2vw + 18px, 31px);

/* 3xl: 31px on small, 39px on large */
font-size: clamp(31px, 2.5vw + 20px, 39px);

/* 4xl: 39px on small, 49px on large */
font-size: clamp(39px, 3vw + 22px, 49px);
```

## Line Heights

| Context     | Line-Height   | Use Case                               |
| ----------- | ------------- | -------------------------------------- |
| Headings    | 1.2           | Tight, compact headings                |
| Subheadings | 1.3           | Secondary headings                     |
| Body text   | 1.5 (default) | Standard readability for paragraphs    |
| Dense UI    | 1.4           | Form labels, list items in data tables |
| Spacious    | 1.6           | Long-form articles, blog posts         |

### Implementation

```css
/* Headings */
h1,
h2,
h3,
h4 {
  line-height: 1.2;
}

/* Body */
body,
p {
  line-height: 1.5;
}

/* Dense UI */
label,
.table-row {
  line-height: 1.4;
}
```

## Letter Spacing

| Context | Letter-Spacing | Use Case                               |
| ------- | -------------- | -------------------------------------- |
| Normal  | 0              | Standard body text                     |
| Tight   | -0.02em        | Headlines (optional for design impact) |
| Relaxed | 0.025em        | Small text (xs, sm sizes)              |
| Wide    | 0.05em         | Uppercase labels, buttons              |

### Implementation (2)

```css
/* Uppercase labels (wider tracking) */
.label {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 12px;
}

/* Small text (improve readability) */
.caption {
  font-size: 12px;
  letter-spacing: 0.025em;
}

/* Normal body */
p {
  letter-spacing: 0;
}
```

## Font Pairings (Google Fonts)

### Serif + Sans Pairing (Professional)

- **Heading (Serif):** Merriweather, Lora, Playfair Display
- **Body (Sans):** Inter, Open Sans, Roboto
- **Monospace:** Roboto Mono, IBM Plex Mono

#### CSS

```css
@import url("https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;600&display=swap");

body {
  font-family: "Inter", sans-serif;
}

h1,
h2,
h3,
h4 {
  font-family: "Lora", serif;
}

code,
pre {
  font-family: "Roboto Mono", monospace;
}
```

### Modern Sans-Only (Tech, SaaS)

- **Body:** Inter, Plus Jakarta Sans, Geist
- **Monospace:** Fira Code, Geist Mono

#### CSS: (2)

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;600&display=swap");

body {
  font-family: "Inter", sans-serif;
}

code,
pre {
  font-family: "Fira Code", monospace;
}
```

## Font Weights

| Weight | Name     | Use Case                           |
| ------ | -------- | ---------------------------------- |
| 400    | Regular  | Body text, default                 |
| 500    | Medium   | Subheadings, labels, emphasis      |
| 600    | Semibold | Headings, buttons, strong emphasis |
| 700    | Bold     | Page titles, strong callouts       |

### Implementation (3)

```css
body {
  font-weight: 400;
}

label,
.button {
  font-weight: 500;
}

h2,
h3 {
  font-weight: 600;
}

h1 {
  font-weight: 700;
}
```

## Tailwind CSS Typography Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    fontSize: {
      xs: ["12px", { lineHeight: "1.5" }],
      sm: ["14px", { lineHeight: "1.4" }],
      base: ["16px", { lineHeight: "1.5" }],
      lg: ["20px", { lineHeight: "1.3" }],
      xl: ["25px", { lineHeight: "1.2" }],
      "2xl": ["31px", { lineHeight: "1.2" }],
      "3xl": ["39px", { lineHeight: "1.1" }],
      "4xl": ["49px", { lineHeight: "1.1" }],
      "5xl": ["61px", { lineHeight: "1.0" }],
    },
    fontFamily: {
      sans: ["Inter", "system-ui", "sans-serif"],
      serif: ["Lora", "serif"],
      mono: ["Fira Code", "monospace"],
    },
    letterSpacing: {
      tighter: "-0.02em",
      tight: "-0.01em",
      normal: "0",
      relaxed: "0.025em",
      wide: "0.05em",
    },
  },
};
```

## Accessibility Notes

1. **Minimum size:** Never go below 12px for body text (WCAG 2.2 recommendation is 14px).
2. **Contrast:** Ensure heading colors meet 4.5:1 contrast against background.
3. **Line height:** 1.5+ for body text improves readability for users with dyslexia.
4. **Avoid using color alone:** Pair color changes with weight or size changes.
5. **Responsive:** Use `clamp()` to scale fonts fluidly rather than abrupt breakpoint changes.

## Usage Examples

### Page Structure

```html
<h1 class="text-4xl font-bold leading-tight">Page Title</h1>
<!-- 49px, bold, tight line-height -->

<h2 class="text-2xl font-semibold leading-snug mt-8">Section Heading</h2>
<!-- 31px, semibold, compact -->

<p class="text-base font-normal leading-relaxed max-w-3xl">
  Body paragraph with comfortable line height.
</p>
<!-- 16px, regular weight, 1.5 line-height -->

<label class="text-sm font-medium">Form Label</label>
<!-- 14px, medium weight, secondary emphasis -->

<span class="text-xs text-gray-600">Caption or hint text</span>
<!-- 12px, gray color, fine print -->
```

### Button Variants

```html
<!-- Large button -->
<button class="text-base font-semibold px-4 py-3">Primary Action</button>

<!-- Small button -->
<button class="text-sm font-medium px-3 py-2">Secondary Action</button>

<!-- Icon button (no text size defined; see icon size instead) -->
<button class="p-2">
  <svg class="w-5 h-5"></svg>
</button>
```
