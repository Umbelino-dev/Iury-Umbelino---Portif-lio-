"""
Poses and actions for the cat rig (called by build_cat.py).

Bodies are posed by *direction*, not by raw angles: `aim(bone, dir)` points a
bone along a world direction (keeping its head where its parent put it), and
the paws are placed with the IK controls, so feet stay planted. Each action is
keyed on the pose channels; the glTF export samples the final (IK-solved) pose.

Secondary motion (blink, gaze, ear flicks, tail sway, breathing) is NOT baked:
three.js adds it procedurally on top of these actions, so it can react.
"""

import math

import bpy
from mathutils import Matrix, Vector

FPS = 24
rig = None


def P(name):
    return rig.pose.bones[name]


def update():
    bpy.context.view_layer.update()


def reset_pose():
    for pb in rig.pose.bones:
        pb.location = (0, 0, 0)
        pb.rotation_euler = (0, 0, 0)
        pb.scale = (1, 1, 1)
    update()


def aim(name, d, roll=0.0):
    """Point bone `name` along world direction `d` (armature at the origin)."""
    pb = P(name)
    rest = pb.bone.matrix_local.to_3x3()
    rest_dir = rest @ Vector((0, 1, 0))
    q = rest_dir.rotation_difference(Vector(d).normalized())
    m = q.to_matrix() @ rest
    if roll:
        m = Matrix.Rotation(math.radians(roll), 3, Vector(d).normalized()) @ m
    head = pb.matrix.to_translation()
    pb.matrix = Matrix.Translation(head) @ m.to_4x4()
    update()


def place(name, pos):
    """Move a bone's head to a world position (IK controls, root)."""
    pb = P(name)
    m = pb.matrix.copy()
    m.translation = Vector(pos)
    pb.matrix = m
    update()


def head_of(name):
    return P(name).matrix.to_translation()


def key_all(frame):
    for pb in rig.pose.bones:
        pb.keyframe_insert("location", frame=frame)
        pb.keyframe_insert("rotation_euler", frame=frame)
        pb.keyframe_insert("scale", frame=frame)


def new_action(name):
    act = bpy.data.actions.new(name)
    act.use_fake_user = True
    rig.animation_data_create()
    rig.animation_data.action = act
    return act


def finish(act, start, end, cyclic=False):
    act.frame_range = (start, end)
    act.use_frame_range = True
    act.use_cyclic = cyclic
    # store in the NLA so the glTF exporter sees every action
    track = rig.animation_data.nla_tracks.new()
    track.name = act.name
    track.strips.new(act.name, int(start), act)
    # muted while authoring, or this track would override the next action's poses
    track.mute = True
    rig.animation_data.action = None


# ---------------------------------------------------------------- poses


def pose_stand():
    reset_pose()


def pose_sit():
    """The sheet's main pose: upright, front legs straight, tail on the floor."""
    reset_pose()
    place("root", (0, 0.12, -0.43))
    aim("hips", (0, -0.42, 1))
    aim("spine", (0, -0.26, 1))
    aim("chest", (0, -0.12, 1))
    aim("neck", (0, -0.2, 1))
    aim("head", (0, -0.02, 1))
    for sx, s in ((1, "L"), (-1, "R")):
        sh = head_of(f"upperarm.{s}")
        place(f"ik.hand.{s}", (0.062 * sx, sh.y - 0.03, 0.075))
        place(f"pole.elbow.{s}", (0.07 * sx, sh.y + 0.4, 0.3))
        hp = head_of(f"thigh.{s}")
        place(f"ik.foot.{s}", (0.1 * sx, hp.y - 0.16, 0.035))
        place(f"pole.knee.{s}", (0.11 * sx, hp.y - 0.5, 0.25))
    # tail: back, down onto the floor, then round to the cat's left and forward
    aim("tail.0", (0.2, 1, -0.12))
    aim("tail.1", (0.75, 0.55, 0))
    aim("tail.2", (1, -0.15, 0))
    aim("tail.3", (0.55, -1, 0.04))
    aim("tail.4", (-0.15, -1, 0.35))


# ------------------------------------------------------------------ walk

WALK_FRAMES = 24  # one full stride at 24 fps = 1 s (three.js retimes it)
STRIDE = 0.3  # paw travel per stride; the code moves the cat 0.3 / 1 s
PHASE = {"foot.L": 0.0, "hand.L": 0.25, "foot.R": 0.5, "hand.R": 0.75}


def paw_offset(u, lift):
    """Paw path at leg phase u: stance (planted, slides back) then swing (arc forward)."""
    stance = 0.62
    if u < stance:
        s = u / stance
        return Vector((0, -STRIDE / 2 + STRIDE * s, 0))
    s = (u - stance) / (1 - stance)
    e = 0.5 - 0.5 * math.cos(math.pi * s)
    return Vector((0, STRIDE / 2 - STRIDE * e, lift * math.sin(math.pi * s)))


def key_walk(act):
    reset_pose()
    rest = {k: head_of(f"ik.{k}") for k in PHASE}
    for f in range(WALK_FRAMES + 1):
        t = f / WALK_FRAMES
        reset_pose()
        # two small bobs per stride (one per pair of legs), a slight roll
        place("root", (0, 0.1, -0.014 * (0.5 - 0.5 * math.cos(4 * math.pi * t))))
        for k, ph in PHASE.items():
            u = (t + ph) % 1
            lift = 0.075 if k.startswith("hand") else 0.06
            place(f"ik.{k}", rest[k] + paw_offset(u, lift))
        roll = 2.5 * math.sin(2 * math.pi * t)
        P("chest").rotation_euler.y = math.radians(roll)
        P("hips").rotation_euler.y = math.radians(-roll)
        P("head").rotation_euler.y = math.radians(-roll * 0.6)
        update()
        key_all(f + 1)
    finish(act, 1, WALK_FRAMES + 1, cyclic=True)


POSES = {"Stand": pose_stand, "Sit": pose_sit}


def build(armature):
    global rig
    rig = armature
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode="POSE")
    for name, fn in POSES.items():
        act = new_action(name)
        fn()
        key_all(1)
        key_all(2)
        finish(act, 1, 2)
    key_walk(new_action("Walk"))
    reset_pose()
    for t in rig.animation_data.nla_tracks:
        t.mute = False
    bpy.ops.object.mode_set(mode="OBJECT")
