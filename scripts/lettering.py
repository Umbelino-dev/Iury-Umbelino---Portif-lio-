"""
Letters the name "Iury / Umbelino" as SVG paths with the y→b ligature.

Concept: the "y" of Iury and the "b" of Umbelino share one stem (y = why,
b = build: "Curiosity builds"). Satoshi's y is a V whose right stroke runs on
into a hooked tail. Here the V is kept and cut where its cross-section is
exactly as wide as the b's stem (found by bisection on the outline, just under
the baseline); from that cut a vertical stem of the same width runs straight
down onto the b's stem axis. y-top ∪ stem ∪ b is one outline (boolean union),
so there is no seam, step or double edge, and the y still reads as a y: a Y-like
fork whose foot is the b.

At the bottom (Iury's reference, 2026-11-13) the m's last leg does not stop at the
baseline: it turns in a half ring (the leg's own width all the way round) and rises
into that same stem, leaving a narrow slit with a round bottom between them. The
spacing is the font's: the slit is the gap the m and the b already have. Below the
ring's centre the shared stem is the ring's own right side, rounded outward, and
the b's bowl does not touch it: its lower curve stops short, leaving an open slit
(SLIT) that follows the ring.
The I is raised to the ascender height (the l, the b and the i's dot).

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


def shape(text, track=TRACK):
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hbfont, buf, {"kern": True, "liga": False})
    x, out = 0, []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
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

# Flush left: the stem alignment pushes "Umbelino" left of "Iury" (D units).
# Close the gap in the spacing, split between the lines so neither looks
# re-tracked on its own: line 1 opens (3 gaps before the y), line 2 tightens
# (2 gaps before the b). Each unit of line-1 tracking moves the U right by 3,
# each unit removed from line 2 by 2.
SPLIT = float(os.environ.get("ALIGN_SPLIT", 0.6))  # share of D taken by line 1
left = lambda line, dx=0: line[0][1] + dx + bounds(line[0][0])[0]
D = left(line1) - left(line2, shift)
TRACK1 = TRACK + SPLIT * D / 3
TRACK2 = TRACK - (1 - SPLIT) * D / 2
line1 = shape("Iury", TRACK1)
line2 = shape("Umbelino", TRACK2)
_, y_x = line1[3]
_, b_x = line2[2]
shift = (y_x + Y_AXIS) - (b_x + (B_STEM[0] + B_STEM[1]) / 2)
assert abs(left(line1) - left(line2, shift)) < 0.5, (left(line1), left(line2, shift))

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


def rect(x0, x1, y0, y1, T):
    """A rectangle given in font units, through the transform T."""
    r = pathops.Path()
    pen = TransformPen(r.getPen(), T)
    pen.moveTo((x0, y0)); pen.lineTo((x1, y0)); pen.lineTo((x1, y1)); pen.lineTo((x0, y1)); pen.closePath()
    return r


def half_ring(cx, cy, r_in, r_out, T, steps=96):
    """The lower half of a ring (font units, y up), through T."""
    import math

    pts = [(cx + r_out * math.cos(math.pi + math.pi * i / steps), cy + r_out * math.sin(math.pi + math.pi * i / steps)) for i in range(steps + 1)]
    pts += [(cx + r_in * math.cos(-math.pi * i / steps), cy + r_in * math.sin(-math.pi * i / steps)) for i in range(steps + 1)]
    r = pathops.Path()
    pen = TransformPen(r.getPen(), T)
    pen.moveTo(pts[0])
    for pt in pts[1:]:
        pen.lineTo(pt)
    pen.closePath()
    return r


ASC = bounds(cmap[ord("l")])[3]  # ascender: the l, the b, the i's dot
m = cmap[ord("m")]
M_LEG = span_at(m, 250, bounds(m)[2] - 40)  # the m's right leg
assert abs((M_LEG[1] - M_LEG[0]) - B_W) < 1, (M_LEG, B_W)
OVERSHOOT = -bounds(cmap[ord("u")])[1]  # round bottoms dip this far under the baseline

glyphs = []
for ch, (name, x) in zip("Iury", line1):
    if ch == "I":
        # Satoshi's I is a plain bar, 14 units under the ascender: raise its top.
        x0, _, x1, top = bounds(name)
        T1 = (1, 0, 0, -1, x, A)
        bar = pathops.Path()
        gs[name].draw(TransformPen(bar.getPen(), T1))
        bar = pathops.op(bar, rect(x0, x1, top - 2, ASC, T1), pathops.PathOp.UNION)
        glyphs.append({"id": "l1-I", "line": 1, "d": to_svg(pathops.simplify(bar))})
    elif ch != "y":
        glyphs.append({"id": f"l1-{ch}", "line": 1, "d": path(name, x, A)})
# The turn, in line-2 coordinates: the slit is the gap the font already leaves
# between the m's leg and the b's stem; the ring's centre line runs through the
# middle of both, so its width is the stem's all the way round.
_, m_x = line2[1]
LEG_L = m_x + shift + M_LEG[0]
STEM_L = b_x + shift + B_STEM[0]
GAP = STEM_L - (LEG_L + B_W)
R_IN = GAP / 2
R_OUT = R_IN + B_W
TURN_CX = LEG_L + B_W + R_IN
TURN_CY = R_OUT - OVERSHOOT  # the ring's bottom dips like any round letter
assert GAP > 20, GAP

for ch, (name, x) in zip("Umbelino", line2):
    if ch == "m":
        Tm = (1, 0, 0, -1, 0, B)  # line-2 x already applied below
        pm = pathops.Path()
        gs[name].draw(TransformPen(pm.getPen(), (1, 0, 0, -1, x + shift, B)))
        # The leg stops where the ring starts; the ring (and 1 unit of overlap) takes over.
        pm = pathops.op(pm, rect(LEG_L - 1, LEG_L + B_W + 1, -200, TURN_CY, Tm), pathops.PathOp.DIFFERENCE)
        ring = half_ring(TURN_CX, TURN_CY + 1, R_IN, R_OUT, Tm)
        ring = pathops.op(ring, rect(LEG_L, LEG_L + B_W, TURN_CY - 1, TURN_CY + 2, Tm), pathops.PathOp.UNION)
        # Its right end reaches a little up under the stem (drawn later, on top), so
        # the two paths overlap instead of meeting on a hairline.
        ring = pathops.op(ring, rect(STEM_L, STEM_L + B_W, TURN_CY - 1, TURN_CY + 3, Tm), pathops.PathOp.UNION)
        pm = pathops.op(pm, ring, pathops.PathOp.UNION)
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
# The b's foot (Iury's reference): below the ring's centre the stem is the ring's
# right side, rounded outward; the bowl does not touch it. The bowl's lower curve
# runs on round the stem and stops short of it, leaving an open slit of SLIT units
# that follows the ring's outer edge (its end is cut parallel to it).
SLIT = 22  # font units, about a seventh of the stem
L2 = (1, 0, 0, -1, 0, B)  # line-2 coordinates, font units, y up
pb = pathops.Path()
gs[b].draw(TransformPen(pb.getPen(), (1, 0, 0, -1, b_x + shift, B)))
pb = pathops.op(pb, rect(STEM_L - 1, STEM_L + B_W, -200, TURN_CY, L2), pathops.PathOp.DIFFERENCE)
# The bowl's outer edge, taken as a circle: its top and bottom on a vertical line
# through the counter, its right side at the glyph's right edge.
_bb = bounds(b)
_cx_b = b_x + shift + (B_STEM[1] + _bb[2]) / 2
_g = pathops.Path()
gs[b].draw(TransformPen(_g.getPen(), (1, 0, 0, 1, b_x + shift, 0)))
_ys = [c.bounds for c in pathops.op(_g, rect(_cx_b - 0.5, _cx_b + 0.5, -500, 1500, (1, 0, 0, 1, 0, 0)), pathops.PathOp.INTERSECTION).contours]
BOWL_BOTTOM = min(c[1] for c in _ys)
BOWL_TOP = max(c[3] for c in _ys if c[1] < 600)
BOWL_R = (BOWL_TOP - BOWL_BOTTOM) / 2
BOWL_CX = b_x + shift + _bb[2] - BOWL_R
BOWL_CY = (BOWL_TOP + BOWL_BOTTOM) / 2


def disk(cx, cy, r, T, steps=180):
    import math

    d = pathops.Path()
    pen = TransformPen(d.getPen(), T)
    pen.moveTo((cx + r, cy))
    for i in range(1, steps):
        a = 2 * math.pi * i / steps
        pen.lineTo((cx + r * math.cos(a), cy + r * math.sin(a)))
    pen.closePath()
    return d


def ellipse(cx, cy, rx, ry, T, steps=240):
    import math

    d = pathops.Path()
    pen = TransformPen(d.getPen(), T)
    pen.moveTo((cx + rx, cy))
    for i in range(1, steps):
        a = 2 * math.pi * i / steps
        pen.lineTo((cx + rx * math.cos(a), cy + ry * math.sin(a)))
    pen.closePath()
    return d


def bowl_bottom_at(xx):
    """Lowest ink of the b (line-2 x, font units) on a vertical line."""
    cs = pathops.op(_g, rect(xx - 0.5, xx + 0.5, -500, 300, (1, 0, 0, 1, 0, 0)), pathops.PathOp.INTERSECTION).contours
    return min(c.bounds[1] for c in cs)


# Satoshi's bowl is flatter than a circle (a superellipse): fit its exponent so the
# carried-on curve meets the real bottom, without a step, where it hands over.
_right = b_x + shift + _bb[2]
_hand = STEM_L + B_W + 90
_target = bowl_bottom_at(_hand)
_ax = _right - BOWL_CX  # horizontal semi-axis (centre fixed, right edge on the glyph's)
lo, hi = 1.2, 6.0
for _ in range(60):
    n = (lo + hi) / 2
    yb_ = BOWL_CY - BOWL_R * (1 - abs((_hand - BOWL_CX) / _ax) ** n) ** (1 / n)
    if yb_ > _target:
        lo = n  # still above the real bottom: flatter
    else:
        hi = n
BOWL_N = (lo + hi) / 2


def superellipse(cx, cy, ax, ay, n, T, steps=360):
    import math

    d = pathops.Path()
    pen = TransformPen(d.getPen(), T)
    for i in range(steps):
        t = 2 * math.pi * i / steps
        c, s_ = math.cos(t), math.sin(t)
        pt = (cx + ax * math.copysign(abs(c) ** (2 / n), c), cy + ay * math.copysign(abs(s_) ** (2 / n), s_))
        (pen.moveTo if i == 0 else pen.lineTo)(pt)
    pen.closePath()
    return d


# The bowl's lower curve carried on under the old stem (left of the counter, below
# the ring's centre), then cut back to leave the slit round the ring.
# It also covers Satoshi's own notch at the b's foot (just right of the stem), and
# never the counter.
tail = pathops.op(superellipse(BOWL_CX, BOWL_CY, _ax, BOWL_R, BOWL_N, L2), rect(TURN_CX, _hand, -200, TURN_CY, L2), pathops.PathOp.INTERSECTION)
_bg = pathops.Path()
gs[b].draw(TransformPen(_bg.getPen(), (1, 0, 0, 1, b_x + shift, 0)))
_counter_pt = (BOWL_CX, BOWL_CY)
COUNTER = min((c for c in pathops.simplify(_bg).contours if c.contains(_counter_pt)), key=lambda c: abs(c.area))
counter = pathops.Path()
COUNTER.draw(TransformPen(counter.getPen(), (1, 0, 0, -1, 0, B)))
tail = pathops.op(tail, counter, pathops.PathOp.DIFFERENCE)
pb = pathops.op(pb, tail, pathops.PathOp.UNION)
pb = pathops.op(pb, pathops.op(disk(TURN_CX, TURN_CY, R_OUT + SLIT, L2), rect(-9000, 9000, -500, TURN_CY, L2), pathops.PathOp.INTERSECTION), pathops.PathOp.DIFFERENCE)
# Above the ring's centre the slit runs straight up beside the stem until it opens
# into the counter, so the bowl hangs from the stem's top only.
pb = pathops.op(pb, rect(STEM_L + B_W, STEM_L + B_W + SLIT, TURN_CY - 1, BOWL_CY, L2), pathops.PathOp.DIFFERENCE)
yb = pathops.op(pathops.op(ytop, stem, pathops.PathOp.UNION), pb, pathops.PathOp.UNION)
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

# Invisible, selectable text over the mark (the h1's real text): where each line's
# box sits when set in the same face at line-height 1. The baseline then lies
# `asc + (1000 - asc - desc) / 2` units under the box top (hhea metrics).
hhea = font["hhea"]
UPM = font["head"].unitsPerEm
BASE_IN_BOX = hhea.ascent + (UPM - hhea.ascent + hhea.descent) / 2
text_layer = {
    "fontSize": round(UPM / W * 100, 4),  # % of the mark's width (cqw)
    "lines": [
        {"text": "Iury", "left": pct_x(line1[0][1]), "top": pct_y(A - BASE_IN_BOX), "tracking": round(TRACK1 / UPM, 4)},
        {"text": "Umbelino", "left": pct_x(line2[0][1] + shift), "top": pct_y(B - BASE_IN_BOX), "tracking": round(TRACK2 / UPM, 4)},
    ],
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(
    "// Generated by scripts/lettering.py — do not edit by hand.\n"
    f"// Satoshi {AXES}, line {LINE}, tracking {round(TRACK1, 1)} / {round(TRACK2, 1)} (flush left); y cut at {CUT} (stem {round(B_W, 1)}).\n"
    f"export const viewBox = {json.dumps(' '.join(str(v) for v in view))};\n"
    f"export const glyphs = {json.dumps(glyphs, indent=2)} as const;\n"
    f"/** The y→b ligature: one outline, the y's V running into the b's stem (the m's half ring turns into it at the base). */\n"
    f"export const ligature = {json.dumps(ligature)} as const;\n"
    f"/** Positions in % of the mark (x of width, y of height). */\n"
    f"export const anchors = {json.dumps(anchors)} as const;\n"
    f"/** The selectable text layer: font size in % of the mark's width, each line's box (line-height 1) in %. */\n"
    f"export const textLayer = {json.dumps(text_layer)} as const;\n"
)

print("viewBox", view, "shift", round(shift, 1), "b stem", B_STEM, "cut", CUT, (round(CUT_L, 1), round(CUT_R, 1)), "anchors", anchors)
