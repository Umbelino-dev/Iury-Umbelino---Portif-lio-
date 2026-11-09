import { getTranslations } from "next-intl/server";

type Step = { title: string; text: string };

/**
 * 06 · Approach — light editorial (Homepage R02 · N15, "a line of thought").
 * No bullets, no icons: a large numeral, a one-word verb and one sentence per step.
 * Columns step down a little at a time so the eye reads a sequence; "05 → back to 01"
 * closes the loop. Offsets only apply where the five columns sit side by side.
 */
export async function Approach() {
  const t = await getTranslations("approach");
  const steps = t.raw("steps") as Step[];
  const n = (i: number) => String(i + 1).padStart(2, "0");

  return (
    <section
      id="approach"
      data-nav-id="approach"
      data-surface="light"
      aria-labelledby="approach-title"
      className="surface-light pt-(--section-space) pb-[clamp(7.5rem,11vw,12.5rem)]"
    >
      <div className="mx-auto max-w-(--container-page) px-(--page-margin)">
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-8 pb-[clamp(3.5rem,6vw,6.5rem)]">
          <div className="flex max-w-[760px] flex-[1_1_420px] flex-col gap-6">
            <p className="text-label font-medium tracking-label text-gray-600 uppercase">{t("label")}</p>
            <h2 id="approach-title" className="font-display text-[clamp(2rem,1.5rem+2.4vw,3.75rem)] leading-[0.98] font-semibold tracking-[-0.03em]">
              {t("title")}
            </h2>
          </div>
          <p className="max-w-[34ch] flex-[0_1_300px] text-caption text-gray-600">{t("note")}</p>
        </div>

        <ol className="grid grid-cols-1 items-start gap-x-[clamp(1rem,2vw,2rem)] gap-y-12 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, i) => (
            <li
              key={step.title}
              style={{ "--step": i } as React.CSSProperties}
              className="flex flex-col gap-3.5 border-t border-ink pt-3.5 lg:mt-[calc(var(--step)*clamp(0px,3vw,3.5rem))]"
            >
              <span className="font-mono text-[11px] tracking-[0.04em] text-gray-600">
                {n(i)} → {i === steps.length - 1 ? t("back") : n(i + 1)}
              </span>
              <span aria-hidden="true" className="font-display text-[clamp(4.5rem,9vw,10rem)] leading-[0.8] font-bold tracking-[-0.05em]">
                {n(i)}
              </span>
              <h3 className="font-display text-[clamp(1.5rem,1.2rem+1vw,2.125rem)] leading-none font-semibold tracking-[-0.02em]">{step.title}</h3>
              <p className="max-w-[24ch] text-[0.875rem] leading-normal text-pretty text-[#3f3d39]">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
