# Migration log — legacy-shop

| State | Evidence |
| --- | --- |
| inventory | legacy-inventory.mjs: missing topology (5), type folders components/ hooks/ utils/, route pages/index.tsx |
| characterization | characterization/cases.json + legacy.test.tsx green on the legacy code |
| target-skeleton | scaffolded from multiplatform-platform-architecture/assets/template |
| incremental-moves | utils/format → entities/product/model; components/ProductList → entities/product/ui + widgets/product-list; hooks/useCart → features/add-to-cart/model; components/Button → packages/ui; pages/index → pages/home + apps/clients/web route |
| gate | arch-check: 0 violations |
| retire | legacy folders and template sample slices removed (see migration.json) |
| both-clients-proven | next build + expo export (see acceptance evidence) |
