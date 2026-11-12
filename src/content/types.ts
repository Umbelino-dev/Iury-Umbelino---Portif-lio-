/**
 * Content contracts. Presentation components read these types; copy lives in
 * src/content/* (facts) and messages/*.json (UI strings).
 *
 * Rule: nothing here may be invented. A fact without a source stays `undefined`
 * and the UI omits it. `confirmed: false` marks data copied from the design
 * prototype that Iury still has to validate.
 */
import type { Locale } from "@/i18n/routing";

/** Project stage — encoded by shape in the UI (StatusMark), never by colour. */
export type ProjectStatus = "concept" | "experiment" | "prototype" | "in-development" | "live";

/** A string per locale. */
export type Localized<T = string> = Record<Locale, T>;

export interface ProjectLink {
  label: Localized;
  href: string;
}

/** A figure or cover: a real image when `image` exists, otherwise the editorial placeholder. */
export interface MediaSlot {
  id: string;
  /** Desktop aspect; mobile may reflow (cover 16:9 → 4:3, 3:4 → 4:5). "1200/630" never reflows (brand pieces with text). */
  aspect: "16/9" | "4/3" | "3/4" | "1200/630";
  /** Mono spec label on the placeholder, e.g. "Painel". */
  label: Localized;
  caption: Localized;
  image?: MediaImage;
}

export interface CaseStudyStep {
  title: Localized;
  text: Localized;
}

export interface CaseStudyChapter {
  /** Stable id, used for anchors. */
  id: "problem" | "build" | "audit" | "product" | "learned" | "results";
  label: Localized; // "O problema" — numbered by position
  title: Localized; // display H2, max ~15ch
  /** Words of the title to mark with the `highlight` utility (light surface accent). */
  highlight?: Localized;
  body?: Localized<string[]>;
  /** Ruled list (index + H3 + one sentence). */
  steps?: CaseStudyStep[];
  figures?: MediaSlot[];
}

export interface CaseStudy {
  /** false = draft: no page is generated and the index does not link to it. */
  confirmed: boolean;
  lead?: Localized;
  /** Tools the product was built with (e.g. the AI builder) — shown next to the stack. */
  builtWith?: string[];
  cover?: MediaSlot;
  /** Rendered in order; a chapter without body, steps or figures is skipped. */
  chapters: CaseStudyChapter[];
  source: string;
}

/** Tag keys, translated in messages (`tags.*`). */
export type TagKey = "web" | "pwa" | "product" | "personal" | "ai" | "data" | "research" | "retail" | "personalTools";

/** A real image for a project or lab entry. Until it exists, the UI draws an editorial placeholder. */
export interface MediaImage {
  /** `/media/<name>.webp` — the loader resolves the width variants. */
  src: string;
  width: number;
  height: number;
  alt: Localized;
}

export interface Project {
  slug: string;
  /** Editorial index, e.g. "P.01". */
  index: string;
  name: string;
  /** Language of `name` when it differs from the page (most names are Portuguese). */
  nameLang?: "pt" | "en";
  status: ProjectStatus;
  year?: number;
  tags: TagKey[];
  summary: Localized;
  /** Cover used by the index preview (4:3 frame). */
  cover?: MediaImage & { fit?: "cover" | "contain"; background?: string };
  role?: Localized;
  stack?: string[];
  links?: ProjectLink[];
  /** Case study. Only `confirmed` ones get a page (/[locale]/projects/[slug]). */
  caseStudy?: CaseStudy;
  /** Where the facts came from — for maintainers, never rendered. */
  source: string;
  /** false = status/year/summary come from the design prototype and await confirmation. */
  confirmed: boolean;
}

/**
 * A pre-rendered 360° turn: one sprite sheet of `cols` × `rows` cells, read left to
 * right, top to bottom. Cell 0 is the same picture as the entry's `media`.
 */
export interface Turntable {
  /** `/media/<name>.webp` — one file, no width variants. */
  src: string;
  frames: number;
  cols: number;
  rows: number;
}

/** Experimental Lab entry (Homepage R02 · Lab). */
export interface LabEntry {
  index: string; // "E.01"
  /** What the frame holds: the 3D model, or a study drawn in place of media (pointer trace, sound score). */
  frame: "model" | "pointer" | "sound";
  aspect: "1/1" | "3/4" | "16/9";
  status: ProjectStatus;
  year?: number;
  topic: Localized;
  title: Localized;
  body: Localized;
  media?: MediaImage;
  /** With `media`: the pointer turns the model (LabFrame). */
  turntable?: Turntable;
  source: string;
  confirmed: boolean;
}
