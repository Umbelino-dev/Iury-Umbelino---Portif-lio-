"""
Letters the name "Iury / Umbelino" as SVG paths with the y→b ligature.

Concept: the "y" of Iury and the "b" of Umbelino share one stem. Bricolage's y
is a u-shape whose right stem drops and hooks left. Here the y keeps the font's
terminals and left arm, the arm curves down into the right stem (no u-bowl), and
the stem runs straight down on the same axis and at the same width as the b's
stem (145 font units). The two outlines are merged into a single path (boolean
union), so there is no seam, overlap or step. The question
("why") flows into "build". Curiosity builds.

Dev-only and reproducible. Needs Python with fonttools, brotli, uharfbuzz and
skia-pathops:
    python -m venv .venv && .venv/bin/pip install fonttools brotli uharfbuzz skia-pathops
    .venv/bin/python scripts/lettering.py
Writes src/components/hero/name-paths.ts (paths in SVG coordinates, no clipping:
the viewBox includes every ascender, overshoot and the descender).
"""
import json
from pathlib import Path

import pathops
import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/fonts/BricolageGrotesque-Standard.woff2"
OUT = ROOT / "src/components/hero/name-paths.ts"
AXES = {"wght": 720, "wdth": 88, "opsz": 96}  # bold, slightly condensed, display optical size
LINE = 880  # baseline-to-baseline in font units (tight, editorial)
TRACK = -12  # extra tracking per glyph, font units
OVERLAP = 24  # how far the y stem reaches into the b stem before the union (no seam)
PAD = 24  # breathing room inside the viewBox
ARM_OUTER = -40  # where the y's curved arm meets the stem, outer edge (font units)
ARM_INNER = 120  # ... and inner edge (the bottom of the counter)

font = TTFont(SRC)
inst = instantiateVariableFont(font, AXES)
inst.flavor = None  # the source is woff2: save a plain TTF so HarfBuzz can read it
tmp = ROOT / ".lettering-instance.ttf"
inst.save(tmp)
inst = TTFont(tmp)
gs = inst.getGlyphSet()
cmap = inst.getBestCmap()
blob = hb.Blob.from_file_path(str(tmp))
hbfont = hb.Font(hb.Face(blob))


def shape(text):
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hbfont, buf, {"kern": True, "liga": False})
    x, out = 0, []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = inst.getGlyphName(info.codepoint)
        out.append((name, x + pos.x_offset))
        x += pos.x_advance + TRACK
    return out


def bounds(name):
    bp = BoundsPen(gs)
    gs[name].draw(bp)
    return bp.bounds


def points(name):
    rp = RecordingPen()
    gs[name].draw(rp)
    return [p for _, args in rp.value for p in args]


def stem_x(name, y_lo, y_hi, right):
    """Left/right edge of a vertical stem: points inside a y band, on one side of the glyph."""
    xmin, _, xmax, _ = bounds(name)
    mid = (xmin + xmax) / 2
    xs = [px for px, py in points(name) if y_lo <= py <= y_hi and ((px > mid) if right else (px < mid))]
    return min(xs), max(xs)


line1 = shape("Iury")
line2 = shape("Umbelino")
y = cmap[ord("y")]
b = cmap[ord("b")]
_, y_x = line1[3]
_, b_x = line2[2]

# The y's right stem and the b's stem (font units, measured on the outlines).
# Both are straight vertical runs in the outlines: y from (294|438, 527) down,
# b from (30|175, 688) down. Asserted so a font update cannot silently break them.
Y_STEM = (294, 438)
B_STEM = (30, 175)
_yp, _bp = {(round(px), round(py)) for px, py in points(y)}, {(round(px), round(py)) for px, py in points(b)}
assert {(294, 527), (438, 527), (438, 158)} <= _yp, "y stem moved"
assert {(30, 688), (175, 688), (30, 0)} <= _bp, "b stem moved"
b_top = bounds(b)[3]
# Put the two stems on one axis: centre the b stem under the y stem.
shift = (y_x + (Y_STEM[0] + Y_STEM[1]) / 2) - (b_x + (B_STEM[0] + B_STEM[1]) / 2)

# Font units → SVG: y down. Line 1 baseline at A, line 2 at A + LINE.
asc = max(bounds(cmap[ord(c)])[3] for c in "Iury")
A = asc + PAD
B = A + LINE


def path(name, dx, base):
    pen = SVGPathPen(gs)
    gs[name].draw(TransformPen(pen, (1, 0, 0, -1, dx, base)))
    return pen.getCommands()


def draw_y(pen, depth):
    """A y drawn for the ligature: the font's left arm and top terminals, a
    straight right stem that runs down to `depth` (into the b), and no u-bowl.

    Bricolage's own y is a u with a hooked tail; with the hook straightened it
    read as a u. Here the left arm leaves its vertical and curves down and to the
    right into the stem (outer edge meeting it below the baseline, inner edge
    meeting it at 120), so the counter closes in a V-shaped crotch and the letter
    reads as a y: curved arm, straight stem.
    """
    # The stem at the b stem's exact width (145), centred on the y's own stem (144).
    half = (B_STEM[1] - B_STEM[0]) / 2
    mid = (Y_STEM[0] + Y_STEM[1]) / 2
    left, right = mid - half, mid + half
    arm_l, arm_r = 26, 170  # the font's left arm (x), straight down to 330
    pen.moveTo((right, depth))
    pen.lineTo((left, depth))
    pen.lineTo((left, ARM_OUTER))  # outer edge of the arm joins the stem here
    pen.qCurveTo((150, 10), (arm_l, 140), (arm_l, 330))
    pen.lineTo((arm_l, 527))
    pen.lineTo((arm_r, 527))
    pen.lineTo((arm_r, 330))
    pen.qCurveTo((172, 220), (left, ARM_INNER))  # inner edge: the V of the counter
    pen.lineTo((left, 527))
    pen.lineTo((right, 527))
    pen.closePath()


def to_svg(p):
    pen = SVGPathPen(None)
    p.draw(pen)
    return pen.getCommands()


glyphs = []
for ch, (name, x) in zip("Iury", line1):
    if ch == "y":
        continue
    glyphs.append({"id": f"l1-{ch}", "line": 1, "d": path(name, x, A)})
for ch, (name, x) in zip("Umbelino", line2):
    if ch == "b":
        continue
    glyphs.append({"id": f"l2-{ch}", "line": 2, "d": path(name, x + shift, B)})

# The ligature: y (stem reaching into the b) ∪ b, as one outline.
depth = -(LINE - b_top) - OVERLAP  # font units below line 1's baseline
py, pb = pathops.Path(), pathops.Path()
draw_y(TransformPen(py.getPen(), (1, 0, 0, -1, y_x, A)), depth)
gs[b].draw(TransformPen(pb.getPen(), (1, 0, 0, -1, b_x + shift, B)))
yb = pathops.op(py, pb, pathops.PathOp.UNION)
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
o_name, o_x = line2[7]
o_b = bounds(o_name)
# Where things sit, in % of the mark, so the page never guesses coordinates.
anchors = {
    "line1Right": pct_x(y_x + bounds(y)[2]),  # right edge of "Iury"
    "xHeight1": pct_y(A - bounds(y)[3]),  # top of "ury" on line 1
    "oCenter": pct_x(o_x + shift + (o_b[0] + o_b[2]) / 2),
    "oTop": pct_y(B - o_b[3]),
    "stem": [pct_x(y_x + Y_STEM[0]), pct_x(y_x + Y_STEM[1])],
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(
    "// Generated by scripts/lettering.py — do not edit by hand.\n"
    f"// Bricolage Grotesque {AXES}, line {LINE}, tracking {TRACK}.\n"
    f"export const viewBox = {json.dumps(' '.join(str(v) for v in view))};\n"
    f"export const glyphs = {json.dumps(glyphs, indent=2)} as const;\n"
    f"/** The y→b ligature: one outline, the y's stem continuing into the b's stem. */\n"
    f"export const ligature = {json.dumps(ligature)} as const;\n"
    f"/** Positions in % of the mark (x of width, y of height). */\n"
    f"export const anchors = {json.dumps(anchors)} as const;\n"
)
tmp.unlink()
print("viewBox", view, "shift", round(shift, 1), "stems", Y_STEM, B_STEM, "depth", depth, "anchors", anchors)
