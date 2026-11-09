import Image from "next/image";
import type { Locale } from "@/i18n/routing";
import type { Project } from "@/content/types";

/** Placeholder tones, cycled per project so neighbours never match (Homepage R02). */
const TONES = [
  { bg: "bg-[#d3cfc5]", fg: "text-ink", meta: "text-[#3f3d39]" },
  { bg: "bg-ink-800", fg: "text-paper", meta: "text-paper-300" },
  { bg: "bg-[#c9c4b8]", fg: "text-ink", meta: "text-[#3f3d39]" },
  { bg: "bg-[#2a2a2a]", fg: "text-paper", meta: "text-paper-300" },
] as const;

/**
 * A project's 4:3 image: the real cover when `project.cover` exists, otherwise the
 * editorial placeholder (index, numeral, status). Fills its positioned container.
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
  labels: { image: string; placeholder: string; status: string };
}) {
  const tone = TONES[position % TONES.length]!;
  const numeral = project.index.replace("P.", "");

  if (project.cover) {
    const contain = project.cover.fit === "contain";
    return (
      <span className="absolute inset-0 block overflow-hidden" style={{ background: project.cover.background }}>
        <Image
          src={project.cover.src}
          alt={project.cover.alt[locale]}
          width={project.cover.width}
          height={project.cover.height}
          sizes="(min-width: 768px) 380px, 100vw"
          className={`absolute inset-0 h-full w-full ${contain ? "object-contain" : "object-cover"}`}
        />
      </span>
    );
  }

  return (
    <span aria-hidden="true" className={`absolute inset-0 block overflow-hidden ${tone.bg}`}>
      <span className={`absolute inset-x-3.5 top-3 flex justify-between gap-3 font-mono text-[11px] tracking-[0.04em] uppercase ${tone.meta}`}>
        <span>
          {labels.image} · {project.index}
        </span>
        <span className="hidden normal-case sm:inline [@media(hover:hover)]:inline">4:3 · {labels.placeholder}</span>
      </span>
      <span
        className={`absolute bottom-0.5 left-3 font-display text-[clamp(4rem,7vw,7rem)] leading-[0.8] font-bold tracking-[-0.05em] ${tone.fg}`}
      >
        {numeral}
      </span>
      <span className={`absolute right-3.5 bottom-3 font-mono text-[11px] tracking-[0.04em] lowercase ${tone.meta}`}>{labels.status}</span>
    </span>
  );
}
