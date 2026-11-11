"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";

export interface LoopPhoto {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
}

const MIN_CARDS = 8; // per set, so one set is always wider than the screen

/**
 * An endless photo strip (About). Two identical sets side by side; the track
 * slides one set's width and repeats, so the loop has no seam.
 * - Coverflow: a card grows to full size at the centre of the screen and
 *   shrinks, fades and turns slightly toward the edges; only the centre card
 *   shows its caption.
 * - Scroll drives it: scrolling down speeds it up, scrolling up runs it
 *   backwards, and the cards lean with the scroll speed, then ease back.
 * - Hover pauses it (fine pointers); it also pauses off screen and in a hidden tab.
 * - Reduced motion: no movement; the strip scrolls sideways by hand, snapping to cards.
 * The second set is a visual copy only: hidden from assistive tech.
 */
export function PhotoLoop({ photos }: { photos: LoopPhoto[] }) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  // Repeat the photos until one set holds enough cards to cover wide screens.
  const reps = Math.max(1, Math.ceil(MIN_CARDS / Math.max(1, photos.length)));
  const set = Array.from({ length: reps }, () => photos).flat();

  useGSAP(
    () => {
      const el = root.current;
      const tr = track.current;
      if (!el || !tr || !set.length) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-loop-card]", tr);
        // Coverflow: each card grows as it passes the centre of the screen and
        // shrinks, fades and turns slightly toward the edges. Computed on the
        // loop's own updates (no extra rAF); layout is measured on resize only.
        const caps = cards.map((c) => c.querySelector("figcaption"));
        const fx = cards.map((c) => ({
          // quickSetter needs the real properties: "scale" is only a shorthand.
          sx: gsap.quickSetter(c, "scaleX"),
          sy: gsap.quickSetter(c, "scaleY"),
          alpha: gsap.quickSetter(c, "opacity"),
          turn: gsap.quickSetter(c, "rotationY", "deg"),
        }));
        gsap.set(cards, { transformPerspective: 1000, transformOrigin: "50% 50%" });
        let centres: number[] = [];
        let left = 0;
        let width = 0;
        const measure = () => {
          left = el.getBoundingClientRect().left;
          width = tr.offsetWidth;
          centres = cards.map((c) => c.offsetLeft + c.offsetWidth / 2);
        };
        const update = () => {
          const shift = ((Number(gsap.getProperty(tr, "xPercent")) || 0) / 100) * width;
          const mid = window.innerWidth / 2;
          for (let i = 0; i < cards.length; i++) {
            const centre = left + (centres[i] ?? 0) + shift;
            const off = (centre - mid) / mid; // -1 left edge … 0 centre … 1 right edge
            const d = Math.min(1, Math.abs(off));
            const f = fx[i];
            if (!f) continue;
            f.sx(1 - 0.28 * d);
            f.sy(1 - 0.28 * d);
            f.alpha(1 - 0.45 * d);
            f.turn(gsap.utils.clamp(-14, 14, -off * 14));
            const cap = caps[i];
            // All or nothing (with a short CSS fade): a half-faded caption would fail contrast.
            if (cap) cap.style.opacity = d < 0.2 ? "1" : "0";
          }
        };
        measure();
        const loop = gsap.to(tr, { xPercent: -50, duration: set.length * 5, ease: "none", repeat: -1, onUpdate: update });
        update();
        const onResize = () => {
          measure();
          update();
        };
        window.addEventListener("resize", onResize);
        const skew = gsap.quickTo(cards, "skewX", { duration: 0.5, ease: "power3.out" });
        let settle: gsap.core.Tween | null = null;

        const st = ScrollTrigger.create({
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
          onUpdate: (self) => {
            const v = self.getVelocity(); // px/s, negative when scrolling up
            const boost = gsap.utils.clamp(-6, 6, v / 300);
            settle?.kill();
            loop.timeScale(v >= 0 ? 1 + Math.abs(boost) : -(1 + Math.abs(boost)));
            skew(gsap.utils.clamp(-7, 7, -v / 260));
            // Ease back to the resting speed and direction once the scroll stops.
            settle = gsap.to(loop, { timeScale: v >= 0 ? 1 : -1, duration: 1.1, ease: "power2.out", delay: 0.05 });
            gsap.delayedCall(0.12, () => skew(0));
          },
        });

        const fine = window.matchMedia(MQ.finePointer).matches;
        const pause = () => loop.pause();
        const play = () => {
          if (st.isActive) loop.play();
        };
        if (fine) {
          el.addEventListener("pointerenter", pause);
          el.addEventListener("pointerleave", play);
        }
        return () => {
          window.removeEventListener("resize", onResize);
          el.removeEventListener("pointerenter", pause);
          el.removeEventListener("pointerleave", play);
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const card = (p: LoopPhoto, i: number, copy: boolean) => (
    <figure
      key={`${copy ? "b" : "a"}-${i}`}
      data-loop-card
      aria-hidden={copy || undefined}
      className="group flex w-[clamp(16rem,28vw,26rem)] shrink-0 snap-start flex-col gap-3 will-change-transform"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#1f1f1f]">
        <Image
          src={p.src}
          alt={copy ? "" : p.alt}
          width={p.width}
          height={p.height}
          sizes="(min-width: 768px) 24vw, 66vw"
          className="h-full w-full object-cover object-[50%_20%] transition-transform duration-(--duration-slow) ease-(--ease-out-soft) group-hover:scale-[1.04]"
        />
      </div>
      <figcaption className="text-index text-gray-600 uppercase transition-opacity duration-(--duration-fast)">{p.caption}</figcaption>
    </figure>
  );

  return (
    <div
      ref={root}
      className="overflow-hidden motion-reduce:snap-x motion-reduce:snap-mandatory motion-reduce:overflow-x-auto"
    >
      {/* Two identical sets, each closed by the same trailing gap: moving the track by
          -50% lands exactly on the start of the copy, so the loop has no seam. */}
      <div ref={track} className="relative flex w-max py-6">
        <div className="flex gap-[clamp(0.5rem,1vw,1rem)] pr-[clamp(0.5rem,1vw,1rem)] motion-reduce:pl-(--page-margin)">
          {set.map((p, i) => card(p, i, false))}
        </div>
        <div className="flex gap-[clamp(0.5rem,1vw,1rem)] pr-[clamp(0.5rem,1vw,1rem)] motion-reduce:hidden" aria-hidden="true">
          {set.map((p, i) => card(p, i, true))}
        </div>
      </div>
    </div>
  );
}
