# Spacing & Grid Reference

Reference file for `saas-ui-specifications` SKILL.

## Spacing Scale (4px Base Unit)

Every spacing value is a multiple of 4px for harmony and alignment.

### Full Scale

| Token | Pixels | Rem  | Use Case                           |
| ----- | ------ | ---- | ---------------------------------- |
| sp-0  | 0      | 0    | Remove default margins             |
| sp-1  | 4px    | 0.25 | Tight spacing, micro interactions  |
| sp-2  | 8px    | 0.5  | Small gaps, badge padding          |
| sp-3  | 12px   | 0.75 | Compact UI, form field padding     |
| sp-4  | 16px   | 1    | **Standard spacing** (most common) |
| sp-5  | 20px   | 1.25 | Slightly generous spacing          |
| sp-6  | 24px   | 1.5  | Card padding, section spacing      |
| sp-8  | 32px   | 2    | Large gaps, section margins        |
| sp-10 | 40px   | 2.5  | Spacious layouts, feature sections |
| sp-12 | 48px   | 3    | Very spacious, page sections       |
| sp-16 | 64px   | 4    | Huge gaps, page-level spacing      |
| sp-20 | 80px   | 5    | Extra large spacing                |
| sp-24 | 96px   | 6    | Maximum spacing for hero sections  |

## Component Padding Guidelines

### Buttons

| Size | Vertical Padding | Horizontal Padding | Total Height              |
| ---- | ---------------- | ------------------ | ------------------------- |
| xs   | 4px (sp-1)       | 8px (sp-2)         | 28px (44px min with icon) |
| sm   | 6px              | 12px (sp-3)        | 32px                      |
| md   | 10px             | 16px (sp-4)        | 40px (44px touch min)     |
| lg   | 12px (sp-3)      | 20px (sp-5)        | 48px                      |

```jsx
/* Tailwind examples */
<button className="px-3 py-2 text-xs">xs</button>  {/* sp-2 h, sp-3 v */}
<button className="px-4 py-2.5 text-sm">sm</button> {/* sp-4 h, 10px v */}
<button className="px-4 py-2.5 text-base">md</button> {/* sp-4 h, 10px v */}
<button className="px-5 py-3 text-lg">lg</button> {/* sp-5 h, sp-3 v */}
```

### Input Fields

| Property             | Value          |
| -------------------- | -------------- |
| Padding (vertical)   | 10px (common)  |
| Padding (horizontal) | 12px (sp-3)    |
| Height               | 40px (minimum) |
| Minimum touch target | 44px           |

```jsx
<input className="px-3 py-2.5 border rounded" /> {/* 40px height */}
```

### Cards & Containers

| Density  | Padding                    | Use Case                             |
| -------- | -------------------------- | ------------------------------------ |
| Compact  | 16px (sp-4)                | Data tables, dashboards, power users |
| Normal   | 20px (sp-5) or 24px (sp-6) | Standard cards, feature cards        |
| Spacious | 32px (sp-8)                | Landing pages, marketing pages       |

```jsx
<div className="p-4">Compact card</div>           {/* sp-4 */}
<div className="p-6">Standard card</div>         {/* sp-6 */}
<div className="p-8">Spacious card</div>         {/* sp-8 */}
```

### Section Spacing

| Level              | Margin-Top   | Use Case                                   |
| ------------------ | ------------ | ------------------------------------------ |
| Text to text       | 16px (sp-4)  | Paragraphs within a section                |
| Section to section | 32px (sp-8)  | Between major sections                     |
| Page-level         | 48px (sp-12) | Between hero and content, between features |

```jsx
<h2 className="mt-8">Section 1</h2>      {/* sp-8 from previous content */}
<p className="mt-4">Paragraph text</p>  {/* sp-4 from heading */}
<h2 className="mt-12">Section 2</h2>    {/* sp-12 from previous section */}
```

## 12-Column Grid Layout

### Grid Structure

```text
12 columns total
```

### Responsive Configurations

#### Mobile (<640px, Tailwind `sm`)

```text
Columns: 4 (or 2 for simple layouts)
Gutter: 4px (sp-1)
Margin (sides): 16px (sp-4)
Max-width: 100% (minus margins)
```

#### Tablet (640px – 1024px, Tailwind `md` – `lg`)

```text
Columns: 8 (or 6)
Gutter: 8px (sp-2)
Margin (sides): 20px (sp-5)
Max-width: 728px (md) or 960px (lg)
```

#### Desktop (>1024px, Tailwind `lg`+)

```text
Columns: 12
Gutter: 16px (sp-4) or 20px (sp-5)
Margin (sides): 24px (sp-6) or 32px (sp-8)
Max-width: 1280px (xl)
```

### Tailwind Grid Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    gridTemplateColumns: {
      2: "repeat(2, minmax(0, 1fr))",
      4: "repeat(4, minmax(0, 1fr))",
      6: "repeat(6, minmax(0, 1fr))",
      8: "repeat(8, minmax(0, 1fr))",
      12: "repeat(12, minmax(0, 1fr))",
    },
    gap: {
      1: "4px",
      2: "8px",
      3: "12px",
      4: "16px",
      5: "20px",
      6: "24px",
      8: "32px",
    },
  },
};
```

### Grid Layout Examples

#### Mobile: 2-column layout

```jsx
<div className="grid grid-cols-2 gap-2 p-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</div>
```

#### Responsive: 2 col (mobile) → 4 col (tablet) → 12 col (desktop)

```jsx
<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-4 p-6">
  <div className="col-span-1 lg:col-span-3">Sidebar</div>
  <div className="col-span-1 lg:col-span-9">Main content</div>
</div>
```

#### 12-Column grid for complex layouts

```jsx
<div className="grid grid-cols-12 gap-6 max-w-7xl mx-auto px-6">
  <div className="col-span-12 lg:col-span-3">Sidebar</div>
  <div className="col-span-12 lg:col-span-6">Main</div>
  <div className="col-span-12 lg:col-span-3">Right panel</div>
</div>
```

## Responsive Breakpoints

Standard Tailwind breakpoints (widely adopted across industry):

| Breakpoint | Min Width | Device             | Columns | Use Case                    |
| ---------- | --------- | ------------------ | ------- | --------------------------- |
| (none)     | 0px       | Mobile             | 2-4     | Default, mobile-first       |
| `sm`       | 640px     | Tablet (portrait)  | 4-6     | Large phones, small tablets |
| `md`       | 768px     | Tablet (landscape) | 6-8     | Standard tablets            |
| `lg`       | 1024px    | Small desktop      | 12      | Small laptops, 10" screens  |
| `xl`       | 1280px    | Standard desktop   | 12      | Most desktops               |
| `2xl`      | 1536px    | Large desktop      | 12      | Large monitors              |

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
  },
};
```

### Container Max-Widths

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    maxWidth: {
      sm: "24rem", // 384px
      md: "28rem", // 448px
      lg: "32rem", // 512px
      xl: "36rem", // 576px
      "2xl": "42rem", // 672px
      "3xl": "48rem", // 768px (tablet)
      "4xl": "56rem", // 896px (small desktop)
      "5xl": "64rem", // 1024px
      "6xl": "72rem", // 1152px (standard desktop)
      "7xl": "80rem", // 1280px (large desktop)
      full: "100%",
    },
  },
};
```

### Responsive Padding/Margin

```jsx
{
  /* Mobile: 16px padding, Tablet: 24px, Desktop: 32px */
}
<div className="px-4 md:px-6 lg:px-8">Content</div>;

{
  /* Mobile: 16px margin, Tablet+: 32px */
}
<div className="my-4 md:my-8">Section</div>;
```

## Density Modes

Choose based on project type and user expectations.

### Compact Density (Data-Heavy, Power Users)

- Smaller fonts (sm, base)
- Tighter spacing (sp-2, sp-3, sp-4)
- More columns, less whitespace
- Suitable for: dashboards, analytics tools, internal tools

```javascript
// tailwind.config.js
const compactConfig = {
  fontSize: { base: "14px" },
  padding: { default: "8px" }, // sp-2
  margin: { default: "8px" },
  lineHeight: { default: "1.4" },
};
```

### Comfortable Density (Standard, Most SaaS)

- Medium fonts (base, lg)
- Standard spacing (sp-4, sp-6, sp-8)
- Breathing room, clear hierarchy
- Suitable for: most SaaS applications

```javascript
// tailwind.config.js
const comfortableConfig = {
  fontSize: { base: "16px" },
  padding: { default: "16px" }, // sp-4
  margin: { default: "16px" },
  lineHeight: { default: "1.5" },
};
```

### Spacious Density (User-Friendly, Marketing)

- Larger fonts (lg, xl)
- Generous spacing (sp-6, sp-8, sp-12)
- Maximized whitespace
- Suitable for: landing pages, marketing pages, consumer-facing apps

```javascript
// tailwind.config.js
const spaciousConfig = {
  fontSize: { base: "18px" },
  padding: { default: "24px" }, // sp-6
  margin: { default: "24px" },
  lineHeight: { default: "1.6" },
};
```

## Accessibility Notes

1. **Touch Targets:** Minimum 44x44px for all interactive elements (mobile best practice).
2. **Spacing:** Use consistent spacing multiples to improve visual rhythm.
3. **Gutter Size:** Ensure gutters (gaps) are large enough to distinguish content (minimum 4px, recommended 8px+).
4. **Line Length:** Keep max-width for text between 50–75 characters for readability.
5. **Whitespace:** Use spacing intentionally to group related content and separate distinct sections.

## Common Responsive Patterns

### Hero Section

```jsx
<section className="px-4 md:px-8 lg:px-16 py-12 md:py-20 lg:py-32">
  <div className="max-w-4xl mx-auto">
    <h1 className="text-4xl md:text-5xl lg:text-6xl mb-4">Title</h1>
    <p className="text-lg md:text-xl max-w-2xl mb-8">Subtitle</p>
  </div>
</section>
```

### Two-Column Layout (Sidebar + Main)

```jsx
<div className="grid grid-cols-1 lg:grid-cols-4 gap-6 px-4 md:px-6">
  <aside className="lg:col-span-1">Sidebar</aside>
  <main className="lg:col-span-3">Main content</main>
</div>
```

### Card Grid

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-4">
  {items.map((item) => (
    <div key={item.id} className="p-4 md:p-6 border rounded">
      {item.content}
    </div>
  ))}
</div>
```

### Responsive Container

```jsx
<div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
  Content
</div>
```

## Spacing Cheat Sheet (Copy & Paste)

```text
Compact padding:      px-2 py-2   (8px)
Standard padding:     px-4 py-3   (16px h, 12px v)
Generous padding:     px-6 py-4   (24px h, 16px v)
Section margin:       my-8        (32px)
Large section margin: my-12       (48px)

Mobile padding:       px-4        (16px sides)
Tablet padding:       px-6        (24px sides)
Desktop padding:      px-8        (32px sides)
```
