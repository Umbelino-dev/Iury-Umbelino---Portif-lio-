import type { Localized } from "./types";

/**
 * Portrait slot — two aligned 4:5 images of the same frame (Homepage R02 · N6).
 * `src` stays undefined until Iury sends the photos; the UI then renders the
 * editorial placeholder ("SPECIMEN 01"). Drop files in /public/portrait/ and set
 * `src`, `width` and `height` (export at 2400×3000 or smaller, same crop for both).
 */
export interface PortraitImage {
  src?: string;
  width: number;
  height: number;
  alt: Localized;
}

export const portrait: { base: PortraitImage; alternate: PortraitImage } = {
  base: {
    width: 2400,
    height: 3000,
    alt: {
      pt: "Retrato de Iury Umbelino.",
      en: "Portrait of Iury Umbelino.",
    },
  },
  alternate: {
    width: 2400,
    height: 3000,
    alt: {
      pt: "O mesmo retrato lido por uma máquina: linhas e coordenadas.",
      en: "The same portrait as a machine reads it: scan lines and coordinates.",
    },
  },
};
