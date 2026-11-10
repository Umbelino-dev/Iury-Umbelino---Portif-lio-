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
        const loop = gsap.to(tr, { xPercent: -50, duration: set.length * 5, ease: "none", repeat: -1 });
        const cards = gsap.utils.toArray<HTMLElement>("[data-loop-card]", tr);
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
      className="group flex w-[clamp(15rem,24vw,23rem)] shrink-0 snap-start flex-col gap-3"
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
      <figcaption className="font-mono text-[11px] tracking-[0.04em] text-gray-600 uppercase">{p.caption}</figcaption>
    </figure>
  );

  return (
    <div
      ref={root}
      className="overflow-hidden motion-reduce:snap-x motion-reduce:snap-mandatory motion-reduce:overflow-x-auto"
    >
      {/* Two identical sets, each closed by the same trailing gap: moving the track by
          -50% lands exactly on the start of the copy, so the loop has no seam. */}
      <div ref={track} className="flex w-max">
        <div className="flex gap-[clamp(1rem,2vw,1.75rem)] pr-[clamp(1rem,2vw,1.75rem)] motion-reduce:pl-(--page-margin)">
          {set.map((p, i) => card(p, i, false))}
        </div>
        <div className="flex gap-[clamp(1rem,2vw,1.75rem)] pr-[clamp(1rem,2vw,1.75rem)] motion-reduce:hidden" aria-hidden="true">
          {set.map((p, i) => card(p, i, true))}
        </div>
      </div>
    </div>
  );
}
