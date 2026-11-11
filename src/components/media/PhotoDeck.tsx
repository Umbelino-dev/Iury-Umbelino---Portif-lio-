"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { gsap, MQ, useGSAP } from "@/lib/gsap";

export interface DeckPhoto {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
}

export interface DeckLabels {
  deck: string;
  show: string; // "Mostrar {caption}"
}

/** The deck always shows at least this many cards (photos repeat until then). */
const MIN_CARDS = 4;
/** Seconds a card stays in front before the next one is dealt. */
const HOLD = 3.4;

/**
 * Where a card sits for its offset from the front (0 = front, ±1 = beside it,
 * ±2 = further out / tucked behind). Fractions of the card's own width.
 */
function pose(o: number, n: number) {
  const a = Math.abs(o);
  const side = Math.sign(o);
  // With 4 cards, the one opposite the front waits hidden behind it.
  if (n === 4 && a === 2) return { x: 0, y: 0.02, scale: 0.7, rotation: 0, opacity: 0, z: 0 };
  if (a === 0) return { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, z: 30 };
  if (a === 1) return { x: side * 0.66, y: 0.05, scale: 0.8, rotation: side * 7, opacity: 1, z: 20 };
  return { x: side * 1.18, y: 0.13, scale: 0.64, rotation: side * 13, opacity: a > 2 ? 0 : 0.85, z: 10 - a };
}

/**
 * A small deck of large photo cards (About), after Iury's reference: the card in
 * front is centred at full size; its neighbours tuck behind it, smaller, turned
 * outward in a fan. Every few seconds the next card is dealt to the front.
 *
 * Each card: rounded portrait, a rim of light, and a frosted base where the
 * photo dissolves into blur and carries the caption. The blur is a second,
 * pre-blurred copy of the same photo under a gradient mask (painted once, then
 * moved with the card as a texture), not a backdrop-filter: the deck stays
 * smooth while it moves.
 *
 * - GSAP tweens only when the front card changes (transform + opacity), no loop.
 * - Click a side card, drag / swipe sideways, or use ← → on the deck.
 * - It deals by itself only while visible, with motion allowed, and not while the
 *   pointer is over it or a card has keyboard focus.
 * - Reduced motion: no auto-play; changes are instant.
 */
export function PhotoDeck({ photos, labels }: { photos: DeckPhoto[]; labels: DeckLabels }) {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [front, setFront] = useState(0);
  const first = useRef(true);
  const paused = useRef(false);
  const visible = useRef(false);

  const reps = Math.max(1, Math.ceil(MIN_CARDS / Math.max(1, photos.length)));
  const cards = Array.from({ length: reps }, () => photos).flat();
  const n = cards.length;
  const offset = useCallback((i: number, f: number) => {
    let o = (((i - f) % n) + n) % n;
    if (o > n / 2) o -= n;
    return o;
  }, [n]);

  const go = useCallback((to: number) => setFront(((to % n) + n) % n), [n]);

  // Lay the cards out for the current front card.
  useGSAP(
    () => {
      const el = stage.current;
      if (!el) return;
      const items = gsap.utils.toArray<HTMLElement>("[data-deck-card]", el);
      const reduced = window.matchMedia(MQ.reduced).matches;
      const instant = first.current || reduced;
      first.current = false;
      items.forEach((card, i) => {
        const p = pose(offset(i, front), n);
        const w = card.offsetWidth;
        gsap.set(card, { zIndex: p.z });
        gsap.to(card, {
          x: p.x * w,
          y: p.y * w,
          scale: p.scale,
          rotation: p.rotation,
          opacity: p.opacity,
          duration: instant ? 0 : 0.95,
          ease: "power3.inOut",
          overwrite: "auto",
        });
      });
    },
    { scope: stage, dependencies: [front, n], revertOnUpdate: false },
  );

  // Re-place on resize (poses are fractions of the card's width).
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      gsap.utils.toArray<HTMLElement>("[data-deck-card]", el).forEach((card, i) => {
        const p = pose(offset(i, front), n);
        gsap.set(card, { x: p.x * card.offsetWidth, y: p.y * card.offsetWidth });
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [front, n, offset]);

  // Auto-deal: only while visible, motion allowed, not hovered, tab shown.
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia(MQ.reduced).matches) return;
    const io = new IntersectionObserver(([e]) => (visible.current = Boolean(e?.isIntersecting)), { threshold: 0.35 });
    io.observe(el);
    const call = gsap.delayedCall(HOLD, () => {
      if (visible.current && !paused.current && !document.hidden) go(front + 1);
      else call.restart(true);
    });
    return () => {
      io.disconnect();
      call.kill();
    };
  }, [front, go]);

  // Drag / swipe: a horizontal flick deals the next or previous card.
  const drag = useRef<{ x: number; id: number } | null>(null);
  const onDown = (e: PointerEvent) => {
    drag.current = { x: e.clientX, id: e.pointerId };
  };
  const onUp = (e: PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 40) go(front + (dx < 0 ? 1 : -1));
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") go(front + 1);
    else if (e.key === "ArrowLeft") go(front - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div
      ref={root}
      role="group"
      aria-roledescription="carousel"
      aria-label={labels.deck}
      tabIndex={0}
      onKeyDown={onKey}
      onPointerEnter={(e) => e.pointerType === "mouse" && (paused.current = true)}
      onPointerLeave={() => (paused.current = false)}
      onFocus={() => (paused.current = true)}
      onBlur={() => (paused.current = false)}
      className="relative overflow-hidden py-[clamp(2.5rem,5vw,4.5rem)] focus-visible:outline-offset-[-4px]"
    >
      <div
        ref={stage}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={() => (drag.current = null)}
        className="relative mx-auto h-[calc(var(--card-w)*4/3*1.12)] w-(--card-w) touch-pan-y select-none [--card-w:clamp(15rem,64vw,26rem)] md:[--card-w:clamp(17rem,27vw,26rem)]"
      >
        {cards.map((p, i) => {
          const o = offset(i, front);
          const copy = i >= photos.length;
          const isFront = o === 0;
          return (
            <figure
              key={i}
              data-deck-card
              aria-hidden={copy || !isFront || undefined}
              onClick={() => !isFront && go(i)}
              className={`absolute inset-x-0 top-0 aspect-[3/4] will-change-transform ${isFront ? "" : "cursor-pointer"}`}
              style={{ zIndex: pose(o, n).z }}
            >
              <div className="relative h-full overflow-hidden rounded-[clamp(1.25rem,2vw,1.875rem)] bg-ink-800 shadow-[0_34px_60px_-30px_rgba(16,16,16,0.6)]">
                <Image
                  src={p.src}
                  alt={copy ? "" : p.alt}
                  width={p.width}
                  height={p.height}
                  draggable={false}
                  sizes="(min-width: 768px) 27vw, 64vw"
                  className="absolute inset-0 h-full w-full object-cover object-[50%_18%]"
                />
                {/* Frosted base: a pre-blurred copy of the photo, revealed by a gradient. */}
                <Image
                  src={p.src}
                  alt=""
                  aria-hidden="true"
                  width={p.width}
                  height={p.height}
                  draggable={false}
                  sizes="(min-width: 768px) 27vw, 64vw"
                  className="absolute inset-0 h-full w-full scale-110 object-cover object-[50%_18%] blur-[14px] saturate-[1.25] [mask-image:linear-gradient(to_top,#000_30%,transparent_56%)]"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgba(243,241,235,0.38),rgba(243,241,235,0.1)_55%,rgba(243,241,235,0))]"
                />
                <figcaption className="absolute inset-x-0 bottom-0 px-5 pb-[clamp(1.125rem,1.8vw,1.625rem)] text-center font-display text-[clamp(1.125rem,1rem+0.5vw,1.5rem)] leading-tight font-bold tracking-[-0.015em] text-balance text-paper-0 [text-shadow:0_1px_14px_rgba(16,16,16,0.55)]">
                  {p.caption}
                </figcaption>
                {/* Rim light: a bright edge and a soft inner glow. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.5),inset_0_1px_24px_rgba(255,255,255,0.2)]"
                />
              </div>
            </figure>
          );
        })}
      </div>

      {/* The captions are the index: the one in front is ink. */}
      <ul className="mt-[clamp(1.5rem,3vw,2.5rem)] flex justify-center gap-x-6 px-(--page-margin)">
        {photos.map((p, i) => {
          const active = front % photos.length === i;
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-current={active ? "true" : undefined}
                aria-label={labels.show.replace("{caption}", p.caption)}
                className={`min-h-11 font-display text-[1rem] font-bold tracking-[-0.01em] transition-colors duration-(--duration-base) hover:text-ink ${active ? "text-ink" : "text-gray-600"}`}
              >
                {p.caption}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
