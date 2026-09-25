---
name: spline-web-integration
description:
  Integrates Spline scenes into this React, Next.js, and TypeScript landing —
  runtime 2.0.55, SplineScene, lazy client load, SSR, placeholders, lifecycle,
  cleanup, accessibility, reduced motion, fallbacks. Use when embedding
  .splinecode, wiring Spline events to the DOM, or editing packages/site-dom
  spline-runtime / spline-scene. Do not invent a new architecture. Spline MCP
  does not export .splinecode.
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-20"
  sources:
    "packages/site-dom spline-runtime.ts and spline-scene.tsx; ADRs 004/005;
    @splinetool/runtime; docs.spline.design export-as-code"
---

# Spline Web Integration

Se o `spline-master` ainda não foi lido, leia
`.agents/skills/spline/spline-master/SKILL.md`.

Trabalho **neste repo**, não no editor, salvo exportar a cena. Não transformar
um canvas numa arquitetura nova.

## Superfície que já existe

- `packages/site-dom/src/pages/home/ui/spline-scene/spline-scene.tsx` — owner do
  canvas, `start`/`dispose`, zoom, interactive.
- `packages/site-dom/src/pages/home/lib/spline-runtime/spline-runtime.ts` —
  runtime único, `wasmPath`, `renderMode`, prefetch, pixel cap.
- Contrato de abertura: `OpeningProvider` / `SceneLifecycle`. A cena reporta
  `loading`/`loaded`/`error`/`unmounted`; não escreve no `<html>` sozinha.

Detalhe e checklist: [references/this-repo.md](references/this-repo.md).

## Regras

- Client-only. Dynamic import de `@splinetool/runtime` (já é o padrão). Sem
  Spline no SSR.
- `new Application(canvas, { renderMode, wasmPath })` — API pública. Sem
  `window.fetch` rewrite.
- Cleanup no unmount: `dispose`. Strict Mode: `scheduleAfterStrictMount` já
  existe; não "corrigir" com remount do canvas.
- Fallback só em `error` explícito. Loading cobre o preloader da abertura.
- Reduced motion: gates do pacote, não um `if` solto no canvas.
- Eventos Spline → DOM: usar a API pública do runtime (`findObjectByName`,
  `addEventListener`, variáveis) **depois** de confirmar no d.ts / código atual.
  Não copiar snippets de forks MCP.
- Export: Spline UI **Export → Code**. MCP não exporta. Cena e runtime na mesma
  geração de schema (hoje 131 / runtime 2.0.55).

Docs oficiais de embed:
<https://docs.spline.design/exporting-your-scene/web/exporting-as-code> e
<https://www.npmjs.com/package/@splinetool/runtime>

## Qualidade

- Um runtime. Duas cenas (hero/intro) compartilham o pacote.
- Nada de `@splinetool/react-spline` paralelo se o host já tem `SplineScene`.
- Depois de mudar runtime/cena/carregamento: `teste-iphone-perf`.
