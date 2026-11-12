import type { LabEntry } from "./types";

/**
 * Experimental Lab. Names and copy come from the design (Homepage R02), where they
 * are marked as placeholders — every entry stays `confirmed: false` until Iury
 * replaces it. E.01's picture is real: Sr. Bigodes, the cat's 3D model. E.02 and E.03 are shown as concepts with no year: the design's
 * "2026 · Prototype" and "2025 · Archived" claimed work that does not exist yet.
 */
export const lab: LabEntry[] = [
  {
    index: "E.01",
    frame: "model",
    aspect: "1/1",
    status: "experiment",
    topic: { pt: "3D", en: "3D" },
    title: { pt: "O gato, em três dimensões", en: "The cat, in three dimensions" },
    body: {
      pt: "Quanta geometria é preciso para ainda parecer atenção? Um estudo para o companheiro que vive neste site. Passe o mouse sobre o quadro para girar o modelo.",
      en: "How little geometry can still read as attention? A study for the companion that lives on this site. Move over the frame to turn the model.",
    },
    media: {
      src: "/media/sr-bigodes.webp",
      width: 1280,
      height: 1280,
      alt: {
        pt: "Sr. Bigodes, o gato preto de olhos verdes deste site, modelado em 3D, sentado e visto em três quartos.",
        en: "Sr. Bigodes, this site's black cat with green eyes, modelled in 3D, sitting, seen in three-quarter view.",
      },
    },
    turntable: { src: "/media/sr-bigodes-turn.webp", frames: 36, cols: 6, rows: 6 },
    source:
      "copy: design Homepage R02 (marked placeholder, awaits Iury). Model and renders: SR_BIGODES_3D/ (Blender), rendered 2026-11-12 by scripts/render_turntable.py",
    confirmed: false,
  },
  {
    index: "E.02",
    frame: "pointer",
    aspect: "3/4",
    status: "concept",
    topic: { pt: "Interação", en: "Interaction" },
    title: { pt: "Um cursor que escuta", en: "Cursor that listens" },
    body: {
      pt: "Velocidade, pausas e hesitação lidas como intenção. A interface responde antes do clique.",
      en: "Speed, pauses and hesitation read as intent. The interface answers before you click.",
    },
    source: "design Homepage R02 (placeholder)",
    confirmed: false,
  },
  {
    index: "E.03",
    frame: "sound",
    aspect: "16/9",
    status: "concept",
    topic: { pt: "IA · Som", en: "AI · Sound" },
    title: { pt: "Prompt como instrumento", en: "Prompt as instrument" },
    body: {
      pt: "Digitar vira partitura. Um modelo de linguagem transforma fraseado e ritmo em som, em tempo real.",
      en: "Typing becomes a score. A language model turns phrasing and rhythm into sound, in real time.",
    },
    source: "design Homepage R02 (placeholder)",
    confirmed: false,
  },
];
