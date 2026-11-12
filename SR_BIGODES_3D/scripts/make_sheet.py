"""Sr. Bigodes - monta a folha de apresentacao a partir de ../renders.

Uso: python make_sheet.py   (precisa de Pillow)
Saida: ../renders/SR_BIGODES_folha_de_apresentacao.png
"""
import glob
import os

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
R = os.path.join(os.path.dirname(HERE), "renders")
BG = (24, 24, 27)
LINE = (58, 58, 64)
TEXT = (232, 232, 228)
MUTED = (150, 150, 152)
LIME = (200, 241, 105)
W = 3360
PAD = 40


def font(size, bold=False):
    names = ["Inter-SemiBold.otf", "Inter-Bold.otf"] if bold else ["Inter-Regular.otf", "Inter-Medium.otf"]
    for name in names + ["DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"]:
        hits = glob.glob(f"/usr/share/fonts/**/{name}", recursive=True)
        if hits:
            return ImageFont.truetype(hits[0], size)
    return ImageFont.load_default()


def load(rel, size, crop=None):
    im = Image.open(os.path.join(R, rel + ".png")).convert("RGB")
    if crop:   # (x0, y0, x1, y1) em fracoes
        w, h = im.size
        im = im.crop((int(crop[0] * w), int(crop[1] * h), int(crop[2] * w), int(crop[3] * h)))
    return im.resize(size, Image.LANCZOS)


def row(sheet, draw, y, title, items, height):
    """items: (rotulo, arquivo, crop) -- colunas de largura igual."""
    draw.text((PAD, y), title.upper(), font=font(26, True), fill=LIME)
    y += 48
    n = len(items)
    gap = 12
    cw = (W - 2 * PAD - gap * (n - 1)) // n
    for i, (label, rel, crop) in enumerate(items):
        x = PAD + i * (cw + gap)
        sheet.paste(load(rel, (cw, height), crop), (x, y))
        draw.rectangle((x, y, x + cw - 1, y + height - 1), outline=LINE)
        draw.text((x + 14, y + 12), label, font=font(24), fill=TEXT)
    return y + height + 34


def sq(height, cw):
    """Recorte central para caber numa celula cw x height sem distorcer."""
    a = cw / height
    if a >= 1:
        m = (1 - 1 / a) / 2
        return (0, m, 1, 1 - m)
    m = (1 - a) / 2
    return (m, 0, 1 - m, 1)


def main():
    sheet = Image.new("RGB", (W, 2600), BG)
    d = ImageDraw.Draw(sheet)
    d.text((PAD, 34), "SR. BIGODES", font=font(64, True), fill=TEXT)
    d.text((PAD + 470, 62), "Folha de personagem 3D  ·  modelo, rig, expressões e poses em Blender", font=font(28), fill=MUTED)
    y = 140

    n, h = 6, 520
    cw = (W - 2 * PAD - 12 * (n - 1)) // n
    c = sq(h, cw)
    y = row(sheet, d, y, "Vistas", [
        ("Frente", "01_frontal", c), ("3/4 frente", "05_3q_frontal", c),
        ("Lado direito", "03_lateral_direita", c), ("Costas", "02_traseira", c),
        ("Lado esquerdo", "04_lateral_esquerda", c), ("3/4 trás", "06_3q_traseira", c)], h)

    n, h = 8, 400
    cw = (W - 2 * PAD - 12 * (n - 1)) // n
    c = sq(h, cw)
    y = row(sheet, d, y, "Expressões (shape keys)", [
        (lab, f"expressoes/{f}", c) for lab, f in (
            ("Normal", "normal"), ("Curioso", "curioso"), ("Surpreso", "surpreso"), ("Feliz", "feliz"),
            ("Bravo", "bravo"), ("Triste", "triste"), ("Dormindo", "dormindo"), ("Desconfiado", "desconfiado"))], h)

    n, h = 7, 440
    cw = (W - 2 * PAD - 12 * (n - 1)) // n
    c = sq(h, cw)
    y = row(sheet, d, y, "Poses e animações (rig)", [
        (lab, f"poses/{f}", c) for lab, f in (
            ("Em pé", "em_pe"), ("Andando", "andando"), ("Correndo", "correndo"), ("Pulando", "pulando"),
            ("Deitado", "deitado"), ("Dormindo", "dormindo"), ("Olhando para os lados", "olhando_lado"))], h)

    n, h = 6, 520
    cw = (W - 2 * PAD - 12 * (n - 1)) // n
    c = sq(h, cw)
    y = row(sheet, d, y, "Detalhes e malha", [
        ("Close do rosto", "09_close_rosto", c), ("Close dos olhos", "10_close_olhos", c),
        ("Topo", "07_superior", c), ("Inferior", "08_inferior", c),
        ("Malha · 3/4", "malha_3q", c), ("Malha · rosto", "malha_rosto", c)], h)

    sheet = sheet.crop((0, 0, W, y + 6))
    out = os.path.join(R, "SR_BIGODES_folha_de_apresentacao.png")
    sheet.save(out, optimize=True)
    print("folha:", out, sheet.size)


if __name__ == "__main__":
    main()
