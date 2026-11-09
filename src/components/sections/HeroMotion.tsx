"use client";

import { useRef, type ReactNode } from "react";
import { gsap, MQ, useGSAP } from "@/lib/gsap";

/**
 * The hero's opening: the name's glyphs rise one by one (line 1, then line 2),
 * then the y's tail draws down into the b's stem, then the statement and meta
 * fade in. Children are server-rendered; the hidden start state is CSS that only
 * applies when JS runs and motion is allowed (`.js [data-glyph]` in globals.css),
 * with a 3s failsafe. The positioning line above is never hidden (LCP).
 */
export function HeroMotion({ children, className }: { children: ReactNode; className?: string }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const glyphs = gsap.utils.toArray<SVGPathElement>("[data-glyph]");
        const tl = gsap.timeline({ delay: 0.1 });
        tl.fromTo(
          glyphs,
          { y: 140, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.045 },
        );
        // The join draws from the y down into the b (transform-origin is its top edge).
        tl.fromTo("[data-join]", { scaleY: 0, autoAlpha: 1, transformOrigin: "50% 0%" }, { scaleY: 1, autoAlpha: 1, duration: 0.42 }, 0.75);
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
