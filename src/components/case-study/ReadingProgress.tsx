"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * 2px reading-progress hairline along the top edge (Case Study Mobile R01 · M1).
 * Scroll position maps straight to scaleX — a state readout, not an animation, so it
 * is the same with reduced motion. Decorative: the scrollbar already says this.
 */
export function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.fromTo(
      bar.current,
      { scaleX: 0 },
      { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: true } },
    );
  });
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5">
      <div ref={bar} className="h-full origin-left scale-x-0 bg-ink" data-reading-progress />
    </div>
  );
}
