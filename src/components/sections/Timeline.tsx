"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { DUR, gsap, MQ, useGSAP } from "@/lib/gsap";

export interface TimelineStep {
  role: string;
  org: string;
  /** The period in words: "abril de 2024 – julho de 2025". */
  period: string;
  /** "1 ano e 4 meses" / "desde abril de 2026". */
  duration: string;
  area: string;
  summary: string;
  details: string[];
  more: string;
  /** Extra lines for the expanded account (the current role's CV highlights). */
  list?: string[];
  /** Tools named in the CV for this role. */
  stack?: string[];
  current?: boolean;
}

export interface TimelineLabels {
  now: string;
  seeMore: string;
  close: string;
  stack: string;
}

/**
 * The career path as a staircase of type. No axis, no lines, no markers: each
 * role is set one size larger and one step higher than the one before, so the
 * path climbs and grows toward today, and the current role is the biggest thing
 * in the composition. The period sits above each role in serif italic.
 *
 * Desktop (≥1024): four columns standing on one baseline, each raised by `--rise`.
 * Smaller screens: the same steps down the page, each a little larger and
 * further in, so the growth still reads.
 *
 * Hover or keyboard focus quiets the other steps and unrolls a few details
 * inside the step's own space (clip-path; nothing moves, nothing floats). On
 * touch the details are always shown. Click / Enter opens the full account under
 * the staircase (inside the step on small screens); Esc closes.
 * On scroll the steps rise into place one after another, once.
 * Reduced motion: no rise, the account opens without animation.
 */
export function Timeline({ steps, labels }: { steps: TimelineStep[]; labels: TimelineLabels }) {
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [hot, setHot] = useState<number | null>(null);
  const uid = useId();

  // The climb: each step rises into place after the one before it.
  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(`${MQ.motion} and (min-width: 1024px)`, () => {
        const items = gsap.utils.toArray<HTMLElement>("[data-tl-h] [data-step]", el);
        gsap.fromTo(
          items,
          { y: (i) => 40 + i * 12, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: DUR.slow * 1.4, stagger: 0.12, scrollTrigger: { trigger: el, start: "top 78%", once: true } },
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  // Account reveal whenever the open step changes (clip-path only).
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
  const quiet = (i: number) => hot !== null && hot !== i;
  /** "desde abril de 2026" → "Desde abril de 2026" when it opens a sentence. */
  const cap = (text: string) => text.charAt(0).toLocaleUpperCase() + text.slice(1);
  const ease = "duration-(--duration-base) ease-(--ease-out-soft)";
  /** Role size grows with each step: the path gets bigger toward today. */
  const roleSize = (i: number) =>
    `clamp(${(1.25 + i * 0.3).toFixed(2)}rem, ${(1.05 + i * 0.22).toFixed(2)}rem + ${(0.55 + i * 0.55).toFixed(2)}vw, ${(1.5 + i * 0.85).toFixed(2)}rem)`;

  // Render helpers (plain functions, not components: no remount, focus stays put).
  const account = (s: TimelineStep) => (
    <div className="flex flex-col gap-6">
      <p className="max-w-[54ch] text-[clamp(1.0625rem,1rem+0.3vw,1.25rem)] leading-normal text-pretty">{s.more}</p>
      {s.list && (
        <ul className="flex max-w-[60ch] flex-col gap-4">
          {s.list.map((item, j) => (
            <li key={j} className="text-body text-pretty text-[#3f3d39]">
              {item}
            </li>
          ))}
        </ul>
      )}
      {s.stack && (
        <p className="max-w-[60ch] text-ui leading-relaxed text-[#3f3d39]">
          <span className="font-display font-bold text-ink">{labels.stack}. </span>
          {s.stack.join(", ")}.
        </p>
      )}
    </div>
  );

  /** `always`: details are shown without hover (small screens, touch). */
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
      className={`group/step relative flex w-full cursor-pointer flex-col items-start gap-2 text-left transition-opacity ${ease} focus-visible:outline-ink ${quiet(i) ? "opacity-40" : ""}`}
    >
      <span className="text-note text-[#3f3d39]">
        {s.current ? (
          <>
            {s.period} <span className="highlight text-ink">{labels.now}</span>
          </>
        ) : (
          s.period
        )}
      </span>
      <span className="font-display leading-[1.02] font-bold tracking-[-0.025em] text-balance" style={{ fontSize: roleSize(i) }}>
        {s.role}
      </span>
      <span className="text-caption font-medium">{s.org}</span>
      <span className="max-w-[30ch] text-ui leading-snug text-pretty text-gray-600">{s.summary}</span>
      {/* More: on the staircase it unrolls just under the step, in the free space
          the climb leaves there (it takes no layout, so nothing moves); on small
          screens it is part of the step. */}
      <span
        className={`flex flex-col gap-1 text-caption text-ink transition-[clip-path,opacity] ${ease} ${
          always
            ? ""
            : "absolute top-full left-0 mt-4 opacity-0 [clip-path:inset(0_0_100%_0)] group-hover/step:opacity-100 group-hover/step:[clip-path:inset(0)] group-focus-visible/step:opacity-100 group-focus-visible/step:[clip-path:inset(0)] [@media(hover:none)]:opacity-100 [@media(hover:none)]:[clip-path:none]"
        }`}
      >
        {s.details.map((d) => (
          <span key={d}>{d}</span>
        ))}
        {/* The current role's period already says "since…". */}
        {!s.current && <span className="text-note text-[1rem] text-[#3f3d39]">{s.duration}</span>}
      </span>
      <span className="mt-1 font-display text-[1rem] font-bold tracking-[-0.01em] underline decoration-1 underline-offset-[0.3em]">
        {open === i ? labels.close : labels.seeMore}
      </span>
    </button>
  );

  const opened = open !== null ? steps[open] : undefined;

  return (
    <div ref={root}>
      {/* Desktop: the staircase, climbing to the right. */}
      <div data-tl-h className="hidden lg:block">
        <ol
          className="grid items-end gap-x-[clamp(1.5rem,3vw,3.5rem)] pb-24 [--rise:clamp(2.5rem,5vw,5.5rem)]"
          style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        >
          {steps.map((s, i) => (
            <li key={s.period} data-step style={{ "--step": i } as CSSProperties} className="mb-[calc(var(--step)*var(--rise))]">
              {head(s, i)}
            </li>
          ))}
        </ol>

        {opened && open !== null && (
          <div
            ref={panel}
            id={panelId(open)}
            role="region"
            aria-label={opened.role}
            className="mt-[clamp(3rem,5vw,5rem)] grid scroll-mb-8 grid-cols-12 gap-x-(--page-gutter) gap-y-8"
          >
            <div className="col-span-4 flex flex-col gap-4">
              <p className="font-display text-headline-l leading-[0.98] font-bold tracking-[-0.03em] text-balance">{opened.role}</p>
              <p className="text-note text-[1.25rem] text-[#3f3d39]">
                {opened.org}, {opened.area}. {cap(opened.duration)}.
              </p>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="mt-2 flex min-h-11 items-center self-start font-display text-[1rem] font-bold underline decoration-1 underline-offset-[0.3em] transition-colors duration-(--duration-fast) hover:text-gray-600 focus-visible:outline-ink"
              >
                {labels.close}
              </button>
            </div>
            <div className="col-span-7 col-start-6">{account(opened)}</div>
          </div>
        )}
      </div>

      {/* Small screens: down the page, each step larger and a little further in. */}
      <ol data-tl-v className="flex flex-col gap-[clamp(2.5rem,8vw,3.5rem)] lg:hidden">
        {steps.map((s, i) => (
          <li key={s.period} style={{ "--step": i } as CSSProperties} className="flex flex-col gap-5 pl-[calc(var(--step)*clamp(0.75rem,4vw,2rem))]">
            {head(s, i, true)}
            {open === i && (
              <div id={`${panelId(i)}-m`} role="region" aria-label={s.role} className="flex flex-col gap-4">
                <p className="text-note text-[#3f3d39]">
                  {s.org}, {s.area}. {cap(s.duration)}.
                </p>
                {account(s)}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
