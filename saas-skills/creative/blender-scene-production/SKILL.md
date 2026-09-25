---
name: blender-scene-production
description: "Produce or revise a Blender scene through the connected Blender MCP: inspect the live file, edit one subsystem at a time with bpy, checkpoint before writes, then validate the scene. Use for Blender, bpy, .blend, armatures, Cycles, Eevee, or GLB export from Blender. Do not use for Spline, Rive, Remotion, CSS, or a product frontend."
metadata:
  author: Context Window
  version: 1.0.0
  last_validated: 2026-09-25
  sources:
    - Blender Python API (docs.blender.org/api/current)
    - Blender manual (docs.blender.org)
---

# Blender Scene Production

Operate a live Blender scene. This skill routes the work. It does not replace the Blender API or the connected MCP schema.

## Operational Contract

| Field | Contract |
| --- | --- |
| Objective | Change a Blender scene without destroying the source file, then prove the change from a fresh scene read. |
| Use when | The task names Blender, bpy, a `.blend` file, armatures, Cycles, Eevee, or GLB export from Blender. |
| Do not use when | Spline, Rive, Remotion, DaVinci Resolve, CSS, or a Next.js/Expo frontend task. |
| Inputs | Intent, what must stay unchanged, and a connected Blender MCP namespace. |
| Preconditions | Discover the live tool schema before the first call. Do not invent tool names or parameters. |
| Tools | Connected Blender MCP only. No second Blender server. |
| Procedure | INTENT, INSPECT, PLAN, CHECKPOINT, MODIFY, VALIDATE, RECOVER. |
| Output | Working copy path, subsystems touched, scene facts after the edit, and anything blocked. |
| Validation | Re-read the scene. A script that returned without error is not success. |
| Known failures | Guessing object names, saving over the source `.blend`, mixing addon protocols, downloading or generating assets without an explicit ask. |

## When to Use

Use this skill for mesh, modifiers, UVs, geometry nodes, physics, rigging, keyframes, materials, lights, cameras, Cycles/Eevee, compositing, or GLB export that starts in Blender.

Do not load it for a greeting, a web app, or another DCC.

## Core Workflow

```text
INTENT → INSPECT → PLAN → CHECKPOINT → MODIFY → VALIDATE → RECOVER
```

1. **INTENT** — State the change and what must be preserved.
2. **INSPECT** — Read the live scene. Use real object names. If the request is read-only, stop after the inspection.
3. **PLAN** — Touch one subsystem from the routing table. Do not load unrelated domains.
4. **CHECKPOINT** — If the open file will be edited, save a copy first. Never overwrite the source `.blend`. If the session is dirty, do not discard it.
5. **MODIFY** — Short Python blocks, one subsystem per call. Discover objects. Do not assume `Cube`, `Armature`, or `Bone`.
6. **VALIDATE** — Read the scene again. For a visual change, capture at most three review frames.
7. **RECOVER** — One corrected attempt. On the same failure twice, stop and report.

## Routing

| Request | Domain |
| --- | --- |
| Read the scene, or inspect a rig without editing | Inspection. Add rigging only if an armature is present. |
| Mesh, modifier, UV, geometry nodes, physics | Modeling |
| Bone, weight, constraint, deformation | Rigging |
| Keyframe, cycle, timing | Animation |
| Material, PBR, shader | Materials |
| Light only | Lighting |
| Camera, lens, shot | Camera |
| Cycles, Eevee, compositor | Rendering |
| GLB, web three.js, landing asset | Web export |
| Visual result | Visual check after the domain edit |
| Failure, bad timing, broken deformation | Debug plus the failed domain |

"Do not change materials" does not open materials. "Export GLB and keep the animation" does not open an animation course.

The domain table is in `references/routing.md`. Procedures for the chosen domain are in `references/domains.md`. Read that section only.

## Invariants

- Code sent into Blender is the smallest Python that does the job. No subprocess, no network, no writes outside the working copy.
- Asset download and generative model import run only when the user explicitly asks for that asset.
- Do not disable telemetry unless the user asks to stop data sending.
- Brand colors, client names, and project paths from an old scene are not global rules. Use the scene's own materials and the user's current brief.
- A Blender render that will be finished in a video editor is handed off as an intermediate. Do not grade or mix it here.

## Anti-Patterns

- Saving over the source file.
- Inventing MCP parameters from memory.
- Rebuilding the whole scene to change one light.
- Treating a screenshot as the source of object names, counts, or transforms.

## Source References

- Routing and handoff: `references/routing.md`
- Domain procedures: `references/domains.md`
