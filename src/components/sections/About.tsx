import type { CSSProperties } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { education, experience } from "@/content/profile";
import { gallery } from "@/content/gallery";
import type { Locale } from "@/i18n/routing";
import { SectionTitle } from "@/components/layout/SectionTitle";
import { PhotoLoop } from "@/components/media/PhotoLoop";
import { Timeline } from "./Timeline";

type Trait = { word: string; text: string };

/**
 * About — light editorial. The section name opens it ("Sobre"), then the thesis
 * and the lead; the three traits side by side; an endless photo strip; then the
 * professional experience (verified CV facts) with the career path as a timeline.
 */
export async function About() {
  const t = await getTranslations("about");
  const locale = (await getLocale()) as Locale;
  const traits = t.raw("traits") as Trait[];

  return (
    <section
      id="about"
      data-nav-id="about"
      data-surface="light"
      aria-labelledby="about-title"
      className="surface-light overflow-hidden py-(--section-space)"
    >
      <div className="page-grid items-end gap-y-8">
        <SectionTitle id="about-title" className="col-span-full">
          {t("label")}
        </SectionTitle>
        <p
          data-split
          className="col-span-4 font-display text-[clamp(1.75rem,1.25rem+2vw,3.25rem)] leading-[1.02] font-bold tracking-[-0.03em] text-balance md:col-span-7"
        >
          {t("title")}
        </p>
        <p className="col-span-4 max-w-[38ch] text-[clamp(1.0625rem,1rem+0.3vw,1.25rem)] leading-normal text-pretty md:col-span-4 md:col-start-9">
          {t("lead")}
        </p>
      </div>

      {/*
        The three traits as whole words across the page, one per row, each starting
        one column further in: the eye reads them in order without numbers. The
        sentence sits at the row's end, on the word's baseline.
      */}
      <ul className="mt-[clamp(4.5rem,8vw,8rem)] flex flex-col gap-[clamp(2.5rem,4vw,3.5rem)]">
        {traits.map((trait, i) => (
          <li key={trait.word} className="page-grid w-full items-end gap-y-4">
            <h3
              style={{ "--step": i } as CSSProperties}
              className="col-span-4 font-display text-[clamp(2.75rem,0.5rem+7.4vw,8.5rem)] leading-[0.82] font-black tracking-[-0.05em] md:col-start-[calc(1+var(--step))] md:col-end-10"
            >
              {trait.word}
            </h3>
            <p className="col-span-4 max-w-[30ch] pb-[0.35em] text-ui leading-normal text-pretty text-gray-600 md:col-span-3 md:col-start-10">
              {trait.text}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-[clamp(4.5rem,8vw,8rem)]">
        <PhotoLoop
          photos={gallery.map((p) => ({ src: p.src, width: p.width, height: p.height, alt: p.alt[locale], caption: p.caption[locale] }))}
        />
      </div>

      <Experience locale={locale} />
    </section>
  );
}

async function Experience({ locale }: { locale: Locale }) {
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
    <section className="page-grid mt-(--section-space) gap-y-14" aria-labelledby="experience-title">
      <div className="col-span-4 flex flex-col gap-6 md:col-span-4">
        <h3 id="experience-title" className="font-display text-headline-l leading-[0.98] font-bold tracking-[-0.03em] text-balance">
          {t("title")}
        </h3>
        <p className="max-w-[40ch] text-body text-pretty">{t("lead")}</p>
      </div>

      <div className="col-span-4 flex flex-col gap-[clamp(3rem,5vw,4.5rem)] md:col-span-7 md:col-start-6">
        <div className="flex flex-col gap-1">
          <p className="font-display text-headline-m font-bold tracking-[-0.02em]">{experience.role[locale]}</p>
          <p className="text-note text-[1.25rem] text-[#3f3d39]">
            {experience.employer}, {experience.period[locale]}
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <h4 className={subhead}>{t("highlights")}</h4>
          <ul className="flex flex-col gap-5">
            {experience.highlights.map((h, i) => (
              <li key={i} className="max-w-[60ch] text-[clamp(1rem,0.97rem+0.15vw,1.0625rem)] leading-[1.6] text-pretty">
                {h[locale]}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h4 className={subhead}>{t("stack")}</h4>
            <p className="text-ui leading-relaxed">{experience.stack.daily.join(", ")}.</p>
            <h4 className={`${subhead} mt-6`}>{t("learning")}</h4>
            <p className="text-ui leading-relaxed text-gray-600">{experience.stack.learning.join(", ")}.</p>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className={subhead}>{t("education")}</h4>
            <ul className="flex flex-col gap-5">
              {education.map((e) => (
                <li key={e.school} className="flex flex-col gap-0.5">
                  <span className="text-ui font-medium">{e.course[locale]}</span>
                  <span className="text-note text-[1.0625rem] text-[#3f3d39]">
                    {e.school}, {t("expected", { year: e.expected })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* The career path, full width: part of the page, not a side list. */}
      <div className="col-span-full flex flex-col gap-[clamp(2.5rem,5vw,4.5rem)] pt-[clamp(2rem,4vw,4rem)]">
        <h4 className="font-display text-headline-m font-bold tracking-[-0.02em]">{t("path")}</h4>
        <Timeline steps={steps} labels={timelineLabels} />
      </div>
    </section>
  );
}
