"use client";

import { useRef, type ReactNode } from "react";
import { gsap, MQ, useGSAP } from "@/lib/gsap";

/**
 * The hero's opening: the name's glyphs rise one by one (line 1, then line 2)
 * while the y→b ligature draws itself downward, then the statement fades in
 * (desktop). Children are server-rendered; the hidden start state is CSS that only
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
        // The y→b ligature draws itself from the top of the y down into the b:
        // the clip rect grows from 0 to the full height (at rest it covers everything).
        const clip = document.querySelector<SVGRectElement>("[data-join-clip]");
        const full = Number(clip?.getAttribute("height") ?? 0);
        tl.set("[data-join]", { autoAlpha: 1 }, 0.12);
        if (clip) tl.fromTo(clip, { attr: { height: 0 } }, { attr: { height: full }, duration: 1.1, ease: "power2.inOut" }, 0.12);
      });
      // The statement fades in only on desktop; on phones it is a large block in
      // the first screen and must be painted at once (it can be the LCP element).
      mm.add(`${MQ.motion} and (min-width: 768px)`, () => {
        gsap.fromTo("[data-hero-fade-md]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.64, delay: 0.55 });
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
