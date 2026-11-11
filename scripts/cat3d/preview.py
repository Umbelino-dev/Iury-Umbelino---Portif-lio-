"""
Render review views of assets/cat3d/cat.blend (Cycles, CPU), on the sheet's
light grey, for side-by-side comparison with assets/reference/cat-sheet.jpg.

    python scripts/cat3d/preview.py OUT_DIR [action[:frame] ...]

Each action (default: rest pose) is rendered front, side and three-quarter.
"""

import math
import os
import sys

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
BLEND = os.path.join(HERE, "..", "..", "assets", "cat3d", "cat.blend")
out = sys.argv[1] if len(sys.argv) > 1 else "."
poses = sys.argv[2:] or ["rest"]
os.makedirs(out, exist_ok=True)

bpy.ops.wm.open_mainfile(filepath=os.path.abspath(BLEND))
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.render.resolution_x = 520
scene.render.resolution_y = 560
scene.render.film_transparent = True
scene.view_settings.view_transform = "Standard"

world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.86, 0.86, 0.86, 1)
bg.inputs["Strength"].default_value = 0.35

# key + rim, soft
for name, loc, energy, size in (("Key", (-2, -3, 3), 120, 3), ("Rim", (2, 3, 2.5), 140, 2), ("Fill", (3, -2, 1), 30, 4)):
    ld = bpy.data.lights.new(name, "AREA")
    ld.energy = energy
    ld.size = size
    lo = bpy.data.objects.new(name, ld)
    scene.collection.objects.link(lo)
    lo.location = loc
    lo.rotation_euler = (Vector((0, 0, 0.6)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()

cam_d = bpy.data.cameras.new("Cam")
cam_d.type = "ORTHO"
cam_d.ortho_scale = 1.65
cam = bpy.data.objects.new("Cam", cam_d)
scene.collection.objects.link(cam)
scene.camera = cam

VIEWS = {"front": -90, "side": 0, "quarter": -50}
rig = bpy.data.objects["CatRig"]
target = Vector((0, 0.1, 0.62))

for pose in poses:
    name, _, frame = pose.partition(":")
    if name != "rest":
        act = bpy.data.actions.get(name)
        if not act:
            print("no action", name)
            continue
        rig.animation_data_create()
        for t in rig.animation_data.nla_tracks:
            t.mute = True
        rig.animation_data.action = act
        if rig.animation_data.action_slot is None and act.slots:
            rig.animation_data.action_slot = act.slots[0]
        scene.frame_set(int(frame or act.frame_range[0]))
    for view, az in VIEWS.items():
        a = math.radians(az)
        cam.location = target + Vector((math.cos(a) * 4, math.sin(a) * 4, 0.25))
        cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = os.path.join(out, f"{name}{('-' + frame) if frame else ''}-{view}.png")
        bpy.ops.render.render(write_still=True)
print("done")
