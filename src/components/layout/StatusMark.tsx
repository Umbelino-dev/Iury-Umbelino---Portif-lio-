import type { ProjectStatus } from "@/content/types";

/**
 * Project stage encoded by shape, never colour (Direção Criativa R01 · Status):
 * readable on both surfaces and independent of the accent.
 * concept ┆ dashed outline · experiment ⋯ dotted · prototype □ outline ·
 * in development ◧ half filled · live ■ filled.
 */
const SHAPE: Record<ProjectStatus, string> = {
  concept: "border border-dashed border-current",
  experiment: "border border-dotted border-current",
  prototype: "border border-current",
  "in-development": "border border-current bg-[linear-gradient(90deg,currentColor_50%,transparent_50%)]",
  live: "border border-current bg-current",
};

export function StatusMark({ status, label, className = "" }: { status: ProjectStatus; label: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-medium ${className}`}>
      <span aria-hidden="true" className={`size-[9px] flex-none ${SHAPE[status]}`} />
      {label}
    </span>
  );
}
