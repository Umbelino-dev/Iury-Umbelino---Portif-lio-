import type { CSSProperties, ReactNode } from "react";

export interface RulerTick {
  /** Position along the ruler, 0–1. */
  at: number;
  /** Major ticks are taller and may carry a label. */
  major?: boolean;
  label?: ReactNode;
}

/**
 * The measured line: a hairline with ticks. It is the site's one graphic device
 * for "where you are" (the cat's rail, the project stage's position, the career
 * axis), so position always reads the same way. Ticks sit on top of the line
 * and labels under it; anything else (markers, segments) is passed as children
 * and positioned by the caller in the same 0–1 space with `left: x%`.
 */
export function Ruler({
  ticks,
  children,
  className = "",
  style,
}: {
  ticks: RulerTick[];
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`relative h-10 ${className}`} style={style}>
      <span aria-hidden="true" className="absolute inset-x-0 top-3 h-px bg-current opacity-20" />
      {ticks.map((t, i) => (
        <span key={i} aria-hidden={t.label ? undefined : true} className="absolute top-0" style={{ left: `${t.at * 100}%` }}>
          <span className={`absolute left-0 w-px bg-current ${t.major ? "top-0 h-3 opacity-60" : "top-1.5 h-1.5 opacity-30"}`} />
          {t.label && <span className="text-index absolute top-5 left-0 whitespace-nowrap">{t.label}</span>}
        </span>
      ))}
      {children}
    </div>
  );
}
