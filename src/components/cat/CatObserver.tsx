"use client";

import { useRef } from "react";
import { gsap, MQ, useGSAP } from "@/lib/gsap";
import { CatFigure } from "./CatFigure";
import { CAT_OPEN } from "./states";

/** Pointer rules from Homepage R02 · N3 (Cat — observer mode). */
const FAR_PX = 700; // beyond this the cat ignores the pointer
const NEAR_PX = 180; // ears perk, eyes widen
const SPAN_PX = 420; // distance that maps to a full head turn
const STILL_MS = 2500; // pointer still → back to idle
const IGNORE = "h1,h2,h3,p,a,button,nav,figure,[data-cat-ignore]";

type Pose = "idle" | "left" | "right" | "near";

/**
 * S1 · Observer. Sits in its hero slot and never moves across the screen.
 * - Fine pointer + motion: head ±9°, body ±3°, eyes ±3px toward the pointer.
 * - Over text or links: no reaction (reading is not disturbed).
 * - Breathing (scaleY 1→1.025, 1.6s) only while idle; blink every 6–10s.
 * - Touch: breathing + blink only. Reduced motion: fully static.
 * Work happens only while the hero is on screen and the tab is visible.
 */
export function CatObserver({ className, label, cursorLabel }: { className?: string; label: string; cursorLabel?: string }) {
  const root = useRef<HTMLButtonElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const [body] = q<SVGGElement>('[data-cat="body"]');
      const [head] = q<SVGGElement>('[data-cat="head"]');
      const [ears] = q<SVGGElement>('[data-cat="ears"]');
      const [eyes] = q<SVGGElement>('[data-cat="eyes"]');
      if (!body || !head || !ears || !eyes) return;

      const mm = gsap.matchMedia();

      mm.add(MQ.motion, () => {
        gsap.set(body, { svgOrigin: "50 125" });
        gsap.set(head, { svgOrigin: "50 62" });
        gsap.set(eyes, { svgOrigin: "50 40" });

        const breath = gsap.to(el, {
          scaleY: 1.025,
          transformOrigin: "50% 100%",
          duration: 1.6,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          paused: true,
        });

        let onScreen = false;
        let blinkTimer: number | undefined;
        const blink = () => {
          gsap
            .timeline()
            .to(eyes, { scaleY: 0.1, duration: 0.07, ease: "none" })
            .to(eyes, { scaleY: 1, duration: 0.07, ease: "none", delay: 0.07 });
        };
        const scheduleBlink = () => {
          window.clearTimeout(blinkTimer);
          blinkTimer = window.setTimeout(() => {
            blink();
            scheduleBlink();
          }, 6000 + Math.random() * 4000);
        };

        // Pointer tracking — fine pointers only.
        const fine = window.matchMedia(MQ.finePointer).matches;
        let frame = 0;
        let stillTimer: number | undefined;
        let lastEvent: PointerEvent | null = null;
        let pose: Pose = "idle";

        const setPose = (next: Pose, k = 0, dy = 0) => {
          const idle = next === "idle";
          gsap.to(head, { rotation: idle ? 0 : k * 9, duration: 0.42, overwrite: "auto" });
          gsap.to(body, { rotation: idle ? 0 : k * 3, duration: 0.42, overwrite: "auto" });
          gsap.to(ears, { y: next === "near" ? -4 : 0, duration: 0.24, overwrite: "auto" });
          gsap.to(eyes, {
            x: idle ? 0 : k * 3,
            y: idle ? 0 : gsap.utils.clamp(-1, 1, dy / 300) * 1.5,
            scale: next === "near" ? 1.25 : 1,
            duration: 0.2,
            overwrite: "auto",
          });
          if (idle !== (pose === "idle")) {
            if (idle) breath.play();
            else breath.pause();
          }
          pose = next;
        };

        const update = () => {
          frame = 0;
          const e = lastEvent;
          if (!e) return;
          const target = e.target as Element | null;
          if (target?.closest?.(IGNORE) && !el.contains(target)) return setPose("idle");
          const b = el.getBoundingClientRect();
          const dx = e.clientX - (b.left + b.width / 2);
          const dy = e.clientY - (b.top + b.height * 0.35);
          const d = Math.hypot(dx, dy);
          if (d > FAR_PX) return setPose("idle");
          const k = gsap.utils.clamp(-1, 1, dx / SPAN_PX);
          setPose(d < NEAR_PX ? "near" : k < 0 ? "left" : "right", k, dy);
          window.clearTimeout(stillTimer);
          stillTimer = window.setTimeout(() => setPose("idle"), STILL_MS);
        };
        const onMove = (e: PointerEvent) => {
          lastEvent = e;
          if (!frame) frame = requestAnimationFrame(update);
        };

        const start = () => {
          breath.play();
          scheduleBlink();
          if (fine) window.addEventListener("pointermove", onMove, { passive: true });
        };
        const stop = () => {
          breath.pause();
          window.clearTimeout(blinkTimer);
          window.clearTimeout(stillTimer);
          cancelAnimationFrame(frame);
          frame = 0;
          window.removeEventListener("pointermove", onMove);
          setPose("idle");
          breath.pause();
        };
        const sync = () => {
          if (onScreen && document.visibilityState === "visible") start();
          else stop();
        };

        const io = new IntersectionObserver(([entry]) => {
          onScreen = !!entry?.isIntersecting;
          sync();
        });
        io.observe(el);
        document.addEventListener("visibilitychange", sync);

        return () => {
          io.disconnect();
          document.removeEventListener("visibilitychange", sync);
          stop();
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    // S1 is also a way in: clicking or tapping the cat opens the assistant (R03 · M1 → M5).
    <button
      ref={root}
      type="button"
      aria-label={label}
      aria-haspopup="dialog"
      onClick={() => window.dispatchEvent(new Event(CAT_OPEN))}
      className={`cursor-pointer ${className ?? ""}`}
      data-cat-root="observer"
      data-cursor-label={cursorLabel}
    >
      <CatFigure className="block h-full w-full overflow-visible" />
    </button>
  );
}
