"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MQ } from "@/lib/gsap";

export interface ProjectRow {
  slug: string;
  name: string;
  nameLang?: string;
  /** Status mark + label, year, tags — rendered on the server. */
  meta: ReactNode;
  /** 4:3 image or placeholder — rendered on the server, reused inline and in the float. */
  image: ReactNode;
  href?: string;
  external?: boolean;
  externalLabel?: string;
  /** Custom cursor label (fine pointers only). */
  cursorLabel?: string;
}

const LERP = 0.14;
const MAX_TILT = 4; // deg
const GAP = 28; // px between pointer and image

/**
 * Editorial project index.
 * - Each project is a large name with one line of metadata; no cards, codes or rules:
 *   rows are separated by space.
 * - Fine pointer: hovering a name fades the other rows to 25% and a 4:3 image
 *   follows the cursor (lerp 0.14, tilt ≤ 4° with speed), flipping left near the
 *   edge; images crossfade in 200ms. The rAF loop runs only while it moves.
 * - Keyboard focus works like hover, with the image anchored right of the line.
 * - Touch (hover: none): every image sits above its title, nothing depends on hover.
 * - Reduced motion: the image jumps to its target, no lerp or tilt.
 */
export function ProjectList({ rows, label }: { rows: ProjectRow[]; label: string }) {
  const [active, setActive] = useState<number | null>(null);
  const float = useRef<HTMLDivElement>(null);
  const pos = useRef({ fx: 0, fy: 0, tx: 0, ty: 0, frame: 0, fine: false, reduced: false });

  useEffect(() => {
    const p = pos.current;
    const fine = window.matchMedia(MQ.finePointer);
    const reduced = window.matchMedia(MQ.reduced);
    const sync = () => {
      p.fine = fine.matches;
      p.reduced = reduced.matches;
    };
    sync();
    fine.addEventListener("change", sync);
    reduced.addEventListener("change", sync);
    return () => {
      cancelAnimationFrame(p.frame);
      fine.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
    };
  }, []);

  const loop = () => {
    const p = pos.current;
    const el = float.current;
    if (!el) return;
    const dx = p.tx - p.fx;
    const dy = p.ty - p.fy;
    if (p.reduced) {
      p.fx = p.tx;
      p.fy = p.ty;
    } else {
      p.fx += dx * LERP;
      p.fy += dy * LERP;
    }
    const tilt = p.reduced ? 0 : Math.max(-MAX_TILT, Math.min(MAX_TILT, dx * 0.03));
    el.style.transform = `translate3d(${p.fx}px, ${p.fy}px, 0) rotate(${tilt.toFixed(2)}deg)`;
    // Stop once settled; the next pointer move restarts the loop.
    const settled = Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5;
    p.frame = settled ? 0 : requestAnimationFrame(loop);
  };
  const start = () => {
    if (!pos.current.frame) pos.current.frame = requestAnimationFrame(loop);
  };

  /** Target beside the pointer; flips to its left near the right edge; clamped to the viewport. */
  const target = (x: number, y: number) => {
    const el = float.current;
    if (!el) return;
    const p = pos.current;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let nx = x + GAP;
    if (nx + w > window.innerWidth - 16) nx = x - w - GAP;
    p.tx = nx;
    p.ty = Math.min(window.innerHeight - h - 16, Math.max(16, y - h * 0.6));
  };

  const enter = (i: number, x: number, y: number) => {
    const p = pos.current;
    if (!p.fine) return;
    const wasIdle = active === null;
    target(x, y);
    if (wasIdle) {
      p.fx = p.tx;
      p.fy = p.ty + 24; // rises into place on first show
    }
    setActive(i);
    start();
  };
  const leave = () => setActive(null);

  return (
    <div className="relative">
      <ul
        aria-label={label}
        data-active={active !== null ? "" : undefined}
        className="group/list flex flex-col"
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse" || active === null) return;
          target(e.clientX, e.clientY);
          start();
        }}
        onPointerLeave={leave}
      >
        {rows.map((row, i) => {
          const content = (
            <>
              <span className="flex min-w-0 flex-col gap-[clamp(0.5rem,0.8vw,0.875rem)]">
                {/* Touch: the image sits above the title. Hidden where hover exists. */}
                <span className="relative hidden aspect-[4/3] w-full max-w-[520px] [@media(hover:none)]:block">{row.image}</span>
                <span
                  lang={row.nameLang}
                  onPointerEnter={(e) => e.pointerType === "mouse" && enter(i, e.clientX, e.clientY)}
                  onPointerLeave={(e) => e.pointerType === "mouse" && leave()}
                  className="max-w-full self-start font-display text-[clamp(2rem,1.1rem+5.2vw,7rem)] leading-[0.94] font-bold tracking-[-0.035em] text-balance hyphens-auto [overflow-wrap:anywhere]"
                >
                  {row.name}
                  {row.external && (
                    <>
                      <span aria-hidden="true" className="ml-[0.15em] inline-block text-[0.45em] align-top">
                        ↗
                      </span>
                      <span className="sr-only"> ({row.externalLabel})</span>
                    </>
                  )}
                </span>
                <span className="text-caption leading-[1.4] text-gray-600">{row.meta}</span>
              </span>
            </>
          );
          const rowClass = `block py-[clamp(1rem,2vw,1.75rem)] transition-opacity duration-(--duration-base) ease-(--ease-out-soft) ${
            active !== null && active !== i ? "opacity-25" : "opacity-100"
          }`;
          return (
            <li key={row.slug}>
              {row.href ? (
                <a
                  href={row.href}
                  data-cursor-label={row.cursorLabel}
                  target={row.external ? "_blank" : undefined}
                  rel={row.external ? "noopener noreferrer" : undefined}
                  className={rowClass}
                  onFocus={(e) => {
                    const p = pos.current;
                    if (!p.fine) return;
                    // Keyboard: anchor the image to the right of the line.
                    const b = e.currentTarget.getBoundingClientRect();
                    const w = float.current?.offsetWidth ?? 0;
                    p.tx = Math.max(16, b.right - w);
                    p.ty = Math.min(window.innerHeight - (float.current?.offsetHeight ?? 0) - 16, Math.max(16, b.top));
                    p.fx = p.tx;
                    p.fy = p.ty;
                    setActive(i);
                    start();
                  }}
                  onBlur={leave}
                >
                  {content}
                </a>
              ) : (
                <div className={rowClass}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>

      {/* The floating preview: decorative, fine pointers only. */}
      <div
        ref={float}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-30 hidden aspect-[4/3] w-[clamp(240px,26vw,380px)] will-change-transform [@media(hover:hover)_and_(pointer:fine)]:block"
      >
        <div
          className={`absolute inset-0 overflow-hidden outline outline-1 outline-ink/16 transition-[opacity,scale] ease-(--ease-out-soft) ${
            active !== null ? "scale-100 opacity-100 duration-[240ms,420ms]" : "scale-[0.96] opacity-0 duration-[240ms,420ms]"
          }`}
        >
          {rows.map((row, i) => (
            <div
              key={row.slug}
              className={`absolute inset-0 transition-opacity duration-200 ${active === i ? "opacity-100" : "opacity-0"}`}
            >
              {row.image}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
