# Client mirror contract (web + mobile)

Mandatory for every product repository with a frontend. The mirror means one source of design and
behavior consumed by both clients — not two implementations that try to look alike.

## Topology

```text
apps/clients/web        Next.js: src/app (routes, layout); src/host, src/shared for platform integration
apps/clients/mobile     Expo Router: src/app (routes, layout); src/host, src/shared for native integration
packages/frontend       the only FSD tree: src/{app,pages,widgets,features,entities,shared}
packages/ui             components: src/contract/* + src/web/*.web.tsx + src/native/*.native.tsx
packages/design-tokens  canonical tokens and themes
```

## Rules

1. Both clients render `@scope/frontend/pages/*` inside `@scope/frontend/app` providers. A client
   route file only maps a URL/screen to a page and adds platform wrappers (ScrollView, metadata).
2. Clients never import each other and never import `packages/*/src` paths.
3. `packages/ui` components share one contract (`contract/*.ts`: props and token-derived styles)
   and have one implementation per platform. `package.json` exports select the implementation:
   `"react-native"` condition for Metro, `"default"` for Next.js and tests.
4. `packages/frontend` is universal: no `react-dom`, `next/*`, `react-native`, Node built-ins or
   server-only imports. Platform-specific behavior goes into `packages/ui` variants or client adapters.
5. Tokens are defined only in `packages/design-tokens`: `pnpm tokens` rejects literal colors,
   sizes, local style constants and redefinitions of token names elsewhere. A token change must
   reach both clients without editing client code (`pnpm check:tokens`).
6. The component catalog (`packages/ui/src/catalog.ts`) lists every exported component with the
   states under review, and both clients render it at `/catalog`; a unit test fails when a
   component has no catalog entry.

## Proof levels for mobile

| Level | Evidence | Command |
| --- | --- | --- |
| Resolution | TypeScript resolves native variants | `tsc -p apps/clients/mobile` |
| Bundle | Metro produces Android and iOS bundles | `pnpm bundle:mobile` |
| Native build | Gradle / Xcode build | `expo run:android`, `expo run:ios` (needs SDKs; iOS needs macOS) |
| Execution | App runs on device or emulator | manual or Maestro/Detox run |

Report each level separately; a higher level is never implied by a lower one.
