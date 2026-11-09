import type { Localized } from "./types";

/**
 * Portrait slot — two aligned 4:5 images of the same frame (Homepage R02 · N6).
 * Sources live in assets/media and are aligned + cropped to the same 4:5 box by
 * scripts/images.mjs (`npm run images`), so the reveal mask shows the same face.
 * Without `src` the UI falls back to the editorial placeholder ("SPECIMEN 01").
 */
export interface PortraitImage {
  src?: string;
  width: number;
  height: number;
  alt: Localized;
}

export const portrait: { base: PortraitImage; alternate: PortraitImage } = {
  base: {
    src: "/media/portrait-real.webp",
    width: 1036,
    height: 1295,
    alt: {
      pt: "Retrato de Iury Umbelino: cabelo cacheado, óculos de armação fina, jaqueta escura, braços cruzados.",
      en: "Portrait of Iury Umbelino: curly hair, thin-framed glasses, dark jacket, arms crossed.",
    },
  },
  alternate: {
    src: "/media/portrait-cyborg.webp",
    width: 1036,
    height: 1295,
    alt: {
      pt: "O mesmo retrato como ciborgue: rosto e corpo em placas de armadura cinza com luzes brancas.",
      en: "The same portrait as a cyborg: face and body in grey armour plates with white lights.",
    },
  },
};
