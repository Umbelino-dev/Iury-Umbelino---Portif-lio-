import Image from "next/image";
import type { Locale } from "@/i18n/routing";
import type { Project } from "@/content/types";

/** Poster tones, cycled per project so neighbours never match. */
const TONES = [
  { bg: "bg-ink-800", fg: "text-paper", note: "text-paper-300" },
  { bg: "bg-[#d3cfc5]", fg: "text-ink", note: "text-[#3f3d39]" },
  { bg: "bg-[#2a2a2a]", fg: "text-paper", note: "text-paper-300" },
  { bg: "bg-[#c9c4b8]", fg: "text-ink", note: "text-[#3f3d39]" },
] as const;

/**
 * A project's image: the real cover when `project.cover` exists. Otherwise a
 * typographic poster, not a wireframe: the project's own name in Satoshi Black,
 * set large enough that the frame crops it, with one line in serif saying the
 * image is still to come. It is the name, so it carries no extra code or number.
 * Fills its positioned container.
 */
export function ProjectImage({
  project,
  position,
  locale,
  labels,
}: {
  project: Project;
  position: number;
  locale: Locale;
  labels: { pending: string };
}) {
  const tone = TONES[position % TONES.length]!;

  if (project.cover) {
    const contain = project.cover.fit === "contain";
    return (
      <span className="absolute inset-0 block overflow-hidden" style={{ background: project.cover.background }}>
        <Image
          src={project.cover.src}
          alt={project.cover.alt[locale]}
          width={project.cover.width}
          height={project.cover.height}
          sizes="(min-width: 768px) 50vw, 80vw"
          className={`absolute inset-0 h-full w-full ${contain ? "object-contain" : "object-cover"}`}
        />
      </span>
    );
  }

  // One word per line, so even long names become a stacked poster.
  const words = project.name.split(" ");
  return (
    <span aria-hidden="true" className={`@container absolute inset-0 block overflow-hidden ${tone.bg}`}>
      <span className={`text-note absolute top-[6cqw] left-[7cqw] text-[clamp(0.9375rem,4.6cqw,1.25rem)] ${tone.note}`}>
        {labels.pending}
      </span>
      <span
        lang={project.nameLang && project.nameLang !== locale ? project.nameLang : undefined}
        className={`absolute -bottom-[0.14em] left-[5cqw] flex flex-col font-display leading-[0.8] font-black tracking-[-0.055em] whitespace-nowrap ${tone.fg}`}
        style={{ fontSize: `${words.length > 2 ? 24 : words.length > 1 ? 30 : 46}cqw` }}
      >
        {words.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </span>
    </span>
  );
}
