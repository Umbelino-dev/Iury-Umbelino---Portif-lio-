import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { CatObserver } from "@/components/cat/CatObserver";
import { NameMark } from "@/components/hero/NameMark";
import { anchors, viewBox } from "@/components/hero/name-paths";
import { HeroMotion } from "./HeroMotion";

/**
 * 01 · Hero. The name is the experience: "Iury / Umbelino" is lettered as one
 * SVG mark (scripts/lettering.py) where the y's stem runs straight down and
 * becomes the b's stem. y = why, b = build: "Curiosity builds" in the letters.
 *
 * The mark has a padded viewBox and no overflow masks, so no descender can clip.
 * Desktop: the statement and the cat are placed in the mark's own coordinates
 * (anchors exported by the script), so they keep their spot at every width.
 * Mobile (< 768px) has its own composition: name, then the statement with the
 * cat beside it, then the positioning line and the link.
 * Accent points: "next." and the cat's eyes (2 of 2).
 */
const [, , markW, markH] = viewBox.split(" ").map(Number) as [number, number, number, number];
/** Desktop placement, in % of the mark, straight from the lettering geometry. */
const markVars = {
  "--mark-ratio": (markW / markH).toFixed(4),
  "--stmt-left": `${anchors.line1Right + 5}%`, // a clear gap after the y's stem
  "--stmt-top": `${anchors.xHeight1}%`, // the x-height of "ury"
  "--stmt-max": `${100 - anchors.line1Right - 7}%`,
  "--o-center": `${anchors.oCenter}%`,
  "--o-bottom": `${100 - anchors.oTop}%`,
} as CSSProperties;

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
        The name comes first everywhere; the positioning line and the link sit under
        it. Mobile: the hero is as tall as its content. Desktop: a full-height poster,
        the name at the top and the line at the bottom.
      */}
      <HeroMotion className="relative z-10 mx-auto flex w-full max-w-(--container-page) flex-1 flex-col gap-12 px-(--page-margin) md:justify-between md:gap-10">
        <div className="flex flex-col gap-5">
          {/* Width also follows the viewport height (by the mark's own ratio), so the whole mark fits on short screens. */}
          <div
            data-hero-mark
            style={markVars}
            className="@container relative w-full md:w-[clamp(50%,calc((100svh-24rem)*var(--mark-ratio)),100%)]"
          >
            <h1 id="hero-name" className="text-paper">
              <span className="sr-only">Iury Umbelino</span>
              <NameMark className="block h-auto w-full" />
            </h1>
            {/*
              Mobile: the statement is its own row under the name, with the cat at the
              row's end looking up at the letters. Desktop: the row dissolves
              (md:contents) and the statement sits in the space right of "Iury".
            */}
            <div className="mt-8 flex items-end justify-between gap-6 md:contents">
              <p
                data-hero-fade-md
                className="font-display text-[clamp(1.375rem,0.95rem+2.1vw,1.625rem)] leading-[1.1] font-medium tracking-[-0.025em] text-paper md:absolute md:top-(--stmt-top) md:left-(--stmt-left) md:max-w-(--stmt-max) md:text-[max(1rem,3.5cqw)] md:leading-[1.08]"
              >
                {t("tagline.lead")}
                <br />
                {t("tagline.rest")} <span className="text-signal">{t("tagline.accent")}</span>
              </p>
              <CatObserver
                label={ta("open")}
                cursorLabel={tc("ask")}
                look="up"
                className="mb-1 aspect-[4/5] w-12 flex-none md:hidden"
              />
            </div>
            {/* Desktop: perched on the final "o" (anchors from the lettering script). */}
            <CatObserver
              label={ta("open")}
              cursorLabel={tc("ask")}
              look="left"
              className="absolute bottom-(--o-bottom) left-(--o-center) hidden aspect-[4/5] w-[max(2.75rem,7.5cqw)] -translate-x-1/2 md:block"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-x-(--page-gutter) gap-y-6 md:grid-cols-12">
          {/* Visible from the first paint (no fade): this is the mobile LCP text. */}
          <div className="col-span-4 flex flex-col gap-4 md:col-span-6 lg:col-span-5">
            <p className="text-label font-medium tracking-label text-gray-500 uppercase">{t("stack")}</p>
            <p className="max-w-[30ch] text-[clamp(1.1875rem,1rem+0.6vw,1.5rem)] leading-[1.45] md:leading-[1.35] text-pretty text-paper">
              {t("intro")}
            </p>
            <a
              href="#about"
              className="flex min-h-11 items-center gap-2.5 self-start border-b border-paper text-ui font-medium transition-colors duration-(--duration-fast) hover:border-paper-0 hover:text-paper-0"
            >
              {t("cta")} <span aria-hidden="true">↓</span>
            </a>
          </div>
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
