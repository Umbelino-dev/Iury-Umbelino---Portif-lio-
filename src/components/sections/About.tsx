import { getLocale, getTranslations } from "next-intl/server";
import { education, experience } from "@/content/profile";
import type { Locale } from "@/i18n/routing";
import { Portrait } from "@/components/media/Portrait";
import { PortraitReveal } from "@/components/media/PortraitReveal";

type Trait = { index: string; word: [string, string]; text: string };

/**
 * 03 · About — light editorial (Homepage R02). Text in 4 columns, the portrait
 * sticky beside it; then the professional experience (verified CV facts).
 * Mobile order: intro → portrait → traits → experience.
 */
export async function About() {
  const t = await getTranslations("about");
  const locale = (await getLocale()) as Locale;
  const traits = t.raw("traits") as Trait[];
  const label = "text-label font-medium tracking-label uppercase text-gray-600";

  return (
    <section
      id="about"
      data-nav-id="about"
      data-surface="light"
      aria-labelledby="about-title"
      className="surface-light overflow-hidden py-(--section-space)"
    >
      <div className="page-grid items-start gap-y-16">
        <div className="col-span-4 flex flex-col gap-7 md:col-span-4 md:col-start-2 md:row-start-1">
          <p className={label}>{t("label")}</p>
          <h2 id="about-title" className="font-display text-[clamp(2rem,1.55rem+1.9vw,3.25rem)] leading-none font-semibold tracking-[-0.025em]">
            {t("title")}
          </h2>
          <p className="max-w-[36ch] text-[clamp(1.0625rem,1rem+0.3vw,1.25rem)] leading-normal text-pretty">{t("lead")}</p>
        </div>

        <div className="col-span-4 -mx-(--page-margin) md:sticky md:top-22 md:col-span-7 md:col-start-6 md:row-span-2 md:row-start-1 md:mr-[calc(-1*var(--page-margin))] md:ml-0">
          <div className="[&_[data-reveal-frame]]:aspect-[4/5] md:[&_[data-reveal-frame]]:aspect-auto md:[&_[data-reveal-frame]]:h-[max(520px,calc(100dvh-160px))]">
            <PortraitReveal
              base={<Portrait variant="base" />}
              alternate={<Portrait variant="alternate" />}
              caption={t("caption")}
              labels={{ showMachine: t("showMachine"), showPortrait: t("showPortrait") }}
            />
          </div>
        </div>

        <ul className="col-span-4 flex flex-col gap-[clamp(4rem,9vw,10rem)] md:col-span-4 md:col-start-2 md:row-start-2">
          {traits.map((trait) => (
            <li key={trait.index} className="flex flex-col gap-4.5">
              <span className="font-mono text-[11px] tracking-[0.06em] text-gray-600">{trait.index}</span>
              <h3 className="font-display text-[clamp(2.75rem,17vw,5rem)] leading-[0.82] font-bold tracking-[-0.05em] [overflow-wrap:anywhere] md:text-[clamp(2.75rem,6.6vw,6.25rem)]">
                {trait.word[0]}
                <br />
                {trait.word[1]}
              </h3>
              <p className="max-w-[26ch] pl-[0.4em] text-[0.875rem] leading-[1.35] text-pretty text-gray-600">{trait.text}</p>
            </li>
          ))}
        </ul>
      </div>

      <Experience locale={locale} />
    </section>
  );
}

async function Experience({ locale }: { locale: Locale }) {
  const t = await getTranslations("experience");
  const label = "text-label font-medium tracking-label uppercase text-gray-600";
  const listTitle = "font-mono text-[11px] tracking-[0.06em] uppercase text-gray-600";

  return (
    <section className="page-grid mt-(--section-space) gap-y-12" aria-labelledby="experience-title">
      <div className="col-span-4 flex flex-col gap-6 border-t border-ink pt-6 md:col-span-4 md:col-start-2">
        <p className={label}>{t("label")}</p>
        <h3 id="experience-title" className="font-display text-headline-m font-semibold">
          {t("title")}
        </h3>
        <p className="max-w-[40ch] text-body text-pretty">{t("lead")}</p>
      </div>

      <div className="col-span-4 flex flex-col gap-12 border-t border-ink pt-6 md:col-span-6 md:col-start-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <p className="font-display text-title font-semibold">
            {experience.role[locale]} · {experience.employer}
          </p>
          <p className="text-label font-medium tracking-label text-gray-600 uppercase">{experience.period[locale]}</p>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className={listTitle}>{t("highlights")}</h4>
          <ol className="border-b border-paper-300">
            {experience.highlights.map((h, i) => (
              <li key={i} className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-t border-paper-300 py-4 text-body">
                <span aria-hidden="true" className="font-mono text-[11px] leading-[1.62rem] text-gray-600">
                  E.{String(i + 1).padStart(2, "0")}
                </span>
                <span className="max-w-[60ch] text-pretty">{h[locale]}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="grid gap-10 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h4 className={listTitle}>{t("path")}</h4>
            <ol className="flex flex-col">
              {experience.path.map((step) => (
                <li key={step.period} className="flex flex-col border-t border-paper-300 py-3">
                  <span className="text-[0.9375rem] font-medium">{step.role[locale]}</span>
                  <span className="font-mono text-[11px] tracking-[0.04em] text-gray-600">{step.period}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-3">
              <h4 className={listTitle}>{t("stack")}</h4>
              <p className="border-t border-paper-300 pt-3 text-[0.9375rem] leading-relaxed">{experience.stack.daily.join(" · ")}</p>
              <h4 className={`${listTitle} mt-3`}>{t("learning")}</h4>
              <p className="border-t border-paper-300 pt-3 text-[0.9375rem] leading-relaxed text-gray-600">
                {experience.stack.learning.join(" · ")}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className={listTitle}>{t("education")}</h4>
              <ul className="flex flex-col">
                {education.map((e) => (
                  <li key={e.school} className="flex flex-col border-t border-paper-300 py-3">
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
