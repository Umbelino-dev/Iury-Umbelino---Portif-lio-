"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { DUR, gsap, MQ, useGSAP } from "@/lib/gsap";
import { Ruler, type RulerTick } from "@/components/layout/Ruler";

export interface TimelineStep {
  role: string;
  org: string;
  period: string;
  /** First and last month as a month count (year × 12 + month); `to` is null while the role is current. */
  from: number;
  to: number | null;
  /** "1 ano e 4 meses" / "desde abril de 2026". */
  duration: string;
  area: string;
  summary: string;
  details: string[];
  more: string;
  /** Extra lines for the expanded panel (the current role's CV highlights). */
  list?: string[];
  /** Tools named in the CV for this role. */
  stack?: string[];
  current?: boolean;
}

export interface TimelineLabels {
  now: string;
  today: string;
  seeMore: string;
  close: string;
  area: string;
  duration: string;
  org: string;
  stack: string;
}

/** Height of one wiring level (px): each connector turns on its own level, so none cross. */
const LEVEL = 26;

/**
 * The career path drawn to scale.
 *
 * Desktop (≥1024): a ruler of real months runs along the bottom; each role is an
 * ink segment on it, as long as the role lasted, so the gap and the quick
 * succession of roles show without a word. The four texts stand above it in even
 * columns, each one step higher than the last, and a hairline runs from every
 * text down to the month it began: verticals for the roles, horizontals for time.
 * On scroll the ink traces the axis from the first month to today.
 *
 * Smaller screens: the same steps down the page, each indented one notch, with
 * a small copy of the axis showing where that role sits in the whole path.
 *
 * Each step shows period, role, organisation and one sentence. Hover or keyboard
 * focus reveals a few more lines in space the step already owns (nothing moves,
 * nothing pops up); on touch they are always shown. Click / Enter / tap opens the
 * full account under the axis (inside the step on small screens); Esc closes it.
 * Reduced motion: the axis is drawn and the panel opens without animation.
 *
 * Connectors assume each role starts at or after the left edge of its own column
 * (true while the path accelerates toward today); later roles turn on higher levels.
 */
export function Timeline({ steps, now, labels }: { steps: TimelineStep[]; now: number; labels: TimelineLabels }) {
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [hot, setHot] = useState<number | null>(null);
  const uid = useId();

  const n = steps.length;
  const first = steps[0]?.from ?? now;
  const total = Math.max(1, now - first + 1); // months on the axis, both ends included
  const at = (month: number) => (month - first) / total;
  const start = (s: TimelineStep) => at(s.from);
  const length = (s: TimelineStep) => ((s.to ?? now) - s.from + 1) / total;

  // One tick per month; January (and the first month) is a major tick with its year.
  const ticks: RulerTick[] = Array.from({ length: total + 1 }, (_, k) => {
    const m = first + k;
    const major = k === 0 || m % 12 === 0;
    const label = k === 0 ? `${String((m % 12) + 1).padStart(2, "0")}.${Math.floor(m / 12)}` : major ? Math.floor(m / 12) : undefined;
    // No label within three months of the start or the end ("hoje" sits there).
    return { at: k / total, major, label: k === 0 || (k > 3 && k < total - 2) ? label : undefined };
  });

  // The ink traces the axis: each segment draws during its own share of the scroll.
  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(`${MQ.motion} and (min-width: 1024px)`, () => {
        const axis = el.querySelector("[data-tl-axis]");
        const segs = gsap.utils.toArray<HTMLElement>("[data-tl-seg]", el);
        const marks = gsap.utils.toArray<HTMLElement>("[data-tl-mark]", el);
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: axis, start: "top 92%", end: "top 55%", scrub: 0.4 },
        });
        segs.forEach((seg, i) => {
          const a = Number(seg.dataset.at ?? 0);
          const len = Number(seg.dataset.len ?? 0);
          tl.fromTo(seg, { scaleX: 0 }, { scaleX: 1, duration: len }, a);
          const mark = marks[i];
          if (mark) tl.fromTo(mark, { scale: 0 }, { scale: 1, duration: 0.03 }, Math.max(0, a - 0.015));
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  // Panel reveal whenever the open step changes (clip-path only).
  useEffect(() => {
    const el = panel.current;
    if (open === null || !el) return;
    if (!window.matchMedia(MQ.reduced).matches) {
      gsap.fromTo(el, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: DUR.slow });
    }
    el.scrollIntoView({ block: "nearest", behavior: "auto" });
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
  /** A step is lit when hovered, focused or open; the others step back. */
  const lit = (i: number) => hot === i || (hot === null && open === i);
  const dimmed = (i: number) => hot !== null && hot !== i;
  const line = (i: number) => (lit(i) ? "border-ink bg-ink" : "border-ink/25 bg-ink/25");
  const lineMotion = "transition-colors duration-(--duration-base) ease-(--ease-out-soft)";

  // Render helpers (plain functions, not components: no remount, focus stays put).
  const facts = (s: TimelineStep) => (
    <dl className="text-index grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-gray-600 uppercase">
      <dt>{labels.org}</dt>
      <dd className="text-ink">{s.org}</dd>
      <dt>{labels.area}</dt>
      <dd className="text-ink">{s.area}</dd>
      <dt>{labels.duration}</dt>
      <dd className="text-ink">{s.duration}</dd>
    </dl>
  );
  const account = (s: TimelineStep) => (
    <div className="flex flex-col gap-5">
      <p className="max-w-[60ch] text-body text-pretty">{s.more}</p>
      {s.list && (
        <ul className="flex flex-col border-t border-paper-300">
          {s.list.map((item, j) => (
            <li key={j} className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-b border-paper-300 py-3 text-ui leading-normal">
              <span aria-hidden="true" className="text-index leading-6 text-gray-600">
                E.{String(j + 1).padStart(2, "0")}
              </span>
              <span className="max-w-[60ch] text-pretty">{item}</span>
            </li>
          ))}
        </ul>
      )}
      {s.stack && (
        <p className="text-ui leading-relaxed">
          <span className="text-index mr-3 text-gray-600 uppercase">{labels.stack}</span>
          {s.stack.join(" · ")}
        </p>
      )}
    </div>
  );

  /** `always`: details are shown without hover (vertical layout, touch). */
  const head = (s: TimelineStep, i: number, always = false) => (
    <button
      type="button"
      onClick={() => toggle(i)}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHot(i)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHot(null)}
      onFocus={(e) => e.currentTarget.matches(":focus-visible") && setHot(i)}
      onBlur={() => setHot(null)}
      aria-expanded={open === i}
      aria-controls={`${panelId(i)} ${panelId(i)}-m`}
      className={`group/step flex w-full cursor-pointer flex-col items-start gap-1.5 text-left transition-opacity duration-(--duration-base) ease-(--ease-out-soft) focus-visible:outline-ink ${dimmed(i) ? "opacity-45" : ""}`}
    >
      <span className="text-index text-gray-600">
        {s.period}
        {s.current && (
          <>
            {" "}
            <span className="highlight px-1 text-ink">{labels.now}</span>
          </>
        )}
      </span>
      <span className="font-display text-[clamp(1.125rem,1rem+0.5vw,1.5rem)] leading-[1.15] font-bold tracking-[-0.015em] text-balance">{s.role}</span>
      <span className="text-caption font-medium">{s.org}</span>
      <span className="max-w-[30ch] text-ui leading-snug text-pretty text-gray-600">{s.summary}</span>
      <span className="mt-1.5 text-label font-medium tracking-label uppercase">
        {open === i ? labels.close : labels.seeMore} <span aria-hidden="true">{open === i ? "×" : "→"}</span>
      </span>
      {/* More, in the step's own space: unrolls downward, moves nothing. */}
      <span
        className={`text-index mt-2 flex flex-col gap-1 text-ink transition-[clip-path,opacity] duration-(--duration-base) ease-(--ease-out-soft) ${
          always
            ? ""
            : "opacity-0 [clip-path:inset(0_0_100%_0)] group-hover/step:opacity-100 group-hover/step:[clip-path:inset(0)] group-focus-visible/step:opacity-100 group-focus-visible/step:[clip-path:inset(0)] [@media(hover:none)]:opacity-100 [@media(hover:none)]:[clip-path:none]"
        }`}
      >
        {s.details.map((d) => (
          <span key={d}>+ {d}</span>
        ))}
        <span>+ {s.duration}</span>
      </span>
    </button>
  );

  const opened = open !== null ? steps[open] : undefined;

  return (
    <div ref={root}>
      {/* Desktop: texts climb in even columns; the axis below is to scale. */}
      <div data-tl-h className="hidden lg:block">
        <ol
          className="grid items-end [--rise:clamp(1.75rem,3.4vw,3.5rem)]"
          style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
        >
          {steps.map((s, i) => (
            <li
              key={s.period}
              style={{ "--step": i } as CSSProperties}
              className="relative mb-[calc(var(--step)*var(--rise))] pr-8 pl-5"
            >
              {/* The spine: runs beside the text and on down to the wiring. */}
              <span
                aria-hidden="true"
                className={`absolute top-0 -bottom-[calc(var(--step)*var(--rise))] left-0 w-px ${line(i)} ${lineMotion}`}
              />
              {head(s, i)}
            </li>
          ))}
        </ol>

        {/* Wiring: from each column across to the month the role began, then down. */}
        <div aria-hidden="true" className="relative" style={{ height: (n + 1) * LEVEL }}>
          {steps.map((s, i) => {
            const col = i / n;
            const x = start(s);
            const level = (n - i) * LEVEL;
            const right = x >= col;
            return (
              <span key={s.period}>
                <span
                  className={`absolute top-0 border-b bg-transparent! ${right ? "border-l" : "border-r"} ${line(i)} ${lineMotion}`}
                  style={{ left: `${Math.min(col, x) * 100}%`, width: `${Math.abs(x - col) * 100}%`, height: level }}
                />
                <span
                  className={`absolute bottom-0 w-px ${line(i)} ${lineMotion}`}
                  style={{ left: `${x * 100}%`, top: level - 1 }}
                />
              </span>
            );
          })}
        </div>

        <div data-tl-axis className="relative">
          <Ruler ticks={ticks} className="text-gray-600">
            {steps.map((s, i) => (
              <span key={s.period} aria-hidden="true">
                <span
                  data-tl-seg
                  data-at={start(s)}
                  data-len={length(s)}
                  className={`absolute top-[11px] h-[3px] origin-left ${lit(i) || (hot === null && open === null) ? "bg-ink" : "bg-ink/35"} ${lineMotion}`}
                  style={{ left: `${start(s) * 100}%`, width: `calc(${length(s) * 100}% - 2px)` }}
                />
                <span
                  data-tl-mark
                  className="absolute top-2 -ml-1 size-[9px] bg-ink"
                  style={{ left: `${start(s) * 100}%` }}
                />
              </span>
            ))}
            <span className="text-index absolute top-5 right-0 text-ink">{labels.today}</span>
          </Ruler>
        </div>

        {opened && open !== null && (
          <div
            ref={panel}
            id={panelId(open)}
            role="region"
            aria-label={opened.role}
            className="page-grid relative mt-6 scroll-mb-8 gap-y-8 border-t border-ink px-0! pt-8"
          >
            <div className="col-span-4 flex flex-col gap-5">
              <p className="font-display text-headline-m font-bold text-balance">{opened.role}</p>
              <p className="text-index text-gray-600">{opened.current ? `${opened.period} ${labels.now}` : opened.period}</p>
              {facts(opened)}
            </div>
            <div className="col-span-6 col-start-6">{account(opened)}</div>
            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label={labels.close}
              className="col-start-12 flex size-11 items-center justify-center justify-self-end text-xl transition-colors duration-(--duration-fast) hover:bg-ink/6 focus-visible:outline-ink"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        )}
      </div>

      {/* Small screens: down the page, one notch in per step. */}
      <ol data-tl-v className="flex flex-col lg:hidden">
        {steps.map((s, i) => (
          <li
            key={s.period}
            style={{ "--step": i } as CSSProperties}
            className={`relative ml-[calc(var(--step)*0.75rem)] flex flex-col gap-4 border-l pb-10 pl-5 last:pb-0 ${lit(i) ? "border-ink" : "border-ink/25"} ${lineMotion}`}
          >
            {i > 0 && <span aria-hidden="true" className="absolute top-0 -left-[calc(0.75rem+1px)] h-px w-3 bg-ink/25" />}
            <span aria-hidden="true" className="absolute top-0 -left-[5px] size-[9px] bg-ink" />
            {/* Where this role sits in the whole path, to scale. */}
            <span aria-hidden="true" className="relative -mt-px block h-[9px] w-full max-w-64">
              <span className="absolute inset-x-0 top-1 h-px bg-ink/20" />
              <span className="absolute top-[3px] h-[3px] bg-ink" style={{ left: `${start(s) * 100}%`, width: `${length(s) * 100}%` }} />
            </span>
            {head(s, i, true)}
            {open === i && (
              <div id={`${panelId(i)}-m`} role="region" aria-label={s.role} className="flex flex-col gap-5 border-t border-ink pt-5">
                {facts(s)}
                {account(s)}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
