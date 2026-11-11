import { Link } from "@/i18n/navigation";

/**
 * The closing block (Case Study R01, Mobile · M7): dark, and the whole block is one
 * link — to the next confirmed case study, or back to the project index when there
 * is none. 96px bottom padding so the last line clears the cat and the home indicator.
 */
export function NextProject({
  href,
  eyebrow,
  index,
  title,
  titleLang,
}: {
  href: string;
  eyebrow: string;
  index?: string;
  title: string;
  titleLang?: string;
}) {
  return (
    <Link
      href={href}
      data-surface="dark"
      className="mt-[clamp(7rem,11vw,12.5rem)] flex flex-col gap-5 bg-ink px-(--page-margin) pt-[clamp(2.5rem,4vw,4rem)] pb-24 text-paper transition-colors duration-(--duration-fast) hover:bg-[#161616] focus-visible:outline-signal max-md:pr-12 md:pb-[clamp(4rem,6vw,6.5rem)]"
    >
      <span className="flex flex-wrap justify-between gap-4 text-label font-medium tracking-label text-gray-500 uppercase">
        <span>{eyebrow}</span>
        {index && <span className="text-index normal-case">{index}</span>}
      </span>
      <span
        lang={titleLang}
        className="font-display text-[clamp(2.75rem,1.2rem+7vw,9.375rem)] leading-[0.88] font-bold tracking-[-0.045em] text-balance hyphens-auto [overflow-wrap:anywhere]"
      >
        {title} <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}
