"use client";

import { useEffect, useRef } from "react";
import { MQ } from "@/lib/gsap";

const SIZE = 560; // px, diameter of the lit area

/**
 * A soft light that follows the pointer over the hero and, inside it only, a fine
 * dot grid (Iury, 2026-11-13). Decorative: aria-hidden, behind the content.
 *
 * Cost: one 560px layer moved with `transform`; the dots keep still on the page
 * because their background-position is moved by the opposite amount, so only that
 * layer repaints. Work happens in one rAF per pointer move, never in a loop.
 * Fine pointer + motion allowed only; touch and reduced motion get nothing.
 */
export function HeroSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const hero = el?.closest<HTMLElement>("#hero");
    if (!el || !hero) return;
    const ok = window.matchMedia(`${MQ.finePointer} and ${MQ.motion}`);
    let frame = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      frame = 0;
      const left = x - SIZE / 2;
      const top = y - SIZE / 2;
      el.style.transform = `translate3d(${left}px, ${top}px, 0)`;
      el.style.backgroundPosition = `${-left}px ${-top}px, 0 0`;
    };
    const onMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      x = e.clientX - r.left;
      y = e.clientY - r.top;
      el.style.opacity = "1";
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onLeave = () => {
      el.style.opacity = "0";
    };
    const bind = () => {
      if (ok.matches) {
        hero.addEventListener("pointermove", onMove, { passive: true });
        hero.addEventListener("pointerleave", onLeave);
      } else {
        unbind();
      }
    };
    const unbind = () => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
      frame = 0;
      onLeave();
    };
    bind();
    ok.addEventListener("change", bind);
    return () => {
      ok.removeEventListener("change", bind);
      unbind();
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 opacity-0 transition-opacity duration-(--duration-slow) ease-(--ease-out-soft) will-change-transform"
      style={{
        width: SIZE,
        height: SIZE,
        // Layer 1: the dot grid (fixed to the page). Layer 2: the light itself.
        backgroundImage:
          "radial-gradient(circle, rgba(243,241,235,0.16) 0.9px, transparent 1.4px), radial-gradient(closest-side, rgba(243,241,235,0.05), transparent)",
        backgroundSize: "22px 22px, 100% 100%",
        backgroundRepeat: "repeat, no-repeat",
        WebkitMaskImage: "radial-gradient(closest-side, #000 20%, transparent 100%)",
        maskImage: "radial-gradient(closest-side, #000 20%, transparent 100%)",
      }}
    />
  );
}
