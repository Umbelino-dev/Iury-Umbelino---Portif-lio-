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

export interface CaseStudyChapter {
  /** e.g. "problem", "role", "decisions" — stable id used for anchors. */
  id: string;
  title: Localized;
  body: Localized<string[]>;
}

/** Tag keys, translated in messages (`tags.*`). */
export type TagKey = "web" | "pwa" | "product" | "personal" | "ai" | "data" | "research" | "retail" | "personalTools";

/** A real image for a project or lab entry. Until it exists, the UI draws an editorial placeholder. */
export interface MediaImage {
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
  /** 4:3 cover used by the index preview. */
  cover?: MediaImage;
  role?: Localized;
  stack?: string[];
  links?: ProjectLink[];
  /** Case-study chapters. Omitted until there is verified material. */
  chapters?: CaseStudyChapter[];
  /** Where the facts came from — for maintainers, never rendered. */
  source: string;
  /** false = status/year/summary come from the design prototype and await confirmation. */
  confirmed: boolean;
}

/** Experimental Lab entry (Homepage R02 · Lab). */
export interface LabEntry {
  index: string; // "E.01"
  /** The frame study drawn in place of media: 3D cube, pointer trace or sound score. */
  frame: "cube" | "pointer" | "sound";
  aspect: "1/1" | "3/4" | "16/9";
  status: ProjectStatus;
  year?: number;
  topic: Localized;
  title: Localized;
  body: Localized;
  media?: MediaImage;
  source: string;
  confirmed: boolean;
}
