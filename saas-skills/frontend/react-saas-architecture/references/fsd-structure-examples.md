# FSD structure examples

## Complete product frontend (template)

```text
packages/frontend/src/
├── app/
│   ├── providers/AppProviders.tsx      ThemeProvider from shared/ui
│   └── index.ts                        export { AppProviders }
├── pages/
│   ├── home/
│   │   ├── api/sample-product.ts       data loading for the page
│   │   ├── ui/HomePage.tsx             composes the widget
│   │   └── index.ts                    export { HomePage }
│   └── catalog/                        renders the design-system catalog
├── widgets/product-highlight/
│   ├── ui/ProductHighlight.tsx         ProductCard + ToggleFavoriteButton
│   └── index.ts
├── features/toggle-favorite/
│   ├── model/favorite.ts               reducer (pure, tested)
│   ├── ui/ToggleFavoriteButton.tsx     "use client", Button from shared/ui
│   └── index.ts
├── entities/product/
│   ├── model/product.ts                Product type, formatPrice
│   ├── ui/ProductCard.tsx
│   └── index.ts
└── shared/ui/index.ts                  export { Button, Stack, Text, ... } from "@scope/ui"
```

Clients:

```tsx
// apps/clients/web/src/app/page.tsx
import { HomePage } from "@scope/frontend/pages/home";
export default function Page() {
  return <HomePage />;
}

// apps/clients/mobile/src/app/index.tsx
import { ScrollView } from "react-native";
import { HomePage } from "@scope/frontend/pages/home";
export default function HomeScreen() {
  return (
    <ScrollView>
      <HomePage />
    </ScrollView>
  );
}
```

## Before / after: feature-first legacy to FSD

```text
BEFORE (legacy, rejected)                    AFTER (FSD)
src/components/ProductCard.tsx          →    entities/product/ui/ProductCard.tsx
src/utils/price.ts (formatPrice)        →    entities/product/model/product.ts
src/hooks/useFavorite.ts                →    features/toggle-favorite/model/favorite.ts (+ ui)
src/components/Button.tsx               →    packages/ui (contract + .web + .native)
src/pages/index.tsx (screen content)    →    pages/home/ui/HomePage.tsx
src/pages/index.tsx (routing)           →    apps/clients/web/src/app/page.tsx
```

## Import examples

```ts
// widgets/product-highlight/ui/ProductHighlight.tsx
import { ProductCard } from "../../../entities/product";           // OK: lower layer, index
import { ToggleFavoriteButton } from "../../../features/toggle-favorite"; // OK
import { formatPrice } from "../../../entities/product/model/product";    // FSD-PUBLIC-API

// features/share-product/model/share.ts
import { ToggleFavoriteButton } from "../../toggle-favorite";       // FSD-SLICE (sibling)

// entities/product/lib/x.ts
import { ToggleFavoriteButton } from "../../../features/toggle-favorite"; // FSD-LAYER (upward)

// entities/order/model/order.ts
import type { Product } from "../../product/@x/order";             // OK: @x addressed to order
```

## Where does it go?

| Situation | Destination |
| --- | --- |
| Button, Text, Stack, Input primitives | `packages/ui` |
| Color, spacing, font size values | `packages/design-tokens` |
| "Add to cart" used on product and search pages | `features/add-to-cart` |
| Product image + name + price block used in lists | `entities/product/ui` |
| Checkout summary used only on the checkout page | `pages/checkout/ui` |
| Header with navigation used by all pages | `widgets/header` |
| Fetch wrapper with auth headers | `shared/api` |
| Currency formatting for any amount | `shared/lib/money` (no business rules) |
