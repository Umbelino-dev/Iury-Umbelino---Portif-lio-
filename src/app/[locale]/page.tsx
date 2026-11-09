import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Nav } from "@/components/layout/Nav";
import { Hero } from "@/components/sections/Hero";

// Section order (CLAUDE.md): Hero → Night→Day → About → Projects → Lab → Approach → Contact.
// M1 ships Nav + Hero; the rest arrive in M2–M5.
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
      </main>
    </>
  );
}
