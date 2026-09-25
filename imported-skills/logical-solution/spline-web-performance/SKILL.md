---
name: spline-web-performance
description:
  Web 3D performance for Spline scenes — object and polygon counts, materials,
  lights, shadows, textures, transparency, particles, clones, runtime cost, FPS,
  memory, mobile GPUs, Core Web Vitals. Use when optimizing, lag, heat, battery,
  FPS, polygon budget, or before adding visual complexity. Call 3d_analyze_scene
  and load MCP skill scene-optimization. For this repo also follow measured
  runtime facts in spline-web-3d and ADRs 004/005.
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-20"
  sources:
    "user-Spline 3d_analyze_scene; Spline scene-optimization catalog; repo ADRs
    004/005; global skill spline-web-3d"
---

# Spline Web Performance

Se o `spline-master` ainda não foi lido, leia
`.agents/skills/spline/spline-master/SKILL.md`.

Princípio: **qualidade visual / custo computacional**. Antes de complexificar:

> Existe uma maneira visualmente equivalente e computacionalmente mais barata?

## Workflow

1. `3d_analyze_scene` (before).
2. `3d_load_skill("scene-optimization")` — receitas oficiais (`decimate`,
   `merge`, `bakeBoolean`, consolidar materiais, luzes). Não inventar.
3. Aplicar fixes pontuais por id do relatório.
4. `3d_analyze_scene` de novo. Provar que a métrica mudou.
5. Paridade visual: screenshot before/after. Otimização que muda pixel de arte
   não é otimização.

Métricas e interpretação:
[references/analyze-scene.md](references/analyze-scene.md).

## Neste repositório (medido, não docs genéricas)

A skill global `spline-web-3d` manda no runtime `@splinetool/runtime` 2.0.x:

- Pausa fora da tela = `renderMode` (`manual` / `auto` / `continuous`), **não**
  `renderOnDemand` depois do construtor.
- Densidade no toque limitada a 2× (`pixelRatioMobile` é da publicação da cena;
  o host ainda capa).
- `.wasm` pela API pública `wasmPath`, origem própria. Não remendar
  `window.fetch`.
- MCP **não exporta** `.splinecode`. Export → Code na UI, cena aberta.
- Hero contínuo enquanto visível; intro `auto`. Física no hero antigo saiu.

ADRs: `docs/adr/004-spline-wasm-local-e-csp.md`,
`docs/adr/005-modo-de-desenho-das-cenas.md`. Teste no iPhone depois de mudança
pesada: skill `teste-iphone-perf`.

## Anti-padrões

- Ligar physics, hair, particles ou boolean aninhado "para qualidade".
- `continuous` em cena estática.
- Medir no `next dev` ou com economia de bateria iOS ligada e concluir FPS.
