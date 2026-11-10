"use client";

import { usePathname } from "next/navigation";
import { gsap, MQ, SplitText, useGSAP } from "@/lib/gsap";

/**
 * Section titles marked `data-split` rise word by word the first time they
 * scroll into view. The text is in the server HTML; only titles that start
 * below the fold are animated (nothing on screen ever blinks out), and with
 * reduced motion nothing is split at all. No line masks, so no descender is
 * ever clipped. Headings keep their accessible name (aria-label); paragraphs
 * are left without ARIA, their words read in order.
 */
export function SplitReveal() {
  const pathname = usePathname();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const fold = window.innerHeight * 0.9;
        gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
          if (el.getBoundingClientRect().top < fold) return;
          // The highlighter is sized for inline text; split words would turn it into blocks.
          if (el.querySelector(".highlight")) return;
          SplitText.create(el, {
            type: "words",
            autoSplit: true,
            // Headings keep their name through aria-label; on a paragraph that
            // attribute is not allowed, so the split words are simply read in order.
            aria: /^H[1-6]$/.test(el.tagName) ? "auto" : "none",
            onSplit: (self) =>
              gsap.from(self.words, {
                yPercent: 60,
                autoAlpha: 0,
                duration: 0.9,
                stagger: 0.05,
                scrollTrigger: { trigger: el, start: "top 85%", once: true },
              }),
          });
        });
      });
      return () => mm.revert();
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  return null;
}
