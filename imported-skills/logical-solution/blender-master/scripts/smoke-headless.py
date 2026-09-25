"""Cena de teste isolada. Não abre nem grava o .blend que estiver no Blender GUI."""
import json
import tempfile
from pathlib import Path

import bpy

out = Path(tempfile.gettempdir()) / "ls-blender-skill-smoke"
out.mkdir(exist_ok=True)
blend_path = out / "smoke.blend"
glb_path = out / "smoke.glb"

cube = bpy.data.objects.get("Cube")
if cube is None or cube.type != "MESH":
    raise SystemExit("factory startup sem Cube; abortado")

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end = 12
cube.location = (0.0, 0.0, 0.0)
cube.keyframe_insert(data_path="location", frame=1)
cube.location = (0.0, 0.0, 1.0)
cube.keyframe_insert(data_path="location", frame=12)

scene.frame_set(1)
z1 = float(cube.location.z)
scene.frame_set(12)
z12 = float(cube.location.z)
if not (z12 > z1 + 0.5):
    raise SystemExit(f"animacao nao avaliou: z1={z1} z12={z12}")

action = cube.animation_data.action if cube.animation_data else None
if action is None:
    raise SystemExit("keyframe_insert nao criou action")

bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
bpy.ops.export_scene.gltf(
    filepath=str(glb_path),
    export_format="GLB",
    export_animations=True,
    export_apply=False,
)

blob = glb_path.read_bytes()
if blob[:4] != b"glTF":
    raise SystemExit("GLB sem magic glTF")

print(
    json.dumps(
        {
            "ok": True,
            "blend": str(blend_path),
            "glb": str(glb_path),
            "glb_bytes": len(blob),
            "action": action.name,
            "z1": z1,
            "z12": z12,
            "objects": [obj.name for obj in bpy.data.objects],
        }
    )
)
