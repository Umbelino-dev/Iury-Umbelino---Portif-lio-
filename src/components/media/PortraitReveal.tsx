"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { gsap, MQ } from "@/lib/gsap";

const RADIUS = 150; // px — Homepage R02 `revealRadius`

/**
 * Specimen 01 reveal (Homepage R02 · N6/N7). Two aligned layers; the alternate one
 * is masked by a radial gradient at the pointer (`--x`, `--y`, `--r`). Only the
 * mask's custom properties change — no re-render per frame.
 * - Mouse: the circle follows the pointer, eases in on enter and out on leave.
 * - Touch: press and hold grows it from the finger to the full frame; release restores.
 * - Keyboard / everyone: a 44px toggle shows the full machine reading.
 * - Reduced motion: the swap is instant.
 */
export function PortraitReveal({
  base,
  alternate,
  caption,
  labels,
}: {
  base: ReactNode;
  alternate: ReactNode;
  caption: string;
  labels: { showMachine: string; showPortrait: string; cursor: string };
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  // Tweens start from event handlers; kill any still running on unmount.
  useEffect(() => {
    const el = frame.current;
    return () => {
      if (el) gsap.killTweensOf(el);
    };
  }, []);

  const animateRadius = (target: number) => {
    const el = frame.current;
    if (!el) return;
    const reduced = window.matchMedia(MQ.reduced).matches;
    gsap.to(el, { "--r": `${target}px`, duration: reduced ? 0 : 0.42, overwrite: "auto" });
  };

  const full = () => {
    const b = frame.current?.getBoundingClientRect();
    return b ? Math.hypot(b.width, b.height) * 1.1 : 0;
  };
  const setPoint = (e: PointerEvent<HTMLDivElement>) => {
    const el = frame.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - b.left}px`);
    el.style.setProperty("--y", `${e.clientY - b.top}px`);
  };
  const mouse = (e: PointerEvent) => e.pointerType === "mouse";

  const toggle = () => {
    const next = !on;
    setOn(next);
    frame.current?.style.setProperty("--x", "50%");
    frame.current?.style.setProperty("--y", "50%");
    animateRadius(next ? full() : 0);
  };

  return (
    <figure className="flex flex-col gap-4">
      <div
        ref={frame}
        data-cursor-label={labels.cursor}
        className="relative h-full w-full touch-pan-y overflow-hidden select-none [--r:0px] [--x:50%] [--y:50%]"
        onPointerEnter={(e) => {
          if (mouse(e) && !on) {
            setPoint(e);
            animateRadius(RADIUS);
          }
        }}
        onPointerMove={(e) => {
          if (mouse(e) && !on) setPoint(e);
        }}
        onPointerLeave={(e) => {
          if (mouse(e) && !on) animateRadius(0);
        }}
        onPointerDown={(e) => {
          if (!mouse(e)) {
            setPoint(e);
            animateRadius(full());
          }
        }}
        onPointerUp={(e) => {
          if (!mouse(e) && !on) animateRadius(0);
        }}
        onPointerCancel={() => {
          if (!on) animateRadius(0);
        }}
        onContextMenu={(e) => e.preventDefault()}
        data-reveal-frame
      >
        {base}
        <div
          aria-hidden={!on}
          className="absolute inset-0 [mask-image:radial-gradient(circle_var(--r)_at_var(--x)_var(--y),#000_72%,transparent_100%)]"
        >
          {alternate}
        </div>
      </div>
      {/* Right padding clears the docked cat (56px + 16px margin), so it never covers the toggle. */}
      <figcaption className="flex flex-wrap items-center justify-between gap-4 pr-22">
        <span className="max-w-[36ch] text-caption text-gray-600">{caption}</span>
        <button
          type="button"
          aria-pressed={on}
          onClick={toggle}
          className="min-h-11 border border-ink px-4.5 text-[0.875rem] font-medium transition-colors duration-(--duration-fast) hover:bg-ink hover:text-paper"
        >
          {on ? labels.showPortrait : labels.showMachine}
        </button>
      </figcaption>
    </figure>
  );
}
