"""Sr. Bigodes - geometria e materiais.

Convencoes: Z para cima, o gato olha para -Y, +X e a esquerda dele (.L).
Unidade: 1.0 = altura do gato sentado, com as orelhas.
A pose de construcao (bind) e em pe; o rig leva para as outras poses.
"""
import math

import bpy
import bmesh
import numpy as np
from mathutils import Matrix, Vector

import sb_sdf
from sb_sdf import Prim, SkinField

# ------------------------------------------------------------------ esqueleto
J = {
    "hips": (0.0, 0.215, 0.42),
    "spine": (0.0, 0.10, 0.435),
    "chest": (0.0, -0.03, 0.44),
    "neck": (0.0, -0.19, 0.46),
    "head": (0.0, -0.255, 0.525),
    "head_tip": (0.0, -0.28, 0.72),
    # perna dianteira esquerda
    "shoulder": (0.058, -0.135, 0.38),
    "elbow": (0.068, -0.09, 0.222),
    "wrist": (0.07, -0.135, 0.068),
    "front_toe": (0.07, -0.21, 0.02),
    # perna traseira esquerda
    "hip": (0.075, 0.185, 0.39),
    "knee": (0.085, 0.095, 0.235),
    "hock": (0.08, 0.215, 0.128),
    "hind_ball": (0.08, 0.18, 0.04),
    "hind_toe": (0.08, 0.105, 0.02),
    "tail": (0.0, 0.245, 0.45),
}
HEAD_C = np.array([0.0, -0.315, 0.600])  # centro da cabeca
GROUND = 0.003                            # sola das patas (coxins descem ate z = 0)
TAIL_BONES = 8
TAIL_SEG = 0.085
TAIL_DIR = np.array([0.0, math.cos(math.radians(20)), math.sin(math.radians(20))])

TOE_X = (-0.027, -0.009, 0.009, 0.027)


def hc(x, y, z):
    """Coordenada local da cabeca -> espaco do personagem."""
    return (HEAD_C[0] + x, HEAD_C[1] + y, HEAD_C[2] + z)


def mirror_all(prims):
    out = []
    for p in prims:
        out.append(p)
        if ".L" in p.name:
            out.append(p.mirrored())
    return out


def build_field():
    head = mirror_all([
        Prim("cranium", "ell", "head", 0.05, c=hc(0, 0, 0), r=(0.186, 0.150, 0.132)),
        Prim("cheek.L", "ell", "head", 0.06, c=hc(0.085, -0.035, -0.042), r=(0.107, 0.105, 0.085)),
        Prim("muzzle", "ell", "head", 0.045, c=hc(0, -0.118, -0.047), r=(0.062, 0.05, 0.04)),
        Prim("chin", "ell", "head", 0.04, c=hc(0, -0.092, -0.085), r=(0.05, 0.045, 0.034)),
    ])
    sx, ex, wx = J["shoulder"], J["elbow"], J["wrist"]
    hx, kx, ox, bx = J["hip"], J["knee"], J["hock"], J["hind_ball"]
    fp = (wx[0], -0.162, 0.036)   # centro da pata dianteira
    hp = (bx[0], 0.150, 0.036)    # centro da pata traseira
    body = [
        Prim("chest", "ell", "chest", 0.06, c=(0, -0.10, 0.405), r=(0.096, 0.122, 0.106)),
        Prim("belly", "ell", "spine", 0.07, c=(0, 0.04, 0.395), r=(0.110, 0.13, 0.106)),
        Prim("rump", "ell", "hips", 0.07, c=(0, 0.17, 0.405), r=(0.114, 0.108, 0.108)),
        Prim("tailbase", "ell", "hips", 0.05, c=J["tail"], r=(0.042, 0.042, 0.042)),
        Prim("neck", "cone", "neck", 0.05, a=J["neck"], b=J["head"], r1=0.064, r2=0.058),
        # dianteira
        Prim("f_upper.L", "cone", "front_upper.L", 0.05, a=sx, b=ex, r1=0.048, r2=0.037),
        Prim("f_lower.L", "cone", "front_lower.L", 0.03, a=ex, b=wx, r1=0.036, r2=0.030),
        Prim("f_paw.L", "ell", "front_paw.L", 0.03, c=fp, r=(0.041, 0.054, 0.036)),
        # traseira
        Prim("h_thigh.L", "cone", "hind_upper.L", 0.06, a=hx, b=kx, r1=0.084, r2=0.048),
        Prim("h_shin.L", "cone", "hind_lower.L", 0.035, a=kx, b=ox, r1=0.043, r2=0.029),
        Prim("h_foot.L", "cone", "hind_foot.L", 0.025, a=ox, b=bx, r1=0.029, r2=0.029),
        Prim("h_paw.L", "ell", "hind_paw.L", 0.03, c=hp, r=(0.039, 0.054, 0.036)),
    ]
    for i, dx in enumerate(TOE_X):   # dedos: quatro volumes com sulcos entre eles
        body.append(Prim(f"f_toe{i}.L", "ell", "front_paw.L", 0.007,
                         c=(fp[0] + dx, fp[1] - 0.043, 0.024), r=(0.0125, 0.02, 0.019)))
        body.append(Prim(f"h_toe{i}.L", "ell", "hind_paw.L", 0.007,
                         c=(hp[0] + dx, hp[1] - 0.043, 0.024), r=(0.012, 0.02, 0.019)))
    body = mirror_all(body)
    return SkinField([("body", body), ("head", head)], {"body": 0.0, "head": 0.025}, ground=GROUND)


SKIN_BONES = ["hips", "spine", "chest", "neck", "head"] + [
    f"{n}.{s}" for s in "LR" for n in (
        "front_upper", "front_lower", "front_paw", "hind_upper", "hind_lower", "hind_foot", "hind_paw")
]
SIGMA = {"_default": 0.035, "head": 0.014, "neck": 0.03,
         "front_paw.L": 0.02, "front_paw.R": 0.02, "hind_paw.L": 0.02, "hind_paw.R": 0.02,
         "hind_foot.L": 0.025, "hind_foot.R": 0.025}


# -------------------------------------------------------------- utilidades bpy
def new_mesh_object(name, verts, faces, coll, smooth=True):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(map(float, v)) for v in verts], [], [tuple(map(int, f)) for f in faces])
    me.update()
    if smooth:
        me.shade_smooth()
    ob = bpy.data.objects.new(name, me)
    coll.objects.link(ob)
    return ob


def fix_normals(ob, outward_from=None):
    """Recalcula a orientacao das faces (para fora)."""
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(ob.data)
    bm.free()


def add_subsurf(ob, levels=2):
    m = ob.modifiers.new("Subdivision", "SUBSURF")
    m.levels = levels
    m.render_levels = levels
    return m


def grid_faces(nu, nv, offset=0, flip=False):
    """Quads de uma grade com nv linhas x nu colunas de vertices."""
    faces = []
    for j in range(nv - 1):
        for i in range(nu - 1):
            a = offset + j * nu + i
            q = (a, a + 1, a + nu + 1, a + nu)
            faces.append(q[::-1] if flip else q)
    return faces


def uv_sphere(seg=24, rings=12):
    """Esfera unitaria com os polos no eixo Y (polo -Y = frente)."""
    verts = [(0.0, -1.0, 0.0)]
    for j in range(1, rings):
        a = math.pi * j / rings
        for i in range(seg):
            t = 2 * math.pi * i / seg
            verts.append((math.sin(a) * math.cos(t), -math.cos(a), math.sin(a) * math.sin(t)))
    verts.append((0.0, 1.0, 0.0))
    faces = []
    for i in range(seg):
        faces.append((0, 1 + (i + 1) % seg, 1 + i))
    for j in range(rings - 2):
        for i in range(seg):
            a = 1 + j * seg + i
            b = 1 + j * seg + (i + 1) % seg
            faces.append((a, b, b + seg, a + seg))
    last = len(verts) - 1
    base = 1 + (rings - 2) * seg
    for i in range(seg):
        faces.append((last, base + i, base + (i + 1) % seg))
    return np.array(verts), faces


# ------------------------------------------------------------------ materiais
def _principled(name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    return mat, nt, bsdf


def make_materials():
    M = {}
    # pelagem: preto profundo, acetinado, com brilho de veludo nas bordas
    mat, nt, b = _principled("MAT_Pelagem_Preta")
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 9.0
    noise.inputs["Detail"].default_value = 3.0
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.009, 0.009, 0.011, 1)
    ramp.color_ramp.elements[1].color = (0.024, 0.023, 0.027, 1)
    tex = nt.nodes.new("ShaderNodeTexCoord")
    nt.links.new(tex.outputs["Object"], noise.inputs["Vector"])
    nt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
    fine = nt.nodes.new("ShaderNodeTexNoise")
    fine.inputs["Scale"].default_value = 420.0
    nt.links.new(tex.outputs["Object"], fine.inputs["Vector"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.12
    bump.inputs["Distance"].default_value = 0.002
    nt.links.new(fine.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    b.inputs["Roughness"].default_value = 0.68
    b.inputs["Specular IOR Level"].default_value = 0.28
    b.inputs["Sheen Weight"].default_value = 1.0
    b.inputs["Sheen Roughness"].default_value = 0.38
    b.inputs["Sheen Tint"].default_value = (0.55, 0.57, 0.66, 1)
    M["fur"] = mat

    mat, nt, b = _principled("MAT_Orelha_Interna")
    b.inputs["Base Color"].default_value = (0.095, 0.068, 0.078, 1)
    b.inputs["Roughness"].default_value = 0.7
    b.inputs["Sheen Weight"].default_value = 0.4
    b.inputs["Sheen Tint"].default_value = (0.7, 0.6, 0.62, 1)
    M["ear_inner"] = mat

    # iris: verde-limao, mais clara no centro, borda escura; leve emissao para manter a cor viva
    mat, nt, b = _principled("MAT_Olho_Iris")
    tex = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    comb = nt.nodes.new("ShaderNodeCombineXYZ")
    ln = nt.nodes.new("ShaderNodeVectorMath")
    ln.operation = "LENGTH"
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    cr = ramp.color_ramp
    cr.elements[0].position = 0.0
    cr.elements[0].color = (0.50, 0.90, 0.10, 1)
    cr.elements[1].position = 0.55
    cr.elements[1].color = (0.30, 0.78, 0.05, 1)
    e = cr.elements.new(0.74)
    e.color = (0.10, 0.42, 0.02, 1)
    e = cr.elements.new(0.86)
    e.color = (0.01, 0.05, 0.005, 1)
    nt.links.new(tex.outputs["Object"], sep.inputs[0])
    nt.links.new(sep.outputs["X"], comb.inputs["X"])
    nt.links.new(sep.outputs["Z"], comb.inputs["Z"])
    nt.links.new(comb.outputs[0], ln.inputs[0])
    nt.links.new(ln.outputs["Value"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Emission Color"])
    b.inputs["Emission Strength"].default_value = 0.35
    b.inputs["Roughness"].default_value = 0.25
    b.inputs["Coat Weight"].default_value = 0.6
    b.inputs["Coat Roughness"].default_value = 0.22
    M["iris"] = mat

    mat, nt, b = _principled("MAT_Olho_Pupila")
    b.inputs["Base Color"].default_value = (0.002, 0.002, 0.002, 1)
    b.inputs["Roughness"].default_value = 0.1
    b.inputs["Coat Weight"].default_value = 1.0
    b.inputs["Coat Roughness"].default_value = 0.03
    M["pupil"] = mat

    mat, nt, b = _principled("MAT_Olho_Brilho")
    b.inputs["Base Color"].default_value = (1, 1, 1, 1)
    b.inputs["Emission Color"].default_value = (1, 1, 1, 1)
    b.inputs["Emission Strength"].default_value = 2.5
    M["highlight"] = mat

    mat, nt, b = _principled("MAT_Nariz")
    b.inputs["Base Color"].default_value = (0.012, 0.010, 0.011, 1)
    b.inputs["Roughness"].default_value = 0.28
    b.inputs["Coat Weight"].default_value = 0.6
    b.inputs["Coat Roughness"].default_value = 0.2
    M["nose"] = mat

    mat, nt, b = _principled("MAT_Coxins")
    b.inputs["Base Color"].default_value = (0.085, 0.052, 0.058, 1)
    b.inputs["Roughness"].default_value = 0.5
    M["pad"] = mat

    mat, nt, b = _principled("MAT_Bigodes")
    b.inputs["Base Color"].default_value = (0.62, 0.62, 0.64, 1)
    b.inputs["Roughness"].default_value = 0.35
    M["whisker"] = mat

    mat, nt, b = _principled("MAT_Boca_Linha")
    b.inputs["Base Color"].default_value = (0.001, 0.001, 0.001, 1)
    b.inputs["Roughness"].default_value = 0.9
    b.inputs["Specular IOR Level"].default_value = 0.0
    M["mouth_line"] = mat

    mat, nt, b = _principled("MAT_Boca_Interna")
    b.inputs["Base Color"].default_value = (0.30, 0.07, 0.09, 1)
    b.inputs["Roughness"].default_value = 0.45
    M["mouth_inner"] = mat
    return M


# ------------------------------------------------------------------------ pele
def build_skin(field, colls, mats, h=0.006):
    """Cabeca e corpo: uma unica superficie continua, separada em dois objetos
    por um corte no pescoco (as bordas coincidem vertice a vertice)."""
    bounds = ((-0.27, 0.27), (-0.56, 0.36), (-0.012, 0.80))
    verts, quads = sb_sdf.surface_nets(field, bounds, h)
    verts, edges = sb_sdf.relax(field, verts, quads)
    W = sb_sdf.skin_weights(field, verts, edges, SKIN_BONES, SIGMA)
    normals = field.grad(verts)
    normals /= np.linalg.norm(normals, axis=1)[:, None]

    # corte no pescoco
    a, b = np.array(J["neck"]), np.array(J["head"])
    n = (b - a) / np.linalg.norm(b - a)
    p0 = a + 0.62 * (b - a)
    side = (verts - p0) @ n
    is_head_v = side > 0
    bi = {name: i for i, name in enumerate(SKIN_BONES)}
    keep = np.zeros(len(SKIN_BONES), bool)
    keep[[bi["head"], bi["neck"]]] = True
    W[np.ix_(is_head_v, ~keep)] = 0.0
    far = side > 0.05           # longe do pescoco a cabeca e rigida
    W[far] = 0.0
    W[far, bi["head"]] = 1.0
    W[~is_head_v, bi["head"]] *= np.clip(1 + side[~is_head_v] / 0.03, 0, 1)
    W /= np.maximum(W.sum(1), 1e-9)[:, None]

    fside = side[quads].mean(1) > 0
    objs = {}
    for name, mask, coll in (("SrBigodes_Cabeca", fside, colls["HEAD"]),
                             ("SrBigodes_Corpo", ~fside, colls["BODY"])):
        fq = quads[mask]
        used = np.unique(fq)
        remap = np.full(len(verts), -1)
        remap[used] = np.arange(len(used))
        ob = new_mesh_object(name, verts[used], remap[fq], coll)
        ob.data.materials.append(mats["fur"])
        for j, bname in enumerate(SKIN_BONES):
            w = W[used, j]
            idx = np.nonzero(w > 0)[0]
            if len(idx) == 0:
                continue
            vg = ob.vertex_groups.new(name=bname)
            for vi in idx:
                vg.add([int(vi)], float(w[vi]), "REPLACE")
        # normais da superficie original: a emenda do pescoco fica invisivel
        ob.data.normals_split_custom_set_from_vertices([tuple(v) for v in normals[used]])
        objs[name] = ob
    return objs["SrBigodes_Cabeca"], objs["SrBigodes_Corpo"]


# --------------------------------------------------------------------- orelhas
def ear_surface(u, v):
    """Ponto da folha da orelha esquerda, em coordenadas locais da cabeca."""
    b_in = np.array([0.020, -0.042, 0.130])
    b_out = np.array([0.170, 0.062, 0.030])
    tip = np.array([0.166, 0.012, 0.290])
    mid = 0.5 * (b_in + b_out)
    bow = np.array([-0.57, 0.82, 0.0]) * 0.052 * math.sin(math.pi * u)   # concha voltada para frente e para fora
    pb = b_in + (b_out - b_in) * u + bow
    if v >= 0:
        w = (1.0 - v) ** 0.6
        cl = mid + (tip - mid) * v
    else:
        w = 1.0 - 0.35 * v
        cl = mid + (tip - mid) * v * 0.6
    return cl + (pb - mid) * w


def build_ears(colls, mats):
    us = np.linspace(0, 1, 9)
    vs = [-0.22, -0.08, 0.04, 0.16, 0.30, 0.44, 0.58, 0.71, 0.82, 0.90, 0.955, 0.985, 0.998]
    nu, nv = len(us), len(vs)
    front, back = [], []
    for v in vs:
        th = 0.017 * (1.0 - 0.62 * max(v, 0.0))
        for u in us:
            p = ear_surface(u, v)
            du = ear_surface(min(u + 1e-3, 1), v) - ear_surface(max(u - 1e-3, 0), v)
            dv = ear_surface(u, v + 1e-3) - ear_surface(u, v - 1e-3)
            nrm = np.cross(du, dv)
            nrm /= np.linalg.norm(nrm)
            if nrm[1] < 0:
                nrm = -nrm
            edge = 1.0 - 0.55 * abs(2 * u - 1) ** 3      # afina na borda
            front.append(p - nrm * th * 0.35 * edge)
            back.append(p + nrm * th * 0.65 * edge)
    verts = np.array(front + back)
    faces = grid_faces(nu, nv, 0, flip=True) + grid_faces(nu, nv, nu * nv)
    n_front = (nu - 1) * (nv - 1)
    for j in range(nv - 1):   # bordas laterais
        a, b = j * nu, (j + 1) * nu
        faces.append((a, b, b + nu * nv, a + nu * nv))
        a, b = j * nu + nu - 1, (j + 1) * nu + nu - 1
        faces.append((a + nu * nv, b + nu * nv, b, a))
    top = (nv - 1) * nu
    for i in range(nu - 1):   # ponta
        faces.append((top + i, top + i + 1, top + i + 1 + nu * nv, top + i + nu * nv))
    ears = []
    for side, tag in ((1, "L"), (-1, "R")):
        v = verts.copy()
        v[:, 0] *= side
        v += HEAD_C
        fs = faces if side == 1 else [f[::-1] for f in faces]
        ob = new_mesh_object(f"SrBigodes_Orelha.{tag}", v, fs, colls["EARS"])
        fix_normals(ob)
        ob.data.materials.append(mats["fur"])
        ob.data.materials.append(mats["ear_inner"])
        for fi in range(n_front):   # interior: so a face da frente, com moldura de pelo
            j, i = divmod(fi, nu - 1)
            if 1 <= i <= nu - 3 and 2 <= j <= nv - 4:
                ob.data.polygons[fi].material_index = 1
        vg = ob.vertex_groups.new(name=f"ear.{tag}")
        vg.add(list(range(len(v))), 1.0, "REPLACE")
        add_subsurf(ob, 2)
        ears.append(ob)
    base = (ear_surface(0.5, 0.0) + HEAD_C)
    tipw = (ear_surface(0.5, 0.998) + HEAD_C)
    return ears, base, tipw


# ----------------------------------------------------------------------- cauda
def build_tail(colls, mats):
    root = np.array(J["tail"])
    d = TAIL_DIR
    X = np.array([1.0, 0, 0])
    U = np.cross(d, X)
    total = TAIL_BONES * TAIL_SEG
    seg = 12
    stations = list(np.linspace(-0.05, 0.0, 2, endpoint=False)) + list(np.linspace(0, total, TAIL_BONES * 3 + 1))

    def radius(t):
        return 0.031 - 0.007 * max(t, 0) / total

    verts, wts = [], []
    r_end = radius(total)
    rings = [(t, radius(t)) for t in stations]
    for a in (25, 50, 72):    # ponta arredondada
        rings.append((total + r_end * math.sin(math.radians(a)), r_end * math.cos(math.radians(a))))
    for t, r in rings:
        c = root + d * t
        for i in range(seg):
            ang = 2 * math.pi * i / seg
            verts.append(c + r * (math.cos(ang) * X + math.sin(ang) * U))
            wts.append(t)
    verts.append(root + d * (total + r_end))
    wts.append(total)
    faces = []
    for j in range(len(rings) - 1):
        for i in range(seg):
            a = j * seg + i
            b = j * seg + (i + 1) % seg
            faces.append((a, b, b + seg, a + seg))
    last = len(verts) - 1
    base = (len(rings) - 1) * seg
    for i in range(seg):
        faces.append((base + i, base + (i + 1) % seg, last))
    ob = new_mesh_object("SrBigodes_Cauda", verts, faces, colls["TAIL"])
    fix_normals(ob)
    ob.data.materials.append(mats["fur"])
    groups = [ob.vertex_groups.new(name=f"tail_{i + 1:02d}") for i in range(TAIL_BONES)]
    for vi, t in enumerate(wts):
        u = t / TAIL_SEG - 0.5
        i0 = int(math.floor(u))
        f = u - i0
        for i, w in ((i0, 1 - f), (i0 + 1, f)):
            i = min(max(i, 0), TAIL_BONES - 1)
            groups[i].add([vi], w, "ADD")
    add_subsurf(ob, 1)
    return ob


# ----------------------------------------------------------------------- olhos
EYE_R = (0.067, 0.060, 0.096)   # raios do globo (largura, profundidade, altura)
EYE_PROTRUSION = 0.25           # fracao do raio de profundidade para fora do rosto


def eye_socket_matrix(field, side):
    s = field.raycast((side * 0.086, -0.9, HEAD_C[2] + 0.010), (0, 1, 0))
    n = field.normal(s)[0]
    yaw = 0.8 * math.atan2(n[0], -n[1])
    roll = side * math.radians(7)
    R = Matrix.Rotation(yaw, 4, "Z") @ Matrix.Rotation(roll, 4, "Y")
    fwd = R.to_3x3() @ Vector((0, -1, 0))
    c = Vector(s) - fwd * EYE_R[1] * (1.0 - EYE_PROTRUSION)
    return Matrix.Translation(c) @ R @ Matrix.Diagonal((*EYE_R, 1.0))


def _disc(cx, cz, a, b, R, rings=5, seg=48):
    """Disco eliptico assentado sobre a esfera de raio R (frente = -Y)."""
    verts = [(cx, cz)]
    for j in range(1, rings + 1):
        for i in range(seg):
            t = 2 * math.pi * i / seg
            verts.append((cx + a * j / rings * math.cos(t), cz + b * j / rings * math.sin(t)))
    out = [(x, -math.sqrt(max(R * R - x * x - z * z, 1e-6)), z) for x, z in verts]
    faces = [(0, 1 + i, 1 + (i + 1) % seg) for i in range(seg)]
    for j in range(rings - 1):
        for i in range(seg):
            p = 1 + j * seg + i
            q = 1 + j * seg + (i + 1) % seg
            faces.append((p, p + seg, q + seg, q))
    return out, faces


PUPIL = {"Basis": (0.215, 0.50), "Curioso": (0.30, 0.56), "Surpreso": (0.15, 0.30),
         "Bravo": (0.11, 0.52), "Triste": (0.25, 0.52), "Desconfiado": (0.13, 0.46)}


def build_eye(field, side, tag, colls, mats):
    mat = eye_socket_matrix(field, side)
    socket = bpy.data.objects.new(f"SrBigodes_Orbita.{tag}", None)
    socket.empty_display_type = "PLAIN_AXES"
    socket.empty_display_size = 0.4
    socket.matrix_world = mat
    colls["EYES"].objects.link(socket)

    sv, sf = uv_sphere(32, 16)
    pcx = -side * 0.07     # pupilas levemente convergentes
    pv, pf = _disc(pcx, 0.0, *PUPIL["Basis"], 1.006)
    h1, f1 = _disc(pcx - 0.20, 0.30, 0.105, 0.125, 1.014, rings=3, seg=28)
    h2, f2 = _disc(pcx + 0.17, -0.27, 0.045, 0.05, 1.014, rings=2, seg=20)
    verts = list(sv) + pv + h1 + h2
    o1, o2, o3 = len(sv), len(sv) + len(pv), len(sv) + len(pv) + len(h1)
    faces = list(sf) + [tuple(i + o1 for i in f) for f in pf] \
        + [tuple(i + o2 for i in f) for f in f1] + [tuple(i + o3 for i in f) for f in f2]
    ob = new_mesh_object(f"SrBigodes_Olho.{tag}", verts, faces, colls["EYES"])
    for m in ("iris", "pupil", "highlight"):
        ob.data.materials.append(mats[m])
    for fi, poly in enumerate(ob.data.polygons):
        poly.material_index = 0 if fi < len(sf) else 1 if fi < len(sf) + len(pf) else 2
    ob.parent = socket
    # shape keys da pupila
    ob.shape_key_add(name="Basis")
    for name, (a, b) in PUPIL.items():
        if name == "Basis":
            continue
        key = ob.shape_key_add(name=name)
        nv, _ = _disc(pcx, 0.0, a, b, 1.006)
        for i, co in enumerate(nv):
            key.data[o1 + i].co = co
    return socket, ob


# pálpebras: (borda superior, borda inferior) em graus; n = +1 no canto do nariz
LIDS = {
    "Basis": (lambda n: 64.0, lambda n: -60.0),
    "Piscar": (lambda n: -17.0, lambda n: -14.0),
    "Dormindo": (lambda n: -25.0 + 4 * n * n, lambda n: -22.0 + 4 * n * n),
    "Feliz": (lambda n: 12.0, lambda n: 15.0),
    "Bravo": (lambda n: 25.0 - 23.0 * n, lambda n: -38.0),
    "Triste": (lambda n: 26.0 + 17.0 * n, lambda n: -46.0),
    "Surpreso": (lambda n: 72.0, lambda n: -68.0),
    "Curioso": (lambda n: 68.0, lambda n: -60.0),
    "Desconfiado": (lambda n: 9.0 - 5.0 * n, lambda n: -30.0),
}


def lid_points(side, up, lo, ns=23, nv=6):
    """Duas cascas sobre o globo: a de cima por fora, a de baixo por dentro,
    para poderem se sobrepor quando o olho fecha."""
    ss = np.linspace(-0.985, 0.985, ns)
    out = []
    for hid, fn, R in ((104.0, up, 1.032), (-104.0, lo, 1.020)):
        for j in range(nv + 1):
            for s in ss:
                n = -s * side
                phi = math.radians(hid + (fn(n) - hid) * j / nv)
                c = math.sqrt(1 - s * s)
                out.append((s * R, -math.cos(phi) * c * R, math.sin(phi) * c * R))
    return out


def build_eyelids(socket, side, tag, colls, mats):
    ns, nv = 23, 6
    verts = lid_points(side, *LIDS["Basis"])
    faces = grid_faces(ns, nv + 1, 0) + grid_faces(ns, nv + 1, ns * (nv + 1))
    ob = new_mesh_object(f"SrBigodes_Palpebras.{tag}", verts, faces, colls["EYES"])
    fix_normals(ob)
    # a casca e convexa: garante normais para fora
    me = ob.data
    if sum(p.normal.dot(p.center) for p in me.polygons) < 0:
        me.flip_normals()
    me.materials.append(mats["fur"])
    ob.parent = socket
    ob.shape_key_add(name="Basis")
    for name, (up, lo) in LIDS.items():
        if name == "Basis":
            continue
        key = ob.shape_key_add(name=name)
        for i, co in enumerate(lid_points(side, up, lo)):
            key.data[i].co = co
    sol = ob.modifiers.new("Espessura", "SOLIDIFY")
    sol.thickness = 0.034
    sol.offset = 1.0
    return ob


# ----------------------------------------------------------------- sobrancelhas
BROWS = {  # (giro em graus: + = ponta interna desce, subida, saliencia)
    "Basis": (0.0, 0.006, 0.0015),
    "Bravo": (24.0, -0.022, 0.014),
    "Triste": (-20.0, 0.004, 0.010),
    "Surpreso": (-4.0, 0.022, 0.008),
    "Curioso": (-8.0, 0.016, 0.008),
    "Feliz": (-6.0, 0.008, 0.006),
    "Desconfiado": (10.0, -0.016, 0.012),
}


def build_brow(field, side, tag, colls, mats):
    s = field.raycast((side * 0.088, -0.9, HEAD_C[2] + 0.098), (0, 1, 0))
    n = field.normal(s)[0]
    t = np.cross((0, 0, 1), n)
    t /= np.linalg.norm(t)
    if t[0] * side < 0:      # t aponta para fora (da linha central para a lateral)
        t = -t
    u = np.cross(n, t)
    if u[2] < 0:
        u = -u
    sv, sf = uv_sphere(16, 10)

    def shape(rot, lift, bulge):
        a = math.radians(rot)
        base = []
        hgt = []
        for x, y, z in sv:
            px, pz = x * 0.050, z * 0.011
            qx = px * math.cos(a) - pz * math.sin(a)
            qz = px * math.sin(a) + pz * math.cos(a) + lift
            base.append(s + t * qx + u * qz)
            hgt.append(-y * 0.011 + bulge - 0.011)
        base = field.project(np.array(base), 3)
        nr = field.grad(base)
        nr /= np.linalg.norm(nr, axis=1)[:, None]
        return base + nr * np.array(hgt)[:, None]

    ob = new_mesh_object(f"SrBigodes_Sobrancelha.{tag}", shape(*BROWS["Basis"]), sf, colls["HEAD"])
    fix_normals(ob)
    ob.data.materials.append(mats["fur"])
    ob.shape_key_add(name="Basis")
    for name, prm in BROWS.items():
        if name == "Basis":
            continue
        key = ob.shape_key_add(name=name)
        for i, co in enumerate(shape(*prm)):
            key.data[i].co = co
    vg = ob.vertex_groups.new(name="head")
    vg.add(list(range(len(sv))), 1.0, "REPLACE")
    add_subsurf(ob, 1)
    return ob


# ---------------------------------------------------------------- nariz e boca
NOSE_Z = -0.032   # altura do nariz, local da cabeca


def surface_at(field, x, z):
    p = field.raycast((x, -0.9, HEAD_C[2] + z), (0, 1, 0))
    return p, field.normal(p)[0]


def build_nose(field, colls, mats):
    s, n = surface_at(field, 0.0, NOSE_Z)
    t = np.array([1.0, 0, 0])
    u = np.cross(n, t)
    if u[2] < 0:
        u = -u
    sv, sf = uv_sphere(20, 12)
    verts = []
    for x, y, z in sv:
        wf = 0.42 + 0.58 * (z + 1) / 2          # triangulo arredondado: largo em cima
        verts.append(s + t * (x * 0.0215 * wf) + u * (z * 0.0125) + n * (-y * 0.011 - 0.002))
    ob = new_mesh_object("SrBigodes_Nariz", verts, sf, colls["HEAD"])
    fix_normals(ob)
    ob.data.materials.append(mats["nose"])
    vg = ob.vertex_groups.new(name="head")
    vg.add(list(range(len(verts))), 1.0, "REPLACE")
    add_subsurf(ob, 1)
    return ob


MOUTH = {  # (x do canto, z do canto, mergulho do arco, abertura)
    "Basis": (0.034, -0.004, 0.011, 0.0),
    "Feliz": (0.040, 0.010, 0.016, 0.0),
    "Triste": (0.032, -0.016, 0.003, 0.0),
    "Bravo": (0.029, -0.011, 0.005, 0.0),
    "Surpreso": (0.0, 0.0, 0.0, 1.0),
    "Dormindo": (0.032, -0.002, 0.008, 0.0),
}


def mouth_geometry(field, cx, cz, dip, opened):
    """Linha da boca (filtro + dois arcos) e o interior, sobre o focinho."""
    z0 = NOSE_Z - 0.030          # fim do filtro
    strokes = []
    strokes.append([(0.0, NOSE_Z - 0.011 - (z0 - NOSE_Z + 0.011) * -i / 4) for i in range(5)])
    for sgn in (1, -1):
        pts = []
        for i in range(11):
            f = i / 10
            if opened > 0:       # os arcos viram o contorno oval da boca aberta
                x = 0.0145 * math.sin(math.pi * f)
                z = z0 - 0.017 * (1 - math.cos(math.pi * f))
            else:
                x = cx * f
                z = z0 + cz * f - dip * math.sin(math.pi * f) ** 0.9
            pts.append((sgn * x, z))
        strokes.append(pts)
    verts, faces = [], []
    ring = 6
    for pts in strokes:
        P, N = [], []
        for x, z in pts:
            p, n = surface_at(field, x, z)
            P.append(p + n * 0.0012)
            N.append(n)
        base = len(verts)
        for i, (p, n) in enumerate(zip(P, N)):
            tan = P[min(i + 1, len(P) - 1)] - P[max(i - 1, 0)]
            tan /= np.linalg.norm(tan)
            side = np.cross(n, tan)
            r = 0.0028 * (0.55 + 0.45 * math.sin(math.pi * i / (len(P) - 1)))
            for k in range(ring):
                a = 2 * math.pi * k / ring
                verts.append(p + r * (math.cos(a) * side + math.sin(a) * n))
        for i in range(len(P) - 1):
            for k in range(ring):
                a = base + i * ring + k
                b = base + i * ring + (k + 1) % ring
                faces.append((a, b, b + ring, a + ring))
    n_line = len(faces)
    # interior: disco que nasce colapsado no fim do filtro
    base = len(verts)
    rings, seg = 4, 16
    c0 = (0.0, z0 - 0.017 * opened)
    grid = [c0] + [(c0[0] + 0.0135 * opened * j / rings * math.cos(2 * math.pi * i / seg),
                    c0[1] + 0.0160 * opened * j / rings * math.sin(2 * math.pi * i / seg))
                   for j in range(1, rings + 1) for i in range(seg)]
    for x, z in grid:
        p, n = surface_at(field, x, z)
        verts.append(p + n * (0.0006 if opened else -0.004))
    faces += [(base, base + 1 + i, base + 1 + (i + 1) % seg) for i in range(seg)]
    for j in range(rings - 1):
        for i in range(seg):
            p = base + 1 + j * seg + i
            q = base + 1 + j * seg + (i + 1) % seg
            faces.append((p, p + seg, q + seg, q))
    return verts, faces, n_line


def build_mouth(field, colls, mats):
    verts, faces, n_line = mouth_geometry(field, *MOUTH["Basis"])
    ob = new_mesh_object("SrBigodes_Boca", verts, faces, colls["HEAD"])
    ob.data.materials.append(mats["mouth_line"])
    ob.data.materials.append(mats["mouth_inner"])
    for fi, poly in enumerate(ob.data.polygons):
        poly.material_index = 0 if fi < n_line else 1
    ob.shape_key_add(name="Basis")
    for name, prm in MOUTH.items():
        if name == "Basis":
            continue
        key = ob.shape_key_add(name=name)
        nv, _, _ = mouth_geometry(field, *prm)
        for i, co in enumerate(nv):
            key.data[i].co = co
    vg = ob.vertex_groups.new(name="head")
    vg.add(list(range(len(verts))), 1.0, "REPLACE")
    return ob


# --------------------------------------------------------------------- bigodes
def build_whiskers(field, colls, mats):
    objs = []
    spec = []
    for i, (dz, up, length) in enumerate(((0.012, 0.30, 0.20), (0.002, 0.10, 0.235),
                                          (-0.008, -0.08, 0.225), (-0.017, -0.26, 0.185))):
        spec.append(("Bigode", i + 1, 0.047 + 0.004 * i, NOSE_Z - 0.012 + dz, (1.0, -0.18, up), length, 0.035))
    for i, (x, up, length) in enumerate(((0.052, 1.0, 0.07), (0.070, 0.85, 0.08))):
        spec.append(("Bigode_Sobrancelha", i + 1, x, 0.108, (0.35 + 0.25 * i, -0.45, up), length, -0.02))
    for side, tag in ((1, "L"), (-1, "R")):
        for kind, i, x, z, d, length, droop in spec:
            p, n = surface_at(field, side * x, z)
            d = np.array([side * d[0], d[1], d[2]])
            d /= np.linalg.norm(d)
            cu = bpy.data.curves.new(f"{kind}_{tag}_{i:02d}", "CURVE")
            cu.dimensions = "3D"
            cu.bevel_depth = 0.0011
            cu.bevel_resolution = 2
            cu.use_fill_caps = True
            sp = cu.splines.new("NURBS")
            npts = 9
            sp.points.add(npts - 1)
            for k in range(npts):
                f = k / (npts - 1)
                q = p - n * 0.004 + d * length * f + np.array([0, 0.03 * f * f, -droop * f * f])
                sp.points[k].co = (*q, 1.0)
                sp.points[k].radius = 1.0 - 0.85 * f
            sp.use_endpoint_u = True
            sp.order_u = 4
            cu.materials.append(mats["whisker"])
            ob = bpy.data.objects.new(f"SrBigodes_{kind}.{tag}.{i:02d}", cu)
            colls["WHISKERS"].objects.link(ob)
            objs.append(ob)
    return objs


# ---------------------------------------------------------------------- coxins
def build_pads(colls, mats):
    sv, sf = uv_sphere(12, 8)
    out = []
    for name, bone, cx, cy in (("Dianteira", "front_paw", J["wrist"][0], -0.162),
                               ("Traseira", "hind_paw", J["hind_ball"][0], 0.150)):
        blobs = [((0.0, 0.006, 0.0), (0.021, 0.019, 0.0045))]
        blobs += [((dx, -0.034 + 0.006 * abs(dx) / 0.027, 0.0), (0.0085, 0.0115, 0.0042)) for dx in TOE_X]
        verts, faces = [], []
        for c, r in blobs:
            base = len(verts)
            for x, y, z in sv:
                # esfera com polos em Y; aqui o achatamento e em Z
                verts.append((cx + c[0] + x * r[0], cy + c[1] + y * r[1], 0.0045 + z * r[2]))
            faces += [tuple(i + base for i in f) for f in sf]
        for side, tag in ((1, "L"), (-1, "R")):
            v = np.array(verts)
            v[:, 0] *= side
            fs = faces if side == 1 else [f[::-1] for f in faces]
            ob = new_mesh_object(f"SrBigodes_Coxins_{name}.{tag}", v, fs, colls["BODY"])
            fix_normals(ob)
            ob.data.materials.append(mats["pad"])
            vg = ob.vertex_groups.new(name=f"{bone}.{tag}")
            vg.add(list(range(len(v))), 1.0, "REPLACE")
            out.append(ob)
    return out
