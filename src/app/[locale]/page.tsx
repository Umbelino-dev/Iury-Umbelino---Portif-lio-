import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Nav } from "@/components/layout/Nav";
import { Hero } from "@/components/sections/Hero";
import { DayNightTransition } from "@/components/sections/DayNightTransition";
import { About } from "@/components/sections/About";
import { Projects } from "@/components/sections/Projects";
import { Lab } from "@/components/sections/Lab";
import { Approach } from "@/components/sections/Approach";
import { Contact } from "@/components/sections/Contact";
import { CatAssistant } from "@/components/cat/CatAssistant";
import { assistantProps } from "@/components/cat/assistantProps";
import { PersonJsonLd } from "@/components/layout/PersonJsonLd";

// Section order (CLAUDE.md): Hero → Night→Day → About → Projects → Lab → Approach → Contact.
// The whole edition: Hero → Night→Day → About → Projects → Lab → Approach → Contact.
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const assistant = await assistantProps("home");

  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <DayNightTransition />
        <About />
        <Projects />
        <Lab />
        <Approach />
        <Contact />
      </main>
      <CatAssistant context="home" projectsHref={`/${locale}#projects`} {...assistant} />
      <PersonJsonLd locale={locale} />
    </>
  );
}
