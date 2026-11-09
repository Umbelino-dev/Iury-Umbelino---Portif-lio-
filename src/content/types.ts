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

export interface Project {
  slug: string;
  /** Editorial index, e.g. "P.01". */
  index: string;
  name: string;
  /** Language of `name` when it differs from the page (most names are Portuguese). */
  nameLang?: "pt" | "en";
  status: ProjectStatus;
  year?: number;
  tags: string[];
  summary: Localized;
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
