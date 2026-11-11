"""
Build the cat character in Blender, from scratch, by script (Iury, 2026-11-11:
"make it in Blender, like the sheet"). Reference: assets/reference/cat-sheet.jpg.

Run (bpy as a Python module, Blender 5.x):
    python scripts/cat3d/build_cat.py [--out DIR]

Writes DIR/cat.blend (default assets/cat3d; the source for edits by hand) and
public/models/cat.glb (mesh + armature + actions, loaded by three.js). Units: the cat stands ~1.2 tall,
floor at z = 0, facing -Y (Blender front view). three.js rescales it.

Construction:
- body: a skeleton of vertices with per-vertex radii → Skin modifier →
  Subdivision → applied. The skeleton follows the armature joints, so the
  automatic weights bend cleanly;
- head: a deformed UV sphere (wide cheeks, small muzzle), ears with a graphite
  inner, almond lime eyes with slit pupils and a highlight, nose, whiskers.
  Head parts are weighted by hand (head / ear / eye bones);
- armature: quadruped (hips › spine › chest › neck › head, ears, eyes,
  front: upperarm › forearm › paw, hind: thigh › shin › foot, tail × 5);
- actions: added by scripts/cat3d/animate.py (imported at the end).
"""

import math
import os
import sys

import bpy  # must come first: it provides bmesh and mathutils
import bmesh  # noqa: E402
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

OUT = os.path.join(HERE, "..", "..", "assets", "cat3d")
if "--out" in sys.argv:
    OUT = sys.argv[sys.argv.index("--out") + 1]
os.makedirs(OUT, exist_ok=True)

# Palette (sheet): body #1A1A1A, inner ear #4A4646, eyes #C8F169.
def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return (*lin, 1.0)


COL = {
    "Fur": "#1A1A1A",
    "Inner": "#4A4646",
    "Eye": "#C8F169",
    "Pupil": "#0B0B0B",
    "Shine": "#FFFFFF",
    "Nose": "#3A3434",
    "Whisker": "#8A8A8A",
}

# ---------------------------------------------------------------- scene


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.unit_settings.system = "METRIC"


def material(name):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    col = srgb(COL[name])
    m.diffuse_color = col
    if bsdf:
        bsdf.inputs["Base Color"].default_value = col
        bsdf.inputs["Roughness"].default_value = {"Fur": 0.55, "Eye": 0.25, "Pupil": 0.2, "Shine": 0.1}.get(name, 0.6)
        if name == "Shine":
            bsdf.inputs["Emission Color"].default_value = col
            bsdf.inputs["Emission Strength"].default_value = 1.0
    return m


def obj_from_bm(name, bm, mat=None):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    if mat:
        ob.data.materials.append(material(mat))
    return ob


def shade_smooth(ob):
    for p in ob.data.polygons:
        p.use_smooth = True


def apply_modifiers(ob):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev)
    ob.modifiers.clear()
    old = ob.data
    ob.data = me
    bpy.data.meshes.remove(old)


# ------------------------------------------------------------- skeleton
# Joint positions (x side, y back, z up). The cat faces -Y.

J = {
    # spine
    "hip": (0, 0.26, 0.55),
    "loin": (0, 0.13, 0.56),
    "spine": (0, 0.01, 0.57),
    "chest": (0, -0.11, 0.58),
    "neck": (0, -0.21, 0.72),
    "throat": (0, -0.26, 0.79),
    # front legs (right side mirrored)
    "sh": (0.07, -0.1, 0.5),
    "elb": (0.068, -0.09, 0.28),
    "wri": (0.066, -0.11, 0.075),
    "fpaw": (0.066, -0.155, 0.035),
    # hind legs
    "hp": (0.085, 0.24, 0.5),
    "kne": (0.09, 0.16, 0.31),
    "hoc": (0.085, 0.31, 0.15),
    "hpaw": (0.085, 0.29, 0.035),
    "htoe": (0.085, 0.25, 0.035),
    # tail (up and back, the tip curling forward: the sheet's walk)
    "t0": (0, 0.36, 0.6),
    "t1": (0, 0.45, 0.7),
    "t2": (0, 0.495, 0.84),
    "t3": (0, 0.48, 0.97),
    "t4": (0, 0.425, 1.05),
    "t5": (0, 0.355, 1.065),
}


def V(k, side=1):
    x, y, z = J[k]
    return Vector((x * side, y, z))


def build_body():
    """Skin-modifier body: torso, neck, legs, tail as one manifold mesh."""
    bm = bmesh.new()
    verts = {}
    radii = {}

    def add(key, co, r):
        v = bm.verts.new(co)
        verts[key] = v
        radii[key] = r
        return v

    def edge(a, b):
        bm.edges.new((verts[a], verts[b]))

    # spine: haunch round, loin narrow, chest deep
    add("hip", V("hip"), (0.16, 0.15))
    add("loin", V("loin"), (0.115, 0.12))
    add("spine", V("spine"), (0.122, 0.13))
    add("chest", V("chest"), (0.13, 0.155))
    add("neck", V("neck"), (0.095, 0.1))
    add("throat", V("throat"), (0.085, 0.08))
    for a, b in [("hip", "loin"), ("loin", "spine"), ("spine", "chest"), ("chest", "neck"), ("neck", "throat")]:
        edge(a, b)

    for side, sx in (("L", 1), ("R", -1)):
        add(f"sh{side}", V("sh", sx), (0.058, 0.07))
        add(f"elb{side}", V("elb", sx), (0.042, 0.044))
        add(f"wri{side}", V("wri", sx), (0.035, 0.036))
        add(f"fpaw{side}", V("fpaw", sx), (0.043, 0.036))
        edge("chest", f"sh{side}")
        edge(f"sh{side}", f"elb{side}")
        edge(f"elb{side}", f"wri{side}")
        edge(f"wri{side}", f"fpaw{side}")

        add(f"hp{side}", V("hp", sx), (0.115, 0.13))
        add(f"kne{side}", V("kne", sx), (0.065, 0.07))
        add(f"hoc{side}", V("hoc", sx), (0.033, 0.035))
        add(f"hpaw{side}", V("hpaw", sx), (0.038, 0.034))
        add(f"htoe{side}", V("htoe", sx), (0.04, 0.034))
        edge("hip", f"hp{side}")
        edge(f"hp{side}", f"kne{side}")
        edge(f"kne{side}", f"hoc{side}")
        edge(f"hoc{side}", f"hpaw{side}")
        edge(f"hpaw{side}", f"htoe{side}")

    tail_r = [0.04, 0.036, 0.033, 0.031, 0.029, 0.026]
    for i in range(6):
        add(f"t{i}", V(f"t{i}"), (tail_r[i], tail_r[i]))
    edge("hip", "t0")
    for i in range(5):
        edge(f"t{i}", f"t{i + 1}")

    bm.verts.index_update()
    idx = {k: v.index for k, v in verts.items()}
    ob = obj_from_bm("Body", bm, "Fur")
    skin = ob.modifiers.new("Skin", "SKIN")
    skin.use_smooth_shade = True
    ob.data.skin_vertices[0].data[idx["hip"]].use_root = True
    for key, i in idx.items():
        sv = ob.data.skin_vertices[0].data[i]
        sv.radius = radii[key]
    sub = ob.modifiers.new("Subsurf", "SUBSURF")
    sub.levels = 2
    sub.render_levels = 2
    apply_modifiers(ob)
    shade_smooth(ob)
    return ob


# ----------------------------------------------------------------- head

HEAD_C = Vector((0, -0.28, 0.86))
HEAD_R = Vector((0.215, 0.168, 0.172))


def build_head():
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=32, radius=1.0)
    for v in bm.verts:
        x, y, z = v.co
        # wide cheeks low, narrower crown (the sheet's rounded-trapezoid head)
        widen = 1.0 + 0.12 * max(0.0, -z) * (1 - abs(z)) - 0.1 * max(0.0, z) ** 2
        x *= widen
        # flatter face, fuller back of the skull
        if y < 0:
            y *= 0.9
        # small muzzle: push the lower centre of the face forward
        m = math.exp(-((x / 0.42) ** 2) - ((z + 0.38) / 0.32) ** 2) * max(0.0, -y)
        y -= 0.26 * m
        # chin tucks in
        if z < -0.7:
            y *= 0.92
        v.co = Vector((x * HEAD_R.x, y * HEAD_R.y, z * HEAD_R.z)) + HEAD_C
    ob = obj_from_bm("Head", bm, "Fur")
    shade_smooth(ob)
    return ob


def front_point(x, z):
    """Point on the head's front surface at (x, z) by ray-casting along +Y."""
    head = bpy.data.objects["Head"]
    origin = Vector((x, -2.0, z))
    ok, loc, normal, _ = head.ray_cast(origin, Vector((0, 1, 0)))
    if not ok:
        raise RuntimeError(f"no head surface at {x}, {z}")
    return loc, normal.normalized()


def ellipsoid(name, mat, center, radii, rot=None, seg=(32, 16)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg[0], v_segments=seg[1], radius=1.0)
    m = Matrix.Diagonal((*radii, 1.0))
    if rot is not None:
        m = rot.to_4x4() @ m
    m = Matrix.Translation(center) @ m
    bmesh.ops.transform(bm, matrix=m, verts=bm.verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = obj_from_bm(name, bm, mat)
    shade_smooth(ob)
    return ob


def look_rot(normal, tilt_deg=0.0):
    """Rotation whose local -Y faces along `normal` (out of the face)."""
    fwd = -normal
    up = Vector((0, 0, 1))
    # right-handed (det +1): a mirrored basis flips face winding, and three.js
    # culls back faces, so a mirrored eye shows its inside (hidden in the head)
    side = fwd.cross(up).normalized()
    up2 = side.cross(fwd).normalized()
    m = Matrix((side, fwd, up2)).transposed()
    return m @ Matrix.Rotation(math.radians(tilt_deg), 3, "Y")


def build_eyes():
    parts = []
    for sx, name in ((1, "L"), (-1, "R")):
        loc, n = front_point(0.094 * sx, HEAD_C.z + 0.005)
        rot = look_rot(n, tilt_deg=-12 * sx)
        eye_c = loc + n * -0.012
        parts.append(ellipsoid(f"Eye.{name}", "Eye", eye_c, (0.062, 0.03, 0.07), rot))
        pupil_c = eye_c + n * 0.024
        parts.append(ellipsoid(f"Pupil.{name}", "Pupil", pupil_c, (0.0135, 0.012, 0.052), rot))
        side = rot @ Vector((1, 0, 0))
        shine_c = eye_c + n * 0.03 + side * (0.018 * sx) + Vector((0, 0, 0.026))
        parts.append(ellipsoid(f"Shine.{name}", "Shine", shine_c, (0.0095, 0.006, 0.0095), rot, seg=(12, 8)))
    return parts


def build_nose():
    loc, n = front_point(0.0, HEAD_C.z - 0.07)
    bm = bmesh.new()
    # a small rounded inverted triangle
    pts = [Vector((-0.016, 0, 0.006)), Vector((0.016, 0, 0.006)), Vector((0, 0, -0.012))]
    vs = [bm.verts.new(p) for p in pts]
    f = bm.faces.new(vs)
    bmesh.ops.extrude_face_region(bm, geom=[f])
    for v in bm.verts[3:]:
        v.co.y += 0.008
    rot = look_rot(n)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(loc + n * 0.004) @ rot.to_4x4(), verts=bm.verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return obj_from_bm("Nose", bm, "Nose")


def build_ears():
    parts = []
    for sx, name in ((1, "L"), (-1, "R")):
        base = HEAD_C + Vector((0.112 * sx, 0.0, 0.1))
        tip = HEAD_C + Vector((0.175 * sx, -0.025, 0.37))
        for kind, scale, off, mat in (("Ear", 1.0, 0.0, "Fur"), ("EarIn", 0.72, -0.022, "Inner")):
            bm = bmesh.new()
            bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=True, segments=24, radius1=0.115 * scale, radius2=0.0, depth=0.27 * scale)
            # flatten front-to-back, with a slight cup
            for v in bm.verts:
                v.co.y *= 0.3 if kind == "Ear" else 0.12
            axis = (tip - base).normalized()
            # open the ear outward (~22°) so its triangle reads from the side too
            rot = Vector((0, 0, 1)).rotation_difference(axis).to_matrix() @ Matrix.Rotation(math.radians(28 * sx), 3, "Z")
            center = base + (tip - base) * (0.5 if kind == "Ear" else 0.46) + Vector((0, off, -0.01 if kind == "EarIn" else 0))
            bmesh.ops.transform(bm, matrix=Matrix.Translation(center) @ rot.to_4x4(), verts=bm.verts)
            ob = obj_from_bm(f"{kind}.{name}", bm, mat)
            parts.append(ob)
    return parts


def build_whiskers():
    """Fine whiskers as thin tubes (three per side), fanning out of the muzzle."""
    parts = []
    for sx, name in ((1, "L"), (-1, "R")):
        for i, (dz, spread) in enumerate(((0.012, 0.03), (0.0, -0.005), (-0.012, -0.04))):
            loc, _ = front_point(0.055 * sx, HEAD_C.z - 0.065 + dz)
            cu = bpy.data.curves.new(f"Whisker.{name}{i}", "CURVE")
            cu.dimensions = "3D"
            sp = cu.splines.new("BEZIER")
            sp.bezier_points.add(1)
            a, b = sp.bezier_points
            a.co = loc + Vector((0, 0.01, 0))
            b.co = loc + Vector((0.3 * sx, 0.04, spread + 0.015))
            for p in (a, b):
                p.handle_left_type = p.handle_right_type = "AUTO"
            cu.bevel_depth = 0.0022
            cu.bevel_resolution = 1
            cu.resolution_u = 6
            ob = bpy.data.objects.new(f"Whisker.{name}{i}", cu)
            bpy.context.collection.objects.link(ob)
            ob.data.materials.append(material("Whisker"))
            bpy.context.view_layer.objects.active = ob
            ob.select_set(True)
            bpy.ops.object.convert(target="MESH")
            ob.select_set(False)
            parts.append(bpy.data.objects[f"Whisker.{name}{i}"])
    return parts


# ------------------------------------------------------------- armature

BONES = []  # (name, head, tail, parent, deform)


def bone(name, h, t, parent=None, deform=True):
    BONES.append((name, Vector(h), Vector(t), parent, deform))


def build_armature():
    BONES.clear()
    bone("root", (0, 0.1, 0), (0, -0.1, 0), deform=False)
    bone("hips", V("hip"), V("loin"), "root")
    bone("spine", V("loin"), V("spine"), "hips")
    bone("chest", V("spine"), V("chest"), "spine")
    bone("neck", V("chest"), V("neck"), "chest")
    bone("head", V("neck"), HEAD_C + Vector((0, 0, 0.12)), "neck")
    for sx, s in ((1, "L"), (-1, "R")):
        bone(f"ear.{s}", HEAD_C + Vector((0.112 * sx, 0.0, 0.1)), HEAD_C + Vector((0.175 * sx, -0.025, 0.37)), "head")
        loc, n = front_point(0.094 * sx, HEAD_C.z + 0.005)
        bone(f"eye.{s}", loc - n * 0.05, loc + n * 0.02, "head")
        bone(f"upperarm.{s}", V("sh", sx), V("elb", sx), "chest")
        bone(f"forearm.{s}", V("elb", sx), V("wri", sx), f"upperarm.{s}")
        bone(f"paw.{s}", V("wri", sx), V("fpaw", sx), f"forearm.{s}")
        bone(f"thigh.{s}", V("hp", sx), V("kne", sx), "hips")
        bone(f"shin.{s}", V("kne", sx), V("hoc", sx), f"thigh.{s}")
        bone(f"foot.{s}", V("hoc", sx), V("hpaw", sx), f"shin.{s}")
        bone(f"toe.{s}", V("hpaw", sx), V("htoe", sx), f"foot.{s}")
    # IK controls (non-deforming), parented to root: paws are placed, legs follow
    for sx, s in ((1, "L"), (-1, "R")):
        w = V("wri", sx)
        bone(f"ik.hand.{s}", w, w + Vector((0, -0.08, 0)), "root", False)
        h = V("hpaw", sx)
        bone(f"ik.foot.{s}", h, h + Vector((0, -0.08, 0)), "root", False)
        e = V("elb", sx)
        bone(f"pole.elbow.{s}", e + Vector((0, 0.35, 0)), e + Vector((0, 0.43, 0)), "root", False)
        k = V("kne", sx)
        bone(f"pole.knee.{s}", k + Vector((0, -0.35, 0)), k + Vector((0, -0.43, 0)), "root", False)
    prev = "hips"
    for i in range(5):
        bone(f"tail.{i}", V(f"t{i}"), V(f"t{i + 1}"), prev)
        prev = f"tail.{i}"

    arm = bpy.data.armatures.new("CatRig")
    ob = bpy.data.objects.new("CatRig", arm)
    bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode="EDIT")
    for name, h, t, parent, deform in BONES:
        b = arm.edit_bones.new(name)
        b.head, b.tail = h, t
        b.use_deform = deform
        if parent:
            b.parent = arm.edit_bones[parent]
            b.use_connect = (b.head - arm.edit_bones[parent].tail).length < 1e-4
    bpy.ops.object.mode_set(mode="OBJECT")
    for sx, s in ((1, "L"), (-1, "R")):
        # pole angles measured so the rest pose is unchanged by the IK (scripts/cat3d: pole test)
        for bone_name, target, pole, chain, angle in (
            (f"forearm.{s}", f"ik.hand.{s}", f"pole.elbow.{s}", 2, 90),
            (f"foot.{s}", f"ik.foot.{s}", f"pole.knee.{s}", 3, -90),
        ):
            c = ob.pose.bones[bone_name].constraints.new("IK")
            c.target = ob
            c.subtarget = target
            c.pole_target = ob
            c.pole_subtarget = pole
            c.pole_angle = math.radians(angle)
            c.chain_count = chain
    for pb in ob.pose.bones:
        pb.rotation_mode = "XYZ"
    return ob


# ------------------------------------------------------------- weights


def rigid(ob, group):
    vg = ob.vertex_groups.new(name=group)
    vg.add([v.index for v in ob.data.vertices], 1.0, "REPLACE")


def bind(rig, body, head_parts):
    # body: automatic (bone heat) weights
    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")
    # head parts: rigid to their bone
    for ob in head_parts:
        n = ob.name
        if n.startswith(("Ear", "EarIn")):
            rigid(ob, "ear." + n.split(".")[-1])
        elif n.startswith(("Eye", "Pupil", "Shine")):
            rigid(ob, "eye." + n.split(".")[-1])
        else:
            rigid(ob, "head")
    # the body's neck-top blob belongs to the head
    # join everything into one skinned mesh (one draw call per material)
    bpy.ops.object.select_all(action="DESELECT")
    for ob in head_parts:
        ob.select_set(True)
    body.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.join()
    body.name = "Cat"
    body.data.name = "Cat"
    return body


def main():
    reset()
    head = build_head()
    body = build_body()
    parts = [head, *build_eyes(), build_nose(), *build_ears(), *build_whiskers()]
    rig = build_armature()
    cat = bind(rig, body, parts)

    import animate  # noqa: E402  (sibling module)

    animate.build(rig)

    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(os.path.join(OUT, "cat.blend")))
    bpy.ops.object.select_all(action="SELECT")
    glb = os.path.join(HERE, "..", "..", "public", "models", "cat.glb")
    os.makedirs(os.path.dirname(glb), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=os.path.abspath(glb),
        export_format="GLB",
        export_animations=True,
        export_animation_mode="ACTIONS",
        export_force_sampling=True,
        export_optimize_animation_size=True,
        export_skins=True,
        export_morph=False,
        export_yup=True,
    )
    print("built", cat.name, len(cat.data.vertices), "verts")


if __name__ == "__main__":
    main()
