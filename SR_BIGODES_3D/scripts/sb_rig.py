"""Sr. Bigodes - armature, vinculos e controles.

Ossos de deformacao: hips, spine, chest, neck, head, ear.L/R, tail_01..08,
front_upper/lower/paw.L/R e hind_upper/lower/foot/paw.L/R.
Controles: CTRL_front_paw.L/R e CTRL_hind_paw.L/R (IK das pernas),
CTRL_hind_heel.L/R (levanta o calcanhar), CTRL_hind_knee.L/R (direcao do joelho), CTRL_eyes (olhar) e CTRL_face
(propriedades das expressoes).
"""
import math

import bpy
import numpy as np
from mathutils import Matrix, Vector

from sb_model import HEAD_C, J, TAIL_BONES, TAIL_DIR, TAIL_SEG

EXPRESSIONS = ["Curioso", "Surpreso", "Feliz", "Bravo", "Triste", "Dormindo", "Desconfiado", "Piscar"]


def mx(p):
    return (-p[0], p[1], p[2])


def build_armature(coll, ear_base, ear_tip):
    arm = bpy.data.armatures.new("SrBigodes_Armature")
    ob = bpy.data.objects.new("SrBigodes_Rig", arm)
    coll.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    eb = arm.edit_bones
    made = {}

    def bone(name, head, tail, parent=None, connect=False, deform=True):
        b = eb.new(name)
        b.head, b.tail = Vector(head), Vector(tail)
        b.use_deform = deform
        if parent:
            b.parent = made[parent]
            b.use_connect = connect
        made[name] = b
        return b

    bone("root", (0, 0, 0), (0, 0.16, 0), deform=False)
    bone("hips", J["hips"], J["spine"], "root")
    bone("spine", J["spine"], J["chest"], "hips", True)
    bone("chest", J["chest"], J["neck"], "spine", True)
    bone("neck", J["neck"], J["head"], "chest", True)
    bone("head", J["head"], J["head_tip"], "neck", True)

    t0 = np.array(J["tail"])
    for i in range(TAIL_BONES):
        a = t0 + TAIL_DIR * TAIL_SEG * i
        b = t0 + TAIL_DIR * TAIL_SEG * (i + 1)
        bone(f"tail_{i + 1:02d}", a, b, "hips" if i == 0 else f"tail_{i:02d}", i > 0)

    for side, tag in ((1, "L"), (-1, "R")):
        f = (lambda p: p) if side == 1 else mx
        eb_base = f(tuple(ear_base))
        eb_tip = f(tuple(ear_tip))
        bone(f"ear.{tag}", eb_base, eb_tip, "head")
        bone(f"front_upper.{tag}", f(J["shoulder"]), f(J["elbow"]), "chest")
        bone(f"front_lower.{tag}", f(J["elbow"]), f(J["wrist"]), f"front_upper.{tag}", True)
        bone(f"front_paw.{tag}", f(J["wrist"]), f(J["front_toe"]), f"front_lower.{tag}", True)
        bone(f"hind_upper.{tag}", f(J["hip"]), f(J["knee"]), "hips")
        bone(f"hind_lower.{tag}", f(J["knee"]), f(J["hock"]), f"hind_upper.{tag}", True)
        bone(f"hind_foot.{tag}", f(J["hock"]), f(J["hind_ball"]), f"hind_lower.{tag}", True)
        bone(f"hind_paw.{tag}", f(J["hind_ball"]), f(J["hind_toe"]), f"hind_foot.{tag}", True)
        # controles
        bone(f"CTRL_front_paw.{tag}", f(J["wrist"]), f(J["front_toe"]), "root", deform=False)
        bone(f"CTRL_hind_paw.{tag}", f(J["hind_ball"]), f(J["hind_toe"]), "root", deform=False)
        bone(f"CTRL_hind_heel.{tag}", f(J["hind_ball"]), f(J["hock"]), f"CTRL_hind_paw.{tag}", deform=False)
        kn = Vector(f(J["knee"])) + Vector((0, -0.35, 0))
        bone(f"CTRL_hind_knee.{tag}", kn, kn + Vector((0, 0, 0.04)), "root", deform=False)
        hk = Vector(f(J["hock"]))
        bone(f"MCH_hock.{tag}", hk, hk + Vector((0, 0.03, 0)), f"CTRL_hind_heel.{tag}", deform=False)
    eye_mid = Vector((0, HEAD_C[1] - 0.45, HEAD_C[2] + 0.01))
    bone("CTRL_eyes", eye_mid, eye_mid + Vector((0, 0, 0.04)), "head", deform=False)
    top = Vector((0, HEAD_C[1], HEAD_C[2] + 0.42))
    bone("CTRL_face", top, top + Vector((0, 0, 0.05)), "head", deform=False)

    # rolagem espelhada entre .L e .R
    for name, b in made.items():
        if name.endswith(".R"):
            b.roll = -made[name[:-2] + ".L"].roll
    bpy.ops.object.mode_set(mode="POSE")

    pb = ob.pose.bones
    for tag in "LR":
        c = pb[f"front_lower.{tag}"].constraints.new("IK")
        c.target, c.subtarget, c.chain_count = ob, f"CTRL_front_paw.{tag}", 2
        c.use_stretch = True      # estica um pouco quando a pata fica longe (sentado, galope)
        for n in ("front_upper", "front_lower", "hind_upper", "hind_lower"):
            pb[f"{n}.{tag}"].ik_stretch = 0.2 if n.startswith("front") else 0.1
        c = pb[f"front_paw.{tag}"].constraints.new("COPY_ROTATION")
        c.target, c.subtarget = ob, f"CTRL_front_paw.{tag}"
        c = pb[f"hind_lower.{tag}"].constraints.new("IK")
        c.target, c.subtarget, c.chain_count = ob, f"MCH_hock.{tag}", 2
        c.use_stretch = True
        c = pb[f"hind_foot.{tag}"].constraints.new("DAMPED_TRACK")
        c.target, c.subtarget, c.track_axis = ob, f"CTRL_hind_paw.{tag}", "TRACK_Y"
        c = pb[f"hind_paw.{tag}"].constraints.new("COPY_ROTATION")
        c.target, c.subtarget = ob, f"CTRL_hind_paw.{tag}"

    calibrate_poles(ob)

    # escala de um osso do tronco nao passa para os filhos (barriga, respiracao)
    for name in ["spine", "chest", "neck", "tail_01"] + [f"{n}.{t}" for t in "LR" for n in ("front_upper", "hind_upper")]:
        arm.bones[name].inherit_scale = "NONE"

    # propriedades das expressoes
    face = pb["CTRL_face"]
    for name in EXPRESSIONS:
        face[name] = 0.0
        ui = face.id_properties_ui(name)
        ui.update(min=0.0, max=1.0, soft_min=0.0, soft_max=1.0, description=f"Expressao: {name}")

    # colecoes de ossos
    groups = {"Deformacao": [], "Controles": [], "Mecanismo": []}
    for b in arm.bones:
        key = "Controles" if b.name.startswith("CTRL_") or b.name == "root" else \
            "Mecanismo" if b.name.startswith("MCH_") else "Deformacao"
        groups[key].append(b)
    for gname, bones in groups.items():
        bc = arm.collections.new(gname)
        for b in bones:
            bc.assign(b)
    arm.collections["Mecanismo"].is_visible = False
    arm.display_type = "OCTAHEDRAL"
    ob.show_in_front = True
    bpy.ops.object.mode_set(mode="OBJECT")
    return ob


def calibrate_poles(rig):
    """Acha o pole_angle em que o joelho fica onde esta no repouso."""
    pb = rig.pose.bones
    for tag in "LR":
        c = next(c for c in pb[f"hind_lower.{tag}"].constraints if c.type == "IK")
        c.pole_target, c.pole_subtarget = rig, f"CTRL_hind_knee.{tag}"
        rest = rig.data.bones[f"hind_lower.{tag}"].head_local
        best = (1e9, 0.0)
        for deg in range(-180, 180, 5):
            c.pole_angle = math.radians(deg)
            bpy.context.view_layer.update()
            err = (pb[f"hind_lower.{tag}"].head - rest).length
            best = min(best, (err, deg))
        c.pole_angle = math.radians(best[1])
        print(f"[rig] pole {tag}: {best[1]} graus (erro {best[0] * 1000:.2f} mm)")
    bpy.context.view_layer.update()


def bind_mesh(ob, rig):
    """Liga uma malha com grupos de vertices ao rig (modificador no topo)."""
    ob.parent = rig
    mod = ob.modifiers.new("Armature", "ARMATURE")
    mod.object = rig
    while ob.modifiers[0] != mod:   # antes de Subdivision / Solidify
        ob.modifiers.move(len(ob.modifiers) - 1, 0)


def parent_to_bone(ob, rig, bone_name):
    world = ob.matrix_world.copy()
    bone = rig.data.bones[bone_name]
    pm = rig.matrix_world @ bone.matrix_local @ Matrix.Translation((0, bone.length, 0))
    ob.parent = rig
    ob.parent_type = "BONE"
    ob.parent_bone = bone_name
    ob.matrix_parent_inverse = pm.inverted()
    ob.matrix_basis = world


def _driver(target, path, rig, data_path, index=-1):
    fc = target.driver_add(path, index) if index >= 0 else target.driver_add(path)
    d = fc.driver
    d.type = "SUM"
    v = d.variables.new()
    v.name = "v"
    v.type = "SINGLE_PROP"
    v.targets[0].id = rig
    v.targets[0].data_path = data_path
    return fc


def drive_expressions(objs, rig):
    """Cada shape key com nome de expressao segue a propriedade de CTRL_face."""
    for ob in objs:
        keys = ob.data.shape_keys
        if not keys:
            continue
        for kb in keys.key_blocks:
            if kb.name in EXPRESSIONS:
                _driver(kb, "value", rig, f'pose.bones["CTRL_face"]["{kb.name}"]')


def drive_eyes(eyes, rig):
    """Mover CTRL_eyes para os lados / para cima gira os olhos."""
    bone = rig.data.bones["CTRL_eyes"]
    R = bone.matrix_local.to_3x3()
    axes = "XYZ"

    def local_axis(world_vec):
        loc = R.inverted() @ Vector(world_vec)
        i = max(range(3), key=lambda k: abs(loc[k]))
        return axes[i], (1.0 if loc[i] > 0 else -1.0)

    ax_side, sg_side = local_axis((1, 0, 0))
    ax_up, sg_up = local_axis((0, 0, 1))
    gain = 6.0   # rad por unidade: 5 cm -> ~17 graus
    for eye in eyes:
        for idx, ax, coef in ((2, ax_side, sg_side * gain), (0, ax_up, -sg_up * gain)):
            fc = eye.driver_add("rotation_euler", idx)
            d = fc.driver
            d.type = "SUM"
            v = d.variables.new()
            v.name = "v"
            v.type = "TRANSFORMS"
            t = v.targets[0]
            t.id = rig
            t.bone_target = "CTRL_eyes"
            t.transform_type = f"LOC_{ax}"
            t.transform_space = "LOCAL_SPACE"
            # y = coef * v, sem expressao em Python
            mod = fc.modifiers[0] if fc.modifiers else fc.modifiers.new("GENERATOR")
            mod.mode = "POLYNOMIAL"
            mod.poly_order = 1
            mod.coefficients = (0.0, coef)
