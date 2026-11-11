"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { DUR, EASE, gsap, MQ, useGSAP } from "@/lib/gsap";
import { Ruler } from "@/components/layout/Ruler";

export interface StageSlide {
  slug: string;
  /** "P.01" */
  index: string;
  name: string;
  nameLang?: string;
  /** Frame proportion (width / height). Frames share a height, so widths differ. */
  ratio: number;
  /** Cover or editorial placeholder, rendered on the server; fills the frame. */
  image: ReactNode;
  /** Status, name, summary and link for this project, rendered on the server. */
  detail: ReactNode;
  href?: string;
  external?: boolean;
  /** Custom cursor label over the frame in front (fine pointers only). */
  cursorLabel?: string;
  /** "Mostrar Koinonia" — name of the ruler tick that brings this project to the front. */
  goLabel: string;
}

export interface StageLabels {
  carousel: string;
  prev: string;
  next: string;
  drag: string;
}

/** How much a frame shrinks and fades once it is one place away from the front. */
const DEPTH = 0.24;
const FADE = 0.3;

/**
 * The project stage: one horizontal strip of frames in different proportions.
 * The frame on the page's left margin is in front, at full size; the others wait
 * to its right, smaller and paler, and run off the screen's edge. Its name sits
 * above the strip at display size, the way the old index set it.
 *
 * - It is a native horizontal scroller with snap points: touch, trackpad, keyboard
 *   and no-JS all work before any script runs. Scale, fade and the ruler marker
 *   are derived from the scroll position (one rAF per scroll event, no loop).
 * - Frames scale from their bottom-left corner and are shifted so the gaps stay
 *   even: the strip reads as one row standing on a baseline, not as loose cards.
 * - Mouse: drag the strip; arrows and ruler ticks move one project at a time;
 *   a click on a frame behind brings it forward, a click on the front one opens it.
 * - Keyboard: ← → Home End on the strip; links and ticks are tab stops.
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
      const marker = el.querySelector<HTMLElement>("[data-marker]");
      const rule = el.querySelector<HTMLElement>("[data-rule]");
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
      const markX = marker ? gsap.quickSetter(marker, "x", "px") : null;

      let offsets: number[] = []; // scrollLeft that puts slide i in front
      let widths: number[] = [];
      let ruleWidth = 0;
      const scale = new Array<number>(n).fill(1);
      const dist = new Array<number>(n).fill(0);

      const measure = () => {
        offsets = items.map((it) => it.offsetLeft);
        widths = items.map((it) => it.offsetWidth);
        ruleWidth = rule?.offsetWidth ?? 0;
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
        // Ruler marker: continuous position between ticks.
        let at = n - 1;
        for (let i = 0; i < n - 1; i++) {
          const a = offsets[i] ?? 0;
          const b = offsets[i + 1] ?? 0;
          if (s < b) {
            at = i + gsap.utils.clamp(0, 1, (s - a) / (b - a || 1));
            break;
          }
        }
        markX?.((at / Math.max(1, n - 1)) * ruleWidth);

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

  const last = slides.length - 1;
  const arrow =
    "flex size-11 items-center justify-center text-xl transition-[background-color,opacity] duration-(--duration-fast) hover:bg-ink/6 disabled:pointer-events-none disabled:opacity-25";

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
                <span
                  data-cap
                  className="mt-3 flex max-w-[76%] items-baseline gap-3 transition-opacity duration-(--duration-fast)"
                >
                  <span className="text-index text-gray-600">{s.index}</span>
                  <span lang={s.nameLang} className="truncate text-ui font-medium">
                    {s.name}
                  </span>
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

      {/* Position: one tick per project on the measured line, and the two arrows. */}
      <div className="mx-auto mt-[clamp(1.5rem,3vw,2.5rem)] flex max-w-(--container-page) items-start gap-6 px-(--page-margin)">
        <div className="min-w-0 flex-1 px-2 md:max-w-[58%]">
          <div data-rule className="relative">
            <Ruler ticks={slides.map((_, i) => ({ at: last ? i / last : 0, major: true }))} className="text-ink">
              <span aria-hidden="true" data-marker className="absolute top-2 -left-1 size-[9px] bg-ink will-change-transform" />
              {slides.map((s, i) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={s.goLabel}
                  aria-current={i === active ? "true" : undefined}
                  style={{ left: `${(last ? i / last : 0) * 100}%` }}
                  className={`text-index absolute -top-1 flex h-11 w-11 -translate-x-1/2 items-end justify-center pb-1 transition-colors duration-(--duration-fast) hover:text-ink ${
                    i === active ? "font-semibold text-ink" : "text-gray-600"
                  }`}
                >
                  {s.index.replace(/\D/g, "")}
                </button>
              ))}
            </Ruler>
          </div>
        </div>
        <div className="ml-auto flex">
          <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label={labels.prev} className={arrow}>
            <span aria-hidden="true">←</span>
          </button>
          <button type="button" onClick={() => go(active + 1)} disabled={active === last} aria-label={labels.next} className={arrow}>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
