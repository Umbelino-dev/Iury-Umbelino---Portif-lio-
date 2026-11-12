"""Sr. Bigodes - campo de distancia (SDF) e extracao de malha.

A pele do personagem (cabeca, pescoco, tronco, pernas e patas) e descrita
como uma uniao suave de volumes simples. A malha sai de um "surface nets"
(so quads) e cada vertice e projetado de volta na superficie exata, entao as
transicoes entre as partes sao continuas, sem emendas.

So depende de numpy (que ja vem com o Blender).
"""
import numpy as np


# ----------------------------------------------------------------- operadores
def smin(a, b, k):
    """Uniao suave (polinomial). k = largura da transicao."""
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return b * (1.0 - h) + a * h - k * h * (1.0 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


def sd_ellipsoid(p, c, r):
    q = p - np.asarray(c, float)
    r = np.asarray(r, float)
    k0 = np.linalg.norm(q / r, axis=-1)
    k1 = np.linalg.norm(q / (r * r), axis=-1)
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)


def sd_roundcone(p, a, b, r1, r2):
    a = np.asarray(a, float)
    b = np.asarray(b, float)
    ba = b - a
    pa = p - a
    t = np.clip((pa @ ba) / (ba @ ba), 0.0, 1.0)
    d = np.linalg.norm(pa - t[:, None] * ba, axis=-1)
    return d - (r1 + (r2 - r1) * t)


# -------------------------------------------------------------------- modelo
class Prim:
    """Um volume: elipsoide ('ell') ou capsula conica ('cone')."""

    def __init__(self, name, kind, bone, k, **kw):
        self.name, self.kind, self.bone, self.k = name, kind, bone, k
        self.kw = kw

    def dist(self, p):
        if self.kind == "ell":
            return sd_ellipsoid(p, self.kw["c"], self.kw["r"])
        return sd_roundcone(p, self.kw["a"], self.kw["b"], self.kw["r1"], self.kw["r2"])

    def mirrored(self):
        def mx(v):
            return (-v[0], v[1], v[2])
        kw = dict(self.kw)
        for key in ("c", "a", "b"):
            if key in kw:
                kw[key] = mx(kw[key])
        name = self.name.replace(".L", ".R")
        bone = self.bone.replace(".L", ".R")
        return Prim(name, self.kind, bone, self.k, **kw)


class SkinField:
    """Grupos de volumes unidos suavemente.

    groups: lista de (nome, [Prim...]); os grupos sao unidos entre si com
    `group_k[nome]`. O chao corta o campo em z = ground (patas com base plana).
    """

    def __init__(self, groups, group_k, ground=0.0, ground_k=0.006):
        self.groups = groups
        self.group_k = group_k
        self.ground = ground
        self.ground_k = ground_k

    def prims(self):
        for _, plist in self.groups:
            for pr in plist:
                yield pr

    def __call__(self, p):
        p = np.asarray(p, float)
        total = None
        for gname, plist in self.groups:
            g = None
            for pr in plist:
                d = pr.dist(p)
                g = d if g is None else smin(g, d, pr.k)
            total = g if total is None else smin(total, g, self.group_k[gname])
        return smax(total, self.ground - p[:, 2], self.ground_k)

    def grad(self, p, eps=2e-4):
        g = np.empty_like(p)
        for ax in range(3):
            d = np.zeros(3)
            d[ax] = eps
            g[:, ax] = (self(p + d) - self(p - d)) / (2 * eps)
        return g

    def project(self, p, iters=3):
        """Leva os pontos para a isosuperficie f = 0 (passos de Newton)."""
        p = np.array(p, float)
        for _ in range(iters):
            f = self(p)
            g = self.grad(p)
            g2 = np.maximum((g * g).sum(1), 1e-12)
            p -= (f / g2)[:, None] * g
        return p

    def raycast(self, origin, direction, tmax=1.0, steps=400):
        """Primeiro ponto da superficie ao longo de um raio (marcha + bissecao)."""
        o = np.asarray(origin, float)
        d = np.asarray(direction, float)
        d = d / np.linalg.norm(d)
        ts = np.linspace(0.0, tmax, steps)
        f = self(o[None, :] + ts[:, None] * d[None, :])
        idx = np.nonzero(f < 0)[0]
        if len(idx) == 0 or idx[0] == 0:
            return None
        lo, hi = ts[idx[0] - 1], ts[idx[0]]
        for _ in range(40):
            mid = 0.5 * (lo + hi)
            if self((o + mid * d)[None, :])[0] < 0:
                hi = mid
            else:
                lo = mid
        return o + 0.5 * (lo + hi) * d

    def normal(self, p):
        g = self.grad(np.atleast_2d(np.asarray(p, float)))
        return g / np.linalg.norm(g, axis=1)[:, None]


# -------------------------------------------------------------- surface nets
def surface_nets(field, bounds, h):
    """Extrai uma malha de quads. A grade e simetrica em X e tem uma fileira de
    celulas centrada em x = 0, entao a malha ganha um loop central."""
    (x0, x1), (y0, y1), (z0, z1) = bounds
    n = int(np.ceil(max(abs(x0), abs(x1)) / h))
    xs = (np.arange(-n, n) + 0.5) * h
    ys = np.arange(y0, y1 + h, h)
    zs = np.arange(z0, z1 + h, h)
    nx, ny, nz = len(xs), len(ys), len(zs)
    F = np.empty((nx, ny, nz))
    Y, Z = np.meshgrid(ys, zs, indexing="ij")
    yz = np.stack([Y.ravel(), Z.ravel()], 1)
    for i, x in enumerate(xs[: nx // 2]):  # metade; o resto e espelho
        pts = np.column_stack([np.full(len(yz), x), yz])
        F[i] = field(pts).reshape(ny, nz)
        F[nx - 1 - i] = F[i]

    coords = (xs, ys, zs)
    cshape = (nx - 1, ny - 1, nz - 1)
    ncell = cshape[0] * cshape[1] * cshape[2]
    acc = np.zeros((ncell, 3))
    cnt = np.zeros(ncell)

    def cell_id(i, j, k):
        return (i * cshape[1] + j) * cshape[2] + k

    quads = []
    for ax in range(3):
        sl_a = [slice(None)] * 3
        sl_b = [slice(None)] * 3
        sl_a[ax] = slice(0, -1)
        sl_b[ax] = slice(1, None)
        A, B = F[tuple(sl_a)], F[tuple(sl_b)]
        cross = (A < 0) != (B < 0)
        idx = np.nonzero(cross)
        a, b = A[idx], B[idx]
        t = a / (a - b)
        pos = np.empty((len(t), 3))
        for c in range(3):
            pos[:, c] = coords[c][idx[c]]
        pos[:, ax] += t * (coords[ax][idx[ax] + 1] - coords[ax][idx[ax]])
        o1, o2 = [c for c in range(3) if c != ax]
        ring = []
        for d1, d2 in ((1, 1), (0, 1), (0, 0), (1, 0)):
            ci = [idx[0].copy(), idx[1].copy(), idx[2].copy()]
            ci[o1] -= d1
            ci[o2] -= d2
            ok = (ci[o1] >= 0) & (ci[o1] < cshape[o1]) & (ci[o2] >= 0) & (ci[o2] < cshape[o2])
            cid = cell_id(ci[0], ci[1], ci[2])
            for c in range(3):
                acc[:, c] += np.bincount(cid[ok], weights=pos[ok, c], minlength=ncell)
            cnt += np.bincount(cid[ok], minlength=ncell)
            ring.append((cid, ok))
        allok = ring[0][1] & ring[1][1] & ring[2][1] & ring[3][1]
        q = np.stack([r[0][allok] for r in ring], 1)
        quads.append(q)

    active = np.nonzero(cnt > 0)[0]
    remap = np.full(ncell, -1, dtype=np.int64)
    remap[active] = np.arange(len(active))
    verts = acc[active] / cnt[active][:, None]
    quads = remap[np.concatenate(quads)]
    quads = quads[(quads >= 0).all(1)]

    # orientacao: normal da face = gradiente do campo
    v = verts[quads]
    fn = np.cross(v[:, 2] - v[:, 0], v[:, 3] - v[:, 1])
    g = field.grad(v.mean(1))
    flip = (fn * g).sum(1) < 0
    quads[flip] = quads[flip][:, ::-1]
    return verts, quads


def relax(field, verts, quads, iters=6, lam=0.5):
    """Suaviza a distribuicao dos vertices e reprojeta na superficie."""
    n = len(verts)
    e = np.concatenate([quads[:, [0, 1]], quads[:, [1, 2]], quads[:, [2, 3]], quads[:, [3, 0]]])
    e = np.concatenate([e, e[:, ::-1]])
    deg = np.bincount(e[:, 0], minlength=n).astype(float)
    v = field.project(verts, 3)
    for _ in range(iters):
        s = np.zeros_like(v)
        for c in range(3):
            s[:, c] = np.bincount(e[:, 0], weights=v[e[:, 1], c], minlength=n)
        avg = s / np.maximum(deg, 1)[:, None]
        v = field.project(v + lam * (avg - v), 2)
    v[np.abs(v[:, 0]) < 1e-4, 0] = 0.0
    return v, e


def skin_weights(field, verts, edges, bone_names, sigma, smooth_iters=3):
    """Pesos de skinning a partir dos proprios volumes: cada vertice pesa pelos
    volumes que formam a superficie naquele ponto."""
    n = len(verts)
    bi = {b: i for i, b in enumerate(bone_names)}
    W = np.zeros((n, len(bone_names)))
    for pr in field.prims():
        d = np.maximum(pr.dist(verts), 0.0)
        s = sigma.get(pr.bone, sigma["_default"])
        w = np.exp(-((d / s) ** 2))
        if pr.bone.endswith(".L"):
            w *= np.clip((verts[:, 0] + 0.015) / 0.03, 0, 1)
        elif pr.bone.endswith(".R"):
            w *= np.clip((-verts[:, 0] + 0.015) / 0.03, 0, 1)
        j = bi[pr.bone]
        W[:, j] = np.maximum(W[:, j], w)
    W /= np.maximum(W.sum(1), 1e-9)[:, None]
    deg = np.bincount(edges[:, 0], minlength=n).astype(float)
    for _ in range(smooth_iters):
        S = np.zeros_like(W)
        for j in range(W.shape[1]):
            S[:, j] = np.bincount(edges[:, 0], weights=W[edges[:, 1], j], minlength=n)
        W = 0.5 * W + 0.5 * S / np.maximum(deg, 1)[:, None]
    W[W < 0.02] = 0.0
    W /= np.maximum(W.sum(1), 1e-9)[:, None]
    return W
