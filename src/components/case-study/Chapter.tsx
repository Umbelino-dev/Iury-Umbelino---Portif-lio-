import type { Locale } from "@/i18n/routing";
import type { CaseStudyChapter } from "@/content/types";
import { MediaFrame } from "./MediaFrame";

/** True when a chapter has something to show; empty chapters are never rendered. */
export function hasContent(c: CaseStudyChapter) {
  return Boolean(c.body?.pt.length || c.steps?.length || c.figures?.length);
}

/**
 * A case-study chapter (Case Study R01 · C2, Mobile · M4–M6).
 * Desktop: three columns — the label and a giant numeral, sticky while the text
 * scrolls past, then the H2 (≤15ch) and body in the other two.
 * Mobile: no sticky numeral; the mono label sits above a 32px H2, body 16/1.6,
 * text kept out of the 48px cat lane; figures run full bleed in reading order.
 */
export function Chapter({
  chapter,
  number,
  locale,
  figureLabel,
  placeholder,
}: {
  chapter: CaseStudyChapter;
  number: number;
  locale: Locale;
  figureLabel: string;
  placeholder: string;
}) {
  const n = String(number).padStart(2, "0");
  const label = `${n} — ${chapter.label[locale]}`;
  const title = chapter.title[locale];
  const mark = chapter.highlight?.[locale];
  const at = mark ? title.indexOf(mark) : -1;
  const headingId = `chapter-${chapter.id}`;

  return (
    <section id={chapter.id} aria-labelledby={headingId} className="flex flex-col gap-[clamp(3rem,5vw,5.5rem)]">
      <div className="grid grid-cols-1 items-start gap-x-[clamp(1.5rem,4vw,5rem)] gap-y-6 px-(--page-margin) max-md:pr-12 md:grid-cols-3">
        <div className="flex flex-col gap-3.5 md:sticky md:top-24">
          <p className="font-mono text-[11px] tracking-[0.04em] text-gray-600 uppercase">{label}</p>
          <span aria-hidden="true" className="hidden font-display text-[clamp(6rem,12vw,12.5rem)] leading-[0.8] font-bold tracking-[-0.05em] md:block">
            {n}
          </span>
        </div>

        <div className="flex min-w-0 flex-col gap-[clamp(1.75rem,3vw,2.75rem)] md:col-span-2">
          <h2
            id={headingId}
            className="max-w-[15ch] font-display text-[clamp(2rem,1rem+4.6vw,6rem)] leading-[0.94] font-bold tracking-[-0.04em] text-balance"
          >
            {at >= 0 && mark ? (
              <>
                {title.slice(0, at)}
                <span className="highlight">{mark}</span>
                {title.slice(at + mark.length)}
              </>
            ) : (
              title
            )}
          </h2>

          {chapter.body && (
            <div className="grid gap-x-10 gap-y-6 lg:grid-cols-2">
              {chapter.body[locale].map((para, i) => (
                <p
                  key={i}
                  className={`max-w-[60ch] text-[clamp(1rem,0.95rem+0.3vw,1.1875rem)] leading-[1.6] text-pretty ${i > 0 ? "text-[#3f3d39]" : ""}`}
                >
                  {para}
                </p>
              ))}
            </div>
          )}

          {chapter.steps && (
            <ol className="flex flex-col border-b border-ink">
              {chapter.steps.map((step, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 border-t border-ink py-[clamp(1.25rem,2.4vw,2.25rem)] md:grid-cols-[3.5rem_minmax(0,1fr)]"
                >
                  <span className="pt-[0.7em] font-mono text-[11px] tracking-[0.04em] text-gray-600">
                    {chapter.id === "audit" ? "A" : "S"}.{String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex flex-col gap-3">
                    <h3 className="font-display text-[clamp(1.5rem,1.1rem+1.8vw,3.25rem)] leading-none font-semibold tracking-[-0.03em] text-balance">
                      {step.title[locale]}
                    </h3>
                    <p className="max-w-[56ch] text-body leading-[1.6] text-pretty text-[#3f3d39]">{step.text[locale]}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {chapter.figures && (
        <div
          className={`flex flex-col gap-10 md:gap-6 md:px-(--page-margin) ${
            // Same-ratio figures share the width equally; mixed ratios keep the design's 1.6 : 1 rhythm.
            new Set(chapter.figures.map((f) => f.aspect)).size === 1
              ? "md:grid md:grid-cols-2"
              : "md:flex-row md:flex-wrap md:items-end"
          }`}
        >
          {chapter.figures.map((fig, i) => (
            <figure
              key={fig.id}
              className={`flex min-w-0 flex-col gap-3 ${
                new Set(chapter.figures?.map((f) => f.aspect)).size === 1 ? "" : i === 0 ? "md:flex-[1.6_1_420px]" : "md:flex-[1_1_260px]"
              }`}
            >
              <MediaFrame
                slot={fig}
                locale={locale}
                sizes="(min-width: 768px) 46vw, 100vw"
                tone={i % 2 === 0 ? "ink" : "stone"}
                spec={{ left: `${figureLabel} ${String(i + 2).padStart(2, "0")} — ${fig.label[locale]}`, right: `${fig.aspect.replace("/", ":")} · ${placeholder}` }}
              />
              <figcaption className="px-(--page-margin) text-caption text-gray-600 max-md:pr-12 md:px-0">{fig.caption[locale]}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
