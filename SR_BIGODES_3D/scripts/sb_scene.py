"""Sr. Bigodes - colecoes, cameras, iluminacao de estudio e ambiente."""
import math

import bpy
from mathutils import Vector

FOCUS = Vector((0.0, 0.03, 0.50))     # centro do gato sentado
WORLD_GRAY = (0.030, 0.030, 0.033)


def make_collections(scene):
    colls = {}

    def new(name, parent):
        c = bpy.data.collections.new(name)
        parent.children.link(c)
        colls[name] = c
        return c

    char = new("CHARACTER", scene.collection)
    for name in ("HEAD", "BODY", "EYES", "EARS", "WHISKERS", "TAIL", "RIG"):
        new(name, char)
    for name in ("CAMERAS", "LIGHTING", "ENVIRONMENT"):
        new(name, scene.collection)
    return colls


def look_at(ob, target):
    ob.rotation_euler = (Vector(target) - ob.location).to_track_quat("-Z", "Y").to_euler()


def add_camera(coll, name, loc, target=None, ortho=None, lens=60, rot=None):
    cam = bpy.data.cameras.new(name)
    ob = bpy.data.objects.new(name, cam)
    ob.location = loc
    if rot is not None:
        ob.rotation_euler = rot
    else:
        look_at(ob, target if target is not None else FOCUS)
    if ortho:
        cam.type = "ORTHO"
        cam.ortho_scale = ortho
    else:
        cam.lens = lens
    cam.clip_start, cam.clip_end = 0.05, 60
    coll.objects.link(ob)
    return ob


def build_cameras(coll, head_c):
    """Vistas tecnicas ortograficas + apresentacao e closes em perspectiva."""
    f = FOCUS
    cams = {}
    s = 1.16
    cams["frontal"] = add_camera(coll, "CAM_01_Frontal", (f.x, -6, f.z), ortho=s)
    cams["traseira"] = add_camera(coll, "CAM_02_Traseira", (f.x, 6, f.z), ortho=s)
    cams["direita"] = add_camera(coll, "CAM_03_Lateral_Direita", (-6, f.y, f.z), ortho=s)
    cams["esquerda"] = add_camera(coll, "CAM_04_Lateral_Esquerda", (6, f.y, f.z), ortho=s)
    cams["3q_frente"] = add_camera(coll, "CAM_05_3Q_Frontal", (-2.25, -3.15, 1.25), lens=105)
    cams["3q_tras"] = add_camera(coll, "CAM_06_3Q_Traseira", (2.25, 3.25, 1.25), lens=105)
    cams["topo"] = add_camera(coll, "CAM_07_Superior", (f.x, f.y + 0.05, 6), ortho=1.0, rot=(0, 0, math.pi))
    cams["inferior"] = add_camera(coll, "CAM_08_Inferior", (f.x, f.y + 0.05, -6), ortho=1.0, rot=(math.pi, 0, 0))
    # closes: enquadram a cabeca na pose sentada (ver sb_anim.SIT_HEAD)
    hc = Vector(head_c)
    cams["rosto"] = add_camera(coll, "CAM_09_Close_Rosto", hc + Vector((-0.42, -1.75, 0.10)),
                               target=hc + Vector((0, 0, 0.035)), lens=85)
    cams["olhos"] = add_camera(coll, "CAM_10_Close_Olhos", hc + Vector((0.0, -1.5, 0.02)),
                               target=hc + Vector((0, 0, 0.012)), lens=112)
    return cams


def add_area(coll, parent, name, loc, power, size, color=(1, 1, 1), target=None):
    li = bpy.data.lights.new(name, "AREA")
    li.energy = power
    li.shape = "DISK"
    li.size = size
    li.color = color
    ob = bpy.data.objects.new(name, li)
    ob.location = loc
    look_at(ob, target if target is not None else FOCUS)
    coll.objects.link(ob)
    ob.parent = parent
    return ob


def build_lighting(coll):
    """Estudio de tres pontos (+ recorte duplo): o gato e preto, entao as
    contraluzes desenham a silhueta contra o fundo cinza."""
    rig = bpy.data.objects.new("LIGHT_Rig", None)
    rig.empty_display_type = "CIRCLE"
    rig.empty_display_size = 0.6
    coll.objects.link(rig)
    add_area(coll, rig, "LIGHT_Principal", (-1.9, -2.3, 2.4), 62, 1.6, (1.0, 0.97, 0.93))
    add_area(coll, rig, "LIGHT_Preenchimento", (2.4, -1.9, 1.0), 20, 2.4, (0.86, 0.92, 1.0))
    add_area(coll, rig, "LIGHT_Contra_Esq", (-1.7, 2.3, 1.9), 80, 1.1, (0.93, 0.96, 1.0))
    add_area(coll, rig, "LIGHT_Contra_Dir", (2.0, 2.0, 1.7), 62, 1.1, (1.0, 0.97, 0.94))
    add_area(coll, rig, "LIGHT_Topo", (0.0, 0.2, 3.2), 14, 2.2)
    return rig


def build_environment(coll, scene):
    world = bpy.data.worlds.new("WORLD_Estudio")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (*WORLD_GRAY, 1)
    bg.inputs["Strength"].default_value = 1.0
    scene.world = world

    # chao: disco grande que se dissolve na cor do fundo (sem linha de horizonte)
    me = bpy.data.meshes.new("ENV_Chao")
    r, seg = 40.0, 96
    verts = [(0, 0, 0)] + [(r * math.cos(2 * math.pi * i / seg), r * math.sin(2 * math.pi * i / seg), 0)
                           for i in range(seg)]
    faces = [(0, 1 + i, 1 + (i + 1) % seg) for i in range(seg)]
    me.from_pydata(verts, [], faces)
    ob = bpy.data.objects.new("ENV_Chao", me)
    coll.objects.link(ob)
    mat = bpy.data.materials.new("MAT_Chao")
    mat.use_nodes = True
    nt = mat.node_tree
    out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = (0.085, 0.085, 0.092, 1)
    bsdf.inputs["Roughness"].default_value = 0.55
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = (*WORLD_GRAY, 1)
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    ln = nt.nodes.new("ShaderNodeVectorMath")
    ln.operation = "LENGTH"
    ramp = nt.nodes.new("ShaderNodeMapRange")
    ramp.interpolation_type = "SMOOTHSTEP"
    ramp.inputs["From Min"].default_value = 2.2
    ramp.inputs["From Max"].default_value = 7.5
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(geo.outputs["Position"], ln.inputs[0])
    nt.links.new(ln.outputs["Value"], ramp.inputs["Value"])
    nt.links.new(ramp.outputs["Result"], mix.inputs["Fac"])
    nt.links.new(bsdf.outputs["BSDF"], mix.inputs[1])
    nt.links.new(emit.outputs["Emission"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    me.materials.append(mat)
    return ob


def setup_render(scene, main_cam):
    scene.camera = main_cam
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 128
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.02
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 1600
    scene.render.fps = 24
    scene.render.film_transparent = False
    try:
        scene.view_settings.view_transform = "AgX"
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass
