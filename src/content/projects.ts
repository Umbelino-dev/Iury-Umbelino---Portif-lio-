import type { Project } from "./types";

/**
 * Ordered for the index: shipped work first, then work in progress.
 * Sources: CV (rev. 6), portfolio audit (26 Oct 2026), design "Homepage R02".
 */
export const projects: Project[] = [
  {
    slug: "koinonia",
    index: "P.01",
    name: "Koinonia",
    nameLang: "pt",
    status: "live",
    tags: ["Web", "PWA", "Product"],
    summary: {
      pt: "Plataforma web (PWA) de gestão de comunidades, publicada e em uso.",
      en: "A community-management web platform (PWA), published and in use.",
    },
    role: {
      pt: "Concepção do produto, requisitos, regras de negócio e fluxos de uso. Implementação feita com ferramenta de IA (Lovable).",
      en: "Product concept, requirements, business rules and user flows. Implementation built with an AI tool (Lovable).",
    },
    // The audit mentions Supabase; to be confirmed by Iury before rendering it as stack.
    links: [{ label: { pt: "Ver o site", en: "Visit the site" }, href: "https://usekoinonia.com.br" }],
    source: "CV §Projetos; audit §5",
    confirmed: true,
  },
  {
    slug: "via-hebraica",
    index: "P.02",
    name: "Via Hebraica",
    nameLang: "pt",
    status: "live",
    tags: ["Web", "Personal project"],
    summary: {
      pt: "App web de estudos bíblicos com leitor, atlas, cronologia e marca-páginas.",
      en: "A Bible-study web app with a reader, atlas, timeline and bookmarks.",
    },
    // Role and tools are unconfirmed (audit question 2): leave `role` undefined.
    links: [{ label: { pt: "Ver o site", en: "Visit the site" }, href: "https://viahebraica.app" }],
    source: "audit §5",
    confirmed: false,
  },
  {
    slug: "copiloto-de-parentalidade",
    index: "P.03",
    name: "Copiloto de parentalidade",
    nameLang: "pt",
    status: "in-development",
    year: 2026,
    tags: ["AI", "Product"],
    summary: {
      pt: "Assistente de IA para ajudar pais no primeiro ano do bebê.",
      en: "An AI assistant to help parents through a baby's first year.",
    },
    source: "design Homepage R02 / Case Study R01 (copy marked placeholder)",
    confirmed: false,
  },
  {
    slug: "central-de-tendencias",
    index: "P.04",
    name: "Central de Inteligência de Tendências",
    nameLang: "pt",
    status: "concept",
    year: 2025,
    tags: ["AI", "Data", "Research"],
    summary: { pt: "", en: "" },
    source: "design Homepage R02 (design said prototype; Iury: concept/in development only)",
    confirmed: false,
  },
  {
    slug: "zeff",
    index: "P.05",
    name: "Zeff",
    status: "concept",
    year: 2025,
    tags: ["AI", "Retail"],
    summary: { pt: "", en: "" },
    source: "design Homepage R02 (status provisional)",
    confirmed: false,
  },
  {
    slug: "umb",
    index: "P.06",
    name: "UMB",
    status: "in-development",
    year: 2026,
    tags: ["AI", "Personal tools"],
    summary: { pt: "", en: "" },
    source: "design Homepage R02 (status provisional)",
    confirmed: false,
  },
];
