/**
 * Verified personal facts. Source: "Currículo — Iury Umbelino" (Claude Docs, rev. 6, Nov 2026).
 * Anything not in that CV (or confirmed by Iury in chat) does not belong here.
 */

export const site = {
  name: "Iury Umbelino",
  /** Brand tagline — kept in English in every locale (render with lang="en"). */
  tagline: { lead: "Curiosity builds", accent: "what comes next." },
  /** Public origin, used for canonical/hreflang/sitemap. Set NEXT_PUBLIC_SITE_URL in the deploy. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

/** Contacts listed in the CV. Hidden on purpose: Iury will send the final email/LinkedIn (2026-11-09). */
export const contacts = [
  { kind: "email", label: "iuryumbelino1@gmail.com", href: "mailto:iuryumbelino1@gmail.com", publish: false },
  { kind: "linkedin", label: "in/iuryumbelino", href: "https://www.linkedin.com/in/iuryumbelino", publish: false },
  { kind: "github", label: "@Umbelino-dev", href: "https://github.com/Umbelino-dev", publish: false },
] as const;

export const education = [
  { course: "Ciência da Computação (Bacharelado)", school: "UNESC", expected: 2030 },
  { course: "Análise e Desenvolvimento de Sistemas (Tecnólogo)", school: "UNOPAR", expected: 2028 },
] as const;

/**
 * Professional experience. Iury approved naming Giassi and the DOX / SQL / PL-SQL
 * work publicly (2026-11-09). Never expose internal data or systems detail beyond the CV.
 */
export const experience = {
  publishEmployer: true,
  employer: "Giassi Supermercados",
  role: "Assistente de TI",
  since: "2026-04",
  skills: ["SQL", "PL/SQL", "Oracle", "Pascal Script (DOX)", "ReportBuilder", "HTML", "JavaScript"],
} as const;
