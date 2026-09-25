# Integração neste repositório

Código a reler antes de editar (não duplicar aqui):

- `spline-runtime.ts` — `loadSplineRuntime`, `loadSplineSceneBytes`,
  `prefetchSplineScene`, `SplineRenderMode`, sanitização ANGLE, cap de pixel
  ratio no toque.
- `spline-scene.tsx` — `enabled` (canvas no DOM mesmo desligado; `start` só com
  true), `zoom` = dolly, `interactive` (hero sim, intro não).
- `spline-scene-state.ts` — ids de cena.
- `tooling/assets/vendor-spline.mjs` — wasm da origem.
- `tooling/assets/migrate-intro-spline.mjs` — recusa schema mais novo que o
  runtime; decode-only 2.0.

Padrões já decididos:

| Tema   | Decisão                                                               |
| ------ | --------------------------------------------------------------------- |
| Wasm   | `wasmPath` público, `/vendor/...`, CSP `connect-src 'self'`           |
| Draw   | `manual` offscreen, `continuous` hero visível, `auto` intro estática  |
| Pixel  | ≤2× em `(pointer: coarse)`                                            |
| Schema | aviso `updating from 117 to 131` some só reexportando no Spline atual |
| Teste  | iPhone real `?perf` depois de caminho pesado                          |

Não fazer:

- Segundo pacote Spline.
- Remontar `<canvas>` no arm da abertura.
- `stop()` para pausar fora da tela (`stop` mata o loop; `play` não reconstitui
  — ADR 005).
- Medir no servidor de desenvolvimento.
