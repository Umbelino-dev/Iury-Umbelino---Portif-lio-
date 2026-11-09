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

// Section order (CLAUDE.md): Hero → Night→Day → About → Projects → Lab → Approach → Contact.
// M3: everything up to Approach. Contact and the cat assistant arrive in M5.
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

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
      </main>
    </>
  );
}
