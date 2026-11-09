import { getTranslations } from "next-intl/server";
import { site } from "@/content/profile";
import { CatObserver } from "@/components/cat/CatObserver";
import { HeroMotion } from "./HeroMotion";

/**
 * 01 · Hero — dark editorial (Homepage R02).
 * The name is split over two lines with the tagline beside "Iury"; tension comes
 * from scale (~6:1). Accent points: "next." and the cat's eyes — 2 of 2.
 *
 * Mobile-first: on 4 columns the cat sits beside "Iury" (the short word) because
 * "Umbelino" at display size fills the width; from md it moves beside "Umbelino".
 */
export async function Hero() {
  const t = await getTranslations("hero");
  const nameLine =
    "block font-display font-bold leading-[0.86] tracking-[-0.045em] text-[clamp(4rem,20.5vw,6.5rem)] md:text-[clamp(4.5rem,17.5vw,15.75rem)]";

  return (
    <section
      id="hero"
      data-nav-id="hero"
      data-surface="dark"
      aria-labelledby="hero-name"
      className="relative isolate flex min-h-dvh flex-col justify-end overflow-hidden bg-ink pt-24 pb-6 text-paper md:pt-28"
    >
      <HeroBackdrop />

      <HeroMotion className="relative z-10 mx-auto flex w-full max-w-(--container-page) flex-col gap-[clamp(1.25rem,2.4vw,2.5rem)] px-(--page-margin)">
        {/* Intro (top-left, away from the name) + edition metadata */}
        <div className="grid grid-cols-4 gap-x-(--page-gutter) gap-y-6 md:grid-cols-12">
          <div data-hero-fade className="col-span-4 flex flex-col gap-5 md:col-span-6 lg:col-span-5">
            <p className="max-w-[44ch] text-[clamp(1rem,0.9rem+0.45vw,1.1875rem)] leading-[1.55] text-pretty text-paper-300">
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
            className="col-span-4 flex flex-col gap-1.5 text-label font-medium tracking-label text-gray-500 uppercase md:col-span-4 md:col-start-9 md:items-end md:text-right"
          >
            <span>{t("edition")}</span>
            <span>{t("topics")}</span>
          </p>
        </div>

        {/* The name. h1 reads "Iury Umbelino"; the visual "Umbelino" line is aria-hidden. */}
        <div className="flex flex-col">
          <div className="grid grid-cols-4 items-end gap-x-(--page-gutter) md:grid-cols-12">
            <div className="col-span-4 flex items-end justify-between gap-4 md:col-span-6">
              <h1 id="hero-name" className="overflow-hidden pb-[0.04em]">
                <span data-hero-line className={nameLine}>
                  Iury
                </span>
                <span className="sr-only"> Umbelino</span>
              </h1>
              <CatObserver className="mb-[0.4rem] aspect-[4/5] w-16 flex-none md:hidden" />
            </div>
            <p
              lang="en"
              className="col-span-4 order-last mt-5 overflow-hidden font-display text-[clamp(1.75rem,1.2rem+2.4vw,3.75rem)] leading-none font-semibold tracking-[-0.025em] md:order-none md:col-span-6 md:mt-0 md:mb-[2.4vw]"
            >
              <span data-hero-line className="block pb-[0.08em]">
                {site.tagline.lead}
                <br />
                what comes <span className="text-signal">next.</span>
              </span>
            </p>
            <div aria-hidden="true" className="col-span-4 flex items-end gap-[clamp(0.75rem,1.6vw,1.75rem)] md:col-span-12">
              <span data-cat-ignore className="overflow-hidden pb-[0.04em]">
                <span data-hero-line className={nameLine}>
                  Umbelino
                </span>
              </span>
              <CatObserver className="mb-[2.2vw] hidden aspect-[4/5] w-[clamp(4rem,8.5vw,8.75rem)] flex-none md:block" />
            </div>
          </div>
        </div>

        <div
          data-hero-fade
          className="flex justify-between gap-4 border-t border-[#2a2a2a] pt-3.5 text-label font-medium tracking-label text-gray-500 uppercase"
        >
          <span>{t("index")}</span>
          <span aria-hidden="true">{t("scroll")}</span>
        </div>
      </HeroMotion>
    </section>
  );
}

/** Atmosphere: blueprint grid, coordinates, soft light, grain, vignette. Decorative only. */
function HeroBackdrop() {
  const grain =
    "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute -top-44 -right-[6%] h-[420px] w-[62%] bg-[radial-gradient(ellipse_50%_50%_at_60%_50%,rgba(243,241,235,0.11),rgba(243,241,235,0.035)_45%,transparent_72%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_68%_52%,rgba(243,241,235,0.075),rgba(243,241,235,0.02)_45%,transparent_75%)]" />
      <div className="hero-grid absolute inset-0" />
      <div className="absolute inset-0 hidden font-mono text-[10px] tracking-[0.06em] text-gray-600 md:block">
        <span className="absolute top-[31%] left-[58.33%] flex gap-2"><span className="text-gray-500">+</span>x.07 / y.03</span>
        <span className="absolute top-[16%] left-[83.33%] flex gap-2"><span className="text-gray-500">+</span>x.11 / y.01</span>
        <span className="absolute top-[47%] left-[33.33%] flex gap-2"><span className="text-gray-500">+</span>x.05 / y.04</span>
      </div>
      <div className="absolute inset-0 opacity-[0.07] mix-blend-screen" style={{ backgroundImage: grain, backgroundSize: "240px 240px" }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_85%_at_55%_45%,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}
