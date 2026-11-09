"use client";

/**
 * next/image loader for the static export: maps a source like `/media/portrait-real.webp`
 * to the pre-built variant `/media/portrait-real-<w>.webp` (see scripts/images.mjs).
 * Widths must match `images.deviceSizes` in next.config.ts.
 */
const WIDTHS = [640, 960, 1280, 1920];

export default function imageLoader({ src, width }: { src: string; width: number }) {
  const w = WIDTHS.find((candidate) => candidate >= width) ?? WIDTHS[WIDTHS.length - 1];
  return src.replace(/\.webp$/, `-${w}.webp`);
}
