import type { ProjectStatus } from "@/content/types";

/**
 * A project's stage, said in words (Instrument Serif italic, the annotation voice).
 * No shapes or colours: "No ar", "Em desenvolvimento" and "Conceito" read on any
 * surface and need no legend. `status` stays in the API for callers that sort or
 * style by stage.
 */
export function StatusMark({ label, className = "" }: { status: ProjectStatus; label: string; className?: string }) {
  return <span className={`text-note ${className}`}>{label}</span>;
}
