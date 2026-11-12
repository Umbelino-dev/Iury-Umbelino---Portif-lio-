import type { Localized } from "./types";
import { portrait } from "./portrait";

/**
 * Photos for the About carousel (PhotoLoop). Real photos of Iury only.
 * To add one: put the source in assets/media/, add it to scripts/images.mjs,
 * run `npm run images`, then add an entry here with its width/height and an alt
 * text that describes only what is in the picture. Photos with other people:
 * only with their consent. `summary`, `story`, `takeaways` and `linkedin` stay
 * undefined until there is a source: the card then says its story is coming, never
 * invents one. Post links per Iury (2026-11-12): CRIO Conecta last day dDd-BCfN,
 * second day dQYGyAR3; Startup Weekend dqdj2qYm. The event takeaways were drafted from Iury's own posts (2026-11-12)
 * and await his review; the academic side is not in the posts, so it is not here.
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
  linkedin?: {
    url: string;
    embed?: string;
    /** Another post about the same moment (e.g. a second day), shown as a text link. */
    also?: { label: Localized; url: string };
  };
  /**
   * What the moment added to Iury, professionally and academically: short points,
   * drawn only from what he wrote about it (his posts). Not a copy of the post.
   */
  takeaways?: Localized<string[]>;
  /** CSS object-position for the card crop (default "50% 18%", a portrait's face). */
  focus?: string;
}

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
    linkedin: { url: "https://lnkd.in/p/dqdj2qYm" },
    takeaways: {
      pt: [
        "Validar o problema vem antes de construir a solução: é preciso provar que outras pessoas sentem a mesma dor, não só eu.",
        "Trabalhar em um time formado na hora, com gente que eu nunca tinha visto, num sábado das 8h às 22h.",
      ],
      en: [
        "Validating the problem comes before building the solution: you have to prove other people feel the same pain, not just you.",
        "Working in a team formed on the spot, with people I had never met, on a Saturday from 8 am to 10 pm.",
      ],
    },
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
    linkedin: {
      url: "https://lnkd.in/p/dDd-BCfN",
      also: { label: { pt: "Ver o post do segundo dia", en: "View the day-two post" }, url: "https://lnkd.in/p/dQYGyAR3" },
    },
    takeaways: {
      pt: [
        "Ver a Inteligência Artificial aplicada em empresas, com casos reais, e não só como promessa.",
        "Conversar com profissionais da linha de frente antes, durante e depois das palestras. É o tipo de troca que faz diferença para quem está começando na tecnologia.",
        "Sair com vontade de colocar em prática o que vi.",
      ],
      en: [
        "Seeing Artificial Intelligence applied in companies, with real cases, not just as a promise.",
        "Talking with people on the front line before, during and after the talks. It is the kind of exchange that matters to someone starting out in tech.",
        "Leaving eager to put what I saw into practice.",
      ],
    },
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
    story: {
      pt: "O pitch do AutonomIA ficou comigo, e o passador de slides parou de funcionar justo na minha vez.",
      en: "I gave the AutonomIA pitch, and the slide clicker stopped working right on my turn.",
    },
    linkedin: { url: "https://lnkd.in/p/dqdj2qYm" },
    takeaways: {
      pt: [
        "Apresentar sem o cenário ideal me ensinou mais do que um pitch perfeito ensinaria.",
        "Saí mais seguro para apresentar projetos e sabendo exatamente onde preciso melhorar.",
      ],
      en: [
        "Presenting without the ideal setting taught me more than a perfect pitch would have.",
        "I left more confident presenting projects and knowing exactly where I need to improve.",
      ],
    },
  },
  {
    src: portrait.base.src ?? "",
    width: portrait.base.width,
    height: portrait.base.height,
    alt: portrait.base.alt,
    caption: { pt: "Retrato", en: "Portrait" },
  },
].filter((p) => p.src);
