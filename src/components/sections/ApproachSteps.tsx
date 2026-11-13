"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";

export interface ApproachStep {
  title: string;
  text: string;
  techniques: { name: string; text: string }[];
}

export interface ApproachLabels {
  steps: string; // "Os cinco passos" (tablist name)
  stepOf: string; // "Passo {n} de {total}"
  next: string; // "Próximo passo"
  restart: string; // "Voltar a Observar"
  loop: string; // "O último passo alimenta o primeiro"
  techniques: string; // "Técnicas"
}

/**
 * The five steps of the approach as one interactive flow (Iury, 2026-11-13).
 *
 * A row of five stops on one line: the line fills up to the active step, and an
 * arc above the row runs from the last stop back to the first (the loop: what is
 * learned in "Melhorar" feeds "Observar"). Hovering a step (fine pointer), clicking
 * it, the arrow keys or "Próximo passo" make it active; the panel under the row
 * shows its techniques. A tablist (roving tabindex, ← → Home End). Small screens
 * keep the same row with the numbers only (the verb heads the panel).
 * Motion: transform / opacity only; reduced motion makes every change instant
 * (global reset).
 */
export function ApproachSteps({ steps, labels }: { steps: ApproachStep[]; labels: ApproachLabels }) {
  const uid = useId();
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const n = steps.length;
  const last = n - 1;
  const step = steps[active];

  const select = (i: number, focus = false) => {
    const to = ((i % n) + n) % n;
    setActive(to);
    if (focus) tabs.current[to]?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") select(active + 1, true);
    else if (e.key === "ArrowLeft") select(active - 1, true);
    else if (e.key === "Home") select(0, true);
    else if (e.key === "End") select(last, true);
    else return;
    e.preventDefault();
  };

  // Stops sit at the centres of five equal columns: 10%, 30%, … 90%.
  const stop = (i: number) => `${((i + 0.5) / n) * 100}%`;
  const looping = active === last;

  return (
    <div className="flex flex-col gap-[clamp(2rem,4vw,3.5rem)]">
      <div className="relative">
        {/* The loop: an arc from the last stop back to the first. */}
        <div aria-hidden="true" className="relative h-[clamp(2.75rem,5vw,4rem)]">
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-y-0 h-full overflow-visible" style={{ left: stop(0), width: `${((n - 1) / n) * 100}%` }}>
            <path
              d="M 100 40 C 100 2, 0 2, 0 40"
              fill="none"
              vectorEffect="non-scaling-stroke"
              strokeWidth={1.5}
              strokeDasharray={looping ? undefined : "4 5"}
              className={`transition-[stroke,opacity] duration-(--duration-base) ${looping ? "stroke-ink opacity-100" : "stroke-ink opacity-30"}`}
            />
          </svg>
          <p className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-paper px-3 text-note whitespace-nowrap transition-colors duration-(--duration-base) max-sm:hidden ${looping ? "text-ink" : "text-gray-600"}`}>
            ↺ {labels.loop}
          </p>
        </div>

        {/* The line between the first and last stop, and its progress. */}
        <div aria-hidden="true" className="absolute h-[1.5px] bg-ink/15" style={{ left: stop(0), right: stop(0), top: "calc(clamp(2.75rem,5vw,4rem) + 0.5rem)" }}>
          <div
            className="h-full origin-left bg-ink transition-transform duration-(--duration-slow) ease-(--ease-out-soft)"
            style={{ transform: `scaleX(${last ? active / last : 0})` }}
          />
        </div>

        <div role="tablist" aria-label={labels.steps} onKeyDown={onKey} className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {steps.map((s, i) => {
            const on = i === active;
            const reached = i <= active;
            return (
              <button
                key={s.title}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`${uid}-tab-${i}`}
                aria-selected={on}
                aria-controls={`${uid}-panel`}
                tabIndex={on ? 0 : -1}
                onClick={() => select(i)}
                onPointerEnter={(e) => e.pointerType === "mouse" && select(i)}
                className={`group/step flex cursor-pointer flex-col items-center gap-3 px-1 text-center transition-opacity duration-(--duration-fast) focus-visible:outline-none ${on ? "opacity-100" : "opacity-55 hover:opacity-100"}`}
              >
                {/* The stop: lime when active, ink once passed, open ahead. */}
                <span
                  aria-hidden="true"
                  className={`relative mt-[calc(0.5rem-6px)] size-3 rounded-full border-[1.5px] transition-[background-color,border-color,scale] duration-(--duration-base) group-focus-visible/step:outline-2 group-focus-visible/step:outline-offset-4 group-focus-visible/step:outline-ink ${
                    on ? "scale-150 border-ink bg-signal" : reached ? "border-ink bg-ink" : "border-ink/30 bg-paper"
                  }`}
                />
                <span className="text-note text-gray-600">{i + 1}</span>
                <span className="font-display text-[clamp(1.125rem,0.9rem+0.9vw,1.75rem)] leading-tight font-bold tracking-[-0.02em] max-lg:sr-only">{s.title}</span>
                <span className="max-w-[22ch] text-caption leading-snug text-pretty text-gray-600 max-lg:hidden">{s.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* The active step: its techniques. Re-keyed, so each change rises in. */}
      {step && (
        <div
          id={`${uid}-panel`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-${active}`}
          className="grid gap-x-[clamp(2rem,5vw,6rem)] gap-y-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
        >
          <div key={`h-${active}`} className="flex flex-col gap-3 motion-safe:animate-[fade-rise_320ms_cubic-bezier(0.2,0.7,0.1,1)]">
            <p className="text-note text-gray-600">{labels.stepOf.replace("{n}", String(active + 1)).replace("{total}", String(n))}</p>
            <h4 className="font-display text-headline-m leading-[1.05] font-bold tracking-[-0.02em]">{step.title}</h4>
            <p className="max-w-[32ch] text-lead leading-snug text-pretty">{step.text}</p>
            <button
              type="button"
              onClick={() => select(active + 1)}
              className="mt-3 flex min-h-11 items-center gap-2 self-start font-display text-[1rem] font-bold underline decoration-1 underline-offset-[0.3em] transition-colors duration-(--duration-fast) hover:text-gray-600"
            >
              {looping ? (
                <>
                  <span aria-hidden="true">↺</span> {labels.restart}
                </>
              ) : (
                <>
                  {labels.next} <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </div>
          <div key={`t-${active}`} className="flex flex-col gap-3 motion-safe:animate-[fade-rise_420ms_cubic-bezier(0.2,0.7,0.1,1)]">
            <h5 className="text-note text-gray-600">{labels.techniques}</h5>
            <ul className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
              {step.techniques.map((tq) => (
                <li key={tq.name} className="flex flex-col gap-2">
                  <span className="font-display text-title font-bold tracking-[-0.01em]">{tq.name}</span>
                  <span className="max-w-[40ch] text-body text-pretty text-[#3f3d39]">{tq.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
