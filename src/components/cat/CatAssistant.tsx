"use client";

import { useCallback, useEffect, useId, useReducer, useRef, useState, type FormEvent } from "react";
import { gsap, MQ } from "@/lib/gsap";
import { CatFigure } from "./CatFigure";
import { CAT_OPEN, IDLE_MS, transition, type CatEvent, type CatState } from "./states";

export interface AssistantChip {
  label: string;
  answer: string;
  keywords: string[];
  action?: "projects";
}
export interface AssistantScript {
  greeting: string;
  chips: AssistantChip[];
  fallback: string;
}
export interface AssistantUI {
  title: string;
  subtitle: string;
  open: string;
  hint: string;
  close: string;
  handle: string;
  placeholder: string;
  send: string;
  thinking: string;
  you: string;
  cat: string;
  log: string;
}

type Message = { from: "cat" | "you"; text: string };

const MOBILE = "(max-width: 767px)";
const REPLY_MS = 650;

const reducer = (s: CatState, e: CatEvent) => transition(s, e);
const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

/**
 * The cat, states S2–S5 (Cat Journey R03). On the home page it starts as the hero's
 * observer (CatObserver) and jumps to the dock when the hero leaves; on a case study
 * it starts docked. The docked cat is the closed assistant button; opening grows a
 * glass panel out of it (desktop) or slides a bottom sheet up (mobile). It never
 * opens by itself.
 */
export function CatAssistant({
  context,
  script,
  ui,
  projectsHref,
}: {
  context: "home" | "case";
  script: AssistantScript;
  ui: AssistantUI;
  projectsHref: string;
}) {
  const [state, send] = useReducer(reducer, context === "home" ? "observer" : "cling");
  const [messages, setMessages] = useState<Message[]>([{ from: "cat", text: script.greeting }]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");

  const root = useRef<HTMLDivElement>(null);
  const dock = useRef<HTMLDivElement>(null);
  const dockInner = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const logEnd = useRef<HTMLDivElement>(null);
  const prev = useRef<CatState>(state);
  const heroVisible = useRef(context === "home");
  const mounted = useRef(false);
  const replyTimer = useRef<number | undefined>(undefined);
  /** The panel's open/close timeline. Lives outside the per-state context: a state
   *  change (e.g. a keypress waking the cat mid-close) must not kill it half-way. */
  const panelTl = useRef<gsap.core.Timeline | null>(null);
  const titleId = useId();
  const open = state === "awaken";
  const small = context === "case";

  const reduced = () => window.matchMedia(MQ.reduced).matches;
  const mobile = () => window.matchMedia(MOBILE).matches;
  const heroCat = () =>
    Array.from(document.querySelectorAll<HTMLElement>('[data-cat-root="observer"]')).find((el) => el.offsetParent !== null);
  const parts = () => {
    const q = (n: string) => dockInner.current?.querySelector<SVGGElement>(`[data-cat="${n}"]`) ?? null;
    return { svg: dockInner.current?.querySelector("svg") ?? null, body: q("body"), head: q("head"), eyes: q("eyes"), ears: q("ears") };
  };

  // ── Hero visibility drives S1 ⇄ S2 (home only) ───────────────────────────
  useEffect(() => {
    if (context !== "home") return;
    const hero = document.getElementById("hero");
    if (!hero) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = (entry?.intersectionRatio ?? 0) >= 0.4; // ≥60% out of view = left
        heroVisible.current = visible;
        send({ type: visible ? "HERO_ENTERED" : "HERO_LEFT" });
      },
      { threshold: [0, 0.4, 1] },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, [context]);

  // ── Any "ask the cat" control (hero cat, contact) opens the assistant ────
  useEffect(() => {
    const onOpen = () => send({ type: "OPEN" });
    window.addEventListener(CAT_OPEN, onOpen);
    return () => window.removeEventListener(CAT_OPEN, onOpen);
  }, []);

  // ── Idle → sleep, activity → wake; eyes follow reading progress (S3) ─────
  useEffect(() => {
    if (state !== "cling" && state !== "sleep") return;
    let timer: number | undefined;
    let frame = 0;
    const { eyes } = parts();
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => send({ type: "IDLE" }), IDLE_MS);
    };
    const onActivity = () => {
      if (state === "sleep") send({ type: "ACTIVITY" });
      else arm();
    };
    const onScroll = () => {
      onActivity();
      if (state !== "cling" || reduced() || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? window.scrollY / max : 0;
        if (eyes) gsap.to(eyes, { y: (p - 0.5) * 2.4, duration: 0.2, overwrite: "auto" });
      });
    };
    // Pointer movement keeps an awake cat awake but does not wake a sleeping one.
    const onMove = () => {
      if (state === "cling") arm();
    };
    if (state === "cling") arm();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("pointermove", onMove);
    };
  }, [state]);

  // ── S5 open / close ───────────────────────────────────────────────────────
  const openPanel = (fromHero: HTMLElement | null) => {
    const p = panel.current;
    const d = dock.current;
    const inner = dockInner.current;
    if (!p || !d || !inner) return;
    const rm = reduced();
    const sheet = mobile();
    const { svg, ears } = parts();
    if (fromHero) {
      // Opened from the hero slot: the cat moves to the dock first, instantly.
      gsap.set(fromHero, { autoAlpha: 0 });
    }
    gsap.set(d, { autoAlpha: 1 });
    gsap.set(p, { autoAlpha: 1, yPercent: 0, y: 0, clipPath: "none" });
    gsap.set(scrim.current, { autoAlpha: 1 });
    const pr = p.getBoundingClientRect();
    const dr = inner.getBoundingClientRect();
    const perchY = pr.top - dr.bottom + (sheet ? 14 : 10); // sit on the panel's top edge
    panelTl.current?.kill();
    const tl = gsap.timeline({ onComplete: () => title.current?.focus() });
    panelTl.current = tl;

    if (rm) {
      tl.fromTo([p, scrim.current], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.16 }).set(inner, { y: perchY });
      return;
    }
    // 0–320ms: wake and stretch (play bow), ears perk.
    if (svg) tl.to(svg, { scaleX: 1.1, scaleY: 0.9, duration: 0.16 }, 0).to(svg, { scaleX: 1, scaleY: 1, duration: 0.16 }, 0.16);
    if (ears) tl.to(ears, { y: -4, duration: 0.12, yoyo: true, repeat: 1 }, 0.12);
    if (sheet) {
      tl.fromTo(scrim.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.32 }, 0.1);
      tl.fromTo(p, { yPercent: 100 }, { yPercent: 0, duration: 0.32 }, 0.1);
      tl.to(inner, { y: perchY, duration: 0.32 }, 0.1);
    } else {
      // 320–820ms: clip-path grows from a disc at the cat into the panel; the cat rides its edge.
      const cx = dr.left + dr.width / 2 - pr.left;
      const cy = dr.top + dr.height / 2 - pr.top;
      const r = Math.hypot(Math.max(cx, pr.width - cx), Math.max(cy, pr.height - cy));
      tl.fromTo(
        p,
        { clipPath: `circle(28px at ${cx}px ${cy}px)` },
        { clipPath: `circle(${r}px at ${cx}px ${cy}px)`, duration: 0.5, ease: "power2.inOut" },
        0.32,
      )
        .to(inner, { y: perchY, duration: 0.5, ease: "power2.inOut" }, 0.32)
        .set(p, { clipPath: "none" });
    }
  };

  const closePanel = () => {
    const p = panel.current;
    const d = dock.current;
    const inner = dockInner.current;
    if (!p || !d || !inner) return;
    window.clearTimeout(replyTimer.current);
    const done = () => {
      gsap.set(p, { autoAlpha: 0, clipPath: "none", yPercent: 0, y: 0 });
      gsap.set(scrim.current, { autoAlpha: 0 });
      // Back in the hero? The reverse jump takes the cat home; focus follows it.
      if (context === "home" && heroVisible.current) {
        send({ type: "HERO_ENTERED" });
        window.setTimeout(() => heroCat()?.focus(), 450);
      } else {
        button.current?.focus();
      }
    };
    panelTl.current?.kill();
    if (reduced()) {
      panelTl.current = gsap
        .timeline({ onComplete: done })
        .to([p, scrim.current], { autoAlpha: 0, duration: 0.16 })
        .set(inner, { y: 0 }, 0);
      return;
    }
    const tl = gsap.timeline({ onComplete: done });
    panelTl.current = tl;
    if (mobile()) {
      tl.to(p, { yPercent: 100, duration: 0.28, ease: "power2.in" }, 0).to(scrim.current, { autoAlpha: 0, duration: 0.28 }, 0);
    } else {
      // Retract into the dock, where the cat lands as the panel closes.
      const pr = p.getBoundingClientRect();
      const dr = inner.getBoundingClientRect();
      const perched = Number(gsap.getProperty(inner, "y")) || 0;
      const cx = dr.left + dr.width / 2 - pr.left;
      const cy = dr.top + dr.height / 2 - perched - pr.top;
      const r = Math.hypot(Math.max(cx, pr.width - cx), Math.max(cy, pr.height - cy));
      tl.fromTo(p, { clipPath: `circle(${r}px at ${cx}px ${cy}px)` }, { clipPath: `circle(24px at ${cx}px ${cy}px)`, duration: 0.28, ease: "power2.in" }, 0);
      tl.to(scrim.current, { autoAlpha: 0, duration: 0.28 }, 0);
    }
    tl.to(inner, { y: 0, duration: 0.28, ease: "power2.in" }, 0);
  };

  // ── Poses and moves on every state change ────────────────────────────────
  useEffect(() => {
    const from = prev.current;
    prev.current = state;
    const d = dock.current;
    const inner = dockInner.current;
    if (!d || !inner) return;
    const { svg, body, head, eyes } = parts();
    const first = !mounted.current;
    mounted.current = true;
    const rm = reduced();
    const ctx = gsap.context(() => {
      if (svg) gsap.set(svg, { transformOrigin: "50% 100%" });
      if (body) gsap.set(body, { svgOrigin: "50 125" });
      if (eyes) gsap.set(eyes, { svgOrigin: "50 40" });

      // Pose: asleep = eyes shut, body settled; anything else = awake.
      const asleep = state === "sleep";
      if (eyes) gsap.to(eyes, { scaleY: asleep ? 0.1 : 1, duration: rm ? 0 : 0.2 });
      if (body) gsap.to(body, { scaleY: asleep ? 0.82 : 1, duration: rm ? 0 : 0.52, ease: "power2.in" });
      if (head) gsap.to(head, { y: asleep ? 6 : 0, rotation: asleep ? -4 : 0, svgOrigin: "50 62", duration: rm ? 0 : 0.52 });

      const hero = heroCat();
      // S1 → S2: one arc from the hero slot to the dock.
      if (state === "jump") {
        if (first || !hero) {
          gsap.set(d, { autoAlpha: 1 });
          if (hero) gsap.set(hero, { autoAlpha: 0 });
          send({ type: "LANDED" });
          return;
        }
        const hr = hero.getBoundingClientRect();
        const dr = inner.getBoundingClientRect();
        const dx = hr.left + hr.width / 2 - (dr.left + dr.width / 2);
        const dy = hr.top + hr.height / 2 - (dr.top + dr.height / 2);
        gsap.set(d, { autoAlpha: 1 });
        if (rm) {
          gsap.to(hero, { autoAlpha: 0, duration: 0.16 });
          gsap.fromTo(d, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.16, onComplete: () => send({ type: "LANDED" }) });
          return;
        }
        gsap.set(hero, { autoAlpha: 0 });
        gsap
          .timeline({ onComplete: () => send({ type: "LANDED" }) })
          .fromTo(inner, { x: dx, scale: hr.width / dr.width }, { x: 0, scale: 1, duration: 0.42, ease: "power1.inOut" }, 0)
          .fromTo(inner, { y: dy }, { y: 0, duration: 0.42, ease: "back.in(1.4)" }, 0) // rises, then falls onto the dock
          .to(svg, { scaleX: 1.08, scaleY: 0.9, duration: 0.07, ease: "power1.out" })
          .to(svg, { scaleX: 1, scaleY: 1, duration: 0.07 });
        return;
      }

      // S2–S4 → S1: reverse jump back into the hero slot.
      if (state === "observer" && from !== "observer") {
        const back = () => {
          gsap.set(d, { autoAlpha: 0 });
          gsap.set(inner, { x: 0, y: 0, scale: 1 });
          if (hero) gsap.to(hero, { autoAlpha: 1, duration: rm ? 0.16 : 0.12 });
        };
        if (rm || !hero) {
          gsap.to(d, { autoAlpha: 0, duration: 0.16, onComplete: back });
          return;
        }
        const hr = hero.getBoundingClientRect();
        const dr = inner.getBoundingClientRect();
        gsap.to(inner, {
          x: hr.left + hr.width / 2 - (dr.left + dr.width / 2),
          y: hr.top + hr.height / 2 - (dr.top + dr.height / 2),
          scale: hr.width / dr.width,
          duration: 0.42,
          ease: "power2.inOut",
          onComplete: back,
        });
        return;
      }

      if (state === "observer") {
        gsap.set(d, { autoAlpha: 0 });
        if (hero) gsap.set(hero, { autoAlpha: 1 });
        return;
      }

      // Docked states are visible; the hero slot is empty.
      if (state === "cling" || state === "sleep") {
        gsap.set(d, { autoAlpha: 1 });
        if (hero) gsap.set(hero, { autoAlpha: 0 });
      }

    }, root);
    // Panel timelines run outside the context above (see panelTl).
    if (state === "awaken") openPanel(from === "observer" ? (heroCat() ?? null) : null);
    if (from === "awaken" && state !== "awaken") closePanel();
    return () => ctx.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs per state transition only
  }, [state]);

  const close = useCallback(() => send({ type: "CLOSE" }), []);

  // ── Dialog behaviour: Escape, focus trap, inert page, scroll lock, keyboard ──
  useEffect(() => {
    if (!open) return;
    const r = root.current;
    const others = Array.from(document.body.children).filter((el) => el instanceof HTMLElement && !el.contains(r)) as HTMLElement[];
    others.forEach((el) => (el.inert = true));
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const focusables = Array.from(
        panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), input, [href], [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => el.offsetParent !== null);
      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      if (!firstEl || !lastEl) return;
      if (e.shiftKey && (document.activeElement === firstEl || document.activeElement === title.current)) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    // Mobile keyboard: the sheet rides the visual viewport so the field stays visible.
    const vv = window.visualViewport;
    const fit = () => {
      const p = panel.current;
      if (!p || !vv || !mobile()) return;
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      p.style.bottom = `${offset}px`;
      p.style.maxHeight = `${vv.height - 16}px`;
    };
    vv?.addEventListener("resize", fit);
    vv?.addEventListener("scroll", fit);
    fit();
    const p = panel.current;

    return () => {
      others.forEach((el) => (el.inert = false));
      html.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      vv?.removeEventListener("resize", fit);
      vv?.removeEventListener("scroll", fit);
      if (p) {
        p.style.bottom = "";
        p.style.maxHeight = "";
      }
    };
  }, [open, close]);

  useEffect(() => {
    logEnd.current?.scrollIntoView({ block: "end" });
  }, [messages, typing]);
  useEffect(
    () => () => {
      window.clearTimeout(replyTimer.current);
      panelTl.current?.kill();
    },
    [],
  );

  // ── Scripted conversation ─────────────────────────────────────────────────
  const ask = (text: string, chip?: AssistantChip) => {
    const q = text.trim();
    if (!q || typing) return;
    const match =
      chip ?? script.chips.find((c) => c.keywords.some((k) => normalize(q).includes(normalize(k))));
    setMessages((m) => [...m, { from: "you", text: q }]);
    setTyping(true);
    window.clearTimeout(replyTimer.current);
    replyTimer.current = window.setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { from: "cat", text: match ? match.answer : script.fallback }]);
      if (match?.action === "projects") {
        window.setTimeout(() => {
          if (context === "home") {
            close();
            window.setTimeout(
              () => document.getElementById("projects")?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" }),
              350,
            );
          } else {
            window.location.assign(projectsHref);
          }
        }, 700);
      }
    }, REPLY_MS);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(draft);
    setDraft("");
  };

  // ── Drag the sheet down to close (mobile) ─────────────────────────────────
  const drag = useRef<{ y: number; t: number; dy: number } | null>(null);
  const onHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, t: performance.now(), dy: 0 };
  };
  const onHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !panel.current) return;
    drag.current.dy = Math.max(0, e.clientY - drag.current.y);
    gsap.set(panel.current, { y: drag.current.dy });
  };
  const onHandleUp = () => {
    const g = drag.current;
    drag.current = null;
    if (!g || !panel.current) return;
    const h = panel.current.offsetHeight;
    const velocity = g.dy / Math.max(1, performance.now() - g.t);
    if (g.dy > h * 0.3 || velocity > 0.6) close();
    else gsap.to(panel.current, { y: 0, duration: 0.2 });
  };

  const disc = small ? "size-11" : "size-14";
  const catSize = small ? "w-[26px]" : "w-10";

  return (
    <div ref={root} data-cat-assistant={state}>
      {/* Scrim: dims the page on mobile, catches outside clicks everywhere. */}
      <div
        ref={scrim}
        aria-hidden="true"
        onClick={close}
        className="invisible fixed inset-0 z-[60] bg-transparent opacity-0 max-md:bg-ink/40"
      />

      {/* The dock: the curled cat is the closed assistant button (S3/S4). */}
      <div
        ref={dock}
        className="invisible fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[70] opacity-0"
      >
        <div ref={dockInner} className="relative">
          <button
            ref={button}
            type="button"
            aria-label={ui.open}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => (open ? close() : send({ type: "OPEN" }))}
            className={`group relative flex ${disc} items-end justify-center rounded-full border border-ink/14 bg-paper pb-1.5 focus-visible:outline-ink`}
          >
            <CatFigure className={`${catSize} overflow-visible`} />
            {/* Zzz — only while asleep */}
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute -top-3 -left-1 font-mono text-[11px] text-gray-500 ${state === "sleep" ? "" : "hidden"}`}
            >
              <span className="cat-z">z</span>
              <span className="cat-z [animation-delay:600ms]">z</span>
              <span className="cat-z [animation-delay:1200ms]">z</span>
            </span>
            {/* Hover / focus hint (desktop) */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-full mr-3 -translate-y-1/2 translate-x-2 rounded-pill bg-ink px-3 py-1.5 text-caption font-medium whitespace-nowrap text-paper opacity-0 transition-[opacity,translate] duration-(--duration-fast) group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 [@media(hover:none)]:hidden"
            >
              {ui.hint}
            </span>
          </button>
        </div>
      </div>

      {/* S5 — the panel (desktop) / bottom sheet (mobile) */}
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{ visibility: "hidden", opacity: 0 }}
        className="fixed z-[65] flex flex-col overflow-hidden border border-paper/14 bg-ink-800/90 text-paper backdrop-blur-[20px] backdrop-saturate-150 max-md:inset-x-0 max-md:bottom-0 max-md:h-[min(70dvh,590px)] max-md:rounded-t-[18px] max-md:border-b-0 max-md:pb-[env(safe-area-inset-bottom)] md:right-4 md:bottom-4 md:h-[min(520px,calc(100dvh-140px))] md:w-[min(360px,calc(100vw-2rem))] md:rounded-[18px]"
      >
        {/* Drag handle (mobile) */}
        <div
          aria-hidden="true"
          title={ui.handle}
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
          className="flex h-11 shrink-0 touch-none items-center justify-center md:hidden"
        >
          <span className="h-1 w-10 rounded-full bg-paper/30" />
        </div>

        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-paper/10 px-5 pb-3.5 md:pt-4.5">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id={titleId} ref={title} tabIndex={-1} className="font-display text-title font-semibold outline-none">
              {ui.title}
            </h2>
            <p className="font-mono text-[11px] tracking-[0.04em] text-gray-500 uppercase">{ui.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={ui.close}
            className="-mt-1 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-xl leading-none hover:bg-paper/10"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div role="log" aria-label={ui.log} aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex max-w-[92%] flex-col gap-1 ${m.from === "you" ? "self-end text-right" : ""}`}>
              <span className="font-mono text-[11px] tracking-[0.04em] text-gray-500 uppercase">{m.from === "cat" ? ui.cat : ui.you}</span>
              <p className={`text-[0.9375rem] leading-normal text-pretty ${m.from === "you" ? "text-paper-300" : ""}`}>{m.text}</p>
            </div>
          ))}
          {typing && (
            <p className="font-mono text-[11px] tracking-[0.04em] text-gray-500" aria-live="off">
              {ui.thinking}
            </p>
          )}
          <div ref={logEnd} />
        </div>

        <div className="flex shrink-0 gap-2 overflow-x-auto px-5 pb-3 max-md:[&::-webkit-scrollbar]:hidden md:flex-wrap">
          {script.chips.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => ask(c.label, c)}
              disabled={typing}
              className="min-h-11 shrink-0 rounded-pill border border-paper/20 px-4 text-[0.875rem] font-medium whitespace-nowrap transition-colors duration-(--duration-fast) hover:bg-paper/10 disabled:opacity-50"
            >
              {c.label}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="flex shrink-0 items-center gap-2 border-t border-paper/10 px-4 py-3">
          <label className="sr-only" htmlFor={`${titleId}-input`}>
            {ui.placeholder}
          </label>
          <input
            id={`${titleId}-input`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={ui.placeholder}
            autoComplete="off"
            className="h-12 min-w-0 flex-1 rounded-pill border border-paper/20 bg-ink px-4 text-base text-paper placeholder:text-gray-500 focus-visible:outline-signal"
          />
          <button
            type="submit"
            aria-label={ui.send}
            disabled={!draft.trim() || typing}
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-signal text-lg text-ink disabled:opacity-40"
          >
            <span aria-hidden="true">↑</span>
          </button>
        </form>
      </div>
    </div>
  );
}
