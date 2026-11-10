"use client";

import { useEffect, useId, useRef, useState } from "react";
import { gsap, MQ, useGSAP } from "@/lib/gsap";

export interface TimelineStep {
  role: string;
  period: string;
  /** "1 ano e 4 meses" / "desde abril de 2026". */
  duration: string;
  area: string;
  summary: string;
  details: string[];
  more: string;
  /** Extra lines for the expanded panel (the current role's CV highlights). */
  list?: string[];
  current?: boolean;
}

export interface TimelineLabels {
  now: string;
  seeMore: string;
  close: string;
  area: string;
  duration: string;
}

/**
 * Career path, oldest first, as part of the page's design.
 * - Desktop (≥1024): one horizontal hairline; square markers on it; steps
 *   alternate above and below. The line draws itself left → right on scroll and
 *   each marker fills as the line reaches it.
 * - Smaller screens: the same steps down a vertical line.
 * Each step shows its period, role and one sentence. Hover or keyboard focus
 * reveals a few more lines; click / Enter opens a panel with everything we have
 * (below the line on desktop, inside the step on small screens). Esc closes it.
 * Reduced motion: the line is drawn and the panel opens without animation.
 */
export function Timeline({ steps, labels }: { steps: TimelineStep[]; labels: TimelineLabels }) {
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const uid = useId();

  // Line drawing + markers, one scrubbed timeline per layout.
  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      const draw = (axis: "x" | "y", scope: string) => {
        const box = el.querySelector<HTMLElement>(scope);
        if (!box) return;
        const line = box.querySelector("[data-tl-line]");
        const marks = gsap.utils.toArray<HTMLElement>("[data-tl-mark]", box);
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: box, start: "top 80%", end: axis === "x" ? "center 45%" : "bottom 60%", scrub: 0.4 },
        });
        tl.fromTo(line, axis === "x" ? { scaleX: 0 } : { scaleY: 0 }, axis === "x" ? { scaleX: 1, duration: 1 } : { scaleY: 1, duration: 1 }, 0);
        marks.forEach((m, i) => {
          const at = marks.length > 1 ? i / (marks.length - 1) : 0;
          tl.fromTo(m, { scale: 0.45, backgroundColor: "rgba(16,16,16,0)" }, { scale: 1, backgroundColor: "rgba(16,16,16,1)", duration: 0.08 }, Math.max(0, at - 0.04));
        });
      };
      mm.add(`${MQ.motion} and (min-width: 1024px)`, () => draw("x", "[data-tl-h]"));
      mm.add(`${MQ.motion} and (max-width: 1023px)`, () => draw("y", "[data-tl-v]"));
      return () => mm.revert();
    },
    { scope: root },
  );

  // Panel reveal whenever the open step changes (clip-path only).
  useEffect(() => {
    if (open === null || !panel.current) return;
    if (window.matchMedia(MQ.reduced).matches) return;
    gsap.fromTo(panel.current, { clipPath: "inset(0 0 100% 0)", y: -6 }, { clipPath: "inset(0 0 0% 0)", y: 0, duration: 0.32 });
  }, [open]);

  // Esc closes.
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const toggle = (i: number) => setOpen((o) => (o === i ? null : i));
  const panelId = (i: number) => `${uid}-panel-${i}`;

  // Render helpers (plain functions, not components: no remount, focus stays put).
  const body = (s: TimelineStep) => (
    <div className="flex flex-col gap-3">
      <p className="max-w-[60ch] text-body text-pretty">{s.more}</p>
      {s.list && (
        <ul className="flex flex-col">
          {s.list.map((line, j) => (
            <li key={j} className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-b border-paper-300 py-3 text-[0.9375rem] last:border-b-0">
              <span aria-hidden="true" className="font-mono text-[11px] leading-6 text-gray-600">
                E.{String(j + 1).padStart(2, "0")}
              </span>
              <span className="max-w-[60ch] text-pretty">{line}</span>
            </li>
          ))}
        </ul>
      )}
      <dl className="flex flex-wrap gap-x-8 gap-y-1 font-mono text-[11px] tracking-[0.04em] text-gray-600 uppercase">
        <div className="flex gap-2">
          <dt>{labels.area}</dt>
          <dd className="text-ink">{s.area}</dd>
        </div>
        <div className="flex gap-2">
          <dt>{labels.duration}</dt>
          <dd className="text-ink">{s.duration}</dd>
        </div>
      </dl>
    </div>
  );

  // `up`: the step sits above the line, so its hover details open upward (away from it).
  const head = (s: TimelineStep, i: number, up = false) => (
    <button
      type="button"
      onClick={() => toggle(i)}
      aria-expanded={open === i}
      aria-controls={`${panelId(i)} ${panelId(i)}-m`}
      className="group/step relative flex w-full cursor-pointer flex-col items-start gap-1.5 text-left focus-visible:outline-ink"
    >
      <span className="font-mono text-[11px] tracking-[0.04em] text-gray-600">
        {s.period}
        {s.current && (
          <>
            {" "}
            <span className="highlight px-1 text-ink">{labels.now}</span>
          </>
        )}
      </span>
      <span className="font-display text-[clamp(1.125rem,1rem+0.5vw,1.5rem)] leading-tight font-bold tracking-[-0.015em] underline-offset-4 group-hover/step:underline">
        {s.role}
      </span>
      <span className="max-w-[32ch] text-[0.9375rem] leading-snug text-pretty text-gray-600">{s.summary}</span>
      {/* More on hover / focus (fine pointers), floating so it never shifts the layout;
          on touch the panel shows it all. */}
      <span
        className={`pointer-events-none absolute left-0 flex translate-y-1 flex-col gap-0.5 border-l-2 border-ink bg-paper-0 px-3 py-2 font-mono text-[11px] tracking-[0.03em] whitespace-nowrap text-ink opacity-0 transition-[opacity,translate] duration-(--duration-fast) group-hover/step:translate-y-0 group-hover/step:opacity-100 group-focus-visible/step:translate-y-0 group-focus-visible/step:opacity-100 [@media(hover:none)]:hidden ${up ? "bottom-full mb-3" : "top-full mt-3"}`}
      >
        {s.details.map((d) => (
          <span key={d}>+ {d}</span>
        ))}
        <span>+ {s.duration}</span>
      </span>
      <span className="mt-1 text-label font-medium tracking-label text-ink uppercase">
        {open === i ? labels.close : labels.seeMore} <span aria-hidden="true">{open === i ? "×" : "→"}</span>
      </span>
    </button>
  );

  return (
    <div ref={root}>
      {/* Desktop: horizontal, alternating above / below the line. */}
      <div data-tl-h className="hidden lg:block">
        <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
          <span aria-hidden="true" className="absolute top-1/2 right-0 left-0 h-px bg-paper-300" />
          <span aria-hidden="true" data-tl-line className="absolute top-1/2 right-0 left-0 h-px origin-left bg-ink" />
          {steps.map((s, i) => {
            const up = i % 2 === 0;
            return (
              <li key={s.period} className="relative grid grid-rows-[12rem_1.5rem_12rem] pr-8">
                <div className={`row-start-1 flex flex-col justify-end pb-5 ${up ? "" : "invisible"}`}>{up && head(s, i, true)}</div>
                <div className="relative row-start-2 flex items-center">
                  <span aria-hidden="true" data-tl-mark className={`size-3 border border-ink bg-ink ${open === i ? "outline-2 outline-offset-2 outline-ink" : ""}`} />
                  <span aria-hidden="true" className={`absolute left-[5px] w-px bg-paper-300 ${up ? "bottom-1/2 h-5" : "top-1/2 h-5"}`} />
                </div>
                <div className={`row-start-3 flex flex-col justify-start pt-5 ${up ? "invisible" : ""}`}>{!up && head(s, i)}</div>
              </li>
            );
          })}
        </ol>
        {open !== null && steps[open] && (
          <div
            ref={panel}
            id={panelId(open)}
            role="region"
            aria-label={steps[open].role}
            className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] gap-8 border border-ink/16 bg-paper-0 p-[clamp(1.5rem,3vw,2.5rem)]"
          >
            <div className="flex flex-col gap-4">
              <p className="font-display text-title font-bold">{steps[open].role}</p>
              {body(steps[open])}
            </div>
            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label={labels.close}
              className="flex size-11 items-center justify-center self-start text-xl hover:bg-ink/6 focus-visible:outline-ink"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        )}
      </div>

      {/* Small screens: vertical, the panel opens inside the step. */}
      <ol data-tl-v className="relative flex flex-col gap-10 pl-8 lg:hidden">
        <span aria-hidden="true" className="absolute top-1.5 bottom-1.5 left-[5px] w-px bg-paper-300" />
        <span aria-hidden="true" data-tl-line className="absolute top-1.5 bottom-1.5 left-[5px] w-px origin-top bg-ink" />
        {steps.map((s, i) => (
          <li key={s.period} className="relative flex flex-col gap-4">
            <span aria-hidden="true" data-tl-mark className="absolute top-1 -left-8 size-[11px] border border-ink bg-ink" />
            {head(s, i)}
            {open === i && (
              <div id={`${panelId(i)}-m`} role="region" aria-label={s.role} className="border border-ink/16 bg-paper-0 p-5">
                {body(s)}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
