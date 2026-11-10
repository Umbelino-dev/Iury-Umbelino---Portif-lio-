import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { display, sans, serif } from "@/lib/fonts";
import { site } from "@/content/profile";
import { Cursor } from "@/components/layout/Cursor";
import { SplitReveal } from "@/components/layout/SplitReveal";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(site.url),
    title: { default: t("title"), template: `%s · ${site.name}` },
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l === "pt" ? "pt-BR" : l, `/${l}`])),
    },
    openGraph: {
      type: "website",
      locale: locale === "pt" ? "pt_BR" : "en_US",
      alternateLocale: locale === "pt" ? "en_US" : "pt_BR",
      siteName: site.name,
      title: t("title"),
      description: t("description"),
      url: `/${locale}`,
      images: [{ url: `/og-image-${locale}.png`, width: 1200, height: 630, alt: t("ogAlt") }],
    },
    twitter: { card: "summary_large_image", title: t("title"), description: t("description"), images: [`/og-image-${locale}.png`] },
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
  const t = await getTranslations({ locale, namespace: "nav" });

  return (
    <html
      lang={locale === "pt" ? "pt-BR" : "en"}
      className={`${display.variable} ${sans.variable} ${serif.variable}`}
      // The inline script below adds `js` before hydration.
      suppressHydrationWarning
    >
      <head>
        {/* Marks JS support before first paint, so entrance start states never hide content without JS. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="surface-dark font-sans">
        <a
          href="#main"
          className="sr-only z-50 focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:bg-paper focus:px-4 focus:py-3 focus:text-ink"
        >
          {t("skip")}
        </a>
        <NextIntlClientProvider>{children as ReactNode}</NextIntlClientProvider>
        <Cursor />
        <SplitReveal />
      </body>
    </html>
  );
}
