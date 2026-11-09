import { hasLocale, useTranslations } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { site } from "@/content/profile";

// Milestone 0 placeholder. Sections arrive in M1–M5 (see NOTES.md).
export default function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = useTranslations("home");

  return (
    <main id="top" className="page-grid min-h-dvh content-center gap-y-8 py-24">
      <p className="col-span-full font-mono text-label uppercase text-gray-500">{t("edition")}</p>
      <h1 className="col-span-full font-display text-display-xl font-semibold md:col-span-10">
        {site.name}
      </h1>
      <p lang="en" className="col-span-full font-display text-headline-m font-semibold md:col-span-8">
        {site.tagline.lead} <span className="text-signal">{site.tagline.accent}</span>
      </p>
      <p className="col-span-full max-w-[68ch] text-lead text-gray-500 md:col-span-7">{t("status")}</p>
    </main>
  );
}
