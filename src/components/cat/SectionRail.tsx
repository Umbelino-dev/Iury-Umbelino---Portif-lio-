"use client";

import { useEffect, useState } from "react";

type Tick = { id: string; at: number };

/**
 * The cat's rail (Cat Journey R03 · S3), rail mode only (≥1440px, fine pointer).
 * A hairline in the right page margin with one tick per home section, placed by
 * where the section starts in the document. Decorative: the nav stays the real
 * navigation. It ends at the corner where the cat curls up to sleep.
 */
export function SectionRail({ shown }: { shown: boolean }) {
  const [ticks, setTicks] = useState<Tick[]>([]);

  useEffect(() => {
    const measure = () => {
      const total = document.documentElement.scrollHeight;
      setTicks(
        Array.from(document.querySelectorAll<HTMLElement>("main [data-nav-id]"))
          .filter((el) => el.dataset.navId !== "hero")
          .map((el) => ({ id: el.dataset.navId ?? "", at: (el.getBoundingClientRect().top + window.scrollY) / total })),
      );
    };
    // Fires once on observe, then whenever the page height changes.
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed top-24 right-1 bottom-[calc(1rem+22px)] z-[55] w-11 text-paper mix-blend-difference transition-opacity duration-(--duration-slow) ease-(--ease-out-soft) ${shown ? "opacity-60" : "opacity-0"}`}
    >
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current" />
      {ticks.map((t) => (
        <span key={t.id} className="absolute left-1/2 h-px w-2.5 -translate-x-1/2 bg-current" style={{ top: `${t.at * 100}%` }} />
      ))}
    </div>
  );
}
