# Blender routing

Load only the domain the request needs. Procedures are the matching heading in `references/domains.md`.

| Domain | Preserve | Reject from imports |
| --- | --- | --- |
| Inspection | Read names, hierarchy, and armatures before any edit. | Client scene nicknames as defaults. |
| Modeling | Mesh, modifiers, UVs, geometry nodes, physics as separate passes. | One-off topology that only fits a past asset. |
| Rigging | Bones, weights, constraints, deformation checks. | A specific character's bone names as a global rig. |
| Animation | Keyframes, cycles, timing judged on the curves, not on a single frame. | Brand motion preferences stated as universal easing. |
| Materials | PBR values taken from the scene or a stated material brief. | Hex colors owned by one company. |
| Lighting | Light rig changes isolated from materials and camera. | A studio's default three-point setup as mandatory. |
| Camera | Lens, framing, and shot continuity. | A product-hero camera preset with a client name. |
| Rendering | Cycles versus Eevee chosen for the delivery, then compositor. | A pinned Blender build as the only supported version. |
| Web export | GLB with the animations the brief asked to keep; measure cost before a landing page embed. | A path inside one website repository. |
| Visual check | Fresh scene read plus a bounded capture loop (max 3). | Subjective "make it prettier" without a checkable defect. |
| Debug | One retry, then stop. Name the failing domain. | Unbounded Python that shells out or writes outside the copy. |

## Handoff

When the request is to finish the shot in a video editor, stop after a preserved intermediate. Codec, grade, and mix belong to `audiovisual-production`.

When the request is a Spline scene or a web component, stop. Those are `spline-web-scenes` and the frontend skills.
