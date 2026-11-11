"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { DUR, EASE, gsap, MQ, useGSAP } from "@/lib/gsap";

export interface StageSlide {
  slug: string;
  name: string;
  nameLang?: string;
  /** Frame proportion (width / height). Frames share a height, so widths differ. */
  ratio: number;
  /** Cover or typographic poster, rendered on the server; fills the frame. */
  image: ReactNode;
  /** Status, name, summary and link for this project, rendered on the server. */
  detail: ReactNode;
  href?: string;
  external?: boolean;
  /** Custom cursor label over the frame in front (fine pointers only). */
  cursorLabel?: string;
}

export interface StageLabels {
  carousel: string;
  index: string;
  drag: string;
}

/** How much a frame shrinks and fades once it is one place away from the front. */
const DEPTH = 0.24;
const FADE = 0.3;

/**
 * The project stage: one horizontal strip of frames in different proportions.
 * The frame on the page's left margin is in front, at full size; the others wait
 * to its right, smaller and paler, and run off the screen's edge. Its name sits
 * above the strip at display size.
 *
 * - It is a native horizontal scroller with snap points: touch, trackpad, keyboard
 *   and no-JS all work before any script runs. Scale and fade are derived from the
 *   scroll position (one rAF per scroll event, no loop).
 * - Frames scale from their bottom-left corner and are shifted so the gaps stay
 *   even: the strip reads as one row standing on a baseline, not as loose cards.
 * - Below the strip, the project names are the index: the one in front is ink,
 *   the others grey; each name brings its project forward. No numbers, no ruler.
 * - Mouse: drag the strip; a click on a frame behind brings it forward, a click
 *   on the front one opens it. Keyboard: ← → Home End on the strip.
 * - Reduced motion: moves are instant; nothing animates by itself in any mode.
 */
export function ProjectStage({ slides, labels }: { slides: StageSlide[]; labels: StageLabels }) {
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const api = useRef<{ goTo: (i: number) => void }>({ goTo: () => {} });

  useGSAP(
    () => {
      const el = root.current;
      const sc = scroller.current;
      if (!el || !sc) return;
      const list = sc.querySelector<HTMLElement>("[data-strip]");
      const items = gsap.utils.toArray<HTMLElement>("[data-slide]", sc);
      if (!list || !items.length) return;
      const n = items.length;
      const reduced = window.matchMedia(MQ.reduced);

      const frames = items.map((it) => it.querySelector<HTMLElement>("[data-frame]"));
      const caps = items.map((it) => it.querySelector<HTMLElement>("[data-cap]"));
      gsap.set(frames, { transformOrigin: "0% 100%" });
      // quickSetter needs the real properties: "scale" is only a shorthand.
      const fx = frames.map((f) => ({
        x: gsap.quickSetter(f, "x", "px"),
        sx: gsap.quickSetter(f, "scaleX"),
        sy: gsap.quickSetter(f, "scaleY"),
        alpha: gsap.quickSetter(f, "opacity"),
      }));
      const capX = caps.map((c) => gsap.quickSetter(c, "x", "px"));

      let offsets: number[] = []; // scrollLeft that puts slide i in front
      let widths: number[] = [];
      const scale = new Array<number>(n).fill(1);
      const dist = new Array<number>(n).fill(0);

      const measure = () => {
        offsets = items.map((it) => it.offsetLeft);
        widths = items.map((it) => it.offsetWidth);
        // Room after the last frame, so it can reach the front too.
        const inset = parseFloat(getComputedStyle(sc).paddingLeft) || 0;
        list.style.paddingRight = `${Math.max(0, sc.clientWidth - inset - (widths[n - 1] ?? 0))}px`;
      };

      const nearest = (s: number) => {
        let best = 0;
        for (let i = 1; i < n; i++) if (Math.abs((offsets[i] ?? 0) - s) < Math.abs((offsets[best] ?? 0) - s)) best = i;
        return best;
      };

      const update = () => {
        const s = sc.scrollLeft;
        for (let i = 0; i < n; i++) {
          const p = (offsets[i] ?? 0) - s; // px from the front line; negative = already passed
          const span = p >= 0 ? (offsets[i] ?? 0) - (offsets[i - 1] ?? 0) : (offsets[i + 1] ?? 0) - (offsets[i] ?? 0);
          dist[i] = gsap.utils.clamp(-1, 1, p / (span || widths[i] || 1));
          scale[i] = 1 - DEPTH * Math.abs(dist[i] ?? 0);
        }
        // Close the gaps the shrinking opens: frames ahead move left by what the
        // frames between them and the front gave up; passed frames move right.
        let acc = 0;
        const shift = new Array<number>(n).fill(0);
        for (let i = 0; i < n; i++) {
          if ((dist[i] ?? 0) < 0) continue;
          shift[i] = -acc;
          acc += (widths[i] ?? 0) * (1 - (scale[i] ?? 1));
        }
        acc = 0;
        for (let i = n - 1; i >= 0; i--) {
          if ((dist[i] ?? 0) >= 0) continue;
          acc += (widths[i] ?? 0) * (1 - (scale[i] ?? 1));
          shift[i] = acc;
        }
        for (let i = 0; i < n; i++) {
          const f = fx[i];
          if (!f) continue;
          const d = Math.abs(dist[i] ?? 0);
          f.x(shift[i] ?? 0);
          f.sx(scale[i] ?? 1);
          f.sy(scale[i] ?? 1);
          f.alpha(1 - FADE * d);
          capX[i]?.(shift[i] ?? 0);
          // All or nothing: the front project is named above the strip at display size.
          const cap = caps[i];
          if (cap) cap.style.opacity = d < 0.5 ? "0" : "1";
        }
        const now = nearest(s);
        if (now !== activeRef.current) {
          activeRef.current = now;
          setActive(now);
        }
      };

      let frame = 0;
      const onScroll = () => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          update();
        });
      };

      let tween: gsap.core.Tween | null = null;
      const snap = (on: boolean) => {
        sc.style.scrollSnapType = on ? "" : "none";
      };
      const goTo = (i: number) => {
        const to = offsets[gsap.utils.clamp(0, n - 1, i)] ?? 0;
        tween?.kill();
        if (reduced.matches) {
          sc.scrollLeft = to;
          snap(true);
          return;
        }
        // Snap would fight the tween frame by frame: off while it runs.
        snap(false);
        tween = gsap.to(sc, { scrollLeft: to, duration: DUR.slow, ease: EASE, onComplete: () => snap(true) });
      };
      api.current.goTo = goTo;

      // Mouse drag (touch and trackpads scroll natively).
      const drag = { down: false, moved: false, x0: 0, s0: 0, lastX: 0, lastT: 0, v: 0 };
      let swallowClick = false;
      const onDown = (e: PointerEvent) => {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        drag.down = true;
        drag.moved = false;
        drag.x0 = drag.lastX = e.clientX;
        drag.s0 = sc.scrollLeft;
        drag.lastT = e.timeStamp;
        drag.v = 0;
      };
      const onMove = (e: PointerEvent) => {
        if (!drag.down) return;
        const dx = e.clientX - drag.x0;
        if (!drag.moved) {
          if (Math.abs(dx) < 6) return;
          drag.moved = true;
          tween?.kill();
          snap(false);
          el.dataset.dragging = "";
        }
        sc.scrollLeft = drag.s0 - dx;
        const dt = e.timeStamp - drag.lastT;
        if (dt > 0) drag.v = (e.clientX - drag.lastX) / dt; // px per ms
        drag.lastX = e.clientX;
        drag.lastT = e.timeStamp;
      };
      const onUp = () => {
        if (!drag.down) return;
        drag.down = false;
        if (!drag.moved) return;
        delete el.dataset.dragging;
        swallowClick = true;
        setTimeout(() => (swallowClick = false), 0);
        // Carry the throw a little, then settle on the nearest project.
        goTo(nearest(sc.scrollLeft - drag.v * 110));
      };
      const onClickCapture = (e: Event) => {
        if (!swallowClick) return;
        e.preventDefault();
        e.stopPropagation();
      };
      const noNativeDrag = (e: Event) => e.preventDefault();

      measure();
      update();
      const ro = new ResizeObserver(() => {
        measure();
        update();
      });
      ro.observe(sc);
      sc.addEventListener("scroll", onScroll, { passive: true });
      sc.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      sc.addEventListener("click", onClickCapture, true);
      sc.addEventListener("dragstart", noNativeDrag);

      return () => {
        cancelAnimationFrame(frame);
        tween?.kill();
        ro.disconnect();
        sc.removeEventListener("scroll", onScroll);
        sc.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        sc.removeEventListener("click", onClickCapture, true);
        sc.removeEventListener("dragstart", noNativeDrag);
        snap(true);
        list.style.paddingRight = "";
      };
    },
    { scope: root },
  );

  const go = (i: number) => api.current.goTo(i);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const to = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: slides.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    go(to);
  };
  /** A frame behind comes forward first; only the one in front opens its link. */
  const onFrameClick = (e: MouseEvent, i: number) => {
    if (i === activeRef.current) return;
    e.preventDefault();
    go(i);
  };

  return (
    <div ref={root} className="group/stage">
      {/* The project in front, named at display size. All six are in the HTML;
          with JS they share one cell and only the active one shows. */}
      <div className="stage-details mx-auto flex max-w-(--container-page) flex-col gap-12 px-(--page-margin)">
        {slides.map((s, i) => (
          <div key={s.slug} data-active={i === active}>
            {s.detail}
          </div>
        ))}
      </div>

      <div
        ref={scroller}
        role="group"
        aria-roledescription="carousel"
        aria-label={labels.carousel}
        tabIndex={0}
        onKeyDown={onKey}
        data-cursor-label={labels.drag}
        className="bleed-inset mt-[clamp(1.5rem,3vw,2.5rem)] snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] focus-visible:outline-offset-[-2px] group-data-dragging/stage:select-none [&::-webkit-scrollbar]:hidden"
      >
        <ul data-strip className="relative flex w-max items-end gap-(--page-gutter) [--stage-h:min(clamp(15rem,46vh,29rem),62vw)]">
          {slides.map((s, i) => {
            const front = i === active;
            const inner = (
              <>
                <span data-frame className="relative block overflow-hidden will-change-transform" style={{ aspectRatio: s.ratio }}>
                  <span className="absolute inset-0 block transition-transform duration-(--duration-slow) ease-(--ease-out-soft) group-hover/slide:scale-[1.03]">
                    {s.image}
                  </span>
                </span>
                <span data-cap lang={s.nameLang} className="mt-3 block max-w-[80%] truncate text-ui font-medium transition-opacity duration-(--duration-fast)">
                  {s.name}
                </span>
              </>
            );
            return (
              <li
                key={s.slug}
                data-slide
                style={{ "--ar": s.ratio } as CSSProperties}
                className="flex w-[min(calc(var(--stage-h)*var(--ar)),78vw)] shrink-0 snap-start flex-col justify-end"
              >
                {s.href ? (
                  <a
                    href={s.href}
                    target={s.external ? "_blank" : undefined}
                    rel={s.external ? "noopener noreferrer" : undefined}
                    data-cursor-label={front ? s.cursorLabel : labels.drag}
                    aria-current={front ? "true" : undefined}
                    onClick={(e) => onFrameClick(e, i)}
                    onFocus={() => i !== activeRef.current && go(i)}
                    className="group/slide block"
                  >
                    {inner}
                  </a>
                ) : (
                  <div onClick={(e) => onFrameClick(e, i)} className="group/slide block">
                    {inner}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* The index is the projects' own names: the one in front is ink. */}
      <nav aria-label={labels.index} className="mx-auto mt-[clamp(1.75rem,3vw,2.75rem)] max-w-(--container-page) px-(--page-margin)">
        <ul className="flex max-w-[60rem] flex-wrap gap-x-[clamp(1rem,2vw,2rem)] max-md:pr-12">
          {slides.map((s, i) => (
            <li key={s.slug}>
              <button
                type="button"
                lang={s.nameLang}
                onClick={() => go(i)}
                aria-current={i === active ? "true" : undefined}
                className={`min-h-11 font-display text-[clamp(1.0625rem,1rem+0.4vw,1.375rem)] font-bold tracking-[-0.015em] transition-colors duration-(--duration-base) ease-(--ease-out-soft) hover:text-ink ${
                  i === active ? "text-ink" : "text-gray-600"
                }`}
              >
                {s.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
