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

export interface Education {
  course?: Localized;
  school: string;
  /** Start year. */
  from?: number;
  /** Expected end year (current courses). */
  expected?: number;
  /** End year (finished courses). */
  to?: number;
}

/** Current courses (CV; start years from Iury, 2026-11-13). */
export const education: Education[] = [
  { course: { pt: "Bacharelado em Ciência da Computação", en: "BSc in Computer Science" }, school: "UNESC", from: 2026, expected: 2030 },
  {
    course: { pt: "Tecnólogo em Análise e Desenvolvimento de Sistemas", en: "Associate degree in Systems Analysis and Development" },
    school: "UNOPAR",
    from: 2026,
    expected: 2028,
  },
];

/**
 * Earlier courses, behind a disclosure (Iury, 2026-11-13). Iury named the Senac
 * course as Administração; the Cebrac course is not named yet, so only the school shows.
 */
export const educationEarlier: Education[] = [
  { course: { pt: "Administração", en: "Business Administration" }, school: "Centro Universitário Senac", from: 2024, to: 2025 },
  { school: "Cebrac Santa Catarina", from: 2020, to: 2021 },
];

export interface Skill {
  name: Localized;
  /** Where Iury applies or studies it (his own words, 2026-11-13). */
  note: Localized;
  /** Used at work today (listed under the current role in the career path). */
  daily: boolean;
}

/** Skills and stack, no repeats (Iury, 2026-11-13). */
export const skills: Skill[] = [
  {
    name: { pt: "SQL & PL/SQL", en: "SQL & PL/SQL" },
    note: {
      pt: "Manipulação, consultas e correção de dados em banco Oracle para destravar processos na TI do Giassi.",
      en: "Querying, handling and fixing data in an Oracle database to unblock processes in Giassi's IT.",
    },
    daily: true,
  },
  {
    name: { pt: "DOX (EMA Sistemas)", en: "DOX (EMA Sistemas)" },
    note: {
      pt: "Administração do sistema corporativo na Matriz: criação de usuários, permissões e ajustes de fluxos.",
      en: "Running the company system at head office: creating users, setting permissions and adjusting workflows.",
    },
    daily: true,
  },
  {
    name: { pt: "Pascal Script", en: "Pascal Script" },
    note: {
      pt: "Desenvolvimento de regras de validação e automações internas dentro da plataforma DOX.",
      en: "Writing validation rules and internal automations inside the DOX platform.",
    },
    daily: true,
  },
  {
    name: { pt: "JavaScript", en: "JavaScript" },
    note: {
      pt: "Scripts de automação, lógica web e estudo contínuo aplicado a produtos e interfaces.",
      en: "Automation scripts, web logic and ongoing study applied to products and interfaces.",
    },
    daily: true,
  },
  {
    name: { pt: "Softdesk", en: "Softdesk" },
    note: {
      pt: "Atendimento técnico aos colaboradores, análise de logs de processos e resolução de chamados.",
      en: "Technical support for colleagues, reading process logs and resolving tickets.",
    },
    daily: true,
  },
  {
    name: { pt: "Linguagem C", en: "C" },
    note: {
      pt: "Fundamentos de programação estruturada, memória e lógica na graduação em Ciência da Computação (UNESC).",
      en: "Structured programming, memory and logic fundamentals in the Computer Science degree (UNESC).",
    },
    daily: false,
  },
  {
    name: { pt: "Python", en: "Python" },
    note: {
      pt: "Estudos de lógica, automação e análise no curso de Análise e Desenvolvimento de Sistemas (UNOPAR).",
      en: "Logic, automation and analysis studies in the Systems Analysis and Development course (UNOPAR).",
    },
    daily: false,
  },
  {
    name: { pt: "HTML & CSS", en: "HTML & CSS" },
    note: {
      pt: "Estruturação de interfaces web e padronização de templates de e-mails corporativos.",
      en: "Structuring web interfaces and standardising the company's email templates.",
    },
    daily: true,
  },
  {
    name: { pt: "Segurança da Informação", en: "Information Security" },
    note: {
      pt: "Princípios de proteção de dados e controle de acessos estudados na UNOPAR e aplicados na gestão de permissões.",
      en: "Data protection and access control principles studied at UNOPAR and applied when managing permissions.",
    },
    daily: false,
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
  /**
   * "O que faço": four short lines in Iury's own words (2026-11-13; they replace the
   * five CV bullets). `**…**` marks the key terms the UI sets in semibold; `plain()`
   * strips the marks.
   */
  highlights: [
    {
      pt: "Gestão do sistema **DOX (EMA Sistemas)**: usuários, permissões e automações em **Pascal Script**.",
      en: "Running the **DOX (EMA Sistemas)** system: users, permissions and automations in **Pascal Script**.",
    },
    {
      pt: "Consultas, análise e correção de dados em **Oracle (SQL e PL/SQL)**.",
      en: "Queries, analysis and data fixes on **Oracle (SQL and PL/SQL)**.",
    },
    {
      pt: "Resolução de **chamados parados desde 2020** e suporte técnico via **Softdesk**.",
      en: "Resolving **tickets stalled since 2020** and technical support through **Softdesk**.",
    },
    {
      pt: "Padronização de **e-mails automáticos (HTML + SQL)** e relatórios no **ReportBuilder**.",
      en: "Standardising **automatic emails (HTML + SQL)** and reports in **ReportBuilder**.",
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

};

/** A highlight without its `**` emphasis marks (plain-text contexts). */
export const plain = (text: string) => text.replaceAll("**", "");
