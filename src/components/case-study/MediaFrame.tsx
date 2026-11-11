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
  paper: { bg: "bg-[#d3cfc5]", note: "text-[#3f3d39]" },
  stone: { bg: "bg-[#c9c4b8]", note: "text-[#3f3d39]" },
  ink: { bg: "bg-ink-800", note: "text-paper-300" },
} as const;

/**
 * A case-study image: the real one when `slot.image` exists, otherwise a quiet
 * tone with one serif line saying what will be shown there (the slot's own name)
 * and that it is still to come. Captions live outside, in <figcaption>.
 */
export function MediaFrame({
  slot,
  locale,
  pending,
  tone = "paper",
  priority = false,
  sizes = "(min-width: 768px) 90vw, 100vw",
}: {
  slot: MediaSlot;
  locale: Locale;
  /** "em breve": said after the slot's name on the placeholder. */
  pending: string;
  tone?: keyof typeof TONE;
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
        <p aria-hidden="true" className={`text-note absolute bottom-[clamp(1rem,2vw,1.75rem)] left-[clamp(1.25rem,2.4vw,2rem)] text-[clamp(1.125rem,1rem+0.6vw,1.75rem)] ${t.note}`}>
          {slot.label[locale]}, {pending}
        </p>
      )}
    </div>
  );
}
