# EV-R3 — Hotfix 2.0.2 QA portability (prepare-only)

## Causa Ubuntu

1. `test/acceptance-auth.test.mjs` usava `<temp>\...` / `<user-home>\...`.
   Em POSIX, `path.resolve("C:\\Temp\\...")` torna-se relativo ao cwd do runner
   (`.../CONTEXT_WINDOW/<temp>\...`), quebrando cobertura parent/filho.
2. `test/pnpm-guard.test.mjs` usava `storeDir: C:/outside/store`. Em POSIX isso
   **não** é absoluto; `path.resolve(workspace, "C:/outside/store")` cai *dentro*
   do sandbox → o blocker esperado não dispara.

## Causa Windows

`.prettierrc.json` vazio + EditorConfig `end_of_line=lf` → Prettier exige LF.
Checkout GHA Windows com `core.autocrlf=true` materializa CRLF → `prettier --check`
reprova. Não havia `.gitattributes` impondo `eol=lf`.

## Correção

- Destinos/stores sintéticos via `path.join` / `path.resolve` portáveis.
- `isInside(..., pathApi)` + `test/path-portability.test.mjs` (win32+posix).
- `.gitattributes` `* text=auto eol=lf` (+ binaries).
- Prettier `{ "endOfLine": "lf" }`.

## Provas (local)

Ver relatório de preparação v2.0.2 (qa / prettier / clean-copy).

Commit/tag/push **não** executados nesta etapa.
