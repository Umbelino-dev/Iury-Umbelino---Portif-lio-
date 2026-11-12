import type { Localized } from "./types";
import { portrait } from "./portrait";

/**
 * Photos for the About carousel (PhotoLoop). Real photos of Iury only.
 * To add one: put the source in assets/media/, add it to scripts/images.mjs,
 * run `npm run images`, then add an entry here with its width/height and an alt
 * text that describes only what is in the picture. Photos with other people:
 * only with their consent. `summary`, `story` and `linkedin` stay undefined until
 * Iury writes them: the card then says its story is coming, never invents one.
 */
export interface GalleryPhoto {
  src: string;
  width: number;
  height: number;
  alt: Localized;
  caption: Localized;
  /** One or two lines, shown in the box that rises from the pointer on hover. */
  summary?: Localized;
  /** The longer story, shown when the card is opened ("Saber mais"). */
  story?: Localized;
  /**
   * The LinkedIn post about this moment. `url` is the post's public link (the
   * "Ver no LinkedIn" button); `embed` is LinkedIn's embed URL for the same post
   * (Share → Embed this post → the iframe's src,
   * https://www.linkedin.com/embed/feed/update/urn:li:share:…).
   */
  linkedin?: { url: string; embed?: string };
  /** The LinkedIn post's own text (Iury's words, verbatim), one string per paragraph. */
  post?: Localized<string[]>;
  /** CSS object-position for the card crop (default "50% 18%", a portrait's face). */
  focus?: string;
}

/** Post: Startup Weekend (Iury's LinkedIn, Nov 2026). Hashtags left out. */
const startupWeekendPost: Localized<string[]> = {
  pt: [
    "Descobri que a parte mais difícil de criar uma startup não é construir. É validar se o problema que você quer resolver é realmente um problema.",
    "No STARTUP WEEKEND, o que decidimos resolver era a desorganização e o esquecimento no dia a dia. Nasceu o AutonomIA, um organizador de tarefas com IA que lembra você pelo WhatsApp. Parece óbvio até você ter que provar que outras pessoas sentem a mesma dor, e não só você.",
    "Foram manhãs acordando cedo para pegar o ônibus. Um sábado que começou às 8h e terminou às 22h, com ideias que ainda me acompanharam pela madrugada. E um time formado por pessoas que eu nunca tinha visto na vida.",
    "Obrigado à minha equipe por confiar o pitch a mim. Responsabilidade que pesa, mas que ensina muito. E o pitch teve seu imprevisto: o passador de slides parou de funcionar justo na minha vez, e alguns slides acabaram pulados. Não foi como ensaiamos, mas apresentar sem o cenário ideal me ensinou mais do que um pitch perfeito ensinaria.",
    "Obrigado a todos que organizaram e ajudaram durante o evento. Obrigado à Betha Sistemas por disponibilizar todo o ambiente. Saio mais seguro para apresentar projetos e sabendo exatamente onde preciso melhorar.",
  ],
  en: [
    "I found out that the hardest part of creating a startup isn't building it. It's validating whether the problem you want to solve is really a problem.",
    "At STARTUP WEEKEND, we decided to tackle disorganisation and forgetfulness in everyday life. That's how AutonomIA was born, an AI task organiser that reminds you over WhatsApp. It sounds obvious until you have to prove that other people feel the same pain, not just you.",
    "It meant early mornings to catch the bus. A Saturday that started at 8 am and ended at 10 pm, with ideas that kept me company into the night. And a team of people I had never met before.",
    "Thank you to my team for trusting me with the pitch. A responsibility that weighs, but teaches a lot. And the pitch had its surprise: the slide clicker stopped working right on my turn, and some slides got skipped. It wasn't how we rehearsed, but presenting without the ideal setting taught me more than a perfect pitch would have.",
    "Thank you to everyone who organised and helped during the event. Thank you to Betha Sistemas for providing the whole space. I leave more confident presenting projects and knowing exactly where I need to improve.",
  ],
};

/** Post: CRIO Conecta (Iury's LinkedIn, 30 Oct 2026). The list of people met is left out. */
const crioPost: Localized<string[]> = {
  pt: [
    "Ontem (29/10/2026) foi o último dia do CRIO Conecta, e que fechamento!",
    "Foi falado muito sobre a Inteligência Artificial nas empresas: os benefícios que ela pode trazer e, principalmente, os que já trouxe na prática, com cases reais de quem está aplicando no dia a dia.",
    "Mais do que as palestras, o que me marcou foram as conversas. Tive a oportunidade de trocar ideias antes e depois das falas, e de tirar dúvidas antes, durante e depois, sempre com muita abertura e generosidade de quem está na linha de frente. Isso faz toda a diferença para quem está começando a carreira em tecnologia, como eu.",
    "Saí de lá inspirado e com muita vontade de colocar em prática tudo o que vi. Que venham as próximas edições!",
  ],
  en: [
    "Yesterday (29/10/2026) was the last day of CRIO Conecta, and what a finish!",
    "There was a lot of talk about Artificial Intelligence in companies: the benefits it can bring and, above all, the ones it has already brought in practice, with real cases from people applying it every day.",
    "More than the talks, what stayed with me were the conversations. I got to exchange ideas before and after the sessions, and to ask questions before, during and after, always met with great openness and generosity from people on the front line. That makes all the difference for someone starting a career in tech, like me.",
    "I left inspired and eager to put everything I saw into practice. Here's to the next editions!",
  ],
};

export const gallery: GalleryPhoto[] = [
  {
    src: "/media/startup-weekend-team.webp",
    width: 800,
    height: 600,
    focus: "50% 40%",
    alt: {
      pt: "Iury no centro de um grupo de seis pessoas, quase todas de camiseta verde e crachá do T.S.W., num espaço de trabalho.",
      en: "Iury at the centre of a group of six people, most in green T-shirts and T.S.W. badges, in a workspace.",
    },
    caption: { pt: "O time do AutonomIA", en: "The AutonomIA team" },
    summary: {
      pt: "Startup Weekend: um time que nunca tinha se visto, um sábado das 8h às 22h e o pitch do AutonomIA.",
      en: "Startup Weekend: a team of strangers, a Saturday from 8 am to 10 pm and the AutonomIA pitch.",
    },
    story: {
      pt: "No Startup Weekend, o time criou o AutonomIA, um organizador de tarefas com IA que lembra você pelo WhatsApp. O pitch ficou comigo.",
      en: "At Startup Weekend, the team created AutonomIA, an AI task organiser that reminds you over WhatsApp. I gave the pitch.",
    },
    post: startupWeekendPost,
  },
  {
    src: "/media/crio-conecta.webp",
    width: 480,
    height: 852,
    focus: "50% 35%",
    alt: {
      pt: "Selfie de Iury sorrindo ao lado de um homem de terno que faz sinal de positivo, num auditório.",
      en: "Selfie of Iury smiling next to a man in a suit giving a thumbs up, in an auditorium.",
    },
    caption: { pt: "CRIO Conecta", en: "CRIO Conecta" },
    summary: {
      pt: "IA nas empresas, com cases reais. O que mais marcou foram as conversas com quem está na linha de frente.",
      en: "AI in companies, with real cases. What stayed with me were the conversations with people on the front line.",
    },
    story: {
      pt: "No último dia do CRIO Conecta, em 29 de outubro de 2026, o tema foi a Inteligência Artificial nas empresas.",
      en: "On the last day of CRIO Conecta, 29 October 2026, the theme was Artificial Intelligence in companies.",
    },
    post: crioPost,
  },
  {
    src: "/media/startup-weekend.webp",
    width: 480,
    height: 720,
    focus: "50% 30%",
    alt: {
      pt: "Iury sorrindo e fazendo um sinal com a mão, com crachá do T.S.W., diante de um painel de patrocinadores do Startup Weekend.",
      en: "Iury smiling and making a hand sign, wearing a T.S.W. badge, in front of a Startup Weekend sponsor wall.",
    },
    caption: { pt: "Startup Weekend", en: "Startup Weekend" },
    summary: {
      pt: "Validar o problema é mais difícil do que construir a solução. Foi o que o fim de semana me ensinou.",
      en: "Validating the problem is harder than building the solution. That is what the weekend taught me.",
    },
    post: startupWeekendPost,
  },
  {
    src: portrait.base.src ?? "",
    width: portrait.base.width,
    height: portrait.base.height,
    alt: portrait.base.alt,
    caption: { pt: "Retrato", en: "Portrait" },
  },
].filter((p) => p.src);
