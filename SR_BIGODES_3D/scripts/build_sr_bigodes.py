"""Sr. Bigodes - constroi o personagem completo e salva o .blend.

Uso (dentro da pasta scripts):
    blender --background --python build_sr_bigodes.py
ou, com o modulo bpy instalado via pip:
    python build_sr_bigodes.py

Saida: ../SR_BIGODES.blend
"""
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402

import sb_anim  # noqa: E402
import sb_model  # noqa: E402
import sb_rig  # noqa: E402
import sb_scene  # noqa: E402

OUT = os.path.join(os.path.dirname(HERE), "SR_BIGODES.blend")


def build(out=OUT, voxel=0.006):
    t0 = time.time()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = "SR_BIGODES"
    colls = sb_scene.make_collections(scene)
    mats = sb_model.make_materials()
    field = sb_model.build_field()

    # 1. geometria
    head, body = sb_model.build_skin(field, colls, mats, voxel)
    ears, ear_base, ear_tip = sb_model.build_ears(colls, mats)
    tail = sb_model.build_tail(colls, mats)
    eyes, lids, sockets = [], [], []
    brows = []
    for side, tag in ((1, "L"), (-1, "R")):
        socket, eye = sb_model.build_eye(field, side, tag, colls, mats)
        sockets.append(socket)
        eyes.append(eye)
        lids.append(sb_model.build_eyelids(socket, side, tag, colls, mats))
        brows.append(sb_model.build_brow(field, side, tag, colls, mats))
    nose = sb_model.build_nose(field, colls, mats)
    mouth = sb_model.build_mouth(field, colls, mats)
    whiskers = sb_model.build_whiskers(field, colls, mats)
    pads = sb_model.build_pads(colls, mats)
    print(f"[build] geometria: {time.time() - t0:.1f}s")

    # 2. rig
    rig = sb_rig.build_armature(colls["RIG"], ear_base, ear_tip)
    for ob in [head, body, tail, nose, mouth] + ears + brows + pads:
        sb_rig.bind_mesh(ob, rig)
    for ob in sockets + whiskers:
        sb_rig.parent_to_bone(ob, rig, "head")
    sb_rig.drive_expressions(eyes + lids + brows + [mouth], rig)
    sb_rig.drive_eyes(eyes, rig)

    # 3. animacoes
    P, actions, sit_head = sb_anim.build_actions(rig)
    rig.animation_data.action = actions["Sentado_Idle"]
    scene.frame_start, scene.frame_end = 1, 96
    scene.frame_set(1)

    # 4. cena
    cams = sb_scene.build_cameras(colls["CAMERAS"], sit_head)
    sb_scene.build_lighting(colls["LIGHTING"])
    sb_scene.build_environment(colls["ENVIRONMENT"], scene)
    sb_scene.setup_render(scene, cams["3q_frente"])

    meshes = [o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith("ENV_")]
    print(f"[build] {len(meshes)} malhas, {sum(len(o.data.vertices) for o in meshes)} vertices, "
          f"{sum(len(o.data.polygons) for o in meshes)} faces, {len(rig.data.bones)} ossos, "
          f"{sum(len(o.data.shape_keys.key_blocks) - 1 for o in meshes if o.data.shape_keys)} shape keys, "
          f"{len(bpy.data.actions)} acoes")
    for o in (head, body):
        print(f"[build]   {o.name}: {len(o.data.vertices)} vertices, {len(o.data.polygons)} quads")
    bpy.ops.wm.save_as_mainfile(filepath=out, compress=True)
    print(f"[build] salvo em {out} ({os.path.getsize(out) / 1e6:.1f} MB) em {time.time() - t0:.1f}s")
    return rig


if __name__ == "__main__":
    build()
