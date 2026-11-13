import { getTranslations } from "next-intl/server";
import { SectionTitle } from "@/components/layout/SectionTitle";
import { ApproachSteps, type ApproachStep } from "./ApproachSteps";

/**
 * Approach — the second part of Projects (Iury, 2026-11-13): how the work is
 * made, right after the work itself. Not a section of its own (no nav item, no
 * surface change): an h3 inside #projects with its own anchor, `#approach`.
 * The five steps are one interactive flow (ApproachSteps): a line that fills to
 * the active step, an arc from the last step back to the first, and each step's
 * techniques (Iury's own list).
 */
export async function Approach() {
  const t = await getTranslations("approach");
  const steps = t.raw("steps") as ApproachStep[];

  return (
    <div id="approach" aria-labelledby="approach-title" role="region" className="scroll-mt-24 pt-(--section-space)">
      <div className="flex flex-col gap-4 pb-[clamp(2.5rem,5vw,4.5rem)]">
        <SectionTitle id="approach-title" as="h3">
          {t("label")}
        </SectionTitle>
        <p className="max-w-[24ch] font-display text-[clamp(1.5rem,1.1rem+1.6vw,2.5rem)] leading-[1.05] font-bold tracking-[-0.03em] text-balance">
          {t("title")}
        </p>
        <p className="max-w-[44ch] text-ui text-gray-600">{t("hint")}</p>
      </div>
      <ApproachSteps
        steps={steps}
        labels={{
          steps: t("stepsLabel"),
          stepOf: t("stepOf"),
          next: t("next"),
          restart: t("restart"),
          loop: t("loop"),
          techniques: t("techniques"),
        }}
      />
    </div>
  );
}
