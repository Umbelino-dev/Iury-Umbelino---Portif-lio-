import { getLocale, getTranslations } from "next-intl/server";
import { education, experience } from "@/content/profile";
import { gallery } from "@/content/gallery";
import type { Locale } from "@/i18n/routing";
import { SectionTitle } from "@/components/layout/SectionTitle";
import { PhotoLoop } from "@/components/media/PhotoLoop";
import { Timeline } from "./Timeline";

type Trait = { index: string; word: [string, string]; text: string };

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

      {/* The three traits, side by side. */}
      <ul className="page-grid mt-[clamp(4.5rem,8vw,8rem)] gap-y-14">
        {traits.map((trait) => (
          <li key={trait.index} className="col-span-4 flex flex-col gap-4">
            <span className="font-mono text-[11px] tracking-[0.06em] text-gray-600">{trait.index}</span>
            <h3 className="font-display text-[clamp(2.75rem,1.9rem+3.4vw,4.75rem)] leading-[0.84] font-bold tracking-[-0.05em] [overflow-wrap:anywhere]">
              {trait.word[0]}
              <br />
              {trait.word[1]}
            </h3>
            <p className="max-w-[30ch] text-[0.9375rem] leading-normal text-pretty text-gray-600">{trait.text}</p>
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
  const listTitle = "font-mono text-[11px] tracking-[0.06em] uppercase text-gray-600";
  // Oldest first: the path reads as a progression up to today.
  const steps = [...experience.path].reverse().map((s) => ({
    role: s.role[locale],
    period: s.period,
    current: s.period.trim().endsWith("–"),
  }));

  return (
    <section className="page-grid mt-(--section-space) gap-y-14" aria-labelledby="experience-title">
      <div className="col-span-4 flex flex-col gap-6 md:col-span-4">
        <h3 id="experience-title" className="font-display text-headline-l leading-[0.98] font-bold tracking-[-0.03em] text-balance">
          {t("title")}
        </h3>
        <p className="max-w-[40ch] text-body text-pretty">{t("lead")}</p>
      </div>

      <div className="col-span-4 flex flex-col gap-14 md:col-span-7 md:col-start-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <p className="font-display text-title font-bold">
            {experience.role[locale]} · {experience.employer}
          </p>
          <p className="text-label font-medium tracking-label text-gray-600 uppercase">{experience.period[locale]}</p>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className={listTitle}>{t("highlights")}</h4>
          <ol>
            {experience.highlights.map((h, i) => (
              <li key={i} className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-b border-paper-300 py-4 text-body last:border-b-0">
                <span aria-hidden="true" className="font-mono text-[11px] leading-[1.62rem] text-gray-600">
                  E.{String(i + 1).padStart(2, "0")}
                </span>
                <span className="max-w-[60ch] text-pretty">{h[locale]}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="grid gap-14 sm:grid-cols-2">
          <div className="flex flex-col gap-6">
            <h4 className={listTitle}>{t("path")}</h4>
            <Timeline steps={steps} nowLabel={t("now")} />
          </div>

          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-3">
              <h4 className={listTitle}>{t("stack")}</h4>
              <p className="text-[0.9375rem] leading-relaxed">{experience.stack.daily.join(" · ")}</p>
              <h4 className={`${listTitle} mt-5`}>{t("learning")}</h4>
              <p className="text-[0.9375rem] leading-relaxed text-gray-600">{experience.stack.learning.join(" · ")}</p>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className={listTitle}>{t("education")}</h4>
              <ul className="flex flex-col gap-4">
                {education.map((e) => (
                  <li key={e.school} className="flex flex-col">
                    <span className="text-[0.9375rem] font-medium">{e.course[locale]}</span>
                    <span className="font-mono text-[11px] tracking-[0.04em] text-gray-600">
                      {e.school} · {t("expected", { year: e.expected })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
