import type { Localized } from "./types";

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

export interface ContactLink {
  kind: "email" | "linkedin" | "github";
  label: string;
  href: string;
  /** Rendered only when true. */
  publish: boolean;
}

/** Contacts confirmed by Iury for publication (2026-11-09). */
export const contacts: ContactLink[] = [
  { kind: "email", label: "iuryumbelino1@gmail.com", href: "mailto:iuryumbelino1@gmail.com", publish: true },
  { kind: "linkedin", label: "in/iuryumbelino", href: "https://www.linkedin.com/in/iuryumbelino/", publish: true },
  { kind: "github", label: "@Umbelino-dev", href: "https://github.com/Umbelino-dev", publish: true },
];

export const education: { course: Localized; school: string; expected: number }[] = [
  { course: { pt: "Bacharelado em Ciência da Computação", en: "BSc in Computer Science" }, school: "UNESC", expected: 2030 },
  {
    course: { pt: "Tecnólogo em Análise e Desenvolvimento de Sistemas", en: "Associate degree in Systems Analysis and Development" },
    school: "UNOPAR",
    expected: 2028,
  },
];

/**
 * Professional experience. Iury approved naming Giassi and the DOX / SQL / PL-SQL
 * work publicly (2026-11-09). Never expose internal data or systems detail beyond the CV.
 */
export const experience = {
  publishEmployer: true,
  employer: "Giassi Supermercados",
  role: { pt: "Assistente de TI", en: "IT Assistant" } satisfies Localized,
  period: { pt: "abr 2026 – atual", en: "Apr 2026 – present" } satisfies Localized,
  /** Every line is a CV bullet (rev. 6), reworded only for length. */
  highlights: [
    {
      pt: "Retomei, por iniciativa própria, chamados parados desde 2020: em duas semanas, encerrei 6 e mapeei outros 10.",
      en: "On my own initiative, reopened tickets stalled since 2020: in two weeks I closed 6 and mapped 10 more.",
    },
    {
      pt: "Regras de validação e automações em Pascal Script na plataforma DOX (EMA Sistemas), com apoio de IA.",
      en: "Validation rules and automations in Pascal Script on the DOX platform (EMA Sistemas), assisted by AI tools.",
    },
    {
      pt: "Consultas, análises e correções de dados em Oracle com SQL e PL/SQL.",
      en: "Queries, analysis and data fixes on Oracle with SQL and PL/SQL.",
    },
    {
      pt: "Padronizei os e-mails automáticos do sistema (HTML + SQL) num modelo único e mais legível.",
      en: "Standardised the system's automatic emails (HTML + SQL) into one clearer template.",
    },
    {
      pt: "Suporte a usuários por chamados (Softdesk) e e-mail; relatórios no ReportBuilder.",
      en: "User support through tickets (Softdesk) and email; reports in ReportBuilder.",
    },
  ] satisfies Localized[],
  /** The path inside the company, newest first (CV §Experiência). */
  path: [
    { role: { pt: "Assistente de TI", en: "IT Assistant" }, period: "04.2026 –" },
    { role: { pt: "Auxiliar Administrativo, TI", en: "Administrative Assistant, IT" }, period: "01.2026 – 03.2026" },
    { role: { pt: "Operador de Caixas, Logística", en: "Warehouse Operator, Logistics" }, period: "11.2025 – 12.2025" },
    { role: { pt: "Jovem Aprendiz, Centro de Distribuição", en: "Apprentice, Distribution Centre" }, period: "04.2024 – 07.2025" },
  ] satisfies { role: Localized; period: string }[],
  stack: {
    daily: ["SQL", "PL/SQL", "Oracle", "PL/SQL Developer", "DOX · Pascal Script", "ReportBuilder", "Softdesk"],
    /** CV marks these as basic. */
    learning: ["HTML", "JavaScript", "C++", "Git"],
  },
};
