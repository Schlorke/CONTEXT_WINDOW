---
name: spline-lighting
description:
  Spline 3D lighting — key, fill, rim, environment, shadows, contrast, falloff,
  product, cinematic, and web-hero light. Use when adjusting lights, shadows,
  exposure, highlights, or depth separation in a Spline scene. Do not use for
  modeling, animation, or React integration. Prefer few intentional lights over
  many highlights.
metadata:
  author: Logical Solution
  version: "1.0.0"
  last_validated: "2026-09-20"
  sources:
    "user-Spline 3d_analyze_scene light report; Spline dsl-reference (load for
    light props); authoring-guide quality bar"
---

# Spline Lighting

Se o `spline-master` ainda não foi lido, leia
`.agents/skills/spline/spline-master/SKILL.md`.

Props de light/shadow/fog/sky: `3d_load_skill("dsl-reference")` e, para look,
`materials-and-look`. Não inventar campos.

## Decisão

Iluminação intencional. Poucas luzes. Cada uma tem papel.

`3d_analyze_scene` marca `lightCount`. No dump de 2026-09-20 o threshold `bad`
começava em 6; duas directional com shadow já pesam. Não adicionar luz "para
brilhar".

## Workflow

1. Inspecionar luzes existentes (digest + `analyze_scene` → `lights[]` com
   `castsShadows`).
2. Se o pedido é "só iluminação": **não** criar geometria. Mexer nas luzes e, se
   preciso, exposure/background/fog.
3. Nomear: `Key Light`, `Fill Light`, `Rim Light`. Não `Light 3`.
4. Um `3d_run_code` só de luzes.
5. Screenshot + `spline-visual-qa`. Sombras que engolem o assunto ou highlights
   estourados = não done.

Rigs: [references/light-rigs.md](references/light-rigs.md).

## Qualidade

- Key define direção e forma.
- Fill só o suficiente para ler o lado escuro.
- Rim separa o assunto do fundo — fino, não halo neon.
- Ambiente/sky/fog para extensão, não substituto do key.
- Hero web (Logical Solution): luz branca controlada, azul só como accent,
  navy/near-black no entorno. Sem glow de cyberpunk.

## Anti-padrões

- Muitas lights com shadow.
- Highlight artificial em toda aresta.
- Usar emissive do material no lugar de um rim.
- "Corrigir iluminação" restyleando materiais da cena toda.
