import type { Localized } from "./types";
import { portrait } from "./portrait";

/**
 * Photos for the About carousel (PhotoLoop). Real photos of Iury only.
 * To add one: put the source in assets/media/, add it to scripts/images.mjs,
 * run `npm run images`, then add an entry here with its width/height and an alt
 * text that describes only what is in the picture. Photos with other people:
 * only with their consent.
 */
export interface GalleryPhoto {
  src: string;
  width: number;
  height: number;
  alt: Localized;
  caption: Localized;
}

export const gallery: GalleryPhoto[] = [
  {
    src: portrait.base.src ?? "",
    width: portrait.base.width,
    height: portrait.base.height,
    alt: portrait.base.alt,
    caption: { pt: "Retrato", en: "Portrait" },
  },
  {
    src: portrait.alternate.src ?? "",
    width: portrait.alternate.width,
    height: portrait.alternate.height,
    alt: portrait.alternate.alt,
    caption: { pt: "A mesma foto, versão máquina", en: "The same photo, machine version" },
  },
].filter((p) => p.src);
