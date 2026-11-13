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
  { id: "contact", key: "contact" },
] as const;

type ItemId = (typeof ITEMS)[number]["id"];
/** Sections without a nav item (e.g. "approach") mark nothing as current. */
type SectionId = ItemId | (string & {});

/** The line, in px from the top, that decides the nav theme (Homepage R02: 44px). */
const THEME_LINE = 44;

/**
 * Primary nav. Reads the page instead of being told:
 * - theme: the `data-surface` of the section under the nav (light ↔ dark),
 * - active item: the `[data-nav-id]` section crossing the middle of the viewport.
 * One passive scroll listener, throttled to one frame.
 */
export function Nav({ variant = "home" }: { variant?: "home" | "case" }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const otherLocale = locale === "pt" ? "en" : "pt";
  const [light, setLight] = useState(false);
  const [active, setActive] = useState<SectionId>("hero");
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
      let current: SectionId = "hero";
      document.querySelectorAll<HTMLElement>("[data-nav-id]").forEach((s) => {
        if (s.getBoundingClientRect().top < mid) current = s.dataset.navId ?? current;
      });
      setLight(surface === "light");
      setActive(alias ?? current);
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

  // Below md the page scrolls under the name: once past the hero it gets the same
  // glass pill as the other floating controls, so it never sits on top of text.
  const overContent = variant === "case" || active !== "hero";
  const brand = `flex min-h-11 items-center whitespace-nowrap font-display text-[1.0625rem] font-bold tracking-[-0.01em] ${focusRing} ${
    overContent ? `max-md:-ml-3 max-md:rounded-pill max-md:border max-md:px-3 ${glass} ${glassBlur} md:border-transparent md:bg-transparent md:shadow-none md:backdrop-blur-none` : ""
  }`;

  const link = (id: ItemId, key: (typeof ITEMS)[number]["key"], extra = "") => (
    <a
      key={id}
      href={`#${id}`}
      aria-current={active === id ? "location" : undefined}
      onClick={() => setOpen(false)}
      className={`flex min-h-11 items-center rounded-pill px-3.5 text-[0.8125rem] font-medium transition-opacity duration-(--duration-base) hover:opacity-100 ${active === id ? "opacity-100" : "opacity-65"} ${focusRing} ${extra}`}
    >
      {t(key)}
    </a>
  );

  return (
    // The nav strip spans the full width: only its controls take the pointer,
    // so content scrolling under the empty part stays hoverable and clickable.
    <div className="pointer-events-none sticky top-0 z-40 h-0">
      <nav
        aria-label={t("label")}
        className={`pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-6 [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&>div]:pointer-events-auto px-(--page-margin) py-3 md:py-5 ${transition} ${light ? "text-ink" : "text-paper"}`}
      >
        {variant === "home" ? (
          <a href="#hero" aria-label={t("home")} className={brand}>
            {site.name}
          </a>
        ) : (
          <Link href="/" aria-label={t("home")} className={brand}>
            {site.name}
          </Link>
        )}

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {variant === "case" && (
            // Case study: one pill back to the index (Case Study R01; 44px tall on mobile).
            <Link
              href="/#projects"
              className={`flex min-h-11 items-center gap-2.5 rounded-pill border px-4 text-[0.8125rem] whitespace-nowrap sm:px-4.5 font-medium ${glass} ${glassBlur} ${transition} ${focusRing}`}
            >
              <span aria-hidden="true">←</span>
              <span className="sm:hidden">{t("projectsShort")}</span>
              <span className="max-sm:hidden">{t("allProjects")}</span>
            </Link>
          )}

          {/* Desktop: the glass pill with every section */}
          <div className={`${variant === "case" ? "!hidden" : ""} hidden items-center gap-0.5 rounded-pill border p-[3px] md:flex ${glass} ${glassBlur} ${transition}`}>
            {ITEMS.map((i) => link(i.id, i.key))}
          </div>

          <Link
            href={pathname}
            locale={otherLocale}
            hrefLang={otherLocale === "pt" ? "pt-BR" : "en"}
            aria-label={`${t("localeShort")} · ${t("switchLocale")}`}
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
            className={`${variant === "case" ? "!hidden" : ""} flex min-h-11 items-center rounded-pill border px-4 text-[0.8125rem] font-medium md:hidden ${glass} ${glassBlur} ${transition} ${focusRing}`}
          >
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
