import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { display, sans } from "@/lib/fonts";
import { site } from "@/content/profile";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(site.url),
    title: { default: t("title"), template: `%s — ${site.name}` },
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l === "pt" ? "pt-BR" : l, `/${l}`])),
    },
    openGraph: { type: "website", locale: locale === "pt" ? "pt_BR" : "en_US", siteName: site.name },
  };
}

export const viewport: Viewport = {
  themeColor: "#101010",
  colorScheme: "dark light",
};

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale === "pt" ? "pt-BR" : "en"} className={`${display.variable} ${sans.variable}`}>
      <body className="surface-dark font-sans">
        <NextIntlClientProvider>{children as ReactNode}</NextIntlClientProvider>
      </body>
    </html>
  );
}
