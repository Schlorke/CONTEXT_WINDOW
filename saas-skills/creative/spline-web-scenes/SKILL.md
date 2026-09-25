---
name: spline-web-scenes
description: "Build or revise a Spline 3D scene for the web through the official Spline MCP: inspect the live scene, load the authoring guide once, edit one subsystem, then check framing and cost. Use for Spline 3D, .splinecode, a 3D hero, or Spline materials, lights, camera, or interaction. Do not use for Hana 2D, Blender, Rive, or a CSS layout."
metadata:
  author: Context Window
  version: 1.0.0
  last_validated: 2026-09-25
  sources:
    - Spline MCP documentation (docs.spline.design)
    - Spline docs (docs.spline.design)
---

# Spline Web Scenes

Operate a live Spline 3D scene and keep it embeddable. This skill routes the work. It does not replace the official authoring guide.

## Operational Contract

| Field | Contract |
| --- | --- |
| Objective | Change a Spline 3D scene and prove facts from the scene graph, not from a screenshot. |
| Use when | The task names Spline 3D, `.splinecode`, a 3D hero, or Spline modeling, materials, lighting, camera, animation, or interaction. |
| Do not use when | Hana or other 2D canvas tools, Blender, Rive, Remotion, or a frontend that does not embed this scene. |
| Inputs | Intent, what must stay, and whether the scene already exists. |
| Preconditions | Official Spline MCP is connected. Discover the live schema before the first call. |
| Tools | Official Spline MCP 3D tools only. Do not install a fork. |
| Procedure | INTENT, INSPECT, PLAN, BUILD, LOOK, CRITIQUE, REFINE, VALIDATE. |
| Output | What changed, scene facts after the edit, performance flags, and the embed constraints. |
| Validation | Fresh scene digest plus a live view of the subject. Exposure, framing, and hero warnings are fixed or reported. |
| Known failures | Reading facts from pixels, rebuilding the scene for a small edit, inventing tool names, treating a brand palette as a global material rule. |

## When to Use

Use this skill for a Spline 3D object, material, light, camera, animation, interaction, hero, visual check, or web embed of that scene.

Do not use it for 2D design tools, Blender, or a Next.js page that only needs layout.

## Core Workflow

```text
INTENT → INSPECT → PLAN → BUILD → LOOK → CRITIQUE → REFINE → VALIDATE
```

1. **INTENT** — What changes, what stays, and whether a scene already exists.
2. **INSPECT** — Read the live scene first. A current selection is the user pointing. Read states, events, animations, or cloners only when those exist.
3. **PLAN** — One subsystem from the routing table.
4. **BUILD** — Before the first code run in the session, load every authoring-guide part the connected server documents, once each. Keep each edit to one subsystem.
5. **LOOK** — Capture a screenshot for appearance. Counts, positions, and sizes come from the scene graph.
6. **CRITIQUE** — After a visible change, check exposure, framing, and whether the hero subject is the subject.
7. **REFINE** — Incremental edits. Do not rebuild the scene without a stated reason.
8. **VALIDATE** — Fresh digest and a live view of the named subject.

## Routing

| Request | Domain |
| --- | --- |
| Scene already exists, or the ask is "what is here" | Scene analysis |
| Mesh, boolean, group, scale | Modeling |
| Glass, metal, cloth, roughness | Materials |
| Lights only | Lighting |
| Camera and web framing | Camera |
| Motion | Animation |
| Hover, press, scroll, state | Interaction |
| Hero composition | Hero, after modeling and lighting |
| Cost, draw calls, embed weight | Web performance |
| Drop the scene into a page | Web integration, after the scene validates |

Boundaries and the performance bar live in `references/web-embed.md`. Procedures for the chosen domain are in `references/domains.md`. Read that section only.

## Invariants

- 3D tool names on the wire use the prefix the connected server documents. Guide text may omit that prefix. Call the prefixed tool.
- Do not invent colors for a brand. Bind materials to tokens the user supplied, or leave the material unnamed until they do.
- A phone-specific performance anecdote is not a global device lab. Measure the scene that is open.
- Embedding does not authorize rewriting the host app's architecture.

## Anti-Patterns

- Judging transforms from a screenshot.
- Loading every Spline topic for a material tweak.
- Shipping an embed that was not checked for cost.
- Copying a client hero layout as the default for every site.

## Source References

- Embed and cost: `references/web-embed.md`
- Domain procedures: `references/domains.md`
