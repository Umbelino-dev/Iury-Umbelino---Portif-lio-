"use client";

import { useRef, type ReactNode } from "react";

/**
 * A Lab frame: a plain picture area, no border or crosshair. With `cube`, the
 * pointer turns the CSS 3D cube inside (`[data-cube]`): only an inline transform
 * changes, no React re-render, no loop. Mouse only; touch sees the static frame.
 */
export function LabFrame({ children, cube = false, className = "" }: { children: ReactNode; cube?: boolean; className?: string }) {
  const el = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={el}
      data-cursor="none"
      className={`group/frame relative overflow-hidden ${className}`}
      onPointerMove={(e) => {
        const node = el.current;
        if (e.pointerType !== "mouse" || !node) return;
        const b = node.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - b.left) / b.width));
        const y = Math.max(0, Math.min(1, (e.clientY - b.top) / b.height));
        if (cube) {
          const c = node.querySelector<HTMLElement>("[data-cube]");
          if (c) c.style.transform = `rotateX(${(-22 + (y - 0.5) * -50).toFixed(1)}deg) rotateY(${(34 + (x - 0.5) * 90).toFixed(1)}deg)`;
        }
      }}
      onPointerLeave={() => {
        const node = el.current;
        if (!node) return;
        const c = node.querySelector<HTMLElement>("[data-cube]");
        if (c) c.style.transform = "";
      }}
    >
      {children}
    </div>
  );
}
