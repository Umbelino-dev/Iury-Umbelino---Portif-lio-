"""Compose preview renders (transparent PNGs) into one strip on the sheet's grey."""
import sys
from PIL import Image

out, *files = sys.argv[1:]
ims = [Image.open(f).convert("RGBA") for f in files]
w = sum(i.width for i in ims)
h = max(i.height for i in ims)
sheet = Image.new("RGBA", (w, h), (235, 235, 235, 255))
x = 0
for im in ims:
    sheet.alpha_composite(im, (x, 0))
    x += im.width
sheet.convert("RGB").save(out)
