"use client";

import { useEffect, useRef } from "react";
import { DUR, gsap, MQ } from "@/lib/gsap";
import { BAR, scrollThumb } from "./scrollThumb";

const FINE = "(hover: hover) and (pointer: fine)";

/**
 * The site's own scrollbar, on fine pointers (mouse / trackpad); touch devices
 * keep their native overlay bar. A slim pill at the right edge in the page's
 * colours: paper, inverted against what is under it (`mix-blend-difference`), so
 * it reads as ink on paper sections and as paper on dark ones, like the cursor.
 * It widens while hovered, dragged or moving, and fades back when still.
 *
 * Only the thumb is drawn (no track line). Drag the thumb to scroll; click above
 * or below it to page. The native bar is hidden (`html.has-scrollbar`), but the
 * page still scrolls natively (wheel, keys, find, anchors), so this bar is a
 * pointer control only and is hidden from assistive tech. The cat clings to the
 * thumb (`scrollThumb`, the same geometry). Updates on scroll and resize only.
 */
export function ScrollBar() {
  const strip = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = strip.current;
    const t = thumb.current;
    if (!s || !t) return;
    const fine = window.matchMedia(FINE);
    let cleanup: (() => void) | undefined;

    const start = () => {
      const html = document.documentElement;
      html.classList.add("has-scrollbar");
      const rm = window.matchMedia(MQ.reduced).matches;
      let frame = 0;
      let idle: number | undefined;
      let hover = false;
      let drag: { y: number; scroll: number } | null = null;

      const wake = (on: boolean) => {
        gsap.to(t, { scaleX: on ? 1.7 : 1, opacity: on ? 0.9 : 0.5, duration: rm ? 0 : DUR.fast, overwrite: "auto" });
      };
      const draw = () => {
        frame = 0;
        const g = scrollThumb();
        s.style.display = g.scrollable ? "" : "none";
        gsap.set(t, { y: g.top, height: g.h });
      };
      const queue = () => {
        if (!frame) frame = requestAnimationFrame(draw);
      };
      const onScroll = () => {
        queue();
        if (!hover && !drag) {
          wake(true);
          window.clearTimeout(idle);
          idle = window.setTimeout(() => !hover && !drag && wake(false), 700);
        }
      };
      const onDown = (e: PointerEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        const g = scrollThumb();
        if (e.target === t) {
          drag = { y: e.clientY, scroll: window.scrollY };
          s.setPointerCapture(e.pointerId);
          html.classList.add("is-dragging-scrollbar");
          return;
        }
        // page up / down from the track
        const dir = e.clientY < g.top ? -1 : 1;
        window.scrollBy({ top: dir * window.innerHeight * 0.88, behavior: rm ? "auto" : "smooth" });
      };
      const onMove = (e: PointerEvent) => {
        if (!drag) return;
        const g = scrollThumb();
        const doc = document.documentElement.scrollHeight - window.innerHeight;
        const travel = window.innerHeight - BAR.pad * 2 - g.h;
        if (travel > 0) window.scrollTo(0, drag.scroll + ((e.clientY - drag.y) / travel) * doc);
      };
      const onUp = (e: PointerEvent) => {
        if (!drag) return;
        drag = null;
        if (s.hasPointerCapture(e.pointerId)) s.releasePointerCapture(e.pointerId);
        html.classList.remove("is-dragging-scrollbar");
        if (!hover) wake(false);
      };
      const onEnter = () => {
        hover = true;
        wake(true);
      };
      const onLeave = () => {
        hover = false;
        if (!drag) wake(false);
      };
      const ro = new ResizeObserver(queue);
      ro.observe(document.body);
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", queue);
      s.addEventListener("pointerdown", onDown);
      s.addEventListener("pointermove", onMove);
      s.addEventListener("pointerup", onUp);
      s.addEventListener("pointercancel", onUp);
      s.addEventListener("pointerenter", onEnter);
      s.addEventListener("pointerleave", onLeave);
      gsap.set(t, { opacity: 0.5, transformOrigin: "50% 50%" });
      draw();
      return () => {
        html.classList.remove("has-scrollbar", "is-dragging-scrollbar");
        cancelAnimationFrame(frame);
        window.clearTimeout(idle);
        ro.disconnect();
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", queue);
        s.removeEventListener("pointerdown", onDown);
        s.removeEventListener("pointermove", onMove);
        s.removeEventListener("pointerup", onUp);
        s.removeEventListener("pointercancel", onUp);
        s.removeEventListener("pointerenter", onEnter);
        s.removeEventListener("pointerleave", onLeave);
      };
    };
    const sync = () => {
      cleanup?.();
      cleanup = fine.matches ? start() : undefined;
    };
    sync();
    fine.addEventListener("change", sync);
    return () => {
      fine.removeEventListener("change", sync);
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={strip}
      aria-hidden="true"
      data-scrollbar
      data-cursor="none"
      className="fixed top-0 right-0 bottom-0 z-[64] hidden w-[14px] touch-none mix-blend-difference [@media(hover:hover)_and_(pointer:fine)]:block"
    >
      <div ref={thumb} data-scroll-thumb className="absolute top-0 right-[4px] w-[6px] rounded-full bg-paper will-change-transform" />
    </div>
  );
}
