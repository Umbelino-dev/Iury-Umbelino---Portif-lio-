import type { CaseStudy, Project } from "./types";

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
    year: 2026,
    tags: ["web", "pwa", "ai"],
    summary: {
      pt: "Plataforma web (PWA) de gestão de comunidades, publicada e em uso.",
      en: "A community-management web platform (PWA), published and in use.",
    },
    role: {
      pt: "Product builder: problema, fluxo, diretrizes para a IA, orquestração e testes",
      en: "Product builder: problem, flow, AI directives, orchestration and testing",
    },
    stack: ["TanStack Start", "React 19", "Supabase", "Tailwind CSS v4", "Vitest"],
    links: [{ label: { pt: "Ver o Koinonia", en: "Visit Koinonia" }, href: "https://usekoinonia.com.br" }],
    source: "CV §Projetos; Iury (chat, 2026-11-09); repo Umbelino-dev/koinonia.app (README, docs/PRODUTO.md, docs/AUDITORIA.md, docs/historico, git log)",
    confirmed: true,
    caseStudy: {
      confirmed: true,
      source: "repo Umbelino-dev/koinonia.app @7aba644 + Iury's role statement",
      lead: {
        pt: "Uma plataforma web (PWA) para a liderança de comunidades e igrejas acompanhar pessoas, presença e cuidado. Construída com IA, dirigida por mim. Publicada e em uso.",
        en: "A web platform (PWA) for community and church leaders to follow people, attendance and care. Built with AI, directed by me. Published and in use.",
      },
      builtWith: ["Lovable (IA)"],
      cover: {
        id: "cover",
        aspect: "16/9",
        label: { pt: "Capa — tela principal", en: "Cover — main screen" },
        caption: {
          pt: "Fig. 01 — O painel da liderança. Captura a caminho.",
          en: "Fig. 01 — The leadership dashboard. Screenshot on its way.",
        },
      },
      chapters: [
        {
          id: "problem",
          label: { pt: "O problema", en: "The problem" },
          title: { pt: "Ninguém percebe quem está se afastando.", en: "Nobody notices who is drifting away." },
          body: {
            pt: [
              "O Koinonia nasceu na AWAKE, uma rede de jovens cristãos. A liderança fazia quase tudo de memória: lembrar quem esteve nos encontros, perceber quem estava faltando, lembrar aniversários, procurar quem não apareceu.",
              "Uma lista de presença registra quem veio. Não diz por quem começar. O produto existe para responder a uma pergunta só: quem precisa da minha atenção hoje?",
            ],
            en: [
              "Koinonia started at AWAKE, a network of young Christians. Leaders did almost everything from memory: who came to the meetings, who was missing, whose birthday it was, who to reach out to.",
              "An attendance list records who came. It does not say where to start. The product exists to answer one question: who needs my attention today?",
            ],
          },
        },
        {
          id: "build",
          label: { pt: "Como foi construído", en: "How it was built" },
          title: { pt: "A IA escreveu o código. A direção foi minha.", en: "AI wrote the code. The direction was mine." },
          highlight: { pt: "A direção foi minha.", en: "The direction was mine." },
          body: {
            pt: [
              "Não comecei por um editor de código. Comecei por um briefing para a IA, com uma exigência na primeira página: nada de protótipo visual — uma aplicação real, usável pela liderança.",
              "A partir daí, o trabalho foi direção: cada rodada foi um plano escrito por mim, executado pela IA e conferido antes da próxima. A IA encurtou a distância entre a ideia e algo testável. Decidir o que testar continuou sendo meu.",
            ],
            en: [
              "I didn't start in a code editor. I started with a brief for the AI, with one demand on the first page: no visual prototype — a real application the leaders could use.",
              "From there, the work was direction: every round was a plan I wrote, the AI carried out, and I checked before the next one. AI shortened the distance between an idea and something testable. Deciding what to test stayed with me.",
            ],
          },
          steps: [
            {
              title: { pt: "Definir o problema", en: "Define the problem" },
              text: { pt: "Uma pergunta guia o produto: quem precisa da minha atenção hoje?", en: "One question drives the product: who needs my attention today?" },
            },
            {
              title: { pt: "Desenhar o fluxo", en: "Design the flow" },
              text: {
                pt: "Da chamada no encontro a uma fila de cuidado: a presença vira prioridade.",
                en: "From the meeting's roll call to a care queue: attendance becomes priority.",
              },
            },
            {
              title: { pt: "Escrever as diretrizes", en: "Write the directives" },
              text: {
                pt: "Um briefing inicial e planos de evolução datados, escritos para a IA executar.",
                en: "An opening brief and dated evolution plans, written for the AI to carry out.",
              },
            },
            {
              title: { pt: "Orquestrar a construção", en: "Orchestrate the build" },
              text: {
                pt: "521 commits entre 16 de agosto e 5 de outubro de 2026.",
                en: "521 commits between 16 August and 5 October 2026.",
              },
            },
            {
              title: { pt: "Testar o resultado", en: "Test the result" },
              text: {
                pt: "Testes de navegador no desktop e no celular, e as regras do produto cobertas por testes automatizados.",
                en: "Browser tests on desktop and mobile, and the product rules covered by automated tests.",
              },
            },
          ],
        },
        {
          id: "audit",
          label: { pt: "O que a curadoria encontrou", en: "What curation found" },
          title: { pt: "Funcionar não é o mesmo que estar certo.", en: "Working is not the same as being right." },
          body: {
            pt: [
              "Em setembro de 2026, o que a IA tinha construído passou por uma auditoria técnica. O app abria, salvava e parecia certo. Os problemas estavam onde ninguém olha numa demonstração.",
            ],
            en: [
              "In September 2026, what the AI had built went through a technical audit. The app opened, saved and looked right. The problems were where nobody looks in a demo.",
            ],
          },
          steps: [
            {
              title: { pt: "O Radar ia errar em silêncio.", en: "The Radar would have failed silently." },
              text: {
                pt: "As leituras não eram paginadas: depois de mil registros, frequência, Radar e relatórios ficariam errados sem nenhum aviso. Corrigido.",
                en: "Reads weren't paginated: past a thousand records, attendance, the Radar and reports would have gone wrong with no warning. Fixed.",
              },
            },
            {
              title: { pt: "O filtro escondia quem mais precisava.", en: "The filter hid the people who needed it most." },
              text: {
                pt: "“Contatado nos últimos 7 dias” comparava datas invertidas: qualquer contato antigo contava como recente. Corrigido.",
                en: "“Contacted in the last 7 days” compared dates the wrong way round: any old contact counted as recent. Fixed.",
              },
            },
            {
              title: { pt: "Sem testes, sem rede de segurança.", en: "No tests, no safety net." },
              text: {
                pt: "Nenhum teste automatizado e 1.806 problemas de lint. Hoje há testes das regras do produto e verificação contínua no GitHub.",
                en: "No automated tests and 1,806 lint problems. Today the product rules are tested and checked continuously on GitHub.",
              },
            },
            {
              title: { pt: "Preso ao editor da IA.", en: "Locked to the AI editor." },
              text: {
                pt: "Build, logo e telemetria dependiam da ferramenta onde o app nasceu. O projeto ganhou repositório e configuração próprios.",
                en: "Build, logo and telemetry depended on the tool the app was born in. The project moved to its own repository and configuration.",
              },
            },
          ],
        },
        {
          id: "product",
          label: { pt: "O produto", en: "The product" },
          title: { pt: "Uma fila de cuidado, não uma lista de presença.", en: "A care queue, not an attendance list." },
          body: {
            pt: [
              "O Radar de Cuidado classifica cada pessoa pelo risco de afastamento — frequência recente e tempo desde o último encontro — e transforma isso numa fila de ação: contatar, registrar o cuidado feito, acompanhar.",
              "Quem é novo não é punido: com menos de três encontros válidos, a pessoa aparece como “histórico insuficiente”, nunca como risco. Em volta do Radar: chamada rápida, aniversários, mensagens de WhatsApp com modelos, agenda com escalas, pequenos grupos, financeiro e várias organizações isoladas na mesma plataforma.",
            ],
            en: [
              "The Care Radar ranks each person by risk of drifting away — recent attendance and time since the last meeting — and turns it into an action queue: reach out, log the care given, follow up.",
              "Newcomers aren't penalised: with fewer than three valid meetings, a person shows as “not enough history”, never as at risk. Around the Radar: quick roll call, birthdays, WhatsApp messages from templates, a calendar with rotas, small groups, finances and several isolated organisations on one platform.",
            ],
          },
          figures: [
            {
              id: "dashboard",
              aspect: "4/3",
              label: { pt: "Painel", en: "Dashboard" },
              caption: { pt: "Fig. 02 — O painel com o resumo do Radar.", en: "Fig. 02 — The dashboard with the Radar summary." },
            },
            {
              id: "radar",
              aspect: "3/4",
              label: { pt: "Radar de Cuidado", en: "Care Radar" },
              caption: { pt: "Fig. 03 — A fila de cuidado, ordenada por risco.", en: "Fig. 03 — The care queue, ordered by risk." },
            },
          ],
        },
        // "What I learned" stays out until Iury writes it — never invent lessons.
      ],
    },
  },
  {
    slug: "via-hebraica",
    index: "P.02",
    name: "Via Hebraica",
    nameLang: "pt",
    status: "live",
    tags: ["web", "personal"],
    summary: {
      pt: "App web de estudos bíblicos com leitor, atlas, cronologia e marca-páginas.",
      en: "A Bible-study web app with a reader, atlas, timeline and bookmarks.",
    },
    // Role and tools are unconfirmed (audit question 2): leave `role` undefined.
    links: [{ label: { pt: "Ver o site", en: "Visit the site" }, href: "https://viahebraica.app" }],
    source: "audit §5",
    confirmed: false,
    // Draft: no page until Iury sends role, stack, decisions and screenshots.
    caseStudy: {
      confirmed: false,
      source: "awaiting Iury",
      chapters: [],
    },
  },
  {
    slug: "copiloto-de-parentalidade",
    index: "P.03",
    name: "Copiloto de parentalidade",
    nameLang: "pt",
    status: "in-development",
    year: 2026,
    tags: ["ai", "product"],
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
    tags: ["ai", "data", "research"],
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
    tags: ["ai", "retail"],
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
    tags: ["ai", "personalTools"],
    summary: { pt: "", en: "" },
    source: "design Homepage R02 (status provisional)",
    confirmed: false,
  },
];

/** Projects whose case study is confirmed — the only ones that get a page. */
export function getCaseStudies(): (Project & { caseStudy: CaseStudy })[] {
  return projects.filter((p): p is Project & { caseStudy: CaseStudy } => p.caseStudy?.confirmed === true);
}

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
