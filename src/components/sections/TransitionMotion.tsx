"use client";

import { useRef, type ReactNode } from "react";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { SURFACE_EVENT } from "@/components/layout/surface";

/**
 * Night → Day (Homepage R02 · N4/N5). Turns the stacked layers into a sticky
 * 100vh stage by setting `data-enhanced` (CSS does the layout), then lets scroll
 * drive the day layer's clip-path. No JS loop: ScrollTrigger scrubs one timeline.
 * Reduced motion: a hard cut at 50% of the section.
 */
export function TransitionMotion({ children, className }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const day = section.querySelector<HTMLElement>('[data-layer="day"]');
      const horizon = section.querySelector<HTMLElement>("[data-horizon]");
      const line = section.querySelector<HTMLElement>("[data-horizon-line]");
      if (!day || !horizon || !line) return;

      section.dataset.enhanced = "";
      ScrollTrigger.refresh();
      // The nav reads the surface under it on scroll; ScrollTrigger may update the
      // clip after that read, so tell it to look again.
      const notify = () => window.dispatchEvent(new Event(SURFACE_EVENT));
      const hidden = "inset(100% 0% 0% 0%)";
      const shown = "inset(0% 0% 0% 0%)";
      const mm = gsap.matchMedia();

      mm.add(MQ.motion, () => {
        // 0.12 of the scroll holds the night, 0.70 brings the day up, 0.18 holds it.
        gsap
          .timeline({
            defaults: { ease: "power1.inOut" },
            scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: true, onUpdate: notify },
          })
          .fromTo(day, { clipPath: hidden }, { clipPath: shown, duration: 0.7 }, 0.12)
          .fromTo(horizon, { yPercent: 100 }, { yPercent: 0, duration: 0.7 }, 0.12)
          .fromTo(line, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.02, ease: "none" }, 0.12)
          .to(line, { autoAlpha: 0, duration: 0.02, ease: "none" }, 0.8)
          .set({}, {}, 1);
      });

      mm.add(MQ.reduced, () => {
        gsap.set(line, { autoAlpha: 0 });
        // A hard cut needs no tween. Write the style directly: gsap.set inside a
        // ScrollTrigger callback is lazy-rendered at the end of the tick, after `notify`.
        const cut = (self: ScrollTrigger) => {
          day.style.clipPath = self.progress > 0.5 ? shown : hidden;
          notify();
        };
        ScrollTrigger.create({ trigger: section, start: "top top", end: "bottom bottom", onUpdate: cut, onRefresh: cut });
      });

      return () => {
        mm.revert();
        day.style.removeProperty("clip-path");
        delete section.dataset.enhanced;
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} className={className} data-transition>
      {children}
    </div>
  );
}
