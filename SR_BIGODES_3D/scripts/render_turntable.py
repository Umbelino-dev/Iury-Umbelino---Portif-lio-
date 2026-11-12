"""Sr. Bigodes - giro 360 para o Lab do portfolio.

Renderiza o gato sentado girando sobre o proprio eixo, com fundo transparente e
sombra de contato, e monta uma folha de sprites (uma imagem, FRAMES quadros).

Uso:  blender --background --python render_turntable.py -- [draft]
Saida: ../../assets/media/sr-bigodes-src.png       (quadro 0, grande: o poster)
       ../../assets/media/sr-bigodes-turn-src.png  (folha COLS x ROWS)
Depois: `npm run images` na raiz do portfolio gera os .webp em public/media.
"""
import math
import os
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
from PIL import Image  # noqa: E402

import sb_scene  # noqa: E402

ROOT = os.path.dirname(HERE)
MEDIA = os.path.join(os.path.dirname(ROOT), "assets", "media")
ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
DRAFT = "draft" in ARGS

FRAMES, COLS, ROWS = 36, 6, 6
SIZE = 128 if DRAFT else 512          # lado de cada quadro
POSTER = 320 if DRAFT else 1280
BASE = 32.0                           # quadro 0: tres quartos, olhando para a direita da tela


def main():
    bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, "SR_BIGODES.blend"))
    sc = bpy.context.scene
    rig = bpy.data.objects["SrBigodes_Rig"]
    rig.animation_data.action = bpy.data.actions["SB_Sentado_Idle"]
    sc.frame_set(2)
    sc.frame_set(1)

    sc.render.film_transparent = True
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    bpy.data.objects["ENV_Chao"].is_shadow_catcher = True
    cam = sb_scene.add_camera(bpy.data.collections["CAMERAS"], "CAM_tmp_Giro", (0.0, -5.6, 1.05),
                              target=(0.0, 0.0, 0.47), lens=182)
    sc.camera = cam
    for ob in bpy.data.collections["LIGHTING"].objects:   # fundo quase preto no site: mais luz de recorte
        if ob.type == "LIGHT":
            ob.data.energy *= 2.2 if "Contra" in ob.name else 1.6

    def render(path, size, spp, deg):
        rig.rotation_euler = (0.0, 0.0, math.radians(deg))
        sc.render.resolution_x = sc.render.resolution_y = size
        sc.cycles.samples = spp
        sc.render.filepath = path
        bpy.ops.render.render(write_still=True)

    os.makedirs(MEDIA, exist_ok=True)
    render(os.path.join(MEDIA, "sr-bigodes-src.png"), POSTER, 16 if DRAFT else 128, BASE)

    if "poster" in ARGS:
        return
    tmp = tempfile.mkdtemp(prefix="sb_turn_")
    sheet = Image.new("RGBA", (COLS * SIZE, ROWS * SIZE), (0, 0, 0, 0))
    for i in range(FRAMES):
        path = os.path.join(tmp, f"f{i:02d}.png")
        render(path, SIZE, 12 if DRAFT else 72, BASE + i * 360.0 / FRAMES)
        sheet.paste(Image.open(path).convert("RGBA"), ((i % COLS) * SIZE, (i // COLS) * SIZE))
        print(f"[giro] {i + 1}/{FRAMES}")
    out = os.path.join(MEDIA, "sr-bigodes-turn-src.png")
    sheet.save(out, optimize=True)
    print("[giro] folha:", out, sheet.size)


if __name__ == "__main__":
    main()
