"use client";

import { useEffect, useRef } from "react";
import { gsap, MQ } from "@/lib/gsap";

const FINE = "(hover: hover) and (pointer: fine)";
const LINK = "a, button, [role='button'], label, summary, select";
const NATIVE = "input, textarea, select, [contenteditable='true']";

type Mode = "default" | "link" | "label" | "hidden";
/** Dot scale per state: 8px at rest, 18px over something you can act on. */
const dotScale = (m: Mode) => (m === "default" || m === "label" ? 1 : m === "link" ? 2.25 : 0);

/**
 * Custom cursor, fine pointers only (mouse / trackpad). A single dot that sits
 * exactly on the pointer (no trailing ring, no lag): almost invisible until it
 * has something to say. States, read from what is under the pointer:
 * - default: 8px dot · link/button: the dot grows to 18px
 * - `data-cursor-label="…"`: a small labelled pill appears beside the dot ("ver projeto")
 * - over text it stays a dot (no I-beam) · form fields: the native cursor (custom one hidden)
 * - `data-cursor="none"`: hidden (the element draws its own pointer, e.g. Lab frames)
 * - press: the dot compresses for 120ms.
 * It is `pointer-events: none` and `aria-hidden`, so it never blocks clicks, text
 * selection or keyboard focus. Touch devices keep the native cursor and never mount it.
 */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    const d = dot.current;
    const l = label.current;
    if (!el || !d || !l) return;
    const fine = window.matchMedia(FINE);
    const html = document.documentElement;
    let cleanup: (() => void) | undefined;

    const start = () => {
      const rm = window.matchMedia(MQ.reduced).matches;
      html.classList.add("has-cursor");
      const px = gsap.quickSetter([d, l], "x", "px");
      const py = gsap.quickSetter([d, l], "y", "px");
      let mode: Mode = "default";
      let text = "";
      let seen = false;

      const apply = (next: Mode, nextText = "") => {
        if (next === mode && nextText === text) return;
        mode = next;
        text = nextText;
        const t = rm ? 0 : 0.16;
        if (next === "label") l.textContent = nextText;
        gsap.to(d, { scale: dotScale(next), duration: t, overwrite: "auto" });
        gsap.to(l, { autoAlpha: next === "label" ? 1 : 0, duration: next === "label" ? t : 0.08, overwrite: "auto" });
      };

      const read = (target: EventTarget | null) => {
        if (!(target instanceof Element)) return apply("default");
        if (target.closest(NATIVE)) return apply("hidden");
        const own = target.closest<HTMLElement>("[data-cursor], [data-cursor-label]");
        if (own?.dataset.cursor === "none") return apply("hidden");
        if (own?.dataset.cursorLabel) return apply("label", own.dataset.cursorLabel);
        if (target.closest(LINK)) return apply("link");
        apply("default");
      };

      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        px(e.clientX);
        py(e.clientY);
        if (!seen) {
          seen = true;
          read(e.target);
          gsap.to(el, { autoAlpha: 1, duration: 0.16 });
        }
      };
      const onOver = (e: PointerEvent) => read(e.target);
      const onDown = () => {
        const s = dotScale(mode);
        if (rm || !s) return;
        gsap.fromTo(d, { scale: s * 0.6 }, { scale: s, duration: 0.12, delay: 0.12, overwrite: "auto" });
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
        gsap.killTweensOf([el, d, l]);
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
        <div ref={dot} data-cursor-dot className="absolute -top-1 -left-1 size-2 rounded-full bg-paper" />
      </div>
      {/* Not blended: a paper pill with ink text stays legible on any surface. It sits beside the dot, never under it. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[91]">
        <span
          ref={label}
          className="invisible absolute top-0 left-0 translate-x-4 translate-y-3 rounded-pill border border-ink/14 bg-paper px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] whitespace-nowrap text-ink uppercase opacity-0"
        />
      </div>
    </>
  );
}
