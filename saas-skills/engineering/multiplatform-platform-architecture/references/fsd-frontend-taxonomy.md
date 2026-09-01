# FSD Frontend Taxonomy — Layers, Segments, Slice Groups

Feature-Sliced Design (fsd.dev) is the official taxonomy for EVERY frontend
surface of the platform (web and mobile). Same layers, same rules, different
render targets — an engineer who learned one app navigates the other.

## The six layers (import DOWNWARD only)

```text
src/
├── app/        1 — initialization: providers, global styles, app config
├── views/      2 — pages (FSD "pages" renamed: Next.js reserves pages/)
├── widgets/    3 — large self-contained UI blocks (shell, map, data table)
├── features/   4 — user actions, VERBS (client-save, fuel-record-register)
├── entities/   5 — business nouns (client, vehicle, task, conversation)
└── shared/     6 — business-agnostic, app-local: api/ ui/ lib/ config/
```

Rules (all enforced by Steiger, the official FSD linter, in CI):

1. A layer imports only layers strictly below it.
2. A slice never imports a sibling slice — not even inside the same group.
3. Every slice exposes a public `index.ts`; internals are never imported.
4. Anything platform-wide (design system, tokens, contracts, api-client)
   lives in `packages/`, OUTSIDE the FSD tree — which keeps `shared/` thin.
   Anything growing too large in `shared/` is a package candidate.

## Next.js adaptations (web app)

- The framework's `app/` directory (App Router) stays at the project root and
  contains ROUTING ONLY: 3-5 line `page.tsx` files that render a view from
  `src/views/`. Layouts/metadata live there too. It is outside the FSD tree.
- The FSD pages layer is named `views/` because a `src/pages` directory would
  activate the legacy Next.js Pages Router.
- In Expo, `app/` (expo-router) plays the same routing-only role.

## Slice groups (per-domain readability)

Group slices by business domain inside each layer:

```text
features/                     entities/                    views/
├── crm/                      ├── crm/                     ├── dashboard/
│   ├── client-save/          │   ├── client/              ├── crm/
│   └── client-delete/        │   └── client-category/     ├── fleet-hub/
├── fleet/                    ├── fleet/                   ├── fleet-tracking/
│   ├── fuel-record-register/ │   ├── vehicle/             ├── tasks/
│   └── km-record-register/   │   ├── driver/              └── login/
└── auth/                     │   └── fuel-record/
    ├── login/                └── session/
    └── register/
```

Slice-group rules (spec-compliant):

- The group folder contains NO code of its own — no group `index.ts`, only
  slices inside.
- The group name is IDENTICAL across all layers (crm is "crm" everywhere) —
  searching the group name reveals the whole domain in seconds.
- Sibling-slice isolation still applies inside a group.

## Segment anatomy (identical in every slice)

```text
<slice>/
├── ui/         React components (render only; "dumb")
├── model/      state and logic: hooks, stores, view types
├── api/        data access for this slice (via packages/api-client),
│               offline adapters
├── lib/        slice-local helpers
└── index.ts    public API — the ONLY import surface
```

Example — a form action slice:

```text
features/crm/client-save/
├── ui/client-form-dialog.tsx      form markup (React Hook Form wiring)
├── model/use-client-form.ts       form state: useForm + zodResolver(contracts)
├── model/use-client-save.ts       the action: online → API; offline → local
│                                  queue + sync enqueue; optimistic update
└── index.ts
```

`model/` means slice logic — NOT a database model. UI stays dumb; swapping
form library, validation or persistence touches `model/` only.

## Entity vs Feature vs Widget decision table

| Ask                                                                                          | If yes                                      |
| -------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Is it a routed page?                                                                         | `views/`                                    |
| Could it ship alone as a screen block (table with actions, map with panel, app shell)?       | `widgets/`                                  |
| Does its name contain a verb / does it DO something on user intent?                          | `features/`                                 |
| Is it a noun the business owns, reused across features (card, badge, queries of one entity)? | `entities/`                                 |
| Does it know nothing about the business?                                                     | `shared/` (or a package if 2+ apps need it) |

Tie-breakers:

- A component OF one entity used by many features → `entities/<domain>/<noun>/ui`.
- Composition of several entities + features → `widgets/`.
- If a slice needs a sibling slice, the shared part belongs one layer DOWN
  (usually an entity) — never a cross-import.

## Known FSD costs and mitigations

- Classification debates ("entity or feature?") — mitigate with the table
  above; when still ambiguous, prefer the LOWER layer (more reusable).
- `entities/`/`shared/` bloat over time — mitigate with periodic review: big
  `shared/` items graduate to packages; entity groups keep domain ownership.
- A domain spans 4 predictable stops (views/widgets/features/entities) — the
  identical group name makes this a search, not an exploration.
