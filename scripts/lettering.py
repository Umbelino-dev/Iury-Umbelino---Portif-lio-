"""
Letters the name "Iury / Umbelino" as SVG paths with the y→b ligature.

Concept: the "y" of Iury and the "b" of Umbelino share one stem (y = why,
b = build: "Curiosity builds"). Satoshi's y is a V whose right stroke runs on
into a hooked tail. Here the V is kept and cut where its cross-section is
exactly as wide as the b's stem (found by bisection on the outline, just under
the baseline); from that cut a vertical stem of the same width runs straight
down onto the b's stem axis. y-top ∪ stem ∪ b is one outline (boolean union),
so there is no seam, step or double edge, and the y still reads as a y: a Y-like
fork whose foot is the b. At the bottom, the m's last leg turns along the baseline
like a u and rises into that stem (Satoshi's own u, cut in two; see "u-turn").

The license (ITF Free Font License) allows wordmarks made with the font; the
font file itself is never modified or committed: this script reads it in place
at a variation location (no instancing) and writes only vector artwork.

Dev-only. Needs Python with fonttools, uharfbuzz and skia-pathops, and the font:
    python -m venv .venv && .venv/bin/pip install fonttools uharfbuzz skia-pathops
    node scripts/fonts.mjs --lettering     # fetches assets/fonts/Satoshi-Variable.ttf
    .venv/bin/python scripts/lettering.py
Writes src/components/hero/name-paths.ts (paths in SVG coordinates, no clipping:
the viewBox includes every ascender, overshoot and descender).
"""
import json
import os
from pathlib import Path

import pathops
import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/fonts/Satoshi-Variable.ttf"
OUT = ROOT / "src/components/hero/name-paths.ts"
AXES = {"wght": float(os.environ.get("WGHT", 900))}  # Black: a poster-weight mark
LINE = 880  # baseline-to-baseline in font units (tight, editorial)
TRACK = int(os.environ.get("TRACK", -14))  # extra tracking per glyph, font units
OVERLAP = 24  # how far the stem reaches into the b before the union (no seam)
PAD = 24  # breathing room inside the viewBox

font = TTFont(SRC)
gs = font.getGlyphSet(location=AXES)
cmap = font.getBestCmap()
hbfont = hb.Font(hb.Face(hb.Blob.from_file_path(str(SRC))))
hbfont.set_variations(AXES)


def shape(text, track=TRACK, kern=None):
    """Glyph names and pen x positions. `kern` = (index, units): extra space before that glyph."""
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hbfont, buf, {"kern": True, "liga": False})
    x, out = 0, []
    for i, (info, pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
        if kern and i == kern[0]:
            x += kern[1]
        out.append((font.getGlyphName(info.codepoint), x + pos.x_offset))
        x += pos.x_advance + track
    return out


def bounds(name):
    bp = BoundsPen(gs)
    gs[name].draw(bp)
    return bp.bounds


def span_at(name, yy, near_x):
    """Ink span [x0, x1] of the glyph on the horizontal line y = yy, around near_x.

    Intersects the outline (all contours, merged by pathops) with a hairline strip
    and returns the piece that contains near_x (or the nearest one)."""
    g = pathops.Path()
    gs[name].draw(g.getPen())
    strip = pathops.Path()
    pen = strip.getPen()
    pen.moveTo((-4000, yy - 0.01)); pen.lineTo((4000, yy - 0.01)); pen.lineTo((4000, yy + 0.01)); pen.lineTo((-4000, yy + 0.01)); pen.closePath()
    cut = pathops.op(g, strip, pathops.PathOp.INTERSECTION)
    pieces = sorted((c.bounds[0], c.bounds[2]) for c in cut.contours)
    merged = []
    for x0, x1 in pieces:
        if merged and x0 <= merged[-1][1] + 0.05:
            merged[-1] = (merged[-1][0], max(merged[-1][1], x1))
        else:
            merged.append((x0, x1))
    return min(merged, key=lambda s: 0 if s[0] <= near_x <= s[1] else min(abs(s[0] - near_x), abs(s[1] - near_x)))


line1 = shape("Iury")
line2 = shape("Umbelino")
y = cmap[ord("y")]
b = cmap[ord("b")]
_, y_x = line1[3]
_, b_x = line2[2]

# The b's stem: its left edge and the straight right edge above the bowl.
B_STEM = span_at(b, 640, 120)
B_W = B_STEM[1] - B_STEM[0]
b_top = bounds(b)[3]

# Where the y's V is exactly as wide as the b stem: bisection on the cut height.
lo, hi = -80.0, 120.0  # narrower than the stem at lo, wider at hi
VX = 260  # roughly the V's foot (x), font units
for _ in range(60):
    mid = (lo + hi) / 2
    l, r = span_at(y, mid, VX)
    if r - l > B_W:
        hi = mid  # still wider than the stem: cut lower (the V narrows downward)
    else:
        lo = mid
CUT = round((lo + hi) / 2, 2)
CUT_L, CUT_R = span_at(y, CUT, VX)
assert abs((CUT_R - CUT_L) - B_W) < 0.5, (CUT_L, CUT_R, B_W)
Y_AXIS = (CUT_L + CUT_R) / 2

# Line 2 shifts so the b stem sits on the y's axis.
shift = (y_x + Y_AXIS) - (b_x + (B_STEM[0] + B_STEM[1]) / 2)

# The u-turn (Iury, 2026-11-13, after his reference): the m's last leg does not
# stop at the baseline; it turns along the bottom like a "u" and rises into the
# shared stem. The connector is Satoshi's own u, cut in two at its centre: the
# left half sits on the m's leg, the right half on the b's stem (the u's stems are
# exactly as wide as both). For the bowl not to look pinched, the gap between the
# m's leg and the stem is opened to TURN_GAP (default: the m's own counters).
m = cmap[ord("m")]
u = cmap[ord("u")]
M_LEG = span_at(m, 250, bounds(m)[2] - 40)  # the m's right leg
U_L = span_at(u, 250, bounds(u)[0] + 40)  # the u's left stem
U_R = span_at(u, 250, bounds(u)[2] - 40)  # the u's right stem
M_COUNTER = M_LEG[0] - span_at(m, 250, (bounds(m)[0] + bounds(m)[2]) / 2)[1]
TURN_GAP = float(os.environ.get("TURN_GAP", M_COUNTER))
assert abs((M_LEG[1] - M_LEG[0]) - B_W) < 1 and abs((U_L[1] - U_L[0]) - B_W) < 1, (M_LEG, U_L, B_W)

# Flush left: the stem alignment (and the opened m→b gap) push "Umbelino" left of
# "Iury" (D units). Close it in the spacing, split between the lines so neither
# looks re-tracked on its own: line 1 opens (3 gaps before the y), line 2 tightens
# (2 gaps before the b). Each unit of line-1 tracking moves the U right by 3, each
# unit removed from line 2 by 2. The kern and the tracking depend on each other,
# so they are solved together (a few fixed-point rounds).
SPLIT = float(os.environ.get("ALIGN_SPLIT", 1.0))  # share of D taken by line 1 (1.0: all of it, as in Iury's reference)
left = lambda line, dx=0: line[0][1] + dx + bounds(line[0][0])[0]
TRACK1 = TRACK2 = TRACK
K = 0.0
for _ in range(40):
    line1 = shape("Iury", TRACK1)
    line2 = shape("Umbelino", TRACK2, (2, K))
    _, y_x = line1[3]
    _, m_x = line2[1]
    _, b_x = line2[2]
    gap = (b_x + B_STEM[0]) - (m_x + M_LEG[1])
    K += TURN_GAP - gap
    line2 = shape("Umbelino", TRACK2, (2, K))
    _, b_x = line2[2]
    shift = (y_x + Y_AXIS) - (b_x + (B_STEM[0] + B_STEM[1]) / 2)
    D = left(line1) - left(line2, shift)
    TRACK1 += SPLIT * D / 3
    TRACK2 -= (1 - SPLIT) * D / 2
line1 = shape("Iury", TRACK1)
line2 = shape("Umbelino", TRACK2, (2, K))
_, y_x = line1[3]
_, m_x = line2[1]
_, b_x = line2[2]
shift = (y_x + Y_AXIS) - (b_x + (B_STEM[0] + B_STEM[1]) / 2)
assert abs(left(line1) - left(line2, shift)) < 0.5, (left(line1), left(line2, shift))
assert abs((b_x + B_STEM[0]) - (m_x + M_LEG[1]) - TURN_GAP) < 0.5

asc = max(bounds(cmap[ord(c)])[3] for c in "Iury")
A = asc + PAD  # line 1 baseline (SVG y)
B = A + LINE  # line 2 baseline


def to_svg(p):
    pen = SVGPathPen(None)
    p.draw(pen)
    return pen.getCommands()


def path(name, dx, base):
    """The glyph as SVG path data, its contours merged into one clean outline.

    Variable fonts keep overlapping contours (a stroke over a bowl); rendered as
    raw SVG they can leave hairline slivers, so every glyph goes through a union."""
    p = pathops.Path()
    gs[name].draw(TransformPen(p.getPen(), (1, 0, 0, -1, dx, base)))
    return to_svg(pathops.simplify(p))


glyphs = []
for ch, (name, x) in zip("Iury", line1):
    if ch != "y":
        glyphs.append({"id": f"l1-{ch}", "line": 1, "d": path(name, x, A)})
TURN_H = 260  # font units: below this, the m's leg and the b's stem become the u-turn
TURN_OVER = 24  # the u reaches this far up into the leg / stem (no seam)


def rect(x0, x1, y0, y1, T):
    """A rectangle given in font units, through the transform T."""
    r = pathops.Path()
    pen = TransformPen(r.getPen(), T)
    pen.moveTo((x0, y0)); pen.lineTo((x1, y0)); pen.lineTo((x1, y1)); pen.lineTo((x0, y1)); pen.closePath()
    return r


U_MID = (U_L[1] + U_R[0]) / 2  # centre of the u's counter
# Bottom of the u's counter (the inner edge of its bowl), on the counter's centre line.
_g = pathops.Path()
gs[u].draw(_g.getPen())
_col = pathops.Path()
_cp = _col.getPen()
_cp.moveTo((U_MID - 0.01, -500)); _cp.lineTo((U_MID + 0.01, -500)); _cp.lineTo((U_MID + 0.01, 1500)); _cp.lineTo((U_MID - 0.01, 1500)); _cp.closePath()
U_INNER = min(c.bounds[3] for c in pathops.op(_g, _col, pathops.PathOp.INTERSECTION).contours)


def u_half(side, dx):
    """One half of the u, cut at its counter's centre (with an overlap), placed at dx.

    The right half also loses the notch Satoshi's u has where its bowl meets the
    right stem: the area under the bowl, from the centre to the stem, is filled up
    to the counter's bottom, so the bowl runs into the stem without a step."""
    Tu = (1, 0, 0, -1, dx, B)
    pu = pathops.Path()
    gs[u].draw(TransformPen(pu.getPen(), Tu))
    x0, x1 = (-500, U_MID + 40) if side == "left" else (U_MID - 40, 1500)
    half = pathops.op(pu, rect(x0, x1, -200, TURN_H + TURN_OVER, Tu), pathops.PathOp.INTERSECTION)
    if side == "right":
        half = pathops.op(half, rect(U_MID, U_R[0] + 60, 0, U_INNER - 1, Tu), pathops.PathOp.UNION)
    return half


for ch, (name, x) in zip("Umbelino", line2):
    if ch == "m":
        # The m keeps the u's left half: its last leg turns along the bottom.
        Tm = (1, 0, 0, -1, x + shift, B)
        pm = pathops.Path()
        gs[name].draw(TransformPen(pm.getPen(), Tm))
        pm = pathops.op(pm, rect(M_LEG[0] - 1, M_LEG[1] + 1, -200, TURN_H, Tm), pathops.PathOp.DIFFERENCE)
        pm = pathops.op(pm, u_half("left", x + shift + M_LEG[0] - U_L[0]), pathops.PathOp.UNION)
        glyphs.append({"id": "l2-m", "line": 2, "d": to_svg(pathops.simplify(pm))})
    elif ch != "b":
        glyphs.append({"id": f"l2-{ch}", "line": 2, "d": path(name, x + shift, B)})

# The ligature: (y above the cut) ∪ stem ∪ b, as one outline.
T = (1, 0, 0, -1, y_x, A)
py = pathops.Path()
gs[y].draw(TransformPen(py.getPen(), T))
keep = pathops.Path()
kp = TransformPen(keep.getPen(), T)
kp.moveTo((-2000, CUT)); kp.lineTo((2000, CUT)); kp.lineTo((2000, 2000)); kp.lineTo((-2000, 2000)); kp.closePath()
ytop = pathops.op(py, keep, pathops.PathOp.INTERSECTION)
depth = -(LINE - b_top) - OVERLAP  # font units below line 1's baseline
stem = pathops.Path()
sp = TransformPen(stem.getPen(), T)
sp.moveTo((CUT_L, depth)); sp.lineTo((CUT_R, depth)); sp.lineTo((CUT_R, CUT + 2)); sp.lineTo((CUT_L, CUT + 2)); sp.closePath()
Tb = (1, 0, 0, -1, b_x + shift, B)
pb = pathops.Path()
gs[b].draw(TransformPen(pb.getPen(), Tb))
# The b loses the foot of its stem (only the stem: cutting into the bowl leaves a
# sliver); the u's right half takes its place.
pb = pathops.op(pb, rect(B_STEM[0] - 1, B_STEM[1], -200, TURN_H, Tb), pathops.PathOp.DIFFERENCE)
turn = u_half("right", b_x + shift + B_STEM[0] - U_R[0])
yb = pathops.op(pathops.op(pathops.op(ytop, stem, pathops.PathOp.UNION), pb, pathops.PathOp.UNION), turn, pathops.PathOp.UNION)
ligature = {"id": "yb", "d": to_svg(yb)}

xs = []
for name, x in line1:
    xmin, _, xmax, _ = bounds(name)
    xs += [x + xmin, x + xmax]
for name, x in line2:
    xmin, _, xmax, _ = bounds(name)
    xs += [x + shift + xmin, x + shift + xmax]
desc = min(bounds(cmap[ord(c)])[1] for c in "Umbelino")  # overshoot below line 2
minx, maxx = min(xs) - PAD, max(xs) + PAD
view = [round(minx, 2), 0, round(maxx - minx, 2), round(B - desc + PAD, 2)]
W, H = view[2], view[3]
pct_x = lambda v: round((v - minx) / W * 100, 2)
pct_y = lambda v: round(v / H * 100, 2)
n_name, n_x = line2[6]
o_name, o_x = line2[7]
o_b, n_b = bounds(o_name), bounds(n_name)
# Where things sit, in % of the mark, so the page never guesses coordinates.
anchors = {
    "line1Right": pct_x(y_x + bounds(y)[2]),  # right edge of "Iury"
    "xHeight1": pct_y(A - bounds(y)[3]),  # top of "ury" on line 1
    "oCenter": pct_x(o_x + shift + (o_b[0] + o_b[2]) / 2),
    "oRight": pct_x(o_x + shift + o_b[2]),
    "oTop": pct_y(B - o_b[3]),
    "nCenter": pct_x(n_x + shift + (n_b[0] + n_b[2]) / 2),
    "stem": [pct_x(y_x + CUT_L), pct_x(y_x + CUT_R)],
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(
    "// Generated by scripts/lettering.py — do not edit by hand.\n"
    f"// Satoshi {AXES}, line {LINE}, tracking {round(TRACK1, 1)} / {round(TRACK2, 1)} (flush left); m→b +{round(K, 1)} (u-turn gap {round(TURN_GAP, 1)}); y cut at {CUT} (stem {round(B_W, 1)}).\n"
    f"export const viewBox = {json.dumps(' '.join(str(v) for v in view))};\n"
    f"export const glyphs = {json.dumps(glyphs, indent=2)} as const;\n"
    f"/** The y→b ligature: one outline, the y's V running into the b's stem, and the m's last leg turning into it along the bottom (a u). */\n"
    f"export const ligature = {json.dumps(ligature)} as const;\n"
    f"/** Positions in % of the mark (x of width, y of height). */\n"
    f"export const anchors = {json.dumps(anchors)} as const;\n"
)
print("viewBox", view, "shift", round(shift, 1), "b stem", B_STEM, "cut", CUT, (round(CUT_L, 1), round(CUT_R, 1)), "anchors", anchors)
