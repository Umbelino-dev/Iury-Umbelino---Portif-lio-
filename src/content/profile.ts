import type { Localized } from "./types";

/**
 * Verified personal facts. Source: "Currículo — Iury Umbelino" (Claude Docs, rev. 6, Nov 2026).
 * Anything not in that CV (or confirmed by Iury in chat) does not belong here.
 */

export const site = {
  name: "Iury Umbelino",
  /** Public origin, used for canonical/hreflang/sitemap. Defaults to the live Worker; set NEXT_PUBLIC_SITE_URL at build time for a custom domain. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://portfolio.iuryumbelino1.workers.dev",
} as const;

export interface ContactLink {
  kind: "email" | "linkedin" | "github" | "instagram";
  label: string;
  href: string;
  /** Rendered only when true. */
  publish: boolean;
}

/** Contacts confirmed by Iury for publication (2026-11-09; Instagram 2026-11-13). */
export const contacts: ContactLink[] = [
  { kind: "email", label: "iuryumbelino1@gmail.com", href: "mailto:iuryumbelino1@gmail.com", publish: true },
  { kind: "linkedin", label: "in/iuryumbelino", href: "https://www.linkedin.com/in/iuryumbelino/", publish: true },
  { kind: "github", label: "@Umbelino-dev", href: "https://github.com/Umbelino-dev", publish: true },
  // Instagram: confirmed by Iury for publication (2026-11-13).
  { kind: "instagram", label: "@umbelino.zs", href: "https://instagram.com/umbelino.zs", publish: true },
];

export const education: { course: Localized; school: string; expected: number }[] = [
  { course: { pt: "Bacharelado em Ciência da Computação", en: "BSc in Computer Science" }, school: "UNESC", expected: 2030 },
  {
    course: { pt: "Tecnólogo em Análise e Desenvolvimento de Sistemas", en: "Associate degree in Systems Analysis and Development" },
    school: "UNOPAR",
    expected: 2028,
  },
];

export interface PathStep {
  role: Localized;
  period: string;
  area: Localized;
  summary: Localized;
  details: Localized[];
  more: Localized;
  /** Show the CV highlights in the expanded panel (current role). */
  highlights?: boolean;
  confirmed: boolean;
}

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
  /**
   * The path inside the company, newest first (CV §Experiência).
   * `summary` / `details` / `more` were drafted with Iury's go-ahead (2026-11-10)
   * from known facts only (role, area, period, sequence): no tasks or results are
   * claimed. `confirmed: false` until Iury reviews them. The current role's "more"
   * is its CV highlights (above).
   */
  path: [
    {
      role: { pt: "Assistente de TI", en: "IT Assistant" },
      period: "04.2026 –",
      area: { pt: "Tecnologia (TI)", en: "Technology (IT)" },
      summary: { pt: "Sistemas internos, com dados e usuários reais.", en: "Internal systems, with real data and real users." },
      details: [
        { pt: "SQL, PL/SQL e Oracle no dia a dia", en: "SQL, PL/SQL and Oracle every day" },
        { pt: "Regras e automações na plataforma DOX", en: "Rules and automations on the DOX platform" },
      ],
      more: { pt: "O que faço hoje, segundo o currículo:", en: "What I do today, from my CV:" },
      highlights: true,
      confirmed: false,
    },
    {
      role: { pt: "Auxiliar Administrativo, TI", en: "Administrative Assistant, IT" },
      period: "01.2026 – 03.2026",
      area: { pt: "Tecnologia (TI)", en: "Technology (IT)" },
      summary: { pt: "A entrada na área de Tecnologia.", en: "The way into the IT team." },
      details: [{ pt: "Primeiro cargo dentro do time de TI", en: "First role inside the IT team" }],
      more: {
        pt: "Foi o primeiro cargo na área de Tecnologia do Giassi. O passo seguinte foi o de Assistente de TI, a função de hoje.",
        en: "My first role in Giassi's IT team. The next step was IT Assistant, the role I hold today.",
      },
      confirmed: false,
    },
    {
      role: { pt: "Operador de Caixas, Logística", en: "Warehouse Operator, Logistics" },
      period: "11.2025 – 12.2025",
      area: { pt: "Logística", en: "Logistics" },
      summary: { pt: "Uma passagem pela logística antes da TI.", en: "A stop in logistics before IT." },
      details: [{ pt: "O último passo antes da área de Tecnologia", en: "The last step before the IT team" }],
      more: {
        pt: "Um período curto na logística. Logo depois veio a entrada na área de Tecnologia.",
        en: "A short stretch in logistics. Right after it came the move into IT.",
      },
      confirmed: false,
    },
    {
      role: { pt: "Jovem Aprendiz, Centro de Distribuição", en: "Apprentice, Distribution Centre" },
      period: "04.2024 – 07.2025",
      area: { pt: "Centro de Distribuição", en: "Distribution Centre" },
      summary: { pt: "Onde tudo começou: o primeiro emprego.", en: "Where it all began: my first job." },
      details: [{ pt: "Programa Jovem Aprendiz", en: "Apprenticeship programme" }],
      more: {
        pt: "Entrei no Giassi pelo programa Jovem Aprendiz, no Centro de Distribuição. Foi o começo do caminho que me levou à área de Tecnologia.",
        en: "I joined Giassi through its apprenticeship programme, at the Distribution Centre. It was the start of the path that led me into IT.",
      },
      confirmed: false,
    },
  ] satisfies PathStep[],
  stack: {
    daily: ["SQL", "PL/SQL", "Oracle", "PL/SQL Developer", "DOX · Pascal Script", "ReportBuilder", "Softdesk"],
    /** CV marks these as basic. */
    learning: ["HTML", "JavaScript", "C++", "Git"],
  },
};
