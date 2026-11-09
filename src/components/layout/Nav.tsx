"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { site } from "@/content/profile";
import { SURFACE_EVENT } from "./surface";

const ITEMS = [
  { id: "hero", key: "index" },
  { id: "about", key: "about" },
  { id: "projects", key: "projects" },
  { id: "lab", key: "lab" },
  { id: "contact", key: "contact" },
] as const;

type ItemId = (typeof ITEMS)[number]["id"];

/** The line, in px from the top, that decides the nav theme (Homepage R02: 44px). */
const THEME_LINE = 44;

/**
 * Primary nav. Reads the page instead of being told:
 * - theme: the `data-surface` of the section under the nav (light ↔ dark),
 * - active item: the `[data-nav-id]` section crossing the middle of the viewport.
 * One passive scroll listener, throttled to one frame.
 */
export function Nav() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const otherLocale = locale === "pt" ? "en" : "pt";
  const [light, setLight] = useState(false);
  const [active, setActive] = useState<ItemId>("hero");
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuPanel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      const mid = window.innerHeight / 2;
      // Hit-test the line under the nav: respects clip-path, so the Night→Day
      // stage reports whichever layer is actually visible there.
      let surface = "dark";
      let alias: string | undefined;
      const x = Math.min(window.innerWidth - 1, Math.max(0, window.innerWidth / 2));
      for (const el of document.elementsFromPoint(x, THEME_LINE)) {
        if (el.closest("nav")) continue;
        const owner = el.closest<HTMLElement>("[data-surface]");
        if (owner) {
          surface = owner.dataset.surface ?? "dark";
          alias = owner.dataset.navAs; // e.g. the Night→Day stage: night = Index, day = About
          break;
        }
      }
      let current: ItemId = "hero";
      document.querySelectorAll<HTMLElement>("[data-nav-id]").forEach((s) => {
        if (s.getBoundingClientRect().top < mid) current = s.dataset.navId as ItemId;
      });
      setLight(surface === "light");
      setActive((alias as ItemId | undefined) ?? current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    // A surface change can land after this frame's scroll read; re-read once it has painted.
    let late = 0;
    const onSurface = () => {
      cancelAnimationFrame(late);
      late = requestAnimationFrame(() => (late = requestAnimationFrame(read)));
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener(SURFACE_EVENT, onSurface);
    return () => {
      cancelAnimationFrame(late);
      window.removeEventListener(SURFACE_EVENT, onSurface);
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Mobile menu: Escape and outside clicks close it; focus returns to the button.
  useEffect(() => {
    if (!open) return;
    menuPanel.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!menuPanel.current?.contains(target) && !menuButton.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const glass = light
    ? "border-ink/14 bg-paper/62 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_8px_24px_rgba(16,16,16,0.06)]"
    : "border-paper/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.075),rgba(255,255,255,0.035))] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-1px_0_rgba(0,0,0,0.35),0_8px_28px_rgba(0,0,0,0.45)]";
  const glassBlur = "backdrop-blur-[16px] backdrop-saturate-[1.4] backdrop-brightness-[1.15]";
  const transition = "transition-[color,background-color,border-color,box-shadow] duration-(--duration-base) ease-(--ease-out-soft)";
  const focusRing = light ? "focus-visible:outline-ink" : "focus-visible:outline-signal";

  const link = (id: ItemId, key: (typeof ITEMS)[number]["key"], extra = "") => (
    <a
      key={id}
      href={`#${id}`}
      aria-current={active === id ? "location" : undefined}
      onClick={() => setOpen(false)}
      className={`flex min-h-11 items-center gap-2 rounded-pill px-3.5 text-[0.8125rem] font-medium ${focusRing} ${extra}`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 bg-current transition-opacity duration-(--duration-base) ${active === id ? "opacity-100" : "opacity-0"}`}
      />
      {t(key)}
    </a>
  );

  return (
    <div className="pointer-events-none sticky top-0 z-40 h-0">
      <nav
        aria-label={t("label")}
        className={`pointer-events-auto absolute inset-x-0 top-0 flex items-center justify-between gap-6 px-(--page-margin) py-3 md:py-5 ${transition} ${light ? "text-ink" : "text-paper"}`}
      >
        <a
          href="#hero"
          aria-label={t("home")}
          className={`flex min-h-11 items-center font-display text-[1.0625rem] font-semibold tracking-[-0.01em] ${focusRing}`}
        >
          {site.name}
        </a>

        <div className="flex items-center gap-2">
          {/* Desktop: the glass pill with every section */}
          <div className={`hidden items-center gap-0.5 rounded-pill border p-[3px] md:flex ${glass} ${glassBlur} ${transition}`}>
            {ITEMS.map((i) => link(i.id, i.key))}
          </div>

          <Link
            href={pathname}
            locale={otherLocale}
            hrefLang={otherLocale === "pt" ? "pt-BR" : "en"}
            aria-label={t("switchLocale")}
            className={`flex min-h-11 min-w-11 items-center justify-center rounded-pill text-label font-medium tracking-label ${focusRing}`}
          >
            {t("localeShort")}
          </Link>

          {/* Mobile: one pill that opens the same list */}
          <button
            ref={menuButton}
            type="button"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
            className={`flex min-h-11 items-center gap-2 rounded-pill border px-4 text-[0.8125rem] font-medium md:hidden ${glass} ${glassBlur} ${transition} ${focusRing}`}
          >
            <span aria-hidden="true" className="size-1.5 bg-current" />
            {t("menu")}
          </button>
        </div>

        <div
          ref={menuPanel}
          id={menuId}
          hidden={!open}
          className={`absolute top-full right-(--page-margin) w-56 rounded-[18px] border p-1.5 md:hidden ${glassBlur} ${
            // Opaque enough to read over the hero: an open list is content, not decoration.
            light ? "border-ink/14 bg-paper/95" : "border-paper/20 bg-ink-800/95"
          }`}
        >
          <ul className="flex flex-col">
            {ITEMS.map((i) => (
              <li key={i.id}>{link(i.id, i.key, "w-full rounded-[12px]")}</li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
}
