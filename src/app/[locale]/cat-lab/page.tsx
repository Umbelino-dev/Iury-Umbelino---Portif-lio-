import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { CatLab } from "@/components/cat/lab/CatLab";

/**
 * Cat character lab (phase 1): the rigs and their motion, isolated from the
 * portfolio for review. Not linked from the site, not in the sitemap, noindex.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "Cat lab",
  robots: { index: false, follow: false },
};

export default async function CatLabPage({ params }: PageProps<"/[locale]/cat-lab">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <CatLab />;
}
