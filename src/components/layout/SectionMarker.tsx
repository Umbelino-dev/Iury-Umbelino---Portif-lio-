/**
 * The chapter opener every home section starts with (R3 · section hierarchy).
 * One system, used the same way everywhere, so the page reads as chapters:
 * - a 1px rule across the full width marks where a section begins (common region);
 * - an oversized Satoshi Black numeral sits right on that rule, touching the
 *   section's name (proximity: number and name read as one unit);
 * - "01 / 05" on the far right says where you are in the whole (continuity).
 * The same language as the case-study chapters (Chapter.tsx), so the site has one
 * voice. The numeral and the count are decorative for assistive tech; the name
 * is a real heading when the section has no other (`as="h2"`).
 */
export function SectionMarker({
  index,
  total,
  label,
  tone = "light",
  as: Tag = "p",
  id,
}: {
  index: number;
  total: number;
  label: string;
  tone?: "light" | "dark";
  as?: "p" | "h2";
  id?: string;
}) {
  const n = String(index).padStart(2, "0");
  const dark = tone === "dark";
  return (
    <div
      className={`flex items-end gap-[clamp(0.875rem,2vw,2rem)] border-t pt-[clamp(0.75rem,1.4vw,1.25rem)] ${dark ? "border-[#2a2a2a]" : "border-ink/16"}`}
    >
      <span
        aria-hidden="true"
        className={`font-display text-[clamp(4rem,2.2rem+7.5vw,9.5rem)] leading-[0.74] font-black tracking-[-0.06em] tabular-nums ${dark ? "text-paper" : "text-ink"}`}
      >
        {n}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-end justify-between gap-x-6 gap-y-1 pb-[0.15em]">
        <Tag
          id={id}
          className={`text-label font-medium tracking-label uppercase ${dark ? "text-paper" : "text-ink"}`}
        >
          {label}
        </Tag>
        <span aria-hidden="true" className={`font-mono text-[11px] tracking-[0.04em] ${dark ? "text-gray-500" : "text-gray-600"}`}>
          {n} / {String(total).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

/** Home chapters, in page order: the numbers every marker and the nav share. */
export const CHAPTERS = { about: 1, projects: 2, lab: 3, approach: 4, contact: 5 } as const;
export const CHAPTER_TOTAL = 5;
