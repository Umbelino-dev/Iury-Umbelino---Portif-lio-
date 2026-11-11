import { SectionTitle } from "@/components/layout/SectionTitle";
import { getTranslations } from "next-intl/server";

type Step = { title: string; text: string };

/**
 * 06 · Approach — light editorial (Homepage R02 · N15, "a line of thought").
 * No bullets, numbers or rules: a one-word verb in Satoshi Black and one sentence
 * per step. Columns step down a little at a time so the eye reads the order on
 * its own. Offsets only apply where the five columns sit side by side.
 */
export async function Approach() {
  const t = await getTranslations("approach");
  const steps = t.raw("steps") as Step[];

  return (
    <section
      id="approach"
      data-nav-id="approach"
      data-surface="light"
      aria-labelledby="approach-title"
      className="surface-light pt-(--section-space) pb-[clamp(7.5rem,11vw,12.5rem)]"
    >
      <div className="mx-auto max-w-(--container-page) px-(--page-margin)">
        <SectionTitle id="approach-title" className="pb-[clamp(2rem,3.5vw,3.5rem)]">
          {t("label")}
        </SectionTitle>
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-8 pb-[clamp(3.5rem,6vw,6.5rem)]">
          <div className="flex max-w-[760px] flex-[1_1_420px] flex-col gap-6">
            <p data-split className="font-display text-[clamp(1.75rem,1.25rem+2vw,3.25rem)] leading-[1.02] font-bold tracking-[-0.03em] text-balance">
              {t("title")}
            </p>
          </div>
          <p className="max-w-[34ch] flex-[0_1_300px] text-caption text-gray-600">{t("note")}</p>
        </div>

        <ol className="grid grid-cols-1 items-start gap-x-[clamp(1rem,2vw,2rem)] gap-y-12 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, i) => (
            <li
              key={step.title}
              style={{ "--step": i } as React.CSSProperties}
              className="flex flex-col gap-4 lg:mt-[calc(var(--step)*clamp(0px,3.4vw,4rem))]"
            >
              <h3 className="font-display text-[clamp(2rem,1.2rem+3.4vw,3rem)] leading-[0.95] font-black tracking-[-0.04em] lg:text-[clamp(1.5rem,0.4rem+1.75vw,2.25rem)]">{step.title}</h3>
              <p className="max-w-[24ch] text-ui leading-normal text-pretty text-[#3f3d39]">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
