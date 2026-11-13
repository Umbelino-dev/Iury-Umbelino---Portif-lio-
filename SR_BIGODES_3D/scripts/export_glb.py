"""Sr. Bigodes - exporta o personagem para o site (glTF binario).

Uso:  blender --background --python export_glb.py
Saida: ../../public/models/sr-bigodes.glb  (+ sr-bigodes.json com os pontos de ancoragem)

O arquivo .blend nao e alterado: os ajustes abaixo valem so para a exportacao.
- Materiais: o glTF nao leva nos procedurais. A pelagem vira uma cor fixa (a media
  da variacao) e o degrade da iris e gravado numa textura (com um mapa UV plano
  nos olhos), para o olho sair identico.
- Bigodes: as 12 curvas viram uma unica malha (um draw call), presa ao osso da cabeca.
- Animacoes: cada acao vira uma faixa NLA e e amostrada quadro a quadro, entao o
  IK das pernas e os vinculos saem "assados" nos ossos de deformacao.
- As shape keys saem como morph targets (o site controla expressoes e piscadas).

Depois, para a web:  npx @gltf-transform/cli meshopt sr-bigodes.glb sr-bigodes.glb
(compressao sem perda visivel; o site carrega com o MeshoptDecoder do three).
"""
import json
import math
import os
import struct
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
import numpy as np  # noqa: E402

import sb_anim  # noqa: E402

ROOT = os.path.dirname(HERE)
OUT_DIR = os.path.join(os.path.dirname(ROOT), "public", "models")
OUT = os.path.join(OUT_DIR, "sr-bigodes.glb")


def srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def iris_texture(size=256):
    """O mesmo degrade radial do material da iris (ColorRamp), como imagem."""
    stops = [(0.0, (0.50, 0.90, 0.10)), (0.55, (0.30, 0.78, 0.05)), (0.74, (0.10, 0.42, 0.02)), (0.86, (0.01, 0.05, 0.005)), (1.5, (0.01, 0.05, 0.005))]
    u = (np.arange(size) + 0.5) / size * 2 - 1
    r = np.sqrt(u[None, :] ** 2 + u[:, None] ** 2)
    rgb = np.zeros((size, size, 3))
    for (p0, c0), (p1, c1) in zip(stops, stops[1:]):
        m = (r >= p0) & (r < p1)
        t = ((r - p0) / (p1 - p0))[..., None]
        rgb = np.where(m[..., None], np.array(c0) * (1 - t) + np.array(c1) * t, rgb)
    img = bpy.data.images.new("TEX_Iris", size, size, alpha=False)
    px = np.ones((size, size, 4), dtype=np.float32)
    px[..., :3] = srgb(rgb)
    img.pixels.foreach_set(px.ravel())
    img.pack()
    return img


def prepare_materials():
    fur = bpy.data.materials["MAT_Pelagem_Preta"]
    nt = fur.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    for name in ("Base Color", "Normal"):
        for link in list(bsdf.inputs[name].links):
            nt.links.remove(link)
    bsdf.inputs["Base Color"].default_value = (0.016, 0.016, 0.019, 1)

    iris = bpy.data.materials["MAT_Olho_Iris"]
    nt = iris.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    for name in ("Base Color", "Emission Color"):
        for link in list(bsdf.inputs[name].links):
            nt.links.remove(link)
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = iris_texture()
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Emission Color"])
    for ob in bpy.data.objects:
        if ob.name.startswith("SrBigodes_Olho."):
            me = ob.data
            uv = me.uv_layers.new(name="UVMap")
            co = np.array([v.co[:] for v in me.vertices])
            for loop in me.loops:
                x, _, z = co[loop.vertex_index]
                uv.data[loop.index].uv = (x * 0.5 + 0.5, z * 0.5 + 0.5)


def keep_shape_keys():
    """Uma malha com shape keys perde as keys se o exportador aplicar modificadores.
    Palpebras (Solidify) e sobrancelhas (Subdivision) saem sem esses modificadores:
    a casca da palpebra fica com uma face so (o material e dupla face)."""
    for ob in bpy.data.objects:
        if ob.type == "MESH" and ob.data.shape_keys:
            for mod in list(ob.modifiers):
                if mod.type != "ARMATURE":
                    ob.modifiers.remove(mod)


def merge_whiskers(rig):
    curves = [o for o in bpy.data.objects if o.type == "CURVE" and o.name.startswith("SrBigodes_Bigode")]
    bpy.ops.object.select_all(action="DESELECT")
    for o in curves:
        o.select_set(True)
    bpy.context.view_layer.objects.active = curves[0]
    bpy.ops.object.convert(target="MESH")
    bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    ob.name = "SrBigodes_Bigodes"
    ob.data.name = "SrBigodes_Bigodes"
    return ob


def actions_to_nla(rig):
    """Uma faixa NLA por acao: o exportador gera uma animacao por faixa."""
    ad = rig.animation_data
    ad.action = None
    for track in list(ad.nla_tracks):
        ad.nla_tracks.remove(track)
    names = []
    for act in sorted(bpy.data.actions, key=lambda a: a.name):
        if not act.name.startswith("SB_"):
            continue
        track = ad.nla_tracks.new()
        track.name = act.name[3:]
        strip = track.strips.new(act.name, int(act.frame_start), act)
        strip.name = act.name[3:]
        if hasattr(strip, "action_slot") and strip.action_slot is None and act.slots:
            strip.action_slot = act.slots[0]
        track.mute = True
        names.append(track.name)
    return names


def describe(path):
    """Le o JSON do GLB para conferir o que saiu."""
    with open(path, "rb") as f:
        f.read(12)
        length, _ = struct.unpack("<II", f.read(8))
        doc = json.loads(f.read(length))
    out = {
        "meshes": len(doc.get("meshes", [])),
        "primitives": sum(len(m["primitives"]) for m in doc.get("meshes", [])),
        "nodes": len(doc.get("nodes", [])),
        "skins": [len(s["joints"]) for s in doc.get("skins", [])],
        "materials": [m["name"] for m in doc.get("materials", [])],
        "images": len(doc.get("images", [])),
        "extensions": doc.get("extensionsUsed", []),
        "morphs": {m["name"]: len(m["primitives"][0].get("targets", [])) for m in doc.get("meshes", []) if m["primitives"][0].get("targets")},
        "animations": {a["name"]: len(a["channels"]) for a in doc.get("animations", [])},
    }
    return out


def main():
    bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, "SR_BIGODES.blend"))
    scene = bpy.context.scene
    rig = bpy.data.objects["SrBigodes_Rig"]
    prepare_materials()
    keep_shape_keys()
    merge_whiskers(rig)
    names = actions_to_nla(rig)
    scene.frame_set(1)

    bpy.ops.object.select_all(action="DESELECT")
    keep = [o for o in bpy.data.objects if o.name.startswith("SrBigodes_")]
    for o in keep:
        o.hide_set(False)
        o.select_set(True)
    bpy.context.view_layer.objects.active = rig
    os.makedirs(OUT_DIR, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=OUT,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_cameras=False,
        export_lights=False,
        export_extras=False,
        export_skins=True,
        export_def_bones=True,
        export_morph=True,
        export_morph_normal=False,
        export_morph_tangent=False,
        export_animations=True,
        export_animation_mode="NLA_TRACKS",
        export_force_sampling=True,
        export_frame_step=1,
        export_optimize_animation_size=True,
        export_anim_slide_to_zero=True,
        export_morph_animation=False,
    )
    info = describe(OUT)
    info["bytes"] = os.path.getsize(OUT)
    anchors = {
        "sitHeight": 1.0,
        "hangGrip": [round(v, 4) for v in sb_anim.GRIP],
        "peekLedge": [round(v, 4) for v in sb_anim.LEDGE],
        "fps": scene.render.fps,
        "clips": {a["name"]: None for a in []},
    }
    anchors["clips"] = {n: round((bpy.data.actions["SB_" + n].frame_end - bpy.data.actions["SB_" + n].frame_start) / scene.render.fps, 3) for n in names}
    with open(os.path.join(OUT_DIR, "sr-bigodes.json"), "w") as f:
        json.dump(anchors, f, indent=2)
    print("[glb]", json.dumps(info, indent=1))


if __name__ == "__main__":
    main()
