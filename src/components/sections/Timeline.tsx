"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { DUR, gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";

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

const SVG_NS = "http://www.w3.org/2000/svg";
/** Gap between a step's text and the line under it (px). */
const UNDER = 22;

/**
 * The career path as one drawn line, left to right.
 *
 * Desktop (≥1024): the roles stand in four columns, each one step higher than
 * the last, and a single line runs under them from the left edge to the right:
 * flat under each role, then a soft S-curve up to the next. As the section
 * scrolls in, the line draws itself (a trim path, scrubbed to the scroll) with a
 * point of light at its tip; each role lights up when the tip passes under it.
 * Smaller screens: the same line runs down the left side, top to bottom.
 *
 * The path is built from the real positions of the roles (measured, rebuilt on
 * resize), so it always passes under the text, whatever the copy's length.
 *
 * Hover or keyboard focus quiets the other roles and unrolls a few details in
 * the free space above the role (clip-path; nothing moves). On touch the details
 * are always shown. Click / Enter opens the full account under the line
 * (inside the step on small screens); Esc closes.
 * Reduced motion: the line is drawn, every role is lit, no tip.
 */
export function Timeline({ steps, labels }: { steps: TimelineStep[]; labels: TimelineLabels }) {
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [hot, setHot] = useState<number | null>(null);
  const uid = useId();

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();

      /** Draws the line inside `box` along `axis`; returns its cleanup. */
      const run = (box: HTMLElement, axis: "x" | "y", motion: boolean) => {
        const svg = box.querySelector<SVGSVGElement>("[data-tl-svg]");
        const items = gsap.utils.toArray<HTMLElement>("[data-step]", box);
        if (!svg || !items.length) return () => {};
        svg.replaceChildren();
        const path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "currentColor");
        path.setAttribute("stroke-width", "1.5");
        path.setAttribute("stroke-linecap", "round");
        const tip = document.createElementNS(SVG_NS, "circle");
        tip.setAttribute("r", "5");
        tip.setAttribute("class", "fill-signal");
        tip.style.filter = "drop-shadow(0 0 6px rgba(200,241,105,0.9)) drop-shadow(0 0 16px rgba(200,241,105,0.55))";
        svg.append(path, tip);

        let length = 0;
        let marks: number[] = []; // where each step starts, along the axis (px)
        let progress = motion ? 0 : 1;

        const build = () => {
          const b = box.getBoundingClientRect();
          svg.setAttribute("viewBox", `0 0 ${b.width} ${b.height}`);
          const pts = items.map((it) => {
            const r = it.getBoundingClientRect();
            return axis === "x"
              ? { x: r.left - b.left, y: r.bottom - b.top + UNDER, w: r.width }
              : { x: 6, y: r.top - b.top + 6, w: r.height };
          });
          marks = pts.map((p) => (axis === "x" ? p.x : p.y));
          let d = "";
          if (axis === "x") {
            const first = pts[0]!;
            d = `M 0 ${first.y}`;
            pts.forEach((p, i) => {
              const shelf = p.x + p.w * 0.45; // flat under the text
              d += ` L ${shelf} ${p.y}`;
              const next = pts[i + 1];
              if (next) {
                const span = next.x - shelf;
                d += ` C ${shelf + span * 0.55} ${p.y} ${next.x - span * 0.45} ${next.y} ${next.x} ${next.y}`;
              } else {
                d += ` L ${b.width} ${p.y}`;
              }
            });
          } else {
            const last = pts[pts.length - 1]!;
            d = `M 6 ${pts[0]!.y} L 6 ${last.y + last.w - 12}`;
          }
          path.setAttribute("d", d);
          length = path.getTotalLength();
          path.style.strokeDasharray = `${length}`;
          paint();
        };

        const paint = () => {
          path.style.strokeDashoffset = `${length * (1 - progress)}`;
          const at = path.getPointAtLength(length * progress);
          tip.setAttribute("cx", `${at.x}`);
          tip.setAttribute("cy", `${at.y}`);
          tip.style.opacity = motion && progress > 0.001 && progress < 0.999 ? "1" : "0";
          const head = axis === "x" ? at.x : at.y;
          items.forEach((it, i) => {
            const reached = !motion || head >= (marks[i] ?? 0) - 2;
            if (reached) it.dataset.reached = "";
            else delete it.dataset.reached;
          });
        };

        build();
        if (motion) box.dataset.tlAnim = "";
        const ro = new ResizeObserver(build);
        ro.observe(box);

        let st: ScrollTrigger | undefined;
        if (motion) {
          const proxy = { p: 0 };
          const tween = gsap.to(proxy, {
            p: 1,
            ease: "none",
            onUpdate: () => {
              progress = proxy.p;
              paint();
            },
            scrollTrigger: { trigger: box, start: "top 85%", end: axis === "x" ? "bottom 92%" : "bottom 118%", scrub: 0.6 },
          });
          st = tween.scrollTrigger;
        }
        return () => {
          ro.disconnect();
          st?.kill();
          delete box.dataset.tlAnim;
          items.forEach((it) => delete it.dataset.reached);
          svg.replaceChildren();
        };
      };

      const h = el.querySelector<HTMLElement>("[data-tl-h]");
      const v = el.querySelector<HTMLElement>("[data-tl-v]");
      mm.add({ wide: "(min-width: 1024px)", motion: MQ.motion }, (ctx) => {
        const { wide, motion } = ctx.conditions as { wide: boolean; motion: boolean };
        const box = wide ? h : v;
        if (!box) return;
        return run(box, wide ? "x" : "y", motion);
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
      // A short name ("role, period"); the summary is its description. The whole
      // block as a name was ~30 words for a screen reader.
      aria-label={`${s.role}, ${s.period}`}
      aria-describedby={`${uid}-sum-${always ? "v" : "h"}-${i}`}
      className={`group/step relative flex w-full cursor-pointer flex-col items-start gap-2 text-left transition-opacity ${ease} focus-visible:outline-ink ${quiet(i) ? "opacity-40" : ""}`}
    >
      <span className="text-note text-gray-600">
        {s.current ? (
          <>
            {s.period} <span className="highlight text-ink">{labels.now}</span>
          </>
        ) : (
          s.period
        )}
      </span>
      <span className="font-display text-[clamp(1.375rem,1.1rem+0.9vw,2rem)] leading-[1.05] font-bold tracking-[-0.025em] text-balance">{s.role}</span>
      <span className="text-caption font-medium">{s.org}</span>
      <span id={`${uid}-sum-${always ? "v" : "h"}-${i}`} className="max-w-[30ch] text-ui leading-snug text-pretty text-gray-600">{s.summary}</span>
      {/* More: on the line it unrolls in the free space above the role (no layout,
          nothing moves); on small screens it is part of the step. */}
      <span
        className={`flex flex-col gap-1 text-caption text-ink transition-[clip-path,opacity] ${ease} ${
          always
            ? ""
            : "absolute bottom-full left-0 mb-4 opacity-0 [clip-path:inset(100%_0_0_0)] group-hover/step:opacity-100 group-hover/step:[clip-path:inset(0)] group-focus-visible/step:opacity-100 group-focus-visible/step:[clip-path:inset(0)] [@media(hover:none)]:opacity-100 [@media(hover:none)]:[clip-path:none]"
        }`}
      >
        {s.details.map((d) => (
          <span key={d}>{d}</span>
        ))}
        {/* The current role's period already says "since…". */}
        {!s.current && <span className="text-note text-gray-600">{cap(s.duration)}</span>}
      </span>
      <span className="mt-1 font-display text-[1rem] font-bold tracking-[-0.01em] underline decoration-1 underline-offset-[0.3em]">
        {open === i ? labels.close : labels.seeMore}
      </span>
    </button>
  );

  const opened = open !== null ? steps[open] : undefined;

  return (
    <div ref={root}>
      {/* Desktop: the roles climb to the right; one line runs under them. */}
      <div data-tl-h className="relative hidden pt-28 pb-16 lg:block">
        <svg data-tl-svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible text-ink" />
        <ol
          className="relative grid items-end gap-x-[clamp(1.5rem,3vw,3.5rem)] [--rise:clamp(2.75rem,5vw,5.5rem)]"
          style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        >
          {steps.map((s, i) => (
            <li
              key={s.period}
              data-step
              style={{ "--step": i } as CSSProperties}
              className="tl-step mb-[calc(var(--step)*var(--rise)+2.5rem)]"
            >
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
            className="relative mt-[clamp(1.5rem,3vw,3rem)] grid scroll-mb-8 grid-cols-12 gap-x-(--page-gutter) gap-y-8"
          >
            <div className="col-span-4 flex flex-col gap-4">
              <p className="font-display text-headline-l leading-[0.98] font-bold tracking-[-0.03em] text-balance">{opened.role}</p>
              <p className="text-note text-[1.125rem] text-gray-600">
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

      {/* Small screens: the line runs down the left side, top to bottom. */}
      <div data-tl-v className="relative lg:hidden">
        <svg data-tl-svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible text-ink" />
        <ol className="relative flex flex-col gap-[clamp(2.5rem,8vw,3.5rem)] pl-8">
          {steps.map((s, i) => (
            <li key={s.period} data-step className="tl-step flex flex-col gap-5">
              {head(s, i, true)}
              {open === i && (
                <div id={`${panelId(i)}-m`} role="region" aria-label={s.role} className="flex flex-col gap-4">
                  <p className="text-note text-gray-600">
                    {s.org}, {s.area}. {cap(s.duration)}.
                  </p>
                  {account(s)}
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
