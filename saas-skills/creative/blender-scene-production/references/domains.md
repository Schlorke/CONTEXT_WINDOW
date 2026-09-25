# Blender domain procedures

Open only the section for the domain chosen in `routing.md`. Numbers below are decisions, not a pinned Blender build. Re-read the connected tool schema before the first call. Public API names follow the current Blender manual.

## Inspection

Read-only. Do not save, insert keys, or change mode.

1. Read the live scene. Pass the user's wording through as the prompt the tool expects.
2. If a name is missing, one read-only Python block that prints JSON. Do not assign transforms.
3. Report objects and type, collections, modifiers, materials, cameras, lights. With an armature: real bone names, pose constraints, vertex groups on the deforming mesh, actions, NLA mute state, drivers.
4. `Armature`, `Bone`, and `Cube` are not universal names. Say what was not found.
5. A read request ends at the report. Editing starts only after a checkpoint.

If the MCP cannot reach Blender, say so. Do not invent the scene and do not open the user's `.blend` in a second process.

## Modeling

Keep the modifier stack while the decision can still change. Apply is destructive. Non-uniform scale applied before Bevel or Solidify breaks those modifiers.

| Need | Choice |
| --- | --- |
| Hard intersection that manual topology would cost more | Boolean, left live |
| Wide bevel | Support edges, or Shade Smooth breaks |
| Mesh that will deform | Do not apply Boolean or Bevel |
| Sculpt or scan that will not deform as-is | Retopo before any rig |
| A map already baked | Do not re-unwrap to "clean" it |
| Form is a parameter (count, scatter, thickness) | Geometry Nodes |
| Mesh already driven by an armature in this shot | Do not convert it to nodes mid-shot |
| Cloth, rigid body, fluid, particles | Simulation: cache, scene scale in meters, bake only when asked, never on the only copy of the file |
| Repeated thickness, screw, or edge | Modifier, left on the stack |
| One simple unique form | Edit the mesh |
| Organic form without final topology | Sculpt, then retopo. Not both at once |

Inspect the active object, mode, and selection before an edit. Do not apply a modifier on a mesh that already deforms with an armature unless asked. Apply non-uniform scale before bevel or physics. Check face orientation before a material workaround. Sculpt is volume and gesture. Do not paint deformation vertex groups in the middle of a sculpt. Validate with vertex count, the modifier stack, and dimensions.

## Rigging

Fixed order. Stop early when the request is analysis only.

1. Scene objects, collections, current mode.
2. Deforming mesh: Armature modifier and the armature object it points at.
3. Bone list. Keep the real names.
4. Pose constraints and drivers.
5. Vertex groups. A group without a bone, or a bone without a group, is a finding.
6. Do not "fix" weights in the dark. Sample the groups of the limb the user named.
7. Actions on the object and the armature. Note muted NLA strips.
8. Checkpoint before weight paint, bone extrude, or a new key.

Do not delete weights, constraints, modifiers, actions, or shape keys. Do not rename a bone that already has a weight: the vertex group stops matching.

| Symptom | First place to look |
| --- | --- |
| Does not deform | Armature modifier, parent, vertex group name equals the bone |
| Volume collapses | Normalized weights, or the wrong bone |
| One limb explodes | That limb's chain, not the whole rig |
| A bone ignores the pose | Constraint, driver, or rotation inheritance |

A wing deforms from the chain whose name or position matches the wing. Do not rotate the whole rig. A diagnostic pose returns to rest before you finish, unless the user asked to keep it. If the mesh explodes, roll back the copy.

## Animation

- Anticipation: one short key against the gesture, before the accent.
- Main action on the accent. Follow-through and overlap on the children a few frames after the limb root.
- Secondary motion is smaller and slower. It does not compete with the gesture.
- Arcs in the path. A straight line only for a mechanical move.
- Spacing: ease out of the start, dense keys in the settle. A linear curve on a soft body is the "artificial" defect.
- Staging: readable silhouette on the accent frame. If the camera cannot see it, the problem may be the camera.
- Loop: first-frame value and handle match the last. A duplicated frame in the middle breaks the cycle.
- Root motion stays in place when the scene floor is the reference, unless the brief is a game or a camera that follows travel.
- Two extremes and one breakdown teach more than a key on every frame.
- A rigid object is keyed on the object, in a named Action. A character is keyed on the discovered pose bones, in a new Action. Do not delete an existing Action.
- One Action per gesture when the clip is for a game or the web. Do not key over NLA strips you have not read.
- Checkpoint before the first key. Check start, middle, and end with a frame change, plus two or three captures. "Artificial" is spacing on the curves, not more identical keys.

## Materials

Lookdev is a decision. There is no single preset.

1. List materials already on the objects in the request.
2. If the request does not name a material, do not create one and do not change the slot.
3. Adjust the Principled shader that exists. Roughness and metallic explain most "looks like plastic".
4. Normal and displacement only with a map or an explicit ask. Do not invent relief.
5. Alpha uses a blend mode the scene's engine actually supports.
6. UV when a UV exists. Object or Generated coordinates only for a procedural with no UV.

"Do not change materials" stops before any write. Do not remove existing texture nodes. Base color stays the object's color unless a color change was asked. Do not download a texture library without an explicit ask. If the light is the problem, stop and say so.

## Lighting

Read the lights that already exist. One function per light.

| Role | When |
| --- | --- |
| Key | The light that explains the form. Usually the first decision. |
| Fill | Only when the key shadow buries detail. |
| Rim | Separates the subject from the background. |
| HDRI | Environment and reflection. Lower it when a key already exists. |
| Sun | Exterior or time of day, not a small product. |

Area and point energy depend on scene size in meters. Do not copy watts from another scene. Exposure lives in color management or on the camera, not in "one more light". Name created lights `Key Light`, `Fill Light`, `Rim Light`. Do not delete an existing light without naming it. A light request does not create a mesh or change a material. A shadow that is too hard: increase area size or sun angle, not samples.

## Camera

Find the camera by type `CAMERA`. Do not add a second camera when the request is to frame the one that exists. Focal lengths below assume a full-frame sensor as a reference, not a law for every sensor.

| Intent | Lens |
| --- | --- |
| Portrait or character | 50–85 mm |
| Product | 80–100 mm, camera farther back |
| Environment | 24–35 mm |
| Follow action | Lens stays; the camera moves, with easing |

Depth of field needs a real target (discovered object or bone). Focus on the subject, not on empty floor. Few keys, an arc, a short anticipation if the camera "arrives". A lateral move gives parallax. A digital zoom does not. Do not animate lens distortion to hide a bad frame. Do not change the lens to "fix" a model that is out of scale; check dimensions first. Judge the shot through the camera, not only the user's viewport. Leave space in the direction of motion.

## Rendering

The goal picks the engine.

| Goal | Engine | Notes |
| --- | --- | --- |
| Quick look | Eevee, or Cycles with few samples | No motion blur |
| Product or character still | Cycles | Denoise on; samples until the shadow is clean |
| Animation | The engine whose light was already approved | Motion blur only for fast motion |
| Transparent background | Film transparent | PNG or EXR, not JPEG |
| Web / realtime | Do not render the final frame as the delivery | Hand off to web export |

Raise samples and light paths for noise or fireflies, not for a dim light. Keep Filmic or AgX if the scene already chose it. Build a compositor only when the request names comp. Do not render a full animation range unless the user names the range. Write output to a new folder. Agent preview is a viewport capture, not a 4K render. A black image: camera, world, and lights before samples.

## Web export

Default for a copy, via `export_scene.gltf`:

- `export_format='GLB'`
- `export_animations=True` when the brief has an Action or NLA to keep
- `export_apply=False` when the stack has Array, Subdivision, or Boolean
- Draco off unless asked

Do not apply decimate, join, normal bake, KTX2, or Meshopt unless asked. Check the file: the first four bytes are `glTF`, the size is plausible for the mesh, and the clip is still there. A material with no glTF equivalent is reported, not converted in silence. A mesh that is tens of units tall is a scale error, not an optimization. Do not decimate, apply the armature, or join on your own. Report polycount and large textures. Reduction is a second decision. Spline does not consume this GLB. Place the file where the consumer versions media. Do not invent a path inside one website repository.

## Visual check

```text
run → capture → look → diagnose → adjust → capture → stop
```

The capture workflow passes `max_size` 800 to the viewport screenshot tool unless the check needs more detail. That number is a capture budget, not a Blender render limit. At most three visual adjustments. If the same defect remains, stop and describe it. Do not repeat the same code. Numeric facts (position, counts, frame) come from a scene read, not from pixels. Failures: subject out of frame when the ask was to frame it; light that blows out the form; a mesh intersection the request did not ask for; an animation whose middle frame equals the first. A screenshot does not prove weights, bone names, or a clip inside a GLB.

## Debug

```text
operation → exception or failed check → diagnosis → one retry → rollback
```

One retry with a new hypothesis. The same error twice ends the loop.

| Symptom | Hypothesis, in order |
| --- | --- |
| Exception | Wrong mode, no active object, name that does not exist |
| Does not deform | Modifier, parent, or vertex group name differs from the bone |
| Deforms too much | Weight from another bone; do not add subdivision to hide it |
| Artificial motion | Linear spacing, too many keys, pose copied with no anticipation |
| GLB without a clip | Action not assigned, NLA muted, export without animation |
| Black view | Camera, world, lights — before samples |

Roll back to the checkpoint copy. Do not delete the source `.blend`. Do not save over it after an error you do not understand. Report one line: domain, tool, operation, result, whether there was a retry.

## MCP boundary

The connected Blender MCP runs Python inside Blender. There is no sandbox. Limit what you ask for. Do not mix tool names with a different Blender addon protocol. Pass the user's wording through on each call of the same task.

On by default: scene read, object read, viewport capture, and code execution only after inspection and, for an edit, a file copy.

Off until the user explicitly asks: asset marketplaces, generative model import, telemetry changes, trajectory feedback. If an asset tool fails, stop. Do not switch servers. Path checks belong to the addon; do not bypass them and do not treat one addon version as the only supported Blender.

A dirty session (`is_dirty`) is not discarded, not reverted, and not replaced by opening another file in the GUI process. Headless smoke uses factory startup and must not receive the user's file path.
