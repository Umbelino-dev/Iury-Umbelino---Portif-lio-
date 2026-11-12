"""Sr. Bigodes - renders de apresentacao a partir do SR_BIGODES.blend.

Uso:  blender --background --python render_sr_bigodes.py -- [draft] [so=vistas,expressoes,poses,malha]
Saida: ../renders/
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

import sb_anim  # noqa: E402
import sb_scene  # noqa: E402

ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "renders")
ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
DRAFT = "draft" in ARGS
ONLY = next((a[3:].split(",") for a in ARGS if a.startswith("so=")), None)

# vista -> (arquivo, camera, giro do conjunto de luzes em Z, luzes por baixo)
VIEWS = [
    ("01_frontal", "CAM_01_Frontal", 0, False),
    ("02_traseira", "CAM_02_Traseira", 180, False),
    ("03_lateral_direita", "CAM_03_Lateral_Direita", -90, False),
    ("04_lateral_esquerda", "CAM_04_Lateral_Esquerda", 90, False),
    ("05_3q_frontal", "CAM_05_3Q_Frontal", 0, False),
    ("06_3q_traseira", "CAM_06_3Q_Traseira", 180, False),
    ("07_superior", "CAM_07_Superior", 0, False),
    ("08_inferior", "CAM_08_Inferior", 0, True),
    ("09_close_rosto", "CAM_09_Close_Rosto", 0, False),
    ("10_close_olhos", "CAM_10_Close_Olhos", 0, False),
]
HERO = {"01_frontal", "02_traseira", "03_lateral_direita", "05_3q_frontal"}

# expressao -> (propriedades, pose da cabeca, orelhas (x, y para fora, z))
EXPRESSIONS = [
    ("normal", {}, {}, (0, 0, 0)),
    ("curioso", {"Curioso": 1}, {"head_roll": 13, "head_yaw": -6}, (4, -4, 0)),
    ("surpreso", {"Surpreso": 1}, {"head_pitch": -4}, (2, 6, 0)),
    ("feliz", {"Feliz": 1}, {"head_roll": -5, "head_pitch": -3}, (0, 4, 0)),
    ("bravo", {"Bravo": 1}, {"head_pitch": 7}, (-26, 16, 0)),
    ("triste", {"Triste": 1}, {"head_pitch": 9, "head_roll": 4}, (-6, 30, 0)),
    ("dormindo", {"Dormindo": 1}, {"head_pitch": 12}, (-4, 14, 0)),
    ("desconfiado", {"Desconfiado": 1}, {"head_yaw": 14, "head_roll": -4}, (-12, 8, 0)),
]

# pose -> (acao, quadro)
POSES = [
    ("andando", "SB_Andando", 9),
    ("correndo", "SB_Correndo", 9),
    ("pulando", "SB_Pulando", 24),
    ("deitado", "SB_Deitado", 1),
    ("dormindo", "SB_Dormindo", 1),
    ("olhando_lado", "SB_Olhando_Lados", 31),
    ("em_pe", "SB_Em_Pe", 1),
]


def main():
    bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, "SR_BIGODES.blend"))
    sc = bpy.context.scene
    rig = bpy.data.objects["SrBigodes_Rig"]
    lights = bpy.data.objects["LIGHT_Rig"]
    floor = bpy.data.objects["ENV_Chao"]
    cams = bpy.data.collections["CAMERAS"]
    P = sb_anim.Poser(rig)

    def render(path, res, spp):
        sc.render.resolution_x = sc.render.resolution_y = res
        sc.cycles.samples = spp
        sc.render.filepath = os.path.join(OUT, path + ".png")
        os.makedirs(os.path.dirname(sc.render.filepath), exist_ok=True)
        bpy.ops.render.render(write_still=True)
        print("[render]", path)

    def set_action(name, frame):
        rig.animation_data.action = bpy.data.actions[name]
        sc.frame_set(frame + 1)
        sc.frame_set(frame)
        bpy.context.view_layer.update()

    def set_lights(z_deg=0.0, below=False):
        lights.rotation_euler = (math.pi if below else 0.0, 0.0, math.radians(z_deg))
        floor.hide_render = below

    def wants(group):
        return ONLY is None or group in ONLY

    big, mid, small = (480, 360, 300) if DRAFT else (1400, 900, 640)
    s_big, s_mid = (16, 12) if DRAFT else (128, 72)

    if wants("vistas"):
        set_action("SB_Sentado_Idle", 1)
        for name, cam, lz, below in VIEWS:
            sc.camera = bpy.data.objects[cam]
            set_lights(lz, below)
            render(name, big if name in HERO else mid, s_big if name in HERO else s_mid)
        set_lights()

    if wants("expressoes"):
        rig.animation_data.action = None
        sc.camera = bpy.data.objects["CAM_09_Close_Rosto"]
        for name, props, head, (ex, ey, ez) in EXPRESSIONS:
            P.reset(True)
            sb_anim.pose_sit(P, **head)
            P.rot("ear.L", x=ex, y=ey, z=ez)
            P.rot("ear.R", x=ex, y=-ey, z=-ez)
            P.expr(**props)
            P.apply()
            rig.update_tag()
            bpy.context.view_layer.update()
            render(f"expressoes/{name}", small, s_mid)
        P.reset(True)
        P.apply()

    if wants("poses"):
        cam = sb_scene.add_camera(cams, "CAM_tmp_Poses", (-2.9, -3.1, 1.15), target=(0, 0.08, 0.36), lens=125)
        sc.camera = cam
        for name, action, frame in POSES:
            set_action(action, frame)
            hips = rig.pose.bones["hips"].head
            head = rig.pose.bones["head"].head
            target = Vector((0.04, hips.y - 0.10, max(0.30, 0.75 * head.z)))
            cam.location = target + Vector((-2.9, -3.2, 0.85))
            sb_scene.look_at(cam, target)
            render(f"poses/{name}", small, s_mid)
        bpy.data.objects.remove(cam)

    if wants("malha"):
        # topologia: arame sobre argila
        mat = bpy.data.materials.new("MAT_tmp_Arame")
        mat.use_nodes = True
        nt = mat.node_tree
        bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
        wire = nt.nodes.new("ShaderNodeWireframe")
        wire.use_pixel_size = True
        wire.inputs["Size"].default_value = 0.8
        mix = nt.nodes.new("ShaderNodeMixRGB")
        mix.inputs[1].default_value = (0.42, 0.42, 0.44, 1)
        mix.inputs[2].default_value = (0.02, 0.02, 0.02, 1)
        nt.links.new(wire.outputs["Fac"], mix.inputs["Fac"])
        nt.links.new(mix.outputs["Color"], bsdf.inputs["Base Color"])
        bsdf.inputs["Roughness"].default_value = 0.7
        bpy.data.materials["MAT_Pelagem_Preta"].user_remap(mat)
        set_action("SB_Sentado_Idle", 1)
        sc.camera = bpy.data.objects["CAM_05_3Q_Frontal"]
        render("malha_3q", mid, s_mid)
        sc.camera = bpy.data.objects["CAM_09_Close_Rosto"]
        render("malha_rosto", mid, s_mid)


if __name__ == "__main__":
    main()
