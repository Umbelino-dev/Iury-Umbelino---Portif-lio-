import Image from "next/image";
import type { Locale } from "@/i18n/routing";
import type { MediaSlot } from "@/content/types";

const DESKTOP: Record<MediaSlot["aspect"], string> = {
  "16/9": "md:aspect-video",
  "4/3": "md:aspect-[4/3]",
  "3/4": "md:aspect-[3/4]",
  "1200/630": "md:aspect-[1200/630]",
};
/** Mobile reflow (Case Study Mobile R01 · M3/M5): 16:9 → 4:3, 3:4 → 4:5. */
const MOBILE: Record<MediaSlot["aspect"], string> = {
  "16/9": "aspect-[4/3]",
  "4/3": "aspect-[4/3]",
  "3/4": "aspect-[4/5]",
  "1200/630": "aspect-[1200/630]", // brand pieces carry text: never reflowed or cropped
};
const TONE = {
  paper: { bg: "bg-[#d3cfc5]", fg: "text-ink", meta: "text-[#3f3d39]", line: "bg-[#3f3d39]" },
  stone: { bg: "bg-[#c9c4b8]", fg: "text-ink", meta: "text-[#3f3d39]", line: "bg-[#3f3d39]" },
  ink: { bg: "bg-ink-800", fg: "text-paper", meta: "text-paper-300", line: "bg-paper-300" },
} as const;

/**
 * A case-study image: the real one when `slot.image` exists, otherwise the editorial
 * placeholder (spec bar, crosshair, optional numeral). Captions live outside, in <figcaption>.
 */
export function MediaFrame({
  slot,
  locale,
  spec,
  tone = "paper",
  numeral,
  priority = false,
  sizes = "(min-width: 768px) 90vw, 100vw",
}: {
  slot: MediaSlot;
  locale: Locale;
  spec: { left: string; right: string };
  tone?: keyof typeof TONE;
  numeral?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const t = TONE[tone];
  return (
    <div className={`relative w-full overflow-hidden ${MOBILE[slot.aspect]} ${DESKTOP[slot.aspect]} ${t.bg}`}>
      {slot.image ? (
        <Image
          src={slot.image.src}
          alt={slot.image.alt[locale]}
          width={slot.image.width}
          height={slot.image.height}
          priority={priority}
          sizes={sizes}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div aria-hidden="true" className={`absolute inset-0 text-index ${t.meta}`}>
          <div className="absolute inset-x-4 top-3.5 flex justify-between gap-3 uppercase md:inset-x-5 md:top-4">
            <span>{spec.left}</span>
            <span className="hidden normal-case sm:inline">{spec.right}</span>
          </div>
          <span className={`absolute top-1/2 left-1/2 -ml-[22px] h-px w-11 ${t.line}`} />
          <span className={`absolute top-1/2 left-1/2 -mt-[22px] h-11 w-px ${t.line}`} />
          {numeral && (
            <span className={`absolute bottom-1 left-4 font-display text-[clamp(4rem,14vw,15rem)] leading-[0.8] font-bold tracking-[-0.05em] ${t.fg}`}>
              {numeral}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
