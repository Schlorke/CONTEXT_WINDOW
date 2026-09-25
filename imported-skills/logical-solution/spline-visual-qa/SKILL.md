---
name: spline-visual-qa
description:
  Visual critique loop for Spline 3D after a meaningful change — capture,
  compare to the brief, check composition, scale, alignment, lighting, material,
  contrast, depth, hierarchy, clipping, artifacts, then fix and re-inspect. Use
  after modeling, lighting, materials, camera, or hero work, and whenever a
  screenshot is the success criterion. Tool success is not visual success.
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-20"
  sources:
    "user-Spline 3d_take_screenshot live gates EXPOSURE/FRAMING/HERO; Spline
    authoring-guide Done gate"
---

# Spline Visual QA

Se o `spline-master` ainda não foi lido, leia
`.agents/skills/spline/spline-master/SKILL.md`.

**TOOL SUCCESS ≠ VISUAL SUCCESS.** `3d_run_code` retornar ok não encerra o
trabalho.

## Loop

1. Capturar (screenshot de trabalho; no fim do build, `view: "live"` +
   `hero: ["Nome"]`).
2. Comparar com objetivo / referência.
3. Analisar a lista abaixo.
4. Listar discrepâncias (concretas, uma linha cada).
5. Corrigir em `3d_run_code` curto.
6. Reinspecionar digest + captura. Repetir até a lista zerar ou o restante for
   consciente.

Checklist: [references/critique-loop.md](references/critique-loop.md).

## Done gate (oficial + deste sistema)

Do authoring-guide: cada substantivo do pedido existe; o screenshot **mostra** o
assunto; motion pedido foi visto em Play; counts batem com `get_scene`.

Deste sistema: composition, scale, light, material, clipping, hierarquia, e — se
for web hero — headline/CTA ainda lêem.

Avisos EXPOSURE / FRAMING / HERO na captura live = **não** finished.

## Anti-padrões

- Encerrar porque a tool não errou.
- Um único ângulo quando o brief é orbitável.
- Ignorar objeto `hidden` que deveria estar visível.
- Deixar Play ligado.
