"use client";

import { useRef, type ReactNode } from "react";
import { gsap, MQ, useGSAP } from "@/lib/gsap";

/**
 * The hero's single opening reveal (Homepage R02 · intro): the three display lines
 * rise from their masks, 900ms, 110ms apart. Children are server-rendered; the
 * hidden start state is applied by CSS only when JS runs and motion is allowed
 * (see `.js [data-hero-line]` in globals.css), so nothing is lost without JS.
 */
export function HeroMotion({ children, className }: { children: ReactNode; className?: string }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const lines = gsap.utils.toArray<HTMLElement>("[data-hero-line]");
        gsap.fromTo(
          lines,
          // `y: 0` discards the CSS start offset GSAP would otherwise parse as a px base.
          { yPercent: 105, y: 0 },
          // No clearProps: the inline end state must keep overriding the CSS start state.
          { yPercent: 0, y: 0, duration: 0.9, stagger: 0.11, delay: 0.12 },
        );
        gsap.fromTo(
          "[data-hero-fade]",
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.64, delay: 0.5, stagger: 0.08 },
        );
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
