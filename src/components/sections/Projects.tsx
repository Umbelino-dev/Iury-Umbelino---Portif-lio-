import { SectionTitle } from "@/components/layout/SectionTitle";
import { getLocale, getTranslations } from "next-intl/server";
import { projects } from "@/content/projects";
import type { Locale } from "@/i18n/routing";
import { StatusMark } from "@/components/layout/StatusMark";
import { ProjectImage } from "@/components/media/ProjectImage";
import { ProjectStage, type StageSlide } from "./ProjectStage";

/**
 * Frame proportions (width / height) for projects without a cover, cycled so
 * neighbours never match: the strip reads as a sequence of different objects.
 * A real cover sets its own proportion, kept between portrait 3:4 and 16:10.
 */
const FRAMES = [3 / 4, 1, 4 / 3, 3 / 4, 1] as const;

/**
 * Projects — light editorial. Projects are evidence, so they sit in daylight.
 * The index is a horizontal stage (`ProjectStage`): the project in front is named
 * at display size, the others wait in the strip. A project links out only where
 * a real destination exists (a confirmed case study, or a live product's site).
 * Unconfirmed data keeps `confirmed: false` in src/content/projects.ts.
 */
export async function Projects() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("projects");
  const ts = await getTranslations("status");
  const tt = await getTranslations("tags");
  const tc = await getTranslations("cursor");

  let placeholder = 0;
  const slides: StageSlide[] = projects.map((p, i) => {
    const status = ts(p.status);
    // A confirmed case study wins; otherwise a live product links to its site; else no link.
    const caseHref = p.caseStudy?.confirmed ? `/${locale}/projects/${p.slug}` : undefined;
    const live = caseHref ? undefined : p.links?.[0];
    const href = caseHref ?? live?.href;
    const ratio = p.cover
      ? Math.min(1.6, Math.max(0.75, p.cover.width / p.cover.height))
      : FRAMES[placeholder++ % FRAMES.length]!;
    const nameLang = p.nameLang && p.nameLang !== locale ? p.nameLang : undefined;
    const summary = p.summary[locale];

    return {
      slug: p.slug,
      name: p.name,
      nameLang,
      ratio,
      href,
      external: Boolean(live),
      cursorLabel: caseHref ? tc("project") : live ? tc("visit") : undefined,
      image: (
        <ProjectImage
          project={p}
          position={i}
          locale={locale}
          labels={{ pending: t("pending") }}
        />
      ),
      detail: (
        <article className="grid grid-cols-4 items-end gap-x-(--page-gutter) gap-y-5 md:grid-cols-12">
          <div className="col-span-4 flex flex-col gap-[clamp(0.75rem,1.2vw,1.25rem)] md:col-span-9">
            <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <StatusMark status={p.status} label={p.year ? `${status}, ${p.year}` : status} className="text-[1.25rem] text-ink" />
              <span className="text-caption text-gray-600">{p.tags.map((tag) => tt(tag)).join(", ")}</span>
            </p>
            <h3
              data-rise
              lang={nameLang}
              className="font-display text-[clamp(2.25rem,1.1rem+4.4vw,6rem)] leading-[0.94] font-bold tracking-[-0.035em] text-balance [overflow-wrap:anywhere]"
            >
              {p.name}
            </h3>
          </div>
          {(summary || href) && (
            <div className="col-span-4 flex flex-col gap-3 md:col-span-3 md:pb-[0.6em]">
              {summary && <p className="max-w-[36ch] text-ui leading-normal text-pretty text-gray-600">{summary}</p>}
              {href && (
                <a
                  href={href}
                  target={live ? "_blank" : undefined}
                  rel={live ? "noopener noreferrer" : undefined}
                  className="flex min-h-11 items-center gap-2.5 self-start font-display text-[1.125rem] font-bold tracking-[-0.01em] underline decoration-1 underline-offset-[0.3em] transition-colors duration-(--duration-fast) hover:text-gray-600"
                >
                  {live ? live.label[locale] : t("openCase")}
                  <span aria-hidden="true">{live ? "↗" : "→"}</span>
                  {live && <span className="sr-only"> ({t("visit")})</span>}
                </a>
              )}
            </div>
          )}
        </article>
      ),
    };
  });

  return (
    <section
      id="projects"
      data-nav-id="projects"
      data-surface="light"
      aria-labelledby="projects-title"
      className="surface-light overflow-hidden pt-[clamp(4rem,7vw,7.5rem)] pb-(--section-space)"
    >
      <div className="mx-auto flex max-w-(--container-page) flex-col gap-6 px-(--page-margin) pb-[clamp(2.5rem,5vw,5rem)]">
        <SectionTitle id="projects-title">{t("label")}</SectionTitle>
        <p className="max-w-[34ch] text-[0.9375rem] leading-normal text-gray-600 md:mr-[8.33%] md:self-end">{t("note")}</p>
      </div>
      <ProjectStage
        slides={slides}
        labels={{ carousel: t("listLabel"), index: t("indexLabel"), drag: tc("drag") }}
      />
    </section>
  );
}
