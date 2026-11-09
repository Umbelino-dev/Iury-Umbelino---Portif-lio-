"use client";

import { useEffect, useRef } from "react";
import { gsap, MQ } from "@/lib/gsap";

const FINE = "(hover: hover) and (pointer: fine)";
const LINK = "a, button, [role='button'], label, summary, select";
const NATIVE = "input, textarea, select, [contenteditable='true']";
const TEXT = "p, h1, h2, h3, h4, h5, h6, li, dd, dt, blockquote, figcaption, td, th";

type Mode = "default" | "link" | "label" | "text" | "hidden";
const ringScale = (m: Mode) => (m === "default" ? 1 : m === "link" ? 1.75 : 0);

/**
 * Custom cursor, fine pointers only (mouse / trackpad). A dot that follows the
 * pointer exactly and a ring that trails it (gsap.quickTo; no lag with reduced
 * motion). States, read from what is under the pointer:
 * - default: small ring · link/button: larger ring, no dot
 * - `data-cursor-label="…"`: the ring becomes a labelled pill ("ver projeto")
 * - text: a thin I-beam · form fields: the native cursor (custom one hidden)
 * - `data-cursor="none"`: hidden (the element draws its own pointer, e.g. Lab frames)
 * - press: the ring compresses for 120ms.
 * It is `pointer-events: none` and `aria-hidden`, so it never blocks clicks, text
 * selection or keyboard focus. Touch devices keep the native cursor and never mount it.
 */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const beam = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    const r = ring.current;
    const d = dot.current;
    const b = beam.current;
    const l = label.current;
    if (!el || !r || !d || !b || !l) return;
    const fine = window.matchMedia(FINE);
    const html = document.documentElement;
    let cleanup: (() => void) | undefined;

    const start = () => {
      const rm = window.matchMedia(MQ.reduced).matches;
      html.classList.add("has-cursor");
      const lag = rm ? 0 : 0.35;
      const rx = gsap.quickTo(r, "x", { duration: lag, ease: "power3.out" });
      const ry = gsap.quickTo(r, "y", { duration: lag, ease: "power3.out" });
      const lx = gsap.quickTo(l, "x", { duration: lag, ease: "power3.out" });
      const ly = gsap.quickTo(l, "y", { duration: lag, ease: "power3.out" });
      const dx = gsap.quickSetter([d, b], "x", "px");
      const dy = gsap.quickSetter([d, b], "y", "px");
      let mode: Mode = "default";
      let text = "";
      let seen = false;

      const apply = (next: Mode, nextText = "") => {
        if (next === mode && nextText === text) return;
        mode = next;
        text = nextText;
        const t = rm ? 0 : 0.2;
        if (next === "label") l.textContent = nextText;
        gsap.to(r, { scale: ringScale(next), duration: t, overwrite: "auto" });
        gsap.to(l, { autoAlpha: next === "label" ? 1 : 0, scale: next === "label" ? 1 : 0.6, duration: next === "label" ? t : 0.08, overwrite: "auto" });
        gsap.to(d, { autoAlpha: next === "default" ? 1 : 0, duration: t, overwrite: "auto" });
        gsap.to(b, { autoAlpha: next === "text" ? 1 : 0, duration: t, overwrite: "auto" });
      };

      const read = (target: EventTarget | null) => {
        if (!(target instanceof Element)) return apply("default");
        if (target.closest(NATIVE)) return apply("hidden");
        const own = target.closest<HTMLElement>("[data-cursor], [data-cursor-label]");
        if (own?.dataset.cursor === "none") return apply("hidden");
        if (own?.dataset.cursorLabel) return apply("label", own.dataset.cursorLabel);
        if (target.closest(LINK)) return apply("link");
        if (target.closest(TEXT)) return apply("text");
        apply("default");
      };

      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        if (!seen) {
          seen = true;
          gsap.set([r, l], { x: e.clientX, y: e.clientY });
          gsap.to(el, { autoAlpha: 1, duration: 0.16 });
        }
        rx(e.clientX);
        ry(e.clientY);
        lx(e.clientX);
        ly(e.clientY);
        dx(e.clientX);
        dy(e.clientY);
      };
      const onOver = (e: PointerEvent) => read(e.target);
      const onDown = () => {
        if (rm) return;
        const target = mode === "label" ? l : r;
        const s = mode === "label" ? 1 : ringScale(mode);
        if (!s) return;
        gsap.fromTo(target, { scale: s * 0.6 }, { scale: s, duration: 0.12, delay: 0.12, overwrite: "auto" });
      };
      const hide = () => {
        seen = false;
        apply("hidden");
        gsap.to(el, { autoAlpha: 0, duration: 0.16 });
      };
      const onOut = (e: PointerEvent) => {
        if (!e.relatedTarget) hide(); // left the window
      };

      document.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerover", onOver, { passive: true });
      document.addEventListener("pointerout", onOut, { passive: true });
      document.addEventListener("pointerdown", onDown, { passive: true });
      window.addEventListener("blur", hide);
      return () => {
        html.classList.remove("has-cursor");
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerover", onOver);
        document.removeEventListener("pointerout", onOut);
        document.removeEventListener("pointerdown", onDown);
        window.removeEventListener("blur", hide);
        gsap.killTweensOf([el, r, d, b, l]);
        gsap.set(el, { autoAlpha: 0 });
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

  // Two layers: the blended one must itself be the fixed, stacked element, or the
  // blend would only see its own (transparent) group instead of the page.
  return (
    <>
      <div ref={root} data-cursor-root aria-hidden="true" className="pointer-events-none invisible fixed inset-0 z-[90] opacity-0 mix-blend-difference">
        <div ref={ring} className="absolute -top-3 -left-3 size-6 rounded-full border border-paper" />
        <div ref={dot} className="absolute -top-[3px] -left-[3px] size-1.5 rounded-full bg-paper" />
        <div ref={beam} className="invisible absolute -top-3 -left-px h-6 w-0.5 bg-paper opacity-0" />
      </div>
      {/* Not blended: a paper pill with ink text stays legible on any surface. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[91]">
        <span
          ref={label}
          className="invisible absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-pill border border-ink/14 bg-paper px-3.5 py-2 text-[11px] font-medium tracking-[0.08em] whitespace-nowrap text-ink uppercase opacity-0"
        />
      </div>
    </>
  );
}
