# Spline domain procedures

Open only the section for the domain chosen in the skill routing table. Tool names and DSL signatures come from the official authoring guide loaded once in the session, not from memory. Thresholds come from the live scene report.

## Analysis

- `p` position, `r` rotation in degrees, `s` scale. `size` is the content bounds: it excludes the object's own scale; on a group it is the extent of the descendants.
- `SELECTED` means the user pointed before the prompt. "This" and "make it metal" address those ids and their children. A request that names something else, or that says add, is not overwritten by the selection.
- `hidden` still exists. Do not delete it to "tidy" without asking.
- A cloner, including a disabled linear cloner, is read with an object query before any edit.
- `states`, `events`, and `anims` counts are not ids. Tween and event ids exist only on the object read. Editing without that read invents ids.
- Material assets: name, layer types, usage count, id. Usage 0 is a cleanup candidate, not an automatic delete.
- Scene analysis returns a mark (`good`, `average`, `bad`) and thresholds. Offenders carry real ids. Export byte size is not in that report.

An audit does not edit.

## Modeling

Before subdividing, a boolean, hair, particles, or a custom mesh, ask whether a visually equivalent cheaper form exists. Prefer, in order: primitive, lathe, extrude, boolean, custom mesh, then generation. Generation only when the user asks.

Assemble axis-aligned, group, then rotate the group. Put the pivot on the axis the motion will use. A floor plane or rectangle lies flat with rotation x = -90 and y = 0. A pyramid roof uses four radial segments and no extra 45° yaw. Detail stuck to a surface is a decal, not a coplanar mesh. Load the boolean, blend, or lathe topic the session documents before that operation.

- A product sphere is a sphere primitive plus a material, not a generated mesh.
- Repetition is a cloner or an instance, not dozens of manual copies.
- A window hole is one subtract, not a sculpted mesh.
- If polygon count is already not `good`, do not add detail "for realism".
- Do not reparent the scene to fix one object.
- Decimate, merge, and boolean-bake recipes live in the official optimization topic. Do not invent them.

## Materials

Intent, not a company palette. Exact layer props come from the authoring guide.

| Intent | Reads as | Avoid |
| --- | --- | --- |
| Metal | Hard highlights, energy in the specular, slight anisotropy only if asked | Rainbow, neon glow |
| Glass | Refraction or transmission, edge fresnel, the background shows through | Semi-opaque white metal |
| Plastic | Saturated color, medium roughness, broad specular | Chrome matcap |
| Cloth | High roughness, almost no specular, value variation | Metal or pearl |
| Silk | Low-to-medium anisotropic roughness, narrow highlight | Uniform mirror |
| Rubber | High roughness, soft specular, little fresnel | Car gloss |
| Ceramic | Small clean specular, low-to-medium roughness | Metal |
| Matte | Almost no specular | Matcap, metalness |
| Glossy dielectric | Clear specular, color stays | Treating it as metal |

Large real-world surfaces (wall, street, wood) need a subtle mapped texture. A single plastic albedo on them is the "cardboard model" failure. Texture generation has its own contract. Do not hand-write a 2D canvas from memory.

## Lighting

Adjust a light that already has a key or main name instead of adding a third and a fourth.

| Rig | Shape |
| --- | --- |
| Product / web hero | One key from high and to the side (about 45°), shadow on if floor contact matters. One weak fill opposite, usually without shadow. One low rim for the contour. Dark background so the 3D does not fight the headline. |
| Cinematic | Harder key, fill near zero, visible rim. High contrast, subject still readable. |
| Ambient | Soft key, close fill, rim optional. Light fog only when the brief asks for atmosphere. |

Confirm method names (`light`, `shadow`, `fog`, `sky`) in the session guide before calling them. Exposure warnings on the live capture are data. Do not add lights until a screenshot "looks nicer".

## Camera

The product camera is the one in the scene. A screenshot aim is private and does not move the product camera. Frames captured in play ignore that private aim. Frame the subject in the viewport the page will use.

- Reserve the side or area the title already occupies. The 3D lives in the space the layout left.
- Contrast separates subject and background. Mid-gray on mid-gray behind light type fails.
- Mobile is a taller, narrower crop. Do not depend on one widescreen.
- Runtime zoom is a dolly, not a 2D crop. Pan and crop belong to the page.
- Orbit on a hero is a brief decision. Do not assume drag on every scene.
- Reduced motion and offscreen pause belong to integration and performance, not to the camera.

## Animation

The source note, citing the Spline authoring guide's motion section, treats code-driven motion as the official default and States and Transitions as opt-in. Confirm that default in the animation topic loaded this session before creating movers. A later guide that names another default wins. A new interaction is that channel. An event that already exists is edited only after an object read returns its id. Then:

- The entrance costs more than the idle. Idle on a web hero is almost invisible.
- Anticipation and follow-through are one pose, not a choreography.
- Secondary motion is one detail, not three loops.
- If the page honors `prefers-reduced-motion`, confirm the embed actually reads it. Do not assume an HTML overlay does.
- Check motion with play, two frames that differ, then stop. Do not leave play running.

## Interaction

- Desktop: hover and click. Touch has no stable hover, so the default state must read alone.
- Drag only when the brief asks and the host does not need that gesture to scroll.
- If the interaction is essential, the page DOM exposes the equivalent. A WebGL canvas is not a button.
- Collision, trigger, and physics event types are confirmed in the session interactivity topic before use. A catalog from one date is not the live list.

## Hero

One hero subject. Not three competing meshes.

Discover the brand from a guide the user supplies. Do not invent a palette. For a quiet product hero, neon magenta and cyan, blown bloom, a rainbow rim, a crowded sci-fi set, or a pearl sphere in front of the title are failure modes. They are not a ban on every other brand.

The page headline stays the actor when the brief says so. The mesh does not cover the title on desktop or on mobile.

## Visual check

Mark each item against the brief:

composition, scale, alignment after compound rotation, light direction without clipping the form, contact shadow when there is a floor, material matches the ask (glass is not white metal), contrast against the DOM type, depth beyond a floating mesh, one hero, no frame clipping, no z-fight, empty decal, texture checkerboard, or wrong bounds, and the shot still reads in a vertical crop.

Numbers from the scene graph. Appearance from a live screenshot of the named subject. Both. Exposure, framing, and hero warnings mean the pass is not finished. A tool that returned without error is not success. Do not leave play running.

## Performance

Record the live marks. Do not redefine thresholds in this file. Fields to read when present: object count, polygon count, cloned versus non-cloned polygons, material count, texture count, postprocessing, lights (and which cast shadows), heavy meshes, high subdivision, nested booleans, unused assets. Offender lists can be capped. After a fix, the same report must improve the metric you targeted. If it did not, the fix is not done.

One phone, one query-string meter, and one published URL are a project test, not a library lab. Reusable rule: measure the open scene; a desktop WebKit screenshot is not a mobile GPU; do not measure on the dev server; compare with the last recorded result before claiming a regression. Battery-saver frame caps and first-visit weight are properties of that device pass, not global numbers to copy.

## Web integration

Publish from the editor's code export. The connected MCP does not write the scene file. Use the official desktop server. Do not install an archived fork. Embed the published scene. The host page stays usable when the scene fails to load: static fallback, primary action not blocked on the 3D runtime. Load every authoring-guide part the connected server documents, once each, before the first code run. Do not freeze a part count from an old session.

Discover the consumer's runtime: wasm path, draw mode (`manual` offscreen, `continuous` while a hero is visible, `auto` for a static intro), and a pixel-ratio cap on coarse pointers. Do not add a second Spline package. Do not remount the canvas to pause. Stopping the runtime loop is not a pause if play cannot rebuild it. Schema warnings that disappear only after a re-export are a version mismatch to report, not a silent rewrite of the host app.

## Image to 3D

Do not copy the screenshot. Decompose.

```text
OBSERVE → DECOMPOSE → GEOMETRY → MATERIALS → LIGHTING → CAMERA → DEPTH → PLAN → BUILD → COMPARE → REFINE
```

| Becomes | When |
| --- | --- |
| Real geometry | The silhouette changes with angle, it needs its own shadow, or the user can orbit it |
| Texture or decal | Detail stuck to a surface that already exists |
| Lighting | A highlight, rim, or shadow falloff that is not an object |
| Background | Sky, gradient, fog. Do not build a set when sky or fog solves it |
| Particles | Diffuse volume, only if the brief asks. They cost runtime |
| Animation | Only motion the reference implies |
| Page composition | Headline, CTA, and navigation stay in the DOM |

Build the block first. Compare proportion and silhouette. Materials and light come after. Each discrepancy is one short edit. Image and model generation run only when the user asks. A glass sphere, a pedestal, or a product light rig does not justify generation.
