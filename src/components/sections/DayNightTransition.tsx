import { getTranslations } from "next-intl/server";
import { Portrait } from "@/components/media/Portrait";
import { TransitionMotion } from "./TransitionMotion";

/**
 * 02 · Transition — "the page moves from possibility to evidence" (Homepage R02 · N4).
 * Daylight rises over the same frame, turning the machine reading into the real
 * portrait: the visitor meets the person before reading about him.
 *
 * Without JS (or before hydration) the two layers simply stack; TransitionMotion
 * switches them to a sticky, scroll-driven stage (CSS: `[data-transition][data-enhanced]`).
 */
export async function DayNightTransition() {
  const t = await getTranslations("transition");
  const layer =
    "relative grid min-h-dvh grid-cols-4 grid-rows-[11.5rem_1fr] gap-x-(--page-gutter) gap-y-8 px-(--page-margin) pt-24 pb-10 md:grid-cols-12 md:grid-rows-1 md:pt-26 md:pb-14";
  // Mobile: a fixed text row keeps both portrait frames at the same y ("aligned to base · Δ 0px").
  const text = "col-span-4 flex flex-col gap-5 self-start md:col-span-4 md:col-start-2 md:row-start-1";
  const label = "text-label font-medium tracking-label uppercase";
  const title = "font-display text-[clamp(2rem,1.5rem+2.4vw,3.75rem)] leading-[0.98] font-semibold tracking-[-0.03em]";
  const frame =
    "relative -mr-(--page-margin) min-h-[52vh] col-span-4 -ml-(--page-margin) md:col-span-7 md:col-start-6 md:row-start-1 md:ml-0 md:min-h-0";

  return (
    <TransitionMotion className="relative bg-ink">
      <section id="transition">
        <div data-stage className="relative">
          <div data-layer="night" data-surface="dark" data-nav-as="hero" className={`${layer} surface-dark`}>
            <div className={`${text} md:self-start md:pt-[4vh]`}>
              <p className={`${label} text-gray-500`}>{t("night.label")}</p>
              <h2 className={title}>{t("night.title")}</h2>
            </div>
            <div className={frame}>
              <Portrait variant="alternate" />
            </div>
          </div>

          <div data-layer="day" data-surface="light" data-nav-as="about" className={`${layer} surface-light`}>
            <div className={`${text} md:self-end`}>
              <p className={`${label} text-gray-600`}>{t("day.label")}</p>
              <h2 className={title}>
                {t("day.titleLead")} <span className="highlight">{t("day.titleAccent")}</span>
              </h2>
            </div>
            <div className={frame}>
              <Portrait variant="base" />
            </div>
          </div>

          {/* The horizon: rides the clip edge. Only shown on the enhanced stage. */}
          <div data-horizon aria-hidden="true" className="pointer-events-none absolute inset-0 hidden">
            <div data-horizon-line className="invisible absolute inset-x-0 top-0 h-px bg-gray-500">
              <span className={`${label} absolute bottom-2 left-(--page-margin) text-gray-500`}>{t("horizonNight")}</span>
              <span className={`${label} absolute top-2 left-(--page-margin) text-gray-600`}>{t("horizonDay")}</span>
            </div>
          </div>
        </div>
      </section>
    </TransitionMotion>
  );
}
