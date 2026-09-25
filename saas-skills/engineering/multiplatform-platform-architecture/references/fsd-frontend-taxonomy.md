# FSD Frontend Taxonomy — Layers, Segments, Slice Groups

Feature-Sliced Design is the mandatory taxonomy of the product frontend. The tree lives once, in
`packages/frontend/src`, and both `apps/clients/web` and `apps/clients/mobile` render it. Reference:
<https://feature-sliced.design/docs/reference/layers> (fetched 2026-09-24; layer list and import rule
below are quoted from it). Mirror contract: `client-fsd-mirror.md`.

## The layers (import downward only)

```text
packages/frontend/src/
├── app/        providers, global configuration, app-wide concerns (segments, no slices)
├── pages/      screens; one slice per page or group of similar pages
├── widgets/    large self-sufficient UI blocks reused by pages
├── features/   user interactions reused on several pages (verbs)
├── entities/   business nouns: model, api, ui of the concept
└── shared/     business-agnostic foundation (segments, no slices): api, ui, lib, config
```

Official rules (FSD reference):

1. "A module (file) in a slice can only import other slices when they are located on layers strictly below."
2. App and Shared are both a layer and a slice: their segments import each other freely.
3. Entities may reference each other only through the `@x` cross-import public API
   (`entities/song/@x/artist.ts` is imported only by `entities/artist`).
4. A slice's public API is its `index.ts`; wildcard re-exports (`export * from`) are bad practice.
5. Processes is deprecated; do not create it.

Project restrictions added by this library (not part of the official spec):

- `shared/ui` only re-exports or composes `packages/ui`; it never defines a second component source.
- There is no global barrel at `src/index.ts`; the package exports only `./app` and `./pages/*`.
- The frontend is universal: no `next/*`, `react-dom`, `react-native`, Node built-ins or server code.
- Inside `packages/frontend`, imports between slices are relative paths to the other slice's
  `index.ts` (the package does not import itself by name).

All of the above are checked by `tools/arch-check.mjs`. Steiger (official FSD linter) can run in
addition for FSD-internal diagnostics; it does not see cross-package or runtime boundaries.

## Framework routing stays in the clients

- Next.js `src/app/` in `apps/clients/web` holds routes, layouts and metadata; each route renders a
  page exported by `@scope/frontend/pages/*`. Because FSD lives in another package, the FSD `pages`
  layer never collides with the Next.js Pages Router.
- Expo Router `src/app/` in `apps/clients/mobile` plays the same role for screens.

## Slice groups

Slices of one domain may be grouped in a folder that contains no code of its own:

```text
features/                     entities/
├── crm/                      ├── crm/
│   ├── client-save/          │   ├── client/
│   └── client-delete/        │   └── client-category/
└── auth/                     └── session/
    └── login/
```

- The group folder has no `index.ts`; each slice inside it has its own.
- Sibling slices inside a group are still isolated (the gate treats `crm/client-save` and
  `crm/client-delete` as different slices).
- Use the same group name across layers so a domain is found by one search.

## Segment anatomy

```text
<slice>/
├── ui/         components (render only)
├── model/      state and logic: reducers, stores, validation, view types
├── api/        data access for this slice (through shared/api or the api-client package)
├── lib/        slice-local helpers
└── index.ts    public API — the only import surface for other slices
```

Name segments by purpose (`ui`, `model`, `api`, `lib`, `config`), not by essence (`components`,
`hooks`, `types`); the gate warns on essence names.

## Entity vs Feature vs Widget decision table

| Ask | If yes |
| --- | --- |
| Is it a screen? | `pages/` |
| A large block reused by pages, or one of several independent blocks of a page? | `widgets/` |
| A user interaction reused on several pages? | `features/` |
| A business noun reused across features? | `entities/` |
| Knows nothing about the business? | `shared/` (or a package if clients need it) |

Tie-breakers: a block used by one page stays in that page; when two slices need each other, the
shared part moves one layer down (usually an entity).

## Known costs and mitigations

- Classification debates: use the table and prefer the lower layer when ambiguous.
- `shared/` bloat: review periodically; design-system parts belong in `packages/ui`.
