"""Sr. Bigodes - poses e animacoes basicas.

As poses sao descritas em eixos do personagem (X = lateral, Y = frente/tras,
Z = cima) e convertidas para o espaco local de cada osso. As pernas usam IK:
a pose define onde cada pata pisa.
"""
import math

import bpy
from mathutils import Euler, Matrix, Vector

from sb_model import J, TAIL_BONES
from sb_rig import EXPRESSIONS

FK = ["hips", "spine", "chest", "neck", "head", "ear.L", "ear.R"] + \
     [f"tail_{i + 1:02d}" for i in range(TAIL_BONES)]
SHOULDERS = ["front_upper.L", "front_upper.R"]   # so deslocamento: a escapula desliza
CTRL = ["root", "CTRL_eyes"] + SHOULDERS + [f"CTRL_{n}.{t}" for t in "LR" for n in ("front_paw", "hind_paw", "hind_heel", "hind_knee")]


def mirror(p, side):
    return Vector((p[0] * side, p[1], p[2]))


class Poser:
    def __init__(self, rig):
        self.rig = rig
        self.pb = rig.pose.bones
        self.B = {b.name: b.matrix_local.to_3x3() for b in rig.data.bones}
        self.H = {b.name: b.head_local.copy() for b in rig.data.bones}
        self.parent = {b.name: (b.parent.name if b.parent else None) for b in rig.data.bones}
        for name in FK + CTRL:
            self.pb[name].rotation_mode = "QUATERNION"
        self.reset()

    # ---- estado
    def reset(self, new_action=False):
        if new_action or not hasattr(self, "prevq"):
            self.prevq = {}
        self.R = {}      # rotacao de cada osso, em eixos do personagem, relativa ao pai
        self.T = {}      # deslocamento, em eixos do personagem
        self.S = {}
        self.E = {name: 0.0 for name in EXPRESSIONS}

    def Q(self, name):
        """Rotacao acumulada do osso em relacao ao repouso."""
        if name is None:
            return Matrix.Identity(3)
        return self.Q(self.parent[name]) @ self.R.get(name, Matrix.Identity(3))

    def head(self, name):
        p = self.parent[name]
        if p is None:
            return self.H[name] + self.T.get(name, Vector())
        return self.head(p) + self.Q(p) @ (self.H[name] - self.H[p] + self.T.get(name, Vector()))

    def point(self, name, rest_point):
        """Onde vai parar um ponto preso ao osso."""
        return self.head(name) + self.Q(name) @ (Vector(rest_point) - self.H[name])

    # ---- comandos
    @staticmethod
    def _euler(x, y, z):
        return Euler((math.radians(x), math.radians(y), math.radians(z)), "XYZ").to_matrix()

    def rot(self, name, x=0.0, y=0.0, z=0.0):
        """Gira em relacao ao pai (graus)."""
        self.R[name] = self._euler(x, y, z)

    def rot_abs(self, name, x=0.0, y=0.0, z=0.0):
        """Orientacao absoluta em relacao ao repouso, independente dos pais."""
        self.R[name] = self.Q(self.parent[name]).inverted() @ self._euler(x, y, z)

    def move(self, name, dx=0.0, dy=0.0, dz=0.0):
        self.T[name] = Vector((dx, dy, dz))

    def place(self, name, pos):
        """Leva a origem de um controle (filho de root) para `pos`."""
        self.T[name] = Vector(pos) - self.H[name]

    def scale(self, name, s):
        """Escala do osso: numero, ou (largura, comprimento, altura) nos eixos locais."""
        self.S[name] = s

    def expr(self, **kw):
        self.E.update(kw)

    # ---- aplica no rig
    def apply(self):
        for t in "LR":   # sem ordem explicita, o alvo do joelho acompanha o quadril
            name = f"CTRL_hind_knee.{t}"
            if name not in self.T:
                self.place(name, self.point("hips", self.H[name]))
        for name in FK + CTRL:
            b = self.pb[name]
            Bm = self.B[name]
            R = self.R.get(name, Matrix.Identity(3))
            q = (Bm.inverted() @ R @ Bm).to_quaternion()
            if name in self.prevq and q.dot(self.prevq[name]) < 0:   # sem saltos entre quadros
                q.negate()
            self.prevq[name] = q.copy()
            b.rotation_quaternion = q
            b.location = Bm.inverted() @ self.T.get(name, Vector())
            s = self.S.get(name, 1.0)
            b.scale = (s, s, s) if isinstance(s, (int, float)) else s
        face = self.pb["CTRL_face"]
        for k, v in self.E.items():
            face[k] = float(v)

    def key(self, frame):
        self.apply()
        for name in FK + CTRL:
            b = self.pb[name]
            b.keyframe_insert("rotation_quaternion", frame=frame)
            b.keyframe_insert("location", frame=frame)
            b.keyframe_insert("scale", frame=frame)
        face = self.pb["CTRL_face"]
        for k in self.E:
            face.keyframe_insert(f'["{k}"]', frame=frame)


# ------------------------------------------------------------------ poses base
S2 = math.sin
PI2 = 2 * math.pi


def tail_ground(P, yaws, pitches=None, lift_tip=0.0):
    """Cauda deitada no chao: cada osso com orientacao absoluta."""
    for i, yaw in enumerate(yaws):
        up = lift_tip * max(0.0, (i - (TAIL_BONES - 4)) / 3.0)
        base = pitches[i] if pitches else -20.0
        P.rot_abs(f"tail_{i + 1:02d}", x=base + up, z=yaw)


def tail_chain(P, pitches, yaws=None):
    for i, pitch in enumerate(pitches):
        P.rot(f"tail_{i + 1:02d}", x=pitch, z=(yaws[i] if yaws else 0.0))


def paws(P, FL=(0, 0, 0), FR=(0, 0, 0), HL=(0, 0, 0), HR=(0, 0, 0), attached=False):
    """Cada pata: (para tras, para cima, inclinacao). `attached` = presa ao corpo (no ar)."""
    for key, (dy, dz, pitch) in (("FL", FL), ("FR", FR), ("HL", HL), ("HR", HR)):
        t = key[1]
        s = 1 if t == "L" else -1
        front = key[0] == "F"
        name = f"CTRL_{'front' if front else 'hind'}_paw.{t}"
        rest = mirror(J["wrist"] if front else J["hind_ball"], s) + Vector((0, dy, dz))
        P.place(name, P.point("chest" if front else "hips", rest) if attached else rest)
        P.rot(name, x=pitch)


def pose_stand(P, tail=(22, 14, 8, 2, -6, -12, -16, -16)):
    """Em pe, neutro."""
    tail_chain(P, tail)
    paws(P)


def pose_sit(P, head_yaw=0.0, head_pitch=0.0, head_roll=0.0, breath=0.0, tail_sway=0.0,
             hips=-74.0, spine=4.0, chest=6.0, fwd=0.04, sink=0.092, slide=0.065, belly=0.92):
    """Sentado: a pose das referencias."""
    P.rot("hips", x=hips)
    P.rot("spine", x=spine + 0.6 * breath)
    P.rot("chest", x=chest)
    rump = P.point("hips", (0, 0.17, 0.405))
    P.move("hips", 0, 0, sink - rump.z)
    # sentado, a barriga assenta e alarga: o tronco vira uma pera
    P.scale("hips", (1.14, 1.0, 1.10))
    P.scale("spine", (1.16, 1.0, belly + 0.02 * breath))
    P.scale("chest", (0.94 + 0.015 * breath, 1.0, 0.96 + 0.02 * breath))
    P.rot_abs("neck", x=-46.0 + 0.3 * head_pitch, z=0.35 * head_yaw)
    P.rot_abs("head", x=head_pitch, y=head_roll, z=head_yaw)
    for t, s in (("L", 1), ("R", -1)):
        # a escapula desliza para a frente do peito: as pernas descem livres da barriga
        P.move(f"front_upper.{t}", 0, 0, -slide)
        sh = P.head(f"front_upper.{t}")
        P.place(f"CTRL_front_paw.{t}", (s * 0.052, sh.y - fwd, J["wrist"][2]))
        hip = P.point("hips", mirror(J["hip"], s))
        P.place(f"CTRL_hind_paw.{t}", (s * 0.118, hip.y - 0.125, J["hind_ball"][2]))
        P.rot(f"CTRL_hind_paw.{t}", z=s * 12.0)
        P.rot(f"CTRL_hind_heel.{t}", x=-64.0)
        P.place(f"CTRL_hind_knee.{t}", (s * 0.17, hip.y - 0.42, 0.11))   # coxa deitada ao lado da barriga
    yaws = [-12, -38, -68, -98, -124, -146, -160, -168]
    tail_ground(P, [y + tail_sway * (i / 7.0) ** 2 for i, y in enumerate(yaws)],
                pitches=[-32, -24, -20, -20, -20, -20, -20, -20], lift_tip=34.0)


def pose_lie(P, breath=0.0, sleep=0.0, head_yaw=0.0, side=1.0):
    """Deitado de barriga (esfinge). sleep = 1 abaixa a cabeca e enrola o corpo
    para o lado `side` (+1 = esquerda do gato)."""
    P.rot("hips", x=-7.0 + 5.0 * sleep, z=-6.0 * sleep * side)
    P.rot("spine", z=10.0 * sleep * side, x=3.0)
    P.rot("chest", z=12.0 * sleep * side, x=4.0 + 0.6 * breath)
    belly = P.point("spine", (0, 0.04, 0.395))
    P.move("hips", 0, 0, 0.118 - belly.z)          # a barriga assenta no chao
    P.scale("hips", (1.16, 1.0, 1.04))
    P.scale("spine", (1.20, 1.0, 1.04 + 0.025 * breath))
    P.scale("chest", (1.08 + 0.02 * breath, 1.0, 1.0 + 0.025 * breath))
    P.rot_abs("neck", x=10.0 + 82.0 * sleep, z=0.4 * head_yaw + 16.0 * sleep * side)
    P.rot_abs("head", x=2.0 + 16.0 * sleep, y=-14.0 * sleep * side, z=head_yaw + 34.0 * sleep * side)
    for t, s in (("L", 1), ("R", -1)):
        sh = P.point("chest", mirror(J["shoulder"], s))
        P.place(f"CTRL_front_paw.{t}", (sh.x + s * 0.012, sh.y - 0.012, 0.046))
        P.rot(f"CTRL_front_paw.{t}", z=P_yaw(P, "chest"))
        hip = P.point("hips", mirror(J["hip"], s))
        P.place(f"CTRL_hind_paw.{t}", (hip.x + s * 0.05, hip.y - 0.105, J["hind_ball"][2]))
        P.rot(f"CTRL_hind_paw.{t}", z=s * 14.0)
        P.rot(f"CTRL_hind_heel.{t}", x=-64.0)
        P.place(f"CTRL_hind_knee.{t}", (hip.x + s * 0.11, hip.y - 0.40, 0.10))
    curl = 1.0 + 0.25 * sleep
    yaws = [-side * a * curl for a in (14, 40, 68, 92, 112, 128, 138, 144)]
    tail_ground(P, yaws, pitches=[-44, -38, -30, -22, -20, -20, -20, -20], lift_tip=6.0)
    P.rot("ear.L", x=10.0 * sleep, y=8.0 * sleep)
    P.rot("ear.R", x=10.0 * sleep, y=-8.0 * sleep)
    P.expr(Dormindo=sleep)


def P_yaw(P, name):
    """Guinada acumulada do osso, em graus."""
    v = P.Q(name) @ Vector((0, -1, 0))
    return math.degrees(math.atan2(v.x, -v.y))


def pose_walk(P, ph):
    """Caminhada (sequencia lateral), no lugar. ph em [0, 1)."""
    stride, lift, stance = 0.15, 0.045, 0.62

    def leg(offset):
        p = (ph + offset) % 1.0
        if p < stance:
            return (-stride / 2 + stride * p / stance, 0.0, 0.0)
        u = (p - stance) / (1 - stance)
        e = 0.5 - 0.5 * math.cos(math.pi * u)
        return (stride / 2 - stride * e, lift * S2(math.pi * u), 22.0 * S2(math.pi * u) * (1 - u))

    P.move("hips", 0, 0, -0.028 + 0.006 * math.cos(2 * PI2 * ph))
    P.rot("hips", z=-2.5 * S2(PI2 * ph), y=2.0 * S2(PI2 * ph))
    P.rot("spine", z=3.0 * S2(PI2 * ph), x=1.0)
    P.rot("chest", z=3.0 * S2(PI2 * ph), x=2.0)
    P.rot_abs("neck", x=26.0 + 1.5 * S2(2 * PI2 * ph))
    P.rot_abs("head", x=2.0 * S2(2 * PI2 * ph + 0.6), z=-1.5 * S2(PI2 * ph))
    paws(P, HL=leg(0.0), FL=leg(0.25), HR=leg(0.5), FR=leg(0.75))
    base = (30, 22, 14, 6, -8, -18, -22, -20)
    tail_chain(P, base, [7.0 * S2(PI2 * ph - 0.55 * i) for i in range(TAIL_BONES)])
    P.rot("ear.L", x=1.5 * S2(2 * PI2 * ph))
    P.rot("ear.R", x=1.5 * S2(2 * PI2 * ph))


def pose_run(P, ph):
    """Galope, no lugar: as traseiras empurram juntas, as dianteiras alcancam."""
    stride, lift, stance = 0.30, 0.09, 0.34

    def leg(offset, front):
        p = (ph + offset) % 1.0
        if p < stance:
            return (-stride / 2 + stride * p / stance, 0.0, 0.0)
        u = (p - stance) / (1 - stance)
        e = 0.5 - 0.5 * math.cos(math.pi * u)
        tuck = lift * S2(math.pi * u) * (1.0 if front else 1.25)
        return (stride / 2 - stride * e, tuck, (38.0 if front else 26.0) * S2(math.pi * u))

    w = PI2 * ph
    P.move("hips", 0, 0, -0.045 + 0.035 * S2(w + 2.2))
    P.rot("hips", x=7.0 * S2(w + 0.4))
    P.rot("spine", x=9.0 * S2(w + 3.3))
    P.rot("chest", x=7.0 * S2(w + 3.6))
    P.rot_abs("neck", x=30.0 + 4.0 * S2(w))
    P.rot_abs("head", x=3.0 * S2(w + 1.0))
    paws(P, FL=leg(0.00, True), FR=leg(0.10, True), HL=leg(0.52, False), HR=leg(0.62, False))
    tail_chain(P, (4, -2, -6, -4, 2, 6, 6, 4), None)
    P.rot("tail_01", x=4.0 + 9.0 * S2(w + 1.5))
    P.rot("tail_04", x=-4.0 + 8.0 * S2(w + 0.2))
    P.rot("ear.L", x=-22.0, y=6.0)
    P.rot("ear.R", x=-22.0, y=-6.0)


def pose_jump(P, k):
    """Salto em chaves: 0 parado, 1 agachado, 2 impulso, 3 subindo, 4 topo, 5 descendo, 6 pouso, 7 parado."""
    up = (22, 14, 8, 2, -6, -12, -16, -16)
    if k in (0, 7):
        pose_stand(P)
        return
    if k == 1:      # antecipacao: agacha, peso atras
        P.move("hips", 0, 0.03, -0.11)
        P.rot("hips", x=8.0)
        P.rot("spine", x=6.0)
        P.rot_abs("neck", x=16.0)
        P.rot_abs("head", x=-6.0)
        paws(P)
        tail_chain(P, (-6, -8, -6, 0, 6, 8, 6, 4))
        P.rot("ear.L", x=-14.0)
        P.rot("ear.R", x=-14.0)
        P.expr(Curioso=0.6)
    elif k == 2:    # impulso: traseiras estendem, dianteiras saem do chao
        P.move("hips", 0, -0.10, 0.02)
        P.rot("hips", x=-30.0)
        P.rot("spine", x=-6.0)
        P.rot("chest", x=-6.0)
        P.rot_abs("neck", x=-4.0)
        P.rot_abs("head", x=-8.0)
        paws(P, HL=(0.02, 0, 30), HR=(0.02, 0, 30))
        for t, s in (("L", 1), ("R", -1)):
            P.place(f"CTRL_front_paw.{t}", P.point("chest", mirror(J["wrist"], s) + Vector((0, -0.10, 0.10))))
            P.rot(f"CTRL_front_paw.{t}", x=-20.0)
        tail_chain(P, (-10, -8, -4, 0, 2, 4, 4, 2))
    elif k in (3, 4, 5):   # no ar
        y, z, pitch = {3: (-0.32, 0.26, -22.0), 4: (-0.55, 0.36, 0.0), 5: (-0.80, 0.24, 22.0)}[k]
        P.move("hips", 0, y, z)
        P.rot("hips", x=pitch)
        P.rot("spine", x=-4.0 if k == 3 else 6.0)
        P.rot("chest", x=-4.0 if k == 3 else 6.0)
        P.rot_abs("neck", x=10.0)
        P.rot_abs("head", x=0.0)
        f = {3: (-0.16, 0.12, -30.0), 4: (-0.14, 0.10, -10.0), 5: (-0.13, 0.02, -24.0)}[k]
        h = {3: (0.20, 0.06, 50.0), 4: (0.10, 0.12, 30.0), 5: (-0.02, 0.10, 10.0)}[k]
        paws(P, FL=f, FR=f, HL=h, HR=h, attached=True)
        tail_chain(P, {3: (-14, -8, -2, 2, 4, 4, 2, 0), 4: (6, 6, 6, 4, 2, 0, -2, -4),
                       5: (24, 16, 10, 4, 0, -4, -6, -6)}[k])
        P.rot("ear.L", x=-16.0)
        P.rot("ear.R", x=-16.0)
        P.expr(Surpreso=0.35 if k == 4 else 0.0)
    elif k == 6:    # pouso: dianteiras absorvem, corpo baixo
        P.move("hips", 0, -0.95, -0.085)
        P.rot("hips", x=9.0)
        P.rot("spine", x=4.0)
        P.rot_abs("neck", x=20.0)
        P.rot_abs("head", x=-4.0)
        for t, s in (("L", 1), ("R", -1)):
            P.place(f"CTRL_front_paw.{t}", mirror(J["wrist"], s) + Vector((0, -0.98, 0)))
            P.place(f"CTRL_hind_paw.{t}", mirror(J["hind_ball"], s) + Vector((0, -0.93, 0)))
        tail_chain(P, (26, 18, 10, 4, -2, -8, -10, -10))
    if k == 7:
        pass


def shift_all(P, dy):
    """Leva o gato inteiro para frente/tras (fim do salto)."""
    P.move("hips", 0, dy, 0)
    for t, s in (("L", 1), ("R", -1)):
        P.place(f"CTRL_front_paw.{t}", mirror(J["wrist"], s) + Vector((0, dy, 0)))
        P.place(f"CTRL_hind_paw.{t}", mirror(J["hind_ball"], s) + Vector((0, dy, 0)))


# --------------------------------------------------- pendurado, queda, escalada
GRIP = Vector((0.0, 0.16, 1.07))     # onde as patas seguram: o site ancora o gato por este ponto
LEDGE = Vector((0.0, 0.03, 0.93))    # borda sob o queixo, na pose de espiar


def _swing(point, deg):
    """Gira um ponto em torno do apoio (GRIP), no plano frontal: o pendulo."""
    return GRIP + Matrix.Rotation(math.radians(deg), 3, "Y") @ (Vector(point) - GRIP)


def pose_hang(P, sway=0.0, slip=0.0, one=0.0, reach=0.0, breath=0.0, climb=None, peek=False):
    """Pendurado pelas patas dianteiras: corpo na vertical, pernas soltas, cauda para baixo.

    sway  = angulo do pendulo (graus); slip = fase das patas escorregando (rad, 0 = firme);
    one   = 1 solta a pata direita (fica por uma pata); reach = quanto ela tenta voltar (0-1);
    climb = fase da escalada (0-1) ou None; peek = bracos dobrados, patas na borda sob o queixo.
    """
    lean = -13.0 * one                      # por uma pata, o corpo pende para o lado solto
    body = sway + lean
    hips0 = Vector(J["hips"]) + Vector((0, 0, -0.02 * abs(math.sin(slip)) if slip else 0))
    pull = 0.0
    if climb is not None:                   # cada puxada sobe o corpo um pouco
        pull = 0.035 * (0.5 - 0.5 * math.cos(2 * PI2 * climb))
        hips0 += Vector((0, 0, pull))
    P.rot("hips", x=-84.0, y=body)
    P.T["hips"] = _swing(hips0, body) - P.H["hips"]
    P.rot("spine", x=-2.0, y=0.25 * body)
    P.rot("chest", x=-2.0 + 0.5 * breath)
    P.scale("chest", (1.0 + 0.012 * breath, 1.0, 1.0 + 0.015 * breath))
    P.rot_abs("neck", x=-50.0 if not peek else -44.0, y=0.4 * body)
    P.rot_abs("head", x=-8.0 if not peek else 6.0, y=0.5 * body, z=-6.0 * one)
    for t, s in (("L", 1), ("R", -1)):
        ph = slip + (0 if s > 0 else math.pi)
        if peek:
            w = Vector((s * 0.185, LEDGE.y + 0.02, LEDGE.z - 0.01))
        else:
            w = Vector((s * 0.215, GRIP.y, GRIP.z - 0.02))
            if slip:                        # a pata escorrega e volta a procurar apoio
                w.z -= 0.04 * max(0.0, math.sin(ph))
            if climb is not None:           # mao sobre mao
                w.z += 0.06 * math.sin(PI2 * climb + (0 if s > 0 else math.pi))
        hook = -35.0
        if one and s < 0:                   # a pata direita soltou: balanca ao lado do corpo e tenta de novo
            low = _swing((-0.17, 0.10, 0.60), body * 1.3)
            w = low.lerp(Vector((-0.205, GRIP.y, GRIP.z - 0.10)), reach)
            hook = 20.0 - 50.0 * reach
        P.place(f"CTRL_front_paw.{t}", w)
        P.rot(f"CTRL_front_paw.{t}", x=hook)
        kick = 0.05 * math.sin(ph) if slip else 0.0
        if climb is not None:
            kick = 0.05 * math.sin(PI2 * climb + (math.pi if s > 0 else 0))
        foot = _swing((s * 0.085, 0.10 - kick, 0.075 + abs(kick) * 0.8), body * 1.5)
        P.place(f"CTRL_hind_paw.{t}", foot)
        P.rot(f"CTRL_hind_paw.{t}", x=48.0)
        P.rot(f"CTRL_hind_heel.{t}", x=22.0)
        P.place(f"CTRL_hind_knee.{t}", _swing((s * 0.12, -0.30, 0.34), body))
    whip = 22.0 * math.sin(slip * 2.0) if slip else 0.0
    for i, pitch in enumerate((-96, -102, -106, -108, -106, -100, -92, -84)):
        lag = i / 7.0
        P.rot_abs(f"tail_{i + 1:02d}", x=pitch, y=body * (1.0 + 1.2 * lag) + whip * lag)
    back = -18.0 * max(one, 1.0 if slip else 0.0)
    P.rot("ear.L", x=back)
    P.rot("ear.R", x=back)


POLE = Vector((0.0, -0.03, 0.92))    # a barra vertical (a do site) passa na frente da barriga, neste ponto


def _sway(point, deg):
    """Gira um ponto em torno do apoio na barra, no plano lateral (visto de perfil)."""
    return POLE + Matrix.Rotation(math.radians(deg), 3, "X") @ (Vector(point) - POLE)


def pose_cling(P, sway=0.0, slip=0.0, one=0.0, reach=0.0, breath=0.0, climb=None):
    """Agarrado a uma barra vertical, de perfil: barriga para a barra, patas dianteiras
    uma acima da outra, traseiras apoiadas mais embaixo, cauda pendurada, cabeca
    virada para quem olha.

    sway = inclinacao para longe da barra (graus); slip = fase das patas escorregando;
    one = 1 solta a pata de baixo e as traseiras (fica por uma pata); reach = quanto
    ela tenta voltar (0-1); climb = fase da escalada (0-1) ou None.
    """
    lean = sway + 16.0 * one
    hips0 = Vector(J["hips"]) + Vector((0.0, 0.0, 0.04))
    if slip:
        hips0.z -= 0.025 * abs(math.sin(slip))
    if climb is not None:
        hips0.z += 0.04 * (0.5 - 0.5 * math.cos(2 * PI2 * climb))
    P.rot("hips", x=-84.0 + lean)
    P.T["hips"] = _sway(hips0, lean) - P.H["hips"]
    P.rot("spine", x=-3.0)
    P.rot("chest", x=-4.0 + 0.5 * breath)
    P.scale("chest", (1.0 + 0.012 * breath, 1.0, 1.0 + 0.015 * breath))
    P.rot_abs("neck", x=-46.0 + 0.5 * lean, z=-16.0)
    P.rot_abs("head", x=-4.0 + 0.4 * lean, z=-46.0, y=4.0)
    for t, s in (("L", 1), ("R", -1)):
        ph = slip + (0 if s > 0 else math.pi)
        z = 0.98 if s > 0 else 0.87
        if climb is not None:
            z += 0.055 * math.sin(PI2 * climb + (0 if s > 0 else math.pi))
        if slip:
            z -= 0.045 * max(0.0, math.sin(ph))
        w = Vector((s * 0.03, POLE.y, z))
        hook = -62.0
        if one and s < 0:                     # a pata de baixo soltou e tenta voltar
            free = _sway((-0.07, 0.10, 0.66), lean * 1.2)
            w = free.lerp(Vector((-0.03, POLE.y, 0.86)), reach)
            hook = 10.0 - 72.0 * reach
        P.place(f"CTRL_front_paw.{t}", w)
        P.rot(f"CTRL_front_paw.{t}", x=hook)
        if one:                               # sem apoio: as traseiras ficam soltas
            kick = 0.03 * math.sin(ph * 2)
            foot = _sway((s * 0.08, 0.13 - kick, 0.08), lean * 1.4)
            P.place(f"CTRL_hind_paw.{t}", foot)
            P.rot(f"CTRL_hind_paw.{t}", x=48.0)
            P.rot(f"CTRL_hind_heel.{t}", x=22.0)
            P.place(f"CTRL_hind_knee.{t}", _sway((s * 0.12, -0.30, 0.34), lean))
            continue
        fz = 0.34 if s > 0 else 0.29
        if climb is not None:
            fz += 0.05 * math.sin(PI2 * climb + (math.pi if s > 0 else 0))
        if slip:
            fz -= 0.04 * max(0.0, math.sin(ph + 1.0))
        P.place(f"CTRL_hind_paw.{t}", Vector((s * 0.05, POLE.y + 0.015, fz)))
        P.rot(f"CTRL_hind_paw.{t}", x=-48.0)
        P.rot(f"CTRL_hind_heel.{t}", x=6.0)
        P.place(f"CTRL_hind_knee.{t}", Vector((s * 0.11, -0.42, 0.52)))
    whip = 20.0 * math.sin(slip * 2.0) if slip else 0.0
    for i, pitch in enumerate((-100, -104, -106, -106, -102, -96, -88, -80)):
        lag = i / 7.0
        P.rot_abs(f"tail_{i + 1:02d}", x=pitch + lean * (1.0 + 1.5 * lag), y=whip * lag + (8.0 * lag if one else 0.0))
    back = -18.0 * max(one, 1.0 if slip else 0.0)
    P.rot("ear.L", x=back)
    P.rot("ear.R", x=back)


def pose_fall(P, ph=0.0):
    """No ar, caindo: patas abertas procurando o chao, cauda para cima, orelhas para tras."""
    w = PI2 * ph
    P.move("hips", 0, 0, 0.0)
    P.rot("hips", x=-10.0 + 3.0 * S2(w), y=4.0 * S2(w + 1.0))
    P.rot("spine", x=-7.0)
    P.rot("chest", x=-7.0)
    P.rot_abs("neck", x=14.0)
    P.rot_abs("head", x=-6.0)
    f = 0.03 * S2(w)
    paws(P, FL=(-0.09 + f, 0.03, -24.0), FR=(-0.09 - f, 0.03, -24.0), HL=(0.08 - f, 0.03, 26.0), HR=(0.08 + f, 0.03, 26.0), attached=True)
    for t, s in (("L", 1), ("R", -1)):      # patas abertas para os lados
        for name, rest in ((f"CTRL_front_paw.{t}", J["wrist"]), (f"CTRL_hind_paw.{t}", J["hind_ball"])):
            P.T[name] = P.T[name] + Vector((s * 0.05, 0, 0))
    tail_chain(P, (38, 26, 16, 8, 4, 0, -4, -6), [6.0 * S2(w - 0.5 * i) for i in range(TAIL_BONES)])
    P.rot("ear.L", x=-24.0, y=8.0)
    P.rot("ear.R", x=-24.0, y=-8.0)
    P.expr(Surpreso=0.6)


def pose_land(P, k):
    """Pouso em chaves: 0 no ar, 1 impacto (agacha fundo), 2 rebote, 3 em pe."""
    if k == 0:
        pose_fall(P)
        return
    if k == 3:
        pose_stand(P)
        return
    low = -0.15 if k == 1 else -0.045
    P.move("hips", 0, 0.01, low)
    P.rot("hips", x=10.0 if k == 1 else 2.0)
    P.rot("spine", x=8.0 if k == 1 else 2.0)
    P.rot("chest", x=6.0 if k == 1 else 1.0)
    P.rot_abs("neck", x=30.0 if k == 1 else 14.0)
    P.rot_abs("head", x=-4.0)
    P.scale("spine", (1.08, 1.0, 0.94) if k == 1 else 1.0)
    paws(P)
    tail_chain(P, (30, 22, 12, 4, -4, -10, -12, -10) if k == 1 else (24, 16, 9, 3, -6, -12, -16, -16))
    P.rot("ear.L", x=-14.0 if k == 1 else 0.0)
    P.rot("ear.R", x=-14.0 if k == 1 else 0.0)


def pose_stretch(P, k):
    """Espreguicar: 0 em pe, 1 reverencia (frente baixa, garupa alta), 2 mais fundo, 3 dorso arqueado."""
    if k == 0:
        pose_stand(P)
        return
    if k in (1, 2):
        deep = 1.0 if k == 2 else 0.8
        P.move("hips", 0, 0.035 * deep, -0.02 * deep)
        P.rot("hips", x=17.0 * deep)
        P.rot("spine", x=7.0 * deep)
        P.rot("chest", x=8.0 * deep)
        P.rot_abs("neck", x=-8.0)
        P.rot_abs("head", x=-12.0)
        f = (-0.13 * deep, 0.0, -14.0 * deep)
        paws(P, FL=f, FR=f)
        tail_chain(P, (40, 26, 14, 4, -6, -14, -18, -18))
        P.expr(Feliz=0.7 * deep)
        return
    P.move("hips", 0, -0.02, 0.012)
    P.rot("hips", x=-4.0)
    P.rot("spine", x=-11.0)
    P.rot("chest", x=-9.0)
    P.rot_abs("neck", x=20.0)
    P.rot_abs("head", x=4.0)
    paws(P, HL=(0.07, 0, 0), HR=(0.07, 0, 0))
    tail_chain(P, (10, 4, 0, -4, -8, -10, -10, -8))


def report_reach(P, label=""):
    """Confere se o IK alcanca os alvos (distancia do alvo ao osso final)."""
    P.apply()
    bpy.context.view_layer.update()
    rig = P.rig
    out = []
    for t in "LR":
        a = rig.pose.bones[f"front_lower.{t}"].tail - rig.pose.bones[f"CTRL_front_paw.{t}"].head
        b = rig.pose.bones[f"hind_lower.{t}"].tail - rig.pose.bones[f"MCH_hock.{t}"].head
        out.append(f"F{t} {a.length * 1000:.1f}mm  H{t} {b.length * 1000:.1f}mm")
    print(f"[IK] {label}: " + " | ".join(out))


def new_action(rig, name, start=1, end=1, cyclic=False):
    act = bpy.data.actions.new(name)
    act.use_fake_user = True
    act.use_frame_range = True
    act.frame_start, act.frame_end = start, end
    act.use_cyclic = cyclic
    rig.animation_data_create()
    rig.animation_data.action = act
    return act


def build_actions(rig):
    P = Poser(rig)
    A = {}

    def cycle(name, length, fn, step=2):
        A[name] = new_action(rig, f"SB_{name}", 1, length + 1, True)
        P.reset(True)
        for f in range(0, length + 1, step):
            P.reset()
            fn(f / length, f)
            P.key(f + 1)

    # pose estatica em pe
    A["Em_Pe"] = new_action(rig, "SB_Em_Pe")
    P.reset(True); pose_stand(P); P.key(1)
    report_reach(P, "em pe")

    # sentado: respiracao, cauda, orelha e piscada
    def sit_idle(u, f):
        ear = max(0.0, 1 - abs(f - 60) / 4.0)
        pose_sit(P, breath=S2(PI2 * u * 2), tail_sway=14.0 * S2(PI2 * u), head_roll=1.5 * S2(PI2 * u))
        P.rot("ear.L", z=10.0 * ear, x=-4.0 * ear)
        P.expr(Piscar=max(0.0, 1 - abs(f - 30) / 3.0))
    cycle("Sentado_Idle", 96, sit_idle)
    P.reset(); pose_sit(P); report_reach(P, "sentado")

    # olhando para os lados
    def look(u, f):
        yaw = 42.0 * S2(PI2 * u)
        lead = 42.0 * S2(PI2 * u + 0.5)
        pose_sit(P, head_yaw=yaw, head_roll=-0.14 * yaw, head_pitch=-3.0 * abs(S2(PI2 * u)),
                 breath=S2(PI2 * u * 3), tail_sway=10.0 * S2(PI2 * u * 2))
        P.move("CTRL_eyes", 0.05 * (lead - yaw) / 20.0, 0, 0)
        P.expr(Curioso=0.7 * abs(S2(PI2 * u)), Piscar=max(0.0, 1 - abs(f - 60) / 3.0))
        P.rot("ear.L", z=5.0 * S2(PI2 * u))
        P.rot("ear.R", z=5.0 * S2(PI2 * u))
    cycle("Olhando_Lados", 120, look)

    cycle("Andando", 32, lambda u, f: pose_walk(P, u))
    P.reset(); pose_walk(P, 0.3); report_reach(P, "andando")
    cycle("Correndo", 14, lambda u, f: pose_run(P, u), step=1)
    P.reset(); pose_run(P, 0.3); report_reach(P, "correndo")

    # salto (avanca ~0.95 e termina em pe)
    A["Pulando"] = new_action(rig, "SB_Pulando", 1, 60)
    P.reset(True)
    for frame, k in ((1, 0), (12, 1), (17, 2), (22, 3), (28, 4), (34, 5), (39, 6), (52, 7), (60, 7)):
        P.reset()
        pose_jump(P, k)
        if k == 7:
            shift_all(P, -0.95)
            pose_stand_tail = (22, 14, 8, 2, -6, -12, -16, -16)
            tail_chain(P, pose_stand_tail)
        P.key(frame)

    cycle("Deitado", 96, lambda u, f: pose_lie(P, breath=S2(PI2 * u * 2), head_yaw=8.0 * S2(PI2 * u)))
    P.reset(); pose_lie(P); report_reach(P, "deitado")
    cycle("Dormindo", 120, lambda u, f: pose_lie(P, breath=S2(PI2 * u * 2), sleep=1.0, side=-1.0), step=4)

    # pendurado (firme), patas escorregando, por uma pata so, escalando, espiando por cima de uma borda
    cycle("Pendurado", 72, lambda u, f: pose_hang(P, sway=3.5 * S2(PI2 * u), breath=S2(PI2 * u * 2)))
    P.reset(); pose_hang(P); report_reach(P, "pendurado")
    cycle("Pendurado_Deslizando", 16, lambda u, f: pose_hang(P, sway=6.0 * S2(PI2 * u), slip=PI2 * u + 1e-3), step=1)
    cycle("Pendurado_UmaPata", 40, lambda u, f: pose_hang(P, sway=11.0 * S2(PI2 * u), one=1.0, reach=max(0.0, S2(PI2 * u * 2 - 0.6)) ** 2), step=2)
    P.reset(); pose_hang(P, one=1.0); report_reach(P, "uma pata")
    cycle("Escalando", 20, lambda u, f: pose_hang(P, sway=2.0 * S2(PI2 * u), climb=u), step=1)
    cycle("Espiando", 96, lambda u, f: pose_hang(P, sway=1.2 * S2(PI2 * u), breath=S2(PI2 * u * 2), peek=True))
    P.reset(); pose_hang(P, peek=True); report_reach(P, "espiando")

    # agarrado a uma barra vertical, de perfil (a barra de rolagem do site)
    cycle("Agarrado", 72, lambda u, f: pose_cling(P, sway=2.5 * S2(PI2 * u), breath=S2(PI2 * u * 2)))
    P.reset(); pose_cling(P); report_reach(P, "agarrado")
    cycle("Agarrado_Deslizando", 16, lambda u, f: pose_cling(P, sway=5.0 * S2(PI2 * u), slip=PI2 * u + 1e-3), step=1)
    cycle("Agarrado_UmaPata", 40, lambda u, f: pose_cling(P, sway=9.0 * S2(PI2 * u), one=1.0, reach=max(0.0, S2(PI2 * u * 2 - 0.6)) ** 2), step=2)
    P.reset(); pose_cling(P, one=1.0); report_reach(P, "agarrado, uma pata")
    cycle("Agarrado_Escalando", 20, lambda u, f: pose_cling(P, sway=1.5 * S2(PI2 * u), climb=u), step=1)

    # queda (ciclo), pouso, espreguicar, curioso
    cycle("Caindo", 12, lambda u, f: pose_fall(P, u), step=1)
    A["Pousando"] = new_action(rig, "SB_Pousando", 1, 24)
    P.reset(True)
    for frame, k in ((1, 0), (5, 1), (12, 2), (24, 3)):
        P.reset(); pose_land(P, k); P.key(frame)
    A["Espreguicando"] = new_action(rig, "SB_Espreguicando", 1, 52)
    P.reset(True)
    for frame, k in ((1, 0), (12, 1), (24, 2), (30, 2), (42, 3), (52, 0)):
        P.reset(); pose_stretch(P, k); P.key(frame)

    def curious(u, f):
        tilt = 16.0 * S2(PI2 * u)
        pose_sit(P, head_roll=tilt, head_yaw=-9.0 * S2(PI2 * u + 0.8), head_pitch=-4.0, breath=S2(PI2 * u * 3))
        P.rot("ear.L", x=5.0, z=4.0 * S2(PI2 * u * 2))
        P.rot("ear.R", x=5.0, z=-4.0 * S2(PI2 * u * 2))
        P.expr(Curioso=0.9)
    cycle("Curioso", 96, curious)

    P.reset(); pose_sit(P)
    sit_head = P.point("head", (0.0, -0.315, 0.600))
    return P, A, sit_head
