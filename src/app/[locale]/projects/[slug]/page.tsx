import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { getCaseStudies, projects } from "@/content/projects";
import { Nav } from "@/components/layout/Nav";
import { CaseHero } from "@/components/case-study/CaseHero";
import { Chapter, hasContent } from "@/components/case-study/Chapter";
import { MediaFrame } from "@/components/case-study/MediaFrame";
import { NextProject } from "@/components/case-study/NextProject";
import { ReadingProgress } from "@/components/case-study/ReadingProgress";
import { CatAssistant } from "@/components/cat/CatAssistant";
import { assistantProps } from "@/components/cat/assistantProps";
import { Footer } from "@/components/layout/Footer";

// Only confirmed case studies exist as pages; everything else is a 404 at build time.
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => getCaseStudies().map((p) => ({ locale, slug: p.slug })));
}

function find(slug: string) {
  return getCaseStudies().find((p) => p.slug === slug);
}

export async function generateMetadata({ params }: PageProps<"/[locale]/projects/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = find(slug);
  if (!hasLocale(routing.locales, locale) || !project) return {};
  const description = (project.caseStudy.lead ?? project.summary)[locale];
  return {
    title: project.name,
    description,
    alternates: {
      canonical: `/${locale}/projects/${slug}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l === "pt" ? "pt-BR" : l, `/${l}/projects/${slug}`])),
    },
    openGraph: {
      title: project.name,
      description,
      type: "article",
      url: `/${locale}/projects/${slug}`,
      images: [{ url: `/og-image-${locale}.png`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title: project.name, description, images: [`/og-image-${locale}.png`] },
  };
}

export default async function CaseStudyPage({ params }: PageProps<"/[locale]/projects/[slug]">) {
  const { locale: raw, slug } = await params;
  if (!hasLocale(routing.locales, raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);
  const project = find(slug);
  if (!project) notFound();

  const t = await getTranslations("caseStudy");
  const assistant = await assistantProps("case", slug);
  const cs = project.caseStudy;
  const chapters = cs.chapters.filter(hasContent);
  const cases = getCaseStudies();
  const next = cases[(cases.findIndex((p) => p.slug === slug) + 1) % cases.length];
  const hasNext = next && next.slug !== slug;

  return (
    <>
      <ReadingProgress />
      <Nav variant="case" />
      <main id="main" data-surface="light" className="surface-light">
        <article>
          <CaseHero project={project} caseStudy={cs} total={projects.length} locale={locale} />

          {cs.cover && (
            <figure className="flex flex-col gap-3 md:px-(--page-margin)">
              <div className="md:max-h-[86vh] md:overflow-hidden">
                <MediaFrame
                  slot={cs.cover}
                  locale={locale}
                  numeral={project.index.replace("P.", "")}
                  priority
                  spec={{ left: `${cs.cover.label[locale]} · ${project.index}`, right: `16:9 · 3200×1800 · ${t("placeholder")}` }}
                />
              </div>
              <figcaption className="px-(--page-margin) text-caption text-gray-600 max-md:pr-12 md:px-0">
                {cs.cover.caption[locale]}
              </figcaption>
            </figure>
          )}

          <div className="flex flex-col gap-[clamp(7rem,11vw,12.5rem)] pt-[clamp(6rem,9vw,10rem)]">
            {chapters.map((c, i) => (
              <Chapter key={c.id} chapter={c} number={i + 1} locale={locale} figureLabel={t("figure")} placeholder={t("placeholder")} />
            ))}

            {project.links && (
              <section aria-label={t("links")} className="px-(--page-margin) max-md:pr-12 md:grid md:grid-cols-3 md:gap-x-[clamp(1.5rem,4vw,5rem)]">
                <ul className="flex flex-col border-y border-ink md:col-span-2 md:col-start-2">
                  {project.links.map((l) => (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-14 items-center justify-between gap-4 py-4 font-display text-title font-bold transition-colors duration-(--duration-fast) hover:text-gray-600"
                      >
                        {l.label[locale]}
                        <span aria-hidden="true">↗</span>
                        <span className="sr-only"> ({t("newTab")})</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </article>

        {hasNext ? (
          <NextProject
            href={`/projects/${next.slug}`}
            eyebrow={t("next")}
            index={`${next.index} / ${String(projects.length).padStart(2, "0")}`}
            title={next.name}
            titleLang={next.nameLang && next.nameLang !== locale ? next.nameLang : undefined}
          />
        ) : (
          <NextProject href="/#projects" eyebrow={t("index")} title={t("allProjects")} />
        )}
        <div data-surface="dark" className="bg-ink px-(--page-margin) pb-8 text-paper">
          <Footer topHref="#main" />
        </div>
      </main>
      <CatAssistant context="case" projectsHref={`/${locale}#projects`} {...assistant} />
    </>
  );
}
