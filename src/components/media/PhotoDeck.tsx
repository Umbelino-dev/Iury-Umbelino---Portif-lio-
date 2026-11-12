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
  /** Shown in the box that rises from the pointer. */
  summary?: string;
  /** Shown when the card is opened. */
  story?: string;
  linkedin?: { url: string; embed?: string; also?: { label: string; url: string } };
  /** What the moment added (short points). */
  takeaways?: string[];
  /** CSS object-position for the crop. */
  focus?: string;
}

export interface DeckLabels {
  deck: string;
  show: string; // "Mostrar {caption}"
  more: string; // "Saber mais"
  hint: string; // "Clique para saber mais"
  pending: string; // "A história desta foto entra em breve."
  linkedin: string; // "Ver no LinkedIn"
  post: string; // "Post no LinkedIn" (iframe title)
  takeaways: string; // "O que agregou"
  profile: string; // "Ver perfil no LinkedIn"
  profileUrl: string; // the LinkedIn profile, when a photo has no post
  close: string;
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
 * Choosing a card: on hover a card lifts a little out of the deck (its inner
 * layer, so it never fights the deck's own transforms) and a small box rises
 * from the pointer with the photo's name, a one-line summary and "click to learn
 * more". A click (or Enter) opens the card: the photo held still on the left, and
 * on the right its story, what it added, and always a link to LinkedIn (the post,
 * or the profile when there is none). The panel is a native <dialog> (focus trap,
 * Esc, backdrop click closes, focus returns to the card).
 *
 * Each card: rounded portrait, a rim of light, and a frosted base made from a
 * pre-blurred copy of the photo under a gradient mask (painted once, then moved
 * as a texture), not a backdrop-filter, so the deck stays smooth.
 *
 * - GSAP tweens only when the front card changes (transform + opacity), no loop.
 * - Swipe / drag sideways or ← → on the deck deal the next / previous card.
 * - It deals by itself only while visible, with motion allowed, not hovered or
 *   focused, and while no card is open.
 * - Reduced motion: no auto-play; changes and the panel are instant.
 */
export function PhotoDeck({ photos, labels }: { photos: DeckPhoto[]; labels: DeckLabels }) {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [front, setFront] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [opened, setOpened] = useState<number | null>(null);
  const first = useRef(true);
  const paused = useRef(false);
  const visible = useRef(false);

  const reps = Math.max(1, Math.ceil(MIN_CARDS / Math.max(1, photos.length)));
  const cards = Array.from({ length: reps }, () => photos).flat();
  const n = cards.length;
  const offset = useCallback(
    (i: number, f: number) => {
      let o = (((i - f) % n) + n) % n;
      if (o > n / 2) o -= n;
      return o;
    },
    [n],
  );
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

  // Auto-deal: only while visible, motion allowed, not hovered, no card open, tab shown.
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia(MQ.reduced).matches) return;
    const io = new IntersectionObserver(([e]) => (visible.current = Boolean(e?.isIntersecting)), { threshold: 0.35 });
    io.observe(el);
    const call = gsap.delayedCall(HOLD, () => {
      if (visible.current && !paused.current && opened === null && !document.hidden) go(front + 1);
      else call.restart(true);
    });
    return () => {
      io.disconnect();
      call.kill();
    };
  }, [front, go, opened]);

  // The box that rises from the pointer: follows it, appears with a short rise.
  const placeTip = (x: number, y: number) => {
    const el = tip.current;
    if (!el) return;
    const w = el.offsetWidth;
    const flip = x + 18 + w > window.innerWidth - 12;
    el.style.transform = `translate3d(${flip ? x - 18 - w : x + 18}px, ${y - el.offsetHeight - 14}px, 0)`;
  };

  // Open / close the card's panel. The panel grows out of the card that was
  // clicked (its position and size), and shrinks back into the front card.
  const origin = useRef<HTMLElement | null>(null);
  const closing = useRef(false);
  /** Offset and scale that put the panel exactly over `el`. */
  const over = (d: HTMLElement, el: HTMLElement) => {
    const a = el.getBoundingClientRect();
    const b = d.getBoundingClientRect();
    return {
      x: a.left + a.width / 2 - (b.left + b.width / 2),
      y: a.top + a.height / 2 - (b.top + b.height / 2),
      scale: Math.max(0.2, Math.min(a.width / b.width, a.height / b.height)),
    };
  };
  const open = (i: number, el: HTMLElement) => {
    origin.current = el;
    go(i);
    setOpened(i % photos.length);
    setHovered(null);
  };
  useEffect(() => {
    const d = dialog.current;
    if (!d || opened === null) return;
    closing.current = false;
    d.classList.remove("is-closing");
    if (!d.open) d.showModal();
    if (window.matchMedia(MQ.reduced).matches) return;
    gsap.set(d, { x: 0, y: 0, scale: 1, opacity: 1 });
    const from = origin.current ? over(d, origin.current) : { x: 0, y: 24, scale: 0.96 };
    gsap.fromTo(d, { ...from, opacity: 0.4, transformOrigin: "50% 50%" }, { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.62, ease: "expo.out" });
    gsap.fromTo(
      d.querySelectorAll("[data-panel-in]"),
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.06, delay: 0.18 },
    );
  }, [opened]);
  const close = () => {
    const d = dialog.current;
    if (!d || !d.open || closing.current) return;
    closing.current = true;
    d.classList.add("is-closing"); // fades the backdrop (CSS)
    const card = stage.current?.querySelectorAll<HTMLElement>("[data-deck-card] button")[front];
    if (window.matchMedia(MQ.reduced).matches || !card) {
      d.close();
      return;
    }
    gsap.to(d, {
      ...over(d, card),
      opacity: 0,
      duration: 0.42,
      ease: "power3.in",
      onComplete: () => {
        d.close();
        gsap.set(d, { x: 0, y: 0, scale: 1, opacity: 1 });
      },
    });
  };

  // Drag / swipe: a horizontal flick deals the next or previous card.
  const drag = useRef<{ x: number; id: number; moved: boolean } | null>(null);
  const onDown = (e: PointerEvent) => {
    drag.current = { x: e.clientX, id: e.pointerId, moved: false };
  };
  const onUp = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 40) {
      d.moved = true;
      go(front + (dx < 0 ? 1 : -1));
    }
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") go(front + 1);
    else if (e.key === "ArrowLeft") go(front - 1);
    else return;
    e.preventDefault();
  };

  const hot = hovered !== null ? cards[hovered] : undefined;
  const story = opened !== null ? photos[opened] : undefined;

  return (
    <div
      ref={root}
      role="group"
      aria-roledescription="carousel"
      aria-label={labels.deck}
      onKeyDown={onKey}
      onPointerEnter={(e) => e.pointerType === "mouse" && (paused.current = true)}
      onPointerLeave={() => (paused.current = false)}
      onFocus={() => (paused.current = true)}
      onBlur={() => (paused.current = false)}
      className="relative overflow-hidden py-[clamp(2.5rem,5vw,4.5rem)]"
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
          return (
            <figure
              key={i}
              data-deck-card
              className="absolute inset-x-0 top-0 aspect-[3/4] will-change-transform"
              style={{ zIndex: pose(o, n).z }}
            >
              <button
                type="button"
                tabIndex={copy ? -1 : 0}
                aria-hidden={copy || undefined}
                aria-label={`${labels.more}: ${p.caption}`}
                onClick={(e) => {
                  // A swipe that ended on a card is not a click.
                  if (drag.current?.moved) {
                    drag.current = null;
                    return;
                  }
                  drag.current = null;
                  open(i, e.currentTarget);
                }}
                onPointerEnter={(e) => {
                  if (e.pointerType !== "mouse") return;
                  setHovered(i);
                  placeTip(e.clientX, e.clientY);
                }}
                onPointerMove={(e) => e.pointerType === "mouse" && placeTip(e.clientX, e.clientY)}
                onPointerLeave={() => setHovered((h) => (h === i ? null : h))}
                className="group/card block h-full w-full cursor-pointer text-left focus-visible:outline-ink"
              >
                {/* The lift: an inner layer, so it composes with the deck's own transforms. */}
                <span className="relative block h-full overflow-hidden rounded-[clamp(1.25rem,2vw,1.875rem)] bg-ink-800 shadow-[0_34px_60px_-30px_rgba(16,16,16,0.6)] transition-[translate,box-shadow] duration-(--duration-base) ease-(--ease-out-soft) [@media(hover:hover)]:group-hover/card:-translate-y-4 [@media(hover:hover)]:group-hover/card:shadow-[0_48px_70px_-30px_rgba(16,16,16,0.7)] group-focus-visible/card:-translate-y-4">
                  <Image
                    src={p.src}
                    alt={copy ? "" : p.alt}
                    width={p.width}
                    height={p.height}
                    draggable={false}
                    sizes="(min-width: 768px) 27vw, 64vw"
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ objectPosition: p.focus ?? "50% 18%" }}
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
                    className="absolute inset-0 h-full w-full scale-110 object-cover blur-[14px] saturate-[1.25] [mask-image:linear-gradient(to_top,#000_30%,transparent_56%)]"
                    style={{ objectPosition: p.focus ?? "50% 18%" }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgba(243,241,235,0.38),rgba(243,241,235,0.1)_55%,rgba(243,241,235,0))]"
                  />
                  <span className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 px-5 pb-[clamp(1.125rem,1.8vw,1.625rem)] text-center text-paper-0 [text-shadow:0_1px_14px_rgba(16,16,16,0.55)]">
                    <span className="font-display text-[clamp(1.125rem,1rem+0.5vw,1.5rem)] leading-tight font-bold tracking-[-0.015em] text-balance">
                      {p.caption}
                    </span>
                    <span className="font-display text-[0.9375rem] font-medium opacity-85">{labels.more}</span>
                  </span>
                  {/* Rim light: a bright edge and a soft inner glow. */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.5),inset_0_1px_24px_rgba(255,255,255,0.2)]"
                  />
                </span>
              </button>
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

      {/* The box that rises from the pointer (fine pointers only; decorative: the
          card's own label and the panel carry the same text). */}
      <div ref={tip} aria-hidden="true" className="pointer-events-none fixed top-0 left-0 z-[80] hidden [@media(hover:hover)_and_(pointer:fine)]:block">
        <div
          className={`w-[min(18rem,70vw)] rounded-[1rem] bg-paper-0/95 p-4 text-ink shadow-[0_18px_40px_-18px_rgba(16,16,16,0.45)] backdrop-blur-md transition-[opacity,translate] duration-(--duration-base) ease-(--ease-out-soft) ${
            hot ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          <p className="font-display text-[1.0625rem] leading-tight font-bold tracking-[-0.01em]">{hot?.caption}</p>
          <p className="mt-1.5 text-caption leading-snug text-gray-600">{hot?.summary ?? labels.pending}</p>
          <p className="mt-3 font-display text-[0.875rem] font-bold underline decoration-1 underline-offset-[0.3em]">{labels.hint}</p>
        </div>
      </div>

      {/* The card, opened: the photo, its story and its LinkedIn post. */}
      <dialog
        ref={dialog}
        aria-labelledby="deck-story-title"
        onCancel={(e) => {
          // Esc: close with the animation instead of the instant default.
          e.preventDefault();
          close();
        }}
        onClose={() => {
          closing.current = false;
          setOpened(null);
        }}
        onClick={(e) => e.target === e.currentTarget && close()}
        className="m-auto max-h-[min(92dvh,46rem)] w-[min(64rem,calc(100vw-2rem))] overflow-y-auto rounded-[1.75rem] bg-paper p-0 text-ink shadow-[0_40px_90px_-30px_rgba(16,16,16,0.6)] backdrop:bg-ink/55 backdrop:backdrop-blur-sm md:overflow-hidden"
      >
        {story && (
          /* Desktop: two fixed columns, the photo held still and centred on the left,
             only the text on the right scrolls. Small screens: one column, the whole
             panel scrolls. */
          <div className="grid gap-[clamp(1.5rem,3vw,2.5rem)] p-[clamp(1.25rem,3vw,2.5rem)] md:h-[min(calc(92dvh-0px),46rem)] md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)]">
            <div className="flex items-center justify-center md:min-h-0">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[1.25rem] bg-ink-800 md:max-h-full">
                <Image src={story.src} alt={story.alt} width={story.width} height={story.height} sizes="(min-width: 768px) 30rem, 90vw" className="h-full w-full object-cover" style={{ objectPosition: story.focus ?? "50% 18%" }} />
              </div>
            </div>
            <div data-panel-in className="flex min-w-0 flex-col gap-5 md:min-h-0 md:overflow-y-auto md:pr-2 md:[scrollbar-width:thin]">
              <div className="flex items-start justify-between gap-4">
                <h3 id="deck-story-title" className="font-display text-headline-m leading-[1.02] font-bold tracking-[-0.02em] text-balance">
                  {story.caption}
                </h3>
                <button
                  type="button"
                  onClick={close}
                  className="-mt-1 flex min-h-11 shrink-0 items-center font-display text-[1rem] font-bold underline decoration-1 underline-offset-[0.3em] hover:text-gray-600"
                >
                  {labels.close}
                </button>
              </div>
              {story.summary && <p className="text-lead leading-snug text-pretty">{story.summary}</p>}
              {(story.story || !story.takeaways) && <p className="max-w-[60ch] text-body text-pretty text-[#3f3d39]">{story.story ?? labels.pending}</p>}
              {story.takeaways && (
                <div className="flex flex-col gap-3">
                  <h4 className="font-display text-title font-bold tracking-[-0.01em]">{labels.takeaways}</h4>
                  <ul className="flex flex-col gap-3">
                    {story.takeaways.map((item, k) => (
                      <li key={k} className="max-w-[56ch] text-body leading-relaxed text-pretty">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {story.linkedin?.embed && (
                <iframe
                  src={story.linkedin.embed}
                  title={labels.post}
                  loading="lazy"
                  className="h-[min(34rem,60dvh)] w-full shrink-0 rounded-[1rem] border-0 bg-paper-0"
                  allowFullScreen
                />
              )}
              {/* Always a way to LinkedIn: the post, or the profile when there is none. */}
              <a
                href={story.linkedin?.url ?? labels.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex min-h-12 shrink-0 items-center gap-2.5 self-start bg-ink px-5 py-3 font-display text-[1rem] font-bold text-paper transition-colors duration-(--duration-fast) hover:bg-[#2a2a2a]"
              >
                {story.linkedin?.url ? labels.linkedin : labels.profile} <span aria-hidden="true">↗</span>
              </a>
              {story.linkedin?.also && (
                <a
                  href={story.linkedin.also.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="-mt-2 flex min-h-11 shrink-0 items-center gap-2 self-start font-display text-[1rem] font-bold underline decoration-1 underline-offset-[0.3em] transition-colors duration-(--duration-fast) hover:text-gray-600"
                >
                  {story.linkedin.also.label} <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
