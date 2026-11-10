"use client";

import { useRef } from "react";
import { gsap, MQ, useGSAP } from "@/lib/gsap";

export interface TimelineStep {
  role: string;
  period: string;
  current?: boolean;
}

/**
 * Career path as a timeline, oldest first so it reads as a progression.
 * A hairline runs down the left; an ink line draws over it as you scroll
 * (scrubbed), and each step's square marker fills and its text slides in when
 * the line reaches it. The current role is highlighted.
 * Server-rendered and complete without JS; reduced motion shows it fully drawn.
 */
export function Timeline({ steps, nowLabel }: { steps: TimelineStep[]; nowLabel: string }) {
  const root = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const line = el.querySelector("[data-tl-line]");
        const items = gsap.utils.toArray<HTMLElement>("[data-tl-step]", el);
        gsap.fromTo(
          line,
          { scaleY: 0 },
          { scaleY: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 60%", scrub: 0.4 } },
        );
        items.forEach((item) => {
          const mark = item.querySelector("[data-tl-mark]");
          const text = item.querySelectorAll("[data-tl-text]");
          gsap
            .timeline({ scrollTrigger: { trigger: item, start: "top 78%", toggleActions: "play none none reverse" } })
            .fromTo(mark, { scale: 0.4, backgroundColor: "rgba(16,16,16,0)" }, { scale: 1, backgroundColor: "rgba(16,16,16,1)", duration: 0.32 })
            .fromTo(text, { autoAlpha: 0, x: -14 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.06 }, 0.05);
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <ol ref={root} className="relative flex flex-col gap-8 pl-8">
      {/* Track and the line that draws over it. */}
      <span aria-hidden="true" className="absolute top-1.5 bottom-1.5 left-[5px] w-px bg-paper-300" />
      <span aria-hidden="true" data-tl-line className="absolute top-1.5 bottom-1.5 left-[5px] w-px origin-top bg-ink" />
      {steps.map((s) => (
        <li key={s.period} data-tl-step className="relative flex flex-col gap-1">
          <span
            aria-hidden="true"
            data-tl-mark
            className="absolute top-1.5 -left-8 size-[11px] border border-ink bg-ink"
          />
          <span data-tl-text className="font-mono text-[11px] tracking-[0.04em] text-gray-600">
            {s.period}
            {s.current && (
              <>
                {" "}
                <span className="highlight px-1 text-ink">{nowLabel}</span>
              </>
            )}
          </span>
          <span data-tl-text className="font-display text-[clamp(1.125rem,1rem+0.5vw,1.375rem)] leading-tight font-bold tracking-[-0.015em]">
            {s.role}
          </span>
        </li>
      ))}
    </ol>
  );
}
