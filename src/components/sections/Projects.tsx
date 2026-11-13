import { SectionTitle } from "@/components/layout/SectionTitle";
import { getLocale, getTranslations } from "next-intl/server";
import { projects } from "@/content/projects";
import type { Locale } from "@/i18n/routing";
import { StatusMark } from "@/components/layout/StatusMark";
import { ProjectImage } from "@/components/media/ProjectImage";
import { ProjectList, type ProjectRow } from "./ProjectList";
import { Approach } from "./Approach";

/**
 * Projects — light editorial. Projects are evidence, so they sit in daylight.
 * Rows link out only where a real destination exists (live products); the rest
 * stay plain until their case studies ship (M4). Unconfirmed data keeps
 * `confirmed: false` in src/content/projects.ts.
 */
export async function Projects() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("projects");
  const ts = await getTranslations("status");
  const tt = await getTranslations("tags");
  const tc = await getTranslations("cursor");

  const rows: ProjectRow[] = projects.map((p, i) => {
    const status = ts(p.status);
    // A confirmed case study wins; otherwise a live product links to its site; else no link.
    const caseHref = p.caseStudy?.confirmed ? `/${locale}/projects/${p.slug}` : undefined;
    const live = caseHref ? undefined : p.links?.[0];
    return {
      slug: p.slug,
      name: p.name,
      nameLang: p.nameLang && p.nameLang !== locale ? p.nameLang : undefined,
      href: caseHref ?? live?.href,
      external: Boolean(live),
      externalLabel: t("visit"),
      cursorLabel: caseHref ? tc("project") : live ? tc("visit") : undefined,
      summary: p.summary[locale] || undefined,
      hasCover: Boolean(p.cover),
      action: caseHref ? t("openCase") : live ? live.label[locale] : undefined,
      meta: (
        <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <StatusMark status={p.status} label={p.year ? `${status}, ${p.year}` : status} className="text-ink" />
          <span>{p.tags.map((tag) => tt(tag)).join(", ")}</span>
        </span>
      ),
      image: (
        <ProjectImage
          project={p}
          position={i}
          locale={locale}
          labels={{ pending: t("pending") }}
        />
      ),
    };
  });

  return (
    <section
      id="projects"
      data-nav-id="projects"
      data-surface="light"
      aria-labelledby="projects-title"
      className="surface-light pt-(--section-space) pb-(--section-space)"
    >
      <div className="mx-auto max-w-(--container-page) px-(--page-margin)">
        <div className="flex flex-col gap-6 pb-[clamp(2.5rem,5vw,5rem)]">
          <SectionTitle id="projects-title">{t("label")}</SectionTitle>
          <p className="max-w-[34ch] text-[max(0.9375rem,13px)] leading-normal text-gray-600 md:self-end md:mr-[8.33%]">{t("note")}</p>
        </div>
        <ProjectList rows={rows} label={t("listLabel")} />
        {/* Second part: how the work is made (Approach lives inside Projects). */}
        <Approach />
      </div>
    </section>
  );
}
