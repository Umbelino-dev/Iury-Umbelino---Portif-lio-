import { getTranslations } from "next-intl/server";
import { site } from "@/content/profile";
import { CatObserver } from "@/components/cat/CatObserver";
import { NameMark } from "@/components/hero/NameMark";
import { HeroMotion } from "./HeroMotion";

/**
 * 01 · Hero. The name is the experience: "Iury / Umbelino" is lettered as one
 * SVG mark (scripts/lettering.py) where the y's tail runs into the b's stem.
 * y = why, b = build: "Curiosity builds" written into the letters.
 *
 * The mark has a padded viewBox and no overflow masks, so no descender can clip.
 * The statement and the cat are placed in the mark's own coordinates (container
 * query units), so they keep their spot at every width: the statement in the
 * space right of "Iury", the cat perched on the final "o".
 * Accent points: "next." and the cat's eyes (2 of 2).
 */
export async function Hero() {
  const t = await getTranslations("hero");
  const ta = await getTranslations("assistant.ui");
  const tc = await getTranslations("cursor");

  return (
    <section
      id="hero"
      data-nav-id="hero"
      data-surface="dark"
      aria-labelledby="hero-name"
      className="relative isolate flex flex-col overflow-hidden bg-ink pt-24 pb-14 text-paper md:min-h-dvh md:pt-28 md:pb-6"
    >
      <HeroBackdrop />

      {/*
        Mobile: the name comes first and the hero is as tall as its content, so the
        mark leads and About peeks in below. Desktop: a full-height poster with the
        positioning line at the top and the name at the bottom.
      */}
      <HeroMotion className="relative z-10 mx-auto flex w-full max-w-(--container-page) flex-1 flex-col gap-10 px-(--page-margin) md:justify-between">
        <div className="flex flex-col gap-5 md:order-2">
          {/* Width also follows the viewport height, so the whole mark fits on short screens. */}
          <div data-hero-mark className="@container relative w-full md:w-[clamp(50%,calc((100svh-24rem)*2.18),100%)]">
            <h1 id="hero-name" className="text-paper">
              <span className="sr-only">Iury Umbelino</span>
              <NameMark className="block h-auto w-full" />
            </h1>
            {/* Right of "Iury": the mark's line 1 ends at 48% of its width. */}
            <p
              lang="en"
              data-hero-fade
              className="absolute top-[11%] left-[53%] max-w-[44%] font-serif text-[max(1rem,4.4cqw)] leading-[1.02] tracking-[-0.01em] text-paper italic"
            >
              {site.tagline.lead}
              <br />
              what comes <span className="text-signal">next.</span>
            </p>
            {/* Perched on the final "o" (centre 93%, top 64% of the mark). */}
            <CatObserver
              label={ta("open")}
              cursorLabel={tc("ask")}
              className="absolute bottom-[36%] left-[93%] aspect-[4/5] w-[max(2.75rem,7.5cqw)] -translate-x-1/2"
            />
          </div>
          <div
            data-hero-fade
            className="hidden justify-between gap-4 border-t border-[#2a2a2a] pt-3.5 text-label font-medium tracking-label text-gray-500 uppercase md:flex"
          >
            <span>{t("index")}</span>
            <span aria-hidden="true">{t("scroll")}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-x-(--page-gutter) gap-y-6 md:order-1 md:grid-cols-12">
          {/* Visible from the first paint (no fade): this is the mobile LCP text. */}
          <div className="col-span-4 flex flex-col gap-4 md:col-span-6 lg:col-span-5">
            <p className="text-label font-medium tracking-label text-gray-500 uppercase">{t("stack")}</p>
            <p className="max-w-[30ch] text-[clamp(1.1875rem,1rem+0.6vw,1.5rem)] leading-[1.35] text-pretty text-paper">
              {t("intro")}
            </p>
            <a
              href="#about"
              className="flex min-h-11 items-center gap-2.5 self-start border-b border-paper text-ui font-medium transition-colors duration-(--duration-fast) hover:border-paper-0 hover:text-paper-0"
            >
              {t("cta")} <span aria-hidden="true">↓</span>
            </a>
          </div>
          <p
            data-hero-fade
            className="col-span-4 hidden flex-col gap-1.5 text-label font-medium tracking-label text-gray-500 uppercase md:col-span-4 md:col-start-9 md:flex md:items-end md:text-right"
          >
            <span>{t("edition")}</span>
            <span>{t("topics")}</span>
          </p>
        </div>
      </HeroMotion>
    </section>
  );
}

/** Atmosphere: blueprint grid, soft light, grain, vignette. Decorative only. */
function HeroBackdrop() {
  const grain =
    "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute -top-44 -right-[6%] h-[420px] w-[62%] bg-[radial-gradient(ellipse_50%_50%_at_60%_50%,rgba(243,241,235,0.11),rgba(243,241,235,0.035)_45%,transparent_72%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_68%_52%,rgba(243,241,235,0.075),rgba(243,241,235,0.02)_45%,transparent_75%)]" />
      <div className="hero-grid absolute inset-0" />
      <div className="absolute inset-0 opacity-[0.07] mix-blend-screen" style={{ backgroundImage: grain, backgroundSize: "240px 240px" }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_85%_at_55%_45%,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}
