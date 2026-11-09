import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import type { CaseStudy, Project } from "@/content/types";
import { StatusMark } from "@/components/layout/StatusMark";

/**
 * Case-study hero (Case Study R01 · C1, Mobile · M2): section label and position,
 * the name as h1 (≤14ch, balanced), a metadata rule — status, year, role, tags —
 * and the lead. On mobile the metadata is a 2×2 grid over a 1px rule.
 */
export async function CaseHero({
  project,
  caseStudy,
  total,
  locale,
}: {
  project: Project;
  caseStudy: CaseStudy;
  total: number;
  locale: Locale;
}) {
  const t = await getTranslations("caseStudy");
  const ts = await getTranslations("status");
  const tt = await getTranslations("tags");
  const key = "font-mono text-[11px] tracking-[0.04em] text-gray-600 uppercase";
  const value = "text-[0.9375rem] font-medium";

  return (
    <header className="flex flex-col gap-[clamp(2rem,4vw,4rem)] px-(--page-margin) pt-[clamp(7rem,12vw,12.5rem)] pb-[clamp(2.5rem,4vw,4rem)] max-md:pr-12">
      <div className="flex flex-wrap justify-between gap-4 text-label font-medium tracking-label text-gray-600 uppercase">
        <span>{t("label")}</span>
        <span className="font-mono text-[11px] tracking-[0.04em] normal-case">
          {project.index} / {String(total).padStart(2, "0")}
        </span>
      </div>

      <h1
        lang={project.nameLang && project.nameLang !== locale ? project.nameLang : undefined}
        className="max-w-[14ch] font-display text-[clamp(2.75rem,0.6rem+11.5vw,13.125rem)] leading-[0.86] font-bold tracking-[-0.05em] text-balance hyphens-auto [overflow-wrap:anywhere]"
      >
        {project.name}
      </h1>

      <div className="flex flex-col gap-6 border-t border-ink pt-4.5">
        <dl className="grid grid-cols-2 gap-x-[clamp(1rem,2vw,2rem)] gap-y-6 md:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
          <div className="flex flex-col gap-2">
            <dt className={key}>{t("status")}</dt>
            <dd className={value}>
              <StatusMark status={project.status} label={ts(project.status)} />
            </dd>
          </div>
          {project.year && (
            <div className="flex flex-col gap-2">
              <dt className={key}>{t("year")}</dt>
              <dd className={value}>{project.year}</dd>
            </div>
          )}
          {project.role && (
            <div className="col-span-2 flex flex-col gap-2 md:col-span-1">
              <dt className={key}>{t("role")}</dt>
              <dd className={`${value} max-w-[34ch]`}>{project.role[locale]}</dd>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <dt className={key}>{t("tags")}</dt>
            <dd className={value}>{project.tags.map((tag) => tt(tag)).join(", ")}</dd>
          </div>
          {project.stack && (
            <div className="col-span-2 flex flex-col gap-2 md:col-span-1">
              <dt className={key}>{t("stack")}</dt>
              <dd className={value}>{project.stack.join(" · ")}</dd>
            </div>
          )}
          {caseStudy.builtWith && (
            <div className="flex flex-col gap-2">
              <dt className={key}>{t("builtWith")}</dt>
              <dd className={value}>{caseStudy.builtWith.join(" · ")}</dd>
            </div>
          )}
        </dl>
        {caseStudy.lead && <p className="max-w-[52ch] text-body text-pretty text-[#3f3d39] md:text-lead">{caseStudy.lead[locale]}</p>}
      </div>
    </header>
  );
}
