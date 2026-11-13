"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

export interface SkillItem {
  name: string;
  note: string;
}

/**
 * Skills as small pills. Hovering (fine pointer) or focusing a pill shows a white
 * card under it saying where Iury uses or studies that skill; a click or tap pins
 * the card, a second click, a tap outside or Esc closes it.
 *
 * Each note is also the pill's accessible description (`aria-describedby`), so it
 * never depends on the card: the card itself is decorative (`aria-hidden`).
 * Each pill's hit area is 44px tall; the drawn pill is smaller inside it.
 */
export function SkillPills({ skills }: { skills: SkillItem[] }) {
  const uid = useId();
  const root = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  // The card keeps the last skill's text while it fades out.
  const [last, setLast] = useState<number | null>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  // A hovered pill shows over a pinned one; leaving it returns to the pinned card.
  const shown = hover ?? pinned;

  // Put the card under the pill it describes, kept inside the list's width.
  useLayoutEffect(() => {
    if (shown === null) return;
    const el = buttons.current[shown];
    const box = root.current;
    if (!el || !box) return;
    const w = card.current?.offsetWidth ?? 288;
    const max = Math.max(0, box.offsetWidth - w);
    setLast(shown);
    setPos({ left: Math.min(el.offsetLeft, max), top: el.offsetTop + el.offsetHeight - 2 });
  }, [shown]);

  // A pinned card closes on a tap / click outside or Esc.
  useEffect(() => {
    if (pinned === null) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setPinned(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPinned(null);
        setHover(null);
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pinned]);

  const item = last !== null ? skills[last] : undefined;

  return (
    <div ref={root} className="relative">
      <ul className="flex flex-wrap gap-x-1.5">
        {skills.map((s, i) => {
          const active = shown === i;
          return (
            <li key={s.name}>
              <button
                ref={(el) => {
                  buttons.current[i] = el;
                }}
                type="button"
                aria-describedby={`${uid}-${i}`}
                aria-pressed={pinned === i}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") setHover(i);
                }}
                onPointerLeave={(e) => e.pointerType === "mouse" && setHover((h) => (h === i ? null : h))}
                onFocus={(e) => {
                  if (e.currentTarget.matches(":focus-visible")) setHover(i);
                }}
                onBlur={() => setHover((h) => (h === i ? null : h))}
                onClick={() => setPinned((p) => (p === i ? null : i))}
                className="group/pill flex min-h-11 cursor-pointer items-center focus-visible:outline-none"
              >
                <span
                  className={`rounded-full border px-3 py-1 text-caption leading-snug transition-colors duration-(--duration-fast) ease-(--ease-out-soft) group-focus-visible/pill:outline-2 group-focus-visible/pill:outline-offset-2 group-focus-visible/pill:outline-ink ${
                    active ? "border-ink/30 bg-signal/40" : "border-ink/10 bg-ink/[0.03] hover:border-ink/25"
                  }`}
                >
                  {s.name}
                </span>
              </button>
              {/* Outside the button, so it describes the pill without renaming it. */}
              <span id={`${uid}-${i}`} hidden>
                {s.note}
              </span>
            </li>
          );
        })}
      </ul>

      {/* The floating card, in the photos' style: white, rounded, soft shadow. */}
      <div
        ref={card}
        aria-hidden="true"
        style={{ left: pos.left, top: pos.top }}
        className={`pointer-events-none absolute z-20 w-[min(18rem,100%)] rounded-[1rem] bg-paper-0 p-4 text-ink shadow-[0_18px_40px_-18px_rgba(16,16,16,0.45)] transition-[opacity,translate,visibility] duration-(--duration-base) ease-(--ease-out-soft) ${
          shown !== null ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
        }`}
      >
        {item && (
          <>
            <p className="font-display text-[1rem] leading-tight font-bold tracking-[-0.01em]">{item.name}</p>
            <p className="mt-1.5 text-caption leading-snug text-gray-600">{item.note}</p>
          </>
        )}
      </div>
    </div>
  );
}
