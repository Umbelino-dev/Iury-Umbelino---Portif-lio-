import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getCaseStudies } from "@/content/projects";
import { site } from "@/content/profile";

export const dynamic = "force-static";

const lang = (l: string) => (l === "pt" ? "pt-BR" : l);

/** Every locale of every public page, each with its language alternates. */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", ...getCaseStudies().map((p) => `/projects/${p.slug}`)];
  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${site.url}/${locale}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.8,
      alternates: { languages: Object.fromEntries(routing.locales.map((l) => [lang(l), `${site.url}/${l}${path}`])) },
    })),
  );
}
