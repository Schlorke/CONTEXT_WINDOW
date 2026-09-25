# Spline web embed

Domain procedures are the matching heading in `references/domains.md`. The rules below are the boundaries.

## Domain boundaries

| Domain | Do | Do not |
| --- | --- | --- |
| Analysis | Read objects, states, events, animations, cloners. | Edit while claiming the task is an audit. |
| Modeling | Change mesh, booleans, groups, and scale in one pass. | Reparent the whole scene for a local fix. |
| Materials | Set PBR values from the brief or existing materials. | Invent a company hex. |
| Lighting | Isolate light changes from materials and camera. | Add lights until the screenshot "looks nicer" with no exposure check. |
| Camera | Frame the subject for the viewport the page will use. | Use a desktop-only hero crop on a layout that is mobile-first. |
| Animation | Time the motion the brief asked for. | Loop motion that fights the page's reduced-motion requirement. |
| Interaction | Hover, press, and state changes must have a non-motion path. | Depend on drag as the only way to reach content. |
| Performance | Record object count, heavy materials, and the embed's loading behavior before shipping. | Treat one old phone test as a lab standard. |
| Integration | Embed the published scene. Keep the host page usable if the scene fails to load. | Pull product UI into the 3D file, or rewrite the app's frontend architecture. |

## Validate

- Facts: scene graph (counts, names, transforms).
- Appearance: live screenshot of the named subject.
- Fix or report exposure, framing, and hero warnings.
- Web: the page still shows a static fallback and does not block the primary action on the 3D runtime.
