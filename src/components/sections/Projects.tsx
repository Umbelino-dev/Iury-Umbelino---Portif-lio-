import { CHAPTERS, CHAPTER_TOTAL, SectionMarker } from "@/components/layout/SectionMarker";
import { getLocale, getTranslations } from "next-intl/server";
import { projects } from "@/content/projects";
import type { Locale } from "@/i18n/routing";
import { StatusMark } from "@/components/layout/StatusMark";
import { ProjectImage } from "@/components/media/ProjectImage";
import { ProjectList, type ProjectRow } from "./ProjectList";

/**
 * 04 · Projects — light editorial. Projects are evidence, so they sit in daylight.
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
      index: p.index,
      name: p.name,
      nameLang: p.nameLang && p.nameLang !== locale ? p.nameLang : undefined,
      href: caseHref ?? live?.href,
      external: Boolean(live),
      externalLabel: t("visit"),
      cursorLabel: caseHref ? tc("project") : live ? tc("visit") : undefined,
      meta: (
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <StatusMark status={p.status} label={status} className="text-ink" />
          {p.year && (
            <>
              <span aria-hidden="true">·</span>
              <span>{p.year}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>{p.tags.map((tag) => tt(tag)).join(", ")}</span>
        </span>
      ),
      image: (
        <ProjectImage
          project={p}
          position={i}
          locale={locale}
          labels={{ image: t("image"), placeholder: t("placeholder"), status }}
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
      className="surface-light pt-[clamp(4rem,7vw,7.5rem)] pb-(--section-space)"
    >
      <div className="mx-auto max-w-(--container-page) px-(--page-margin)">
        <div className="flex flex-col gap-6 pb-[clamp(2.5rem,5vw,5rem)]">
          <SectionMarker index={CHAPTERS.projects} total={CHAPTER_TOTAL} label={t("label")} as="h2" id="projects-title" />
          <p className="max-w-[34ch] self-end text-caption text-gray-600 md:mr-[8.33%]">{t("note")}</p>
        </div>
        <ProjectList rows={rows} label={t("listLabel")} />
      </div>
    </section>
  );
}
