import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import type { CaseStudy, Project } from "@/content/types";
import { StatusMark } from "@/components/layout/StatusMark";

/**
 * Case-study hero: a line in serif saying what this is, the name as h1 (≤14ch,
 * balanced), the facts (status, year, role, tags, stack) as a quiet grid with
 * serif field names, then the lead. No codes, counters or rules.
 */
export async function CaseHero({
  project,
  caseStudy,
  locale,
}: {
  project: Project;
  caseStudy: CaseStudy;
  locale: Locale;
}) {
  const t = await getTranslations("caseStudy");
  const ts = await getTranslations("status");
  const tt = await getTranslations("tags");
  const key = "text-note text-[1.0625rem] text-gray-600";
  const value = "text-[max(0.9375rem,13px)] font-medium";

  return (
    <header className="flex flex-col gap-[clamp(2rem,4vw,4rem)] px-(--page-margin) pt-[clamp(7rem,12vw,12.5rem)] pb-[clamp(2.5rem,4vw,4rem)] max-md:pr-12">
      <p className="text-note text-[1.375rem] text-[#3f3d39]">{t("label")}</p>

      <h1
        lang={project.nameLang && project.nameLang !== locale ? project.nameLang : undefined}
        className="max-w-[14ch] font-display text-[clamp(2.75rem,0.6rem+11.5vw,13.125rem)] leading-[0.86] font-bold tracking-[-0.05em] text-balance hyphens-auto [overflow-wrap:anywhere]"
      >
        {project.name}
      </h1>

      <div className="flex flex-col gap-[clamp(2rem,3vw,3rem)]">
        <dl className="grid grid-cols-2 gap-x-[clamp(1rem,2vw,2rem)] gap-y-6 md:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
          <div className="flex flex-col gap-1">
            <dt className={key}>{t("status")}</dt>
            <dd className={value}>
              <StatusMark status={project.status} label={ts(project.status)} />
            </dd>
          </div>
          {project.year && (
            <div className="flex flex-col gap-1">
              <dt className={key}>{t("year")}</dt>
              <dd className={value}>{project.year}</dd>
            </div>
          )}
          {project.role && (
            <div className="col-span-2 flex flex-col gap-1 md:col-span-1">
              <dt className={key}>{t("role")}</dt>
              <dd className={`${value} max-w-[34ch]`}>{project.role[locale]}</dd>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <dt className={key}>{t("tags")}</dt>
            <dd className={value}>{project.tags.map((tag) => tt(tag)).join(", ")}</dd>
          </div>
          {project.stack && (
            <div className="col-span-2 flex flex-col gap-1 md:col-span-1">
              <dt className={key}>{t("stack")}</dt>
              <dd className={value}>{project.stack.join(", ")}</dd>
            </div>
          )}
          {caseStudy.builtWith && (
            <div className="flex flex-col gap-1">
              <dt className={key}>{t("builtWith")}</dt>
              <dd className={value}>{caseStudy.builtWith.join(", ")}</dd>
            </div>
          )}
        </dl>
        {caseStudy.lead && <p className="max-w-[52ch] text-body text-pretty text-[#3f3d39] md:text-lead">{caseStudy.lead[locale]}</p>}
      </div>
    </header>
  );
}
