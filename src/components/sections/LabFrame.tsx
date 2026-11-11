"use client";

import { useRef, type ReactNode } from "react";

/**
 * A Lab frame (Homepage R02 · N13): hairline border, crosshair that follows the
 * pointer and prints its coordinates. With `cube`, the pointer also turns the
 * CSS 3D cube inside (`[data-cube]`). Only custom properties and one text node
 * change — no React re-render, no loop. Mouse only; touch sees the static frame.
 */
export function LabFrame({ children, cube = false, className = "" }: { children: ReactNode; cube?: boolean; className?: string }) {
  const el = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={el}
      data-cursor="none"
      className={`group/frame relative overflow-hidden border border-[#2a2a2a] transition-colors duration-(--duration-base) hover:border-gray-600 [--h:0] [--mx:50%] [--my:50%] ${className}`}
      onPointerMove={(e) => {
        const node = el.current;
        if (e.pointerType !== "mouse" || !node) return;
        const b = node.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - b.left) / b.width));
        const y = Math.max(0, Math.min(1, (e.clientY - b.top) / b.height));
        node.style.setProperty("--mx", `${x * 100}%`);
        node.style.setProperty("--my", `${y * 100}%`);
        node.style.setProperty("--h", "1");
        const readout = node.querySelector("[data-xy]");
        if (readout) readout.textContent = `x ${x.toFixed(3)} · y ${y.toFixed(3)}`;
        if (cube) {
          const c = node.querySelector<HTMLElement>("[data-cube]");
          if (c) c.style.transform = `rotateX(${(-22 + (y - 0.5) * -50).toFixed(1)}deg) rotateY(${(34 + (x - 0.5) * 90).toFixed(1)}deg)`;
        }
      }}
      onPointerLeave={() => {
        const node = el.current;
        if (!node) return;
        node.style.setProperty("--h", "0");
        const c = node.querySelector<HTMLElement>("[data-cube]");
        if (c) c.style.transform = "";
      }}
    >
      {children}
      {/* Crosshair + readout */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-(--my) h-px bg-paper/45 opacity-(--h) transition-opacity duration-200" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-(--mx) w-px bg-paper/45 opacity-(--h) transition-opacity duration-200" />
      <span
        data-xy
        aria-hidden="true"
        className="pointer-events-none absolute top-[calc(var(--my)+8px)] left-[calc(var(--mx)+10px)] text-index whitespace-nowrap text-paper opacity-(--h) transition-opacity duration-200"
      >
        x 0.500 · y 0.500
      </span>
    </div>
  );
}
