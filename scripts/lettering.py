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


def shape(text):
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hbfont, buf, {"kern": True, "liga": False})
    x, out = 0, []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        out.append((font.getGlyphName(info.codepoint), x + pos.x_offset))
        x += pos.x_advance + TRACK
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
for ch, (name, x) in zip("Umbelino", line2):
    if ch != "b":
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
pb = pathops.Path()
gs[b].draw(TransformPen(pb.getPen(), (1, 0, 0, -1, b_x + shift, B)))
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

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(
    "// Generated by scripts/lettering.py — do not edit by hand.\n"
    f"// Satoshi {AXES}, line {LINE}, tracking {TRACK}; y cut at {CUT} (stem {round(B_W, 1)}).\n"
    f"export const viewBox = {json.dumps(' '.join(str(v) for v in view))};\n"
    f"export const glyphs = {json.dumps(glyphs, indent=2)} as const;\n"
    f"/** The y→b ligature: one outline, the y's V running into the b's stem. */\n"
    f"export const ligature = {json.dumps(ligature)} as const;\n"
    f"/** Positions in % of the mark (x of width, y of height). */\n"
    f"export const anchors = {json.dumps(anchors)} as const;\n"
)
print("viewBox", view, "shift", round(shift, 1), "b stem", B_STEM, "cut", CUT, (round(CUT_L, 1), round(CUT_R, 1)), "anchors", anchors)
