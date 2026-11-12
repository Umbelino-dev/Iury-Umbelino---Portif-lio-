/**
 * Builds every image the site ships: `assets/media/*` → `public/media/*-<width>.webp`.
 * Run with `npm run images` after adding or changing a source. Widths match
 * `images.deviceSizes` in next.config.ts; the custom loader (src/lib/image-loader.ts)
 * picks them. Never upscales: a width above the source is capped at the source size.
 *
 * The two portraits are aligned here so the radial "machine reading" mask reveals the
 * same face: eye positions were measured on the sources, the cyborg version is scaled
 * and shifted onto the real photo, then both are cropped to the same 4:5 box.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = "assets/media";
const OUT = "public/media";
const WIDTHS = [640, 960, 1280, 1920];
const QUALITY = 78;

// Eye midpoints measured on the sources (px): real (653.8, 279.5), cyborg (678.8, 275.8);
// interocular distance real 114.4, cyborg 119.8 → scale 0.955, offset after scaling (+5, +16).
const ALIGN = { scale: 114.4 / 119.8, dx: 5, dy: 16 };
// Shared 4:5 crop centred on the face (sources are 1213×1296).
const PORTRAIT_BOX = { left: 136, top: 0, width: 1036, height: 1295 };

async function variants(name, input) {
  const { width } = await sharp(input).metadata();
  for (const w of WIDTHS) {
    await sharp(input)
      .resize({ width: Math.min(w, width), withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 6 })
      .toFile(path.join(OUT, `${name}-${w}.webp`));
  }
  const meta = await sharp(input).metadata();
  console.log(`${name}: ${meta.width}×${meta.height} → ${WIDTHS.join("/")}`);
}

async function alignedCyborg() {
  const src = path.join(SRC, "portrait-cyborg-src.webp");
  const real = await sharp(path.join(SRC, "portrait-real-src.webp")).metadata();
  const { width, height } = await sharp(src).metadata();
  const scaled = await sharp(src)
    .resize(Math.round(width * ALIGN.scale), Math.round(height * ALIGN.scale))
    .toBuffer();
  // Background: the cyborg's own corner colour, so the shifted edge is invisible.
  const { data } = await sharp(src).extract({ left: 4, top: 4, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
  return sharp({
    create: { width: real.width, height: real.height, channels: 3, background: { r: data[0], g: data[1], b: data[2] } },
  })
    .composite([{ input: scaled, left: ALIGN.dx, top: ALIGN.dy }])
    .png()
    .toBuffer();
}

await fs.mkdir(OUT, { recursive: true });

const real = await sharp(path.join(SRC, "portrait-real-src.webp")).extract(PORTRAIT_BOX).png().toBuffer();
const cyborg = await sharp(await alignedCyborg()).extract(PORTRAIT_BOX).png().toBuffer();
await variants("portrait-real", real);
await variants("portrait-cyborg", cyborg);

for (const name of ["koinonia-cover", "koinonia-map", "koinonia-brand"]) {
  await variants(name, await fs.readFile(path.join(SRC, `${name}.png`)));
}

// Sr. Bigodes, the cat's 3D model (SR_BIGODES_3D/scripts/render_turntable.py writes both
// sources). The still goes through the usual widths; the 360° sheet is one file of
// 6 × 6 cells with alpha, loaded only on fine pointers (LabFrame).
await variants("sr-bigodes", await fs.readFile(path.join(SRC, "sr-bigodes-src.png")));
await sharp(path.join(SRC, "sr-bigodes-turn-src.png"))
  .webp({ quality: 72, alphaQuality: 90, effort: 6 })
  .toFile(path.join(OUT, "sr-bigodes-turn.webp"));
console.log("sr-bigodes-turn: one sheet");
