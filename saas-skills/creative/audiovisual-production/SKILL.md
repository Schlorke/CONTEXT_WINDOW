---
name: audiovisual-production
description: "Plan or finish a video or still: narrative, edit, screen recording, motion, color, mix, captions, and delivery. Use when asked to edit, grade, mix, caption, export, or review a video, Reel, commercial, or product demo. Do not use for Blender scene authoring, Spline, a Next.js feature, or a greeting."
metadata:
  author: Context Window
  version: 1.0.0
  last_validated: 2026-09-25
  sources:
    - Studio delivery practice rewritten for a consumer project; no upstream package is required at runtime
---

# Audiovisual Production

Decide the production route, protect source media, and finish only the stages the request needs.

## Operational Contract

| Field | Contract |
| --- | --- |
| Objective | Deliver a reviewable cut or export without overwriting source media. |
| Use when | The user asks to edit, cut, grade, mix, caption, render, or deliver a video, Reel, commercial, or product demo. |
| Do not use when | Authoring a Blender or Spline scene, writing application code, or a message that is not a production request. |
| Inputs | Format, audience, what "done" means, and where the media lives. |
| Preconditions | Source files stay intact. Work on a copy or a new timeline. |
| Tools | The editor the user already has. An external control bridge runs only through its documented tools, after the schema is read. |
| Procedure | Classify, read one route, produce, check, export. |
| Output | Route used, working copy or timeline, blocked steps, and the delivery spec. |
| Validation | QC against the checklist in `references/routes.md` before publish. |
| Known failures | Grading before the cut is locked, inventing a brand guide, burning captions outside the safe area, exporting over the camera original. |

## When to Use

Use this skill for editorial structure, screen demos, motion graphics, color, sound, captions, ingest, export, or a pre-publish check.

Do not use it to build a 3D scene (`blender-scene-production`, `spline-web-scenes`) or to implement the product being recorded.

## Core Workflow

1. Classify the request: narrative, commercial, product demo, screen recording, social, cinema pace, motion, color, audio, captions, ingest, export, or failure.
2. Follow one row in the routing table. Do not open every stage.
3. If a written brand guide exists, follow that guide. If a value is missing, mark it unknown. Do not invent colors, type, or claims.
4. Keep originals. New work goes to a copy or a new timeline.
5. If an editor bridge is unavailable, stop the in-editor steps and inspect media locally (codec, frame rate, audio, duration).
6. Run the QC checklist before calling the piece done.

## Routing

| Request | Stages |
| --- | --- |
| Vertical short (Reel, Short, TikTok) | Hook, edit, sound, grade, social export |
| Square or 4:5 feed | Same, with the feed export spec instead of the vertical master |
| Commercial or brand film | Narrative, one message, CTA, motion, mix, grade |
| Software product demo | Claim, interface proof, screen edit, motion, mix |
| Blender shot finishing | Intermediate from Blender, then edit, grade, sound, master |
| Website hero or landing loop | Web weight, mute-safe picture, QC |
| Color only | Grade, then QC. Cut stays locked. |
| Audio only | Mix and loudness |
| Captions only | Reading time, safe area, language of the spoken track |
| New media arrives | Ingest, names, bins, proxies. No cutting yet. |
| Export | Codec, container, frame rate, then QC |
| Broken file, offline media, wrong frame rate | Diagnose before any creative pass |

Add narrative design only when the piece has no structure yet. Add compositing only for key, track, mask, or a composite that titles alone cannot do.

The matching route, with its checks and numbers, is in `references/routes.md`. Read that section only.

## Invariants

- One message per commercial cut. The CTA is visible after the claim, not before the picture makes sense.
- Screen recordings show the real interface. Do not invent UI text with a generative image.
- Captions match the spoken language, stay inside the safe area, and leave time to read.
- Color matching uses scopes after the cut is locked.
- Web delivery states resolution, mute behavior, and a maximum weight the page can afford.
- A company name in an old brief is not a default client.

## Anti-Patterns

- Overwriting camera originals or the only project file.
- Applying a brand palette that was never supplied.
- Treating "cinematic" as a reason to ignore a product-demo request.
- Publishing because the file exported, without the QC pass.

## Source References

- Routes, delivery, QC: `references/routes.md`
