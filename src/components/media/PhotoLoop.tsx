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

/** Progressive blur layers for the frosted base of each card (lowest is strongest). */
const FROST = [
  { h: "54%", blur: 3, mask: "linear-gradient(to top, #000 40%, transparent)" },
  { h: "40%", blur: 9, mask: "linear-gradient(to top, #000 45%, transparent)" },
  { h: "28%", blur: 18, mask: "linear-gradient(to top, #000 50%, transparent)" },
] as const;

const MIN_CARDS = 10; // per set, so one set is always wider than the screen (cards overlap)

/**
 * An endless photo strip (About), set like a fanned hand of glossy cards.
 * Two identical sets side by side; the track slides one set's width and repeats,
 * so the loop has no seam.
 * - Fan: the card at the screen's centre is in front at full size; its
 *   neighbours tuck behind it, smaller, turned outward around a point below the
 *   strip (so the row bows into an arc) and a little paler with distance.
 * - Each card: rounded portrait, a rim of light, and its lower part dissolving
 *   into a frosted blur that carries the caption.
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
        // Fan: computed on the loop's own updates (no extra rAF); layout is
        // measured on resize only. k = distance from the centre in card steps.
        const fx = cards.map((c) => ({
          // quickSetter needs the real properties: "scale" is only a shorthand.
          sx: gsap.quickSetter(c, "scaleX"),
          sy: gsap.quickSetter(c, "scaleY"),
          alpha: gsap.quickSetter(c, "opacity"),
          turn: gsap.quickSetter(c, "rotation", "deg"),
          z: gsap.quickSetter(c, "zIndex"),
        }));
        gsap.set(cards, { transformOrigin: "50% 200%" });
        let centres: number[] = [];
        let left = 0;
        let width = 0;
        let step = 1;
        const measure = () => {
          left = el.getBoundingClientRect().left;
          width = tr.offsetWidth;
          centres = cards.map((c) => c.offsetLeft + c.offsetWidth / 2);
          step = Math.max(1, (centres[1] ?? 1) - (centres[0] ?? 0));
          // A static x offset puts a card's centre exactly on the screen's centre at
          // every stop (x composes with the loop's xPercent).
          const off = window.innerWidth / 2 - (left + (centres[0] ?? 0));
          gsap.set(tr, { x: ((off % step) + step) % step });
        };
        const update = () => {
          const shift = ((Number(gsap.getProperty(tr, "xPercent")) || 0) / 100) * width + (Number(gsap.getProperty(tr, "x")) || 0);
          const mid = window.innerWidth / 2;
          for (let i = 0; i < cards.length; i++) {
            const k = (left + (centres[i] ?? 0) + shift - mid) / step;
            const d = Math.min(4, Math.abs(k));
            const f = fx[i];
            if (!f) continue;
            const sc = 1 - 0.13 * Math.min(d, 2.5);
            f.sx(sc);
            f.sy(sc);
            f.alpha(1 - 0.16 * Math.max(0, d - 1));
            f.turn(gsap.utils.clamp(-14, 14, k * 4.5));
            f.z(100 - Math.round(d * 10));
          }
        };
        measure();
        // Step by step, like a deck being dealt: slide one card, hold it in front, go on.
        // Every step is the same share of the set, so the loop still ends where it began.
        const loop = gsap.timeline({ repeat: -1, onUpdate: update });
        for (let i = 1; i <= set.length; i++) {
          loop.to(tr, { xPercent: (-50 * i) / set.length, duration: 0.95, ease: "power3.inOut" }).to({}, { duration: 1.5 });
        }
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
      className="group relative -mr-[clamp(3rem,7vw,7rem)] w-[clamp(13rem,22vw,20rem)] shrink-0 snap-center will-change-transform motion-reduce:mr-[clamp(0.75rem,1.5vw,1.25rem)]"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-[clamp(1.25rem,2vw,1.75rem)] bg-ink-800 shadow-[0_30px_50px_-28px_rgba(16,16,16,0.55)]">
        <Image
          src={p.src}
          alt={copy ? "" : p.alt}
          width={p.width}
          height={p.height}
          sizes="(min-width: 768px) 22vw, 60vw"
          className="h-full w-full object-cover object-[50%_18%] transition-transform duration-(--duration-slow) ease-(--ease-out-soft) group-hover:scale-[1.04]"
        />
        {/* Frosted base: the photo dissolves into blur gradually (three layers, each
            stronger and lower), then into a soft light that carries the caption. */}
        {FROST.map((f) => (
          <div
            key={f.blur}
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0"
            style={{ height: f.h, backdropFilter: `blur(${f.blur}px)`, WebkitBackdropFilter: `blur(${f.blur}px)`, maskImage: f.mask, WebkitMaskImage: f.mask }}
          />
        ))}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[48%] bg-[linear-gradient(to_top,rgba(243,241,235,0.4),rgba(243,241,235,0.1)_50%,rgba(243,241,235,0))]"
        />
        <figcaption className="absolute inset-x-0 bottom-0 px-5 pb-[clamp(1rem,1.6vw,1.375rem)] text-center font-display text-[clamp(1.0625rem,0.95rem+0.4vw,1.375rem)] leading-tight font-bold tracking-[-0.015em] text-balance text-paper-0 [text-shadow:0_1px_14px_rgba(16,16,16,0.55)]">
          {p.caption}
        </figcaption>
        {/* Rim light: a bright edge and a soft inner glow, over the photo. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.5),inset_0_1px_22px_rgba(255,255,255,0.22)]"
        />
      </div>
    </figure>
  );

  return (
    <div
      ref={root}
      className="overflow-hidden motion-reduce:snap-x motion-reduce:snap-mandatory motion-reduce:overflow-x-auto"
    >
      {/* Two identical sets; every card carries the same (negative) right margin, so
          moving the track by -50% lands exactly on the start of the copy: no seam. */}
      <div ref={track} className="relative flex w-max pt-[clamp(2.5rem,5vw,4.5rem)] pb-[clamp(5rem,9vw,8.5rem)]">
        <div className="flex motion-reduce:pl-(--page-margin)">
          {set.map((p, i) => card(p, i, false))}
        </div>
        <div className="flex motion-reduce:hidden" aria-hidden="true">
          {set.map((p, i) => card(p, i, true))}
        </div>
      </div>
    </div>
  );
}
