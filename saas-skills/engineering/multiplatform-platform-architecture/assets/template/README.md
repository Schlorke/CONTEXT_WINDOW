# Acme platform

Thin clients (`apps/clients/web` Next.js, `apps/clients/mobile` Expo) render the product frontend from
`packages/frontend` (Feature-Sliced Design). Components come from `packages/ui`, values from
`packages/design-tokens`. Platform-specific code lives in `.web.tsx` / `.native.tsx` files selected
through the `react-native` package export condition.

    pnpm install --frozen-lockfile
    pnpm verify        # FSD gate, token gate, typecheck, unit tests, web build, mobile bundles
    pnpm check:tokens  # proves one token change reaches both clients

pnpm is pinned in `package.json` (`packageManager`) and configured in `pnpm-workspace.yaml`. Keep
this folder outside any other pnpm workspace. A new dependency with a build script needs an explicit
`allowBuilds` decision; `pnpm run` never installs implicitly (`verifyDepsBeforeRun: error`).
