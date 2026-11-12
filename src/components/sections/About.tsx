import { getLocale, getTranslations } from "next-intl/server";
import { contacts, education, experience } from "@/content/profile";
import { gallery } from "@/content/gallery";
import type { Locale } from "@/i18n/routing";
import { SectionTitle } from "@/components/layout/SectionTitle";
import { PhotoDeck } from "@/components/media/PhotoDeck";
import { Timeline } from "./Timeline";

type Trait = { word: string; text: string };

/**
 * About — light editorial. The section name opens it ("Sobre"); right under it,
 * who Iury is in brief and what he has done (verified CV facts); then the photo
 * deck (each card tells its story); the three traits; the career path.
 */
export async function About() {
  const ta = await getTranslations("about");
  const locale = (await getLocale()) as Locale;
  const traits = ta.raw("traits") as Trait[];
  const t = await getTranslations("experience");
  const tl = await getTranslations("experience.timeline");
  const intl = locale === "pt" ? "pt-BR" : "en";
  // Small headings inside the block: Satoshi, sentence case. No eyebrow labels.
  const subhead = "font-display text-title font-bold tracking-[-0.01em]";
  // "MM.YYYY" → months since year 0, to compute each role's length.
  const month = (mmYYYY: string) => {
    const [m, y] = mmYYYY.split(".").map(Number) as [number, number];
    return y * 12 + (m - 1);
  };
  /** "04.2024" → "abril de 2024" / "April 2024". */
  const spell = (mmYYYY: string) => {
    const [m, y] = mmYYYY.split(".").map(Number) as [number, number];
    return new Intl.DateTimeFormat(intl, { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1));
  };
  const duration = (period: string) => {
    const [from, to] = period.split("–").map((p) => p.trim());
    if (!from) return "";
    if (!to) return tl("since", { date: spell(from) });
    const total = month(to) - month(from) + 1; // both months included
    const years = Math.floor(total / 12);
    const months = total % 12;
    const parts = [years ? tl("years", { n: years }) : "", months ? tl("months", { n: months }) : ""].filter(Boolean);
    return parts.join(` ${tl("and")} `);
  };
  // Oldest first: the path reads as a climb up to today.
  const steps = [...experience.path].reverse().map((s) => {
    const [from, to] = s.period.split("–").map((p) => p.trim());
    return {
      role: s.role[locale],
      org: experience.employer,
      period: to ? `${spell(from ?? "")} – ${spell(to)}` : tl("since", { date: spell(from ?? "") }),
      duration: duration(s.period),
      area: s.area[locale],
      summary: s.summary[locale],
      details: s.details.map((d) => d[locale]),
      more: s.more[locale],
      list: s.highlights ? experience.highlights.map((h) => h[locale]) : undefined,
      // The CV lists the daily tools for the current role only.
      stack: s.highlights ? experience.stack.daily : undefined,
      current: !to,
    };
  });
  const timelineLabels = { now: t("now"), seeMore: tl("seeMore"), close: tl("close"), stack: t("stack") };


  return (
    <section
      id="about"
      data-nav-id="about"
      data-surface="light"
      aria-labelledby="about-title"
      className="surface-light overflow-hidden py-(--section-space)"
    >
      <div className="page-grid gap-y-[clamp(2.5rem,5vw,4rem)]">
        <SectionTitle id="about-title" className="col-span-full">
          {ta("label")}
        </SectionTitle>

        {/* Who, in brief: the facts first, at reading-display size. */}
        <div className="col-span-4 flex flex-col gap-6 md:col-span-12 lg:col-span-6">
          <p data-split className="font-display text-[clamp(1.5rem,1.1rem+1.4vw,2.375rem)] leading-[1.1] font-bold tracking-[-0.025em] text-pretty">
            {t("lead")}
          </p>
          <div className="flex flex-col gap-1">
            <p className="font-display text-title font-bold tracking-[-0.01em]">{experience.role[locale]}</p>
            <p className="text-note text-gray-600">
              {experience.employer}, {experience.period[locale]}
            </p>
          </div>
        </div>

        {/* What he has done: every line is a CV bullet. */}
        <div className="col-span-4 flex flex-col gap-5 md:col-span-12 lg:col-span-5 lg:col-start-8 lg:pt-2">
          <h3 className={subhead}>{t("highlights")}</h3>
          <ul className="flex flex-col gap-5">
            {experience.highlights.map((h, i) => (
              <li key={i} className="max-w-[60ch] text-[clamp(1rem,0.97rem+0.15vw,1.0625rem)] leading-[1.6] text-pretty">
                {h[locale]}
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-4 grid gap-x-10 gap-y-10 sm:grid-cols-3 md:col-span-12">
          <div className="flex flex-col gap-3">
            <h3 className={subhead}>{t("stack")}</h3>
            <p className="text-ui leading-relaxed">{experience.stack.daily.join(", ")}.</p>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className={subhead}>{t("learning")}</h3>
            <p className="text-ui leading-relaxed text-gray-600">{experience.stack.learning.join(", ")}.</p>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className={subhead}>{t("education")}</h3>
            <ul className="flex flex-col gap-4">
              {education.map((e) => (
                <li key={e.school} className="flex flex-col gap-0.5">
                  <span className="text-ui font-medium">{e.course[locale]}</span>
                  <span className="text-note text-gray-600">
                    {e.school}, {t("expected", { year: e.expected })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* The photos: each card is a moment, with its story and its LinkedIn post. */}
      <div className="mt-[clamp(3.5rem,6vw,6rem)]">
        <PhotoDeck
          photos={gallery.map((p) => ({
            src: p.src,
            width: p.width,
            height: p.height,
            alt: p.alt[locale],
            caption: p.caption[locale],
            summary: p.summary?.[locale],
            story: p.story?.[locale],
            linkedin: p.linkedin && {
              url: p.linkedin.url,
              embed: p.linkedin.embed,
              also: p.linkedin.also && { label: p.linkedin.also.label[locale], url: p.linkedin.also.url },
            },
            takeaways: p.takeaways?.[locale],
            focus: p.focus,
          }))}
          labels={{
            deck: ta("gallery"),
            show: ta.raw("galleryShow") as string,
            more: ta("galleryMore"),
            hint: ta("galleryHint"),
            pending: ta("galleryPending"),
            linkedin: ta("galleryLinkedIn"),
            post: ta("galleryPost"),
            takeaways: ta("galleryTakeaways"),
            profile: ta("galleryProfile"),
            profileUrl: contacts.find((c) => c.kind === "linkedin")?.href ?? "https://www.linkedin.com/in/iuryumbelino/",
            close: ta("galleryClose"),
          }}
        />
      </div>

      {/*
        The three traits side by side, each word whole: the size follows the column's
        own width (container units), so the longest word always fits on one line.
      */}
      <ul className="page-grid mt-[clamp(3.5rem,6vw,6rem)] gap-y-12">
        {traits.map((trait) => (
          <li key={trait.word} className="@container col-span-4 flex flex-col gap-4">
            <h3 className="font-display text-[clamp(2rem,13cqw,4.25rem)] leading-[0.9] font-black tracking-[-0.045em] whitespace-nowrap">
              {trait.word}
            </h3>
            <p className="max-w-[32ch] text-ui leading-normal text-pretty text-gray-600">{trait.text}</p>
          </li>
        ))}
      </ul>

      {/* The career path, full width. */}
      <div className="page-grid mt-(--section-space)">
        <div className="col-span-full flex flex-col gap-[clamp(2.5rem,5vw,4.5rem)]">
          <h3 className="font-display text-headline-m font-bold tracking-[-0.02em]">{t("path")}</h3>
          <Timeline steps={steps} labels={timelineLabels} />
        </div>
      </div>
    </section>
  );
}
