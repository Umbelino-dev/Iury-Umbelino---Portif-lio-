"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { Turntable } from "@/content/types";
import { DUR, gsap, MQ } from "@/lib/gsap";

/**
 * A Lab frame: a plain picture area, no border or crosshair. With `turntable`, the
 * pointer turns the model inside. The frame's own picture (the children) is frame 0
 * of a sprite sheet of `cols` × `rows` cells; the sheet loads when the frame nears
 * the viewport, on fine pointers only, and is then moved by one cell per step with
 * a transform. While it turns, `data-turning` hides the still picture under it.
 * Mouse only: touch and keyboard see the still picture. No loop: a short tween runs
 * while the pointer moves and once more to turn the model back when it leaves.
 */
export function LabFrame({
  children,
  turntable,
  cursorLabel,
  className = "",
}: {
  children: ReactNode;
  turntable?: Turntable;
  cursorLabel?: string;
  className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = el.current;
    const layer = sheet.current;
    if (!turntable || !node || !layer) return;
    if (!window.matchMedia(MQ.finePointer).matches) return;

    const { src, frames, cols, rows } = turntable;
    const reduced = window.matchMedia(MQ.reduced).matches;
    const state = { v: 0 };
    let ready = false;

    const draw = () => {
      const i = ((Math.round(state.v) % frames) + frames) % frames;
      layer.style.transform = `translate(${(-(i % cols) * 100) / cols}%, ${(-Math.floor(i / cols) * 100) / rows}%)`;
    };
    const rest = () => {
      layer.style.opacity = "0";
      delete node.dataset.turning;
    };
    const turnTo = (v: number, duration: number, done?: () => void) => {
      if (reduced) {
        state.v = v;
        draw();
        done?.();
        return;
      }
      gsap.to(state, { v, duration, overwrite: true, onUpdate: draw, onComplete: done });
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        const img = new Image();
        img.src = src;
        img
          .decode()
          .then(() => {
            layer.style.backgroundImage = `url("${src}")`;
            ready = true;
          })
          .catch(() => {
            /* the still picture stays */
          });
      },
      { rootMargin: "600px" },
    );
    io.observe(node);

    const move = (e: PointerEvent) => {
      if (!ready || e.pointerType !== "mouse") return;
      const b = node.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - b.left) / b.width));
      layer.style.opacity = "1";
      node.dataset.turning = "true";
      // One full turn across the frame: the middle is the resting view.
      turnTo((x - 0.5) * frames, DUR.base);
    };
    const leave = () => {
      if (ready) turnTo(0, DUR.slow, rest);
    };
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerleave", leave);

    return () => {
      io.disconnect();
      gsap.killTweensOf(state);
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerleave", leave);
      rest();
    };
  }, [turntable]);

  return (
    <div
      ref={el}
      {...(turntable && cursorLabel ? { "data-cursor-label": cursorLabel } : { "data-cursor": "none" })}
      className={`group/frame relative overflow-hidden ${className}`}
    >
      {children}
      {turntable && (
        <span
          ref={sheet}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 block bg-[length:100%_100%] bg-no-repeat opacity-0"
          style={{ width: `${turntable.cols * 100}%`, height: `${turntable.rows * 100}%` }}
        />
      )}
    </div>
  );
}
