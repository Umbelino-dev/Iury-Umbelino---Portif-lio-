"use client";

import { useCallback, useEffect, useId, useReducer, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { gsap, MQ } from "@/lib/gsap";
import { CatFigure } from "./CatFigure";
import { airborne, brace, catParts, climbRest, climbStep, crouch, falling, grab, greet, land, letGo, prime, settle, wake, type CatParts } from "./clips";
import { sparkle } from "./magic";
import { SectionRail } from "./SectionRail";
import { CAT_OPEN, HERO_LEFT_AT, IDLE_MS, transition, type CatEvent, type CatState } from "./states";

export interface AssistantChip {
  label: string;
  answer: string;
  keywords: string[];
  action?: "projects" | "contact";
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
/**
 * Rail mode (home only): the cat rides a hairline rail in the right page margin.
 * From 1440px the margin is wide enough (≥50px) to hold the 44px cat without
 * covering copy; below that it keeps the bottom-right dock.
 */
const RAIL = "(min-width: 1440px) and (hover: hover) and (pointer: fine)";
const READING_LINE = 0.4; // the rail cat holds 40% of the viewport height
/** A scroll faster than this (px per ms) is too fast to hold on to: the cat lets go. */
const FAST = 2.6;
/** The hero's last letter, the one the cat sits on: it takes the leap and the landing. */
const perch = () => document.querySelector<SVGPathElement>('[data-glyph="l2-o"]');
const subscribeRail = (cb: () => void) => {
  const mq = window.matchMedia(RAIL);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const REPLY_MS = 650;

const reducer = (s: CatState, e: CatEvent) => transition(s, e);
const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

/**
 * The cat, states S2–S5 (Cat Journey R03). On the home page it starts as the hero's
 * observer (CatObserver) and jumps when the hero leaves: onto the rail from 1440px
 * (it hangs there, riding the reading line, and slides down to curl up when idle),
 * or to the bottom-right dock below that. On a case study it starts docked. The docked cat is the closed assistant button; opening grows a
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
  const hint = useRef<HTMLSpanElement>(null);
  /** An "open" asked for mid-leap: honoured as soon as the cat lands. */
  const pendingOpen = useRef(false);
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
  const rail = useSyncExternalStore(subscribeRail, () => context === "home" && window.matchMedia(RAIL).matches, () => false);
  const isRail = () => context === "home" && window.matchMedia(RAIL).matches;

  const reduced = () => window.matchMedia(MQ.reduced).matches;
  const mobile = () => window.matchMedia(MOBILE).matches;
  const heroCat = () =>
    Array.from(document.querySelectorAll<HTMLElement>('[data-cat-root="observer"]')).find((el) => el.offsetParent !== null);
  const parts = () => {
    const q = (n: string) => dockInner.current?.querySelector<SVGGElement>(`[data-cat="${n}"]`) ?? null;
    return {
      svg: dockInner.current?.querySelector("svg") ?? null,
      body: q("body"),
      head: q("head"),
      eyes: q("eyes"),
      ears: q("ears"),
      tail: q("tail"),
      paws: q("paws"),
    };
  };
  /** OPEN, except mid-leap: then it waits for the landing (the jump is not interruptible). */
  const requestOpen = () => {
    if (prev.current === "jump") pendingOpen.current = true;
    else send({ type: "OPEN" });
  };
  const landed = () => {
    send({ type: "LANDED" });
    if (pendingOpen.current) {
      pendingOpen.current = false;
      send({ type: "OPEN" });
    }
  };
  /** The docked cat's parts for the clip library (frame = its svg, pivoting on its feet). */
  const clipParts = (): CatParts | null => {
    const p = dockInner.current ? catParts(dockInner.current) : null;
    if (p) prime(p);
    return p;
  };
  /** Awake, at rest: the pose every awake state returns to. */
  const awakePose = (p: CatParts, gripping: boolean, d: number) => {
    gsap.to(p.frame, { scaleX: 1, scaleY: 1, rotation: 0, y: 0, duration: d, overwrite: "auto" });
    gsap.to(p.eyes, { scaleY: 1, duration: d * 0.4 });
    gsap.to(p.body, { scaleY: 1, duration: d });
    gsap.to(p.head, { y: 0, rotation: 0, duration: d });
    gsap.to([p.legL, p.legR], { y: 0, rotation: 0, duration: d });
    gsap.to(p.tail, { rotation: 0, duration: d ? d * 1.4 : 0, ease: "elastic.out(1, 0.4)" });
    gsap.to(p.paws, { opacity: gripping ? 1 : 0, duration: d * 0.3 });
  };
  /** Dock offset (px) that puts the cat's centre on the reading line. */
  const railY = () => {
    const d = dock.current;
    if (!d) return 0;
    const r = d.getBoundingClientRect();
    const base = r.top + r.height / 2 - (Number(gsap.getProperty(d, "y")) || 0);
    return window.innerHeight * READING_LINE - base;
  };

  // Leaving rail mode (resize): the cat goes back to the corner.
  useEffect(() => {
    if (!rail && dock.current) gsap.set(dock.current, { y: 0 });
  }, [rail]);

  // ── Scroll speed, read by the leap (too fast = no time to jump: it falls) ──
  const speed = useRef({ v: 0, t: 0 });
  useEffect(() => {
    let lastY = window.scrollY;
    let lastT = performance.now();
    const onScroll = () => {
      const now = performance.now();
      speed.current = { v: Math.abs(window.scrollY - lastY) / Math.max(8, now - lastT), t: now };
      lastY = window.scrollY;
      lastT = now;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const tooFast = () => performance.now() - speed.current.t < 220 && speed.current.v > FAST;

  // ── S3 on the rail: hang, ride the page, climb back to the reading line.
  //    It hangs from its paws, so it swings as the page drags it, and climbs back
  //    hand over hand. A scroll too fast to hold on to shakes it loose: it travels
  //    with the page in the air, then falls (or leaps) back to the line and
  //    catches the rail again.
  useEffect(() => {
    if (!rail || state !== "cling") return;
    const d = dock.current;
    if (!d) return;
    const { eyes, tail } = parts();
    const base = railY();
    const rm = reduced();
    // Climb up (from the corner after sleep) or settle after the jump.
    gsap.to(d, { y: base, duration: rm ? 0 : 0.4, ease: "power2.out" });
    // Eyes turn toward the text, to the left of the rail.
    if (eyes) gsap.to(eyes, { x: -2.5, duration: rm ? 0 : 0.3 });
    if (rm) {
      return () => {
        if (eyes) gsap.set(eyes, { x: 0 });
      };
    }
    const p = dockInner.current ? catParts(dockInner.current) : null;
    const vh = window.innerHeight;
    const span = vh * 0.25; // holding on: how far the page can drag it
    const looseUp = vh * READING_LINE - 96; // loose: up to just under the nav
    const looseDown = vh * 0.42;
    const clamp = gsap.utils.clamp;
    const setY = gsap.quickSetter(d, "y", "px");
    const m = { offset: 0 };
    let lastY = window.scrollY;
    let lastT = performance.now();
    let frame = 0;
    let loose = false;
    let returning = false;
    let calm: number | undefined;
    let travelled = 0;
    let steps = 0;
    let hanging = false;

    const swing = (deg: number) => {
      if (!p) return;
      if (!hanging) {
        // From here on the figure pivots where it holds the rail, not on its feet.
        hanging = true;
        gsap.set(p.frame, { transformOrigin: "50% 8%" });
      }
      gsap.set(p.frame, { rotation: deg });
    };
    // Holding on: the page drags it, it climbs back to the line (lerp 0.12).
    // The rAF runs only while it is still moving.
    const tick = () => {
      const before = m.offset;
      m.offset += (0 - m.offset) * 0.12;
      setY(base + m.offset);
      if (tail) gsap.set(tail, { rotation: clamp(-30, 30, m.offset * 0.3), svgOrigin: "80 118" });
      swing(clamp(-13, 13, m.offset * 0.07));
      travelled += Math.abs(m.offset - before);
      if (p && travelled > 16) {
        travelled = 0;
        climbStep(p, ++steps);
      }
      if (Math.abs(m.offset) > 0.5) {
        frame = requestAnimationFrame(tick);
      } else {
        frame = 0;
        m.offset = 0;
        setY(base);
        if (tail) gsap.to(tail, { rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
        if (p) {
          gsap.to(p.frame, { rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.35)" });
          climbRest(p);
        }
      }
    };
    // The speed is gone: it falls (or leaps up) to the line and catches the rail.
    const regrip = () => {
      loose = false;
      returning = true;
      gsap.to(m, {
        offset: 0,
        duration: 0.2 + Math.min(0.3, Math.abs(m.offset) / 900),
        ease: m.offset < 0 ? "power2.in" : "power2.out",
        onUpdate: () => setY(base + m.offset),
        onComplete: () => {
          returning = false;
          if (!p) return;
          grab(p);
          gsap.to(p.eyes, { scale: 1, duration: 0.2 });
          gsap.to(p.ears, { y: 0, duration: 0.2 });
        },
      });
    };
    const onScroll = () => {
      const y = window.scrollY;
      const now = performance.now();
      const dy = y - lastY;
      const v = Math.abs(dy) / Math.max(8, now - lastT);
      lastY = y;
      lastT = now;
      if (!dy) return;
      gsap.killTweensOf(d, "y");
      if (!loose && v > FAST) {
        loose = true;
        returning = false;
        cancelAnimationFrame(frame);
        frame = 0;
        gsap.killTweensOf(m);
        if (p) {
          climbRest(p);
          letGo(p, dy > 0 ? -1 : 1); // scrolling down carries it up, and the other way round
        }
      }
      if (loose) {
        m.offset = clamp(-looseUp, looseDown, m.offset - dy);
        setY(base + m.offset);
        window.clearTimeout(calm);
        calm = window.setTimeout(regrip, 140);
        return;
      }
      if (returning) return;
      m.offset = clamp(-span, span, m.offset - dy);
      if (!frame) frame = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      window.clearTimeout(calm);
      gsap.killTweensOf(d, "y");
      gsap.killTweensOf(m);
      if (p) {
        climbRest(p);
        gsap.killTweensOf(p.frame, "rotation");
        gsap.set(p.frame, { rotation: 0, transformOrigin: "50% 100%" });
      }
      if (eyes) gsap.to(eyes, { x: 0, duration: 0.2 });
    };
  }, [rail, state]);

  // ── S3 in the dock: there is nothing to fall from, so a scroll that fast only
  //    makes it brace (low, ears back, tail streaming), at most once a second.
  useEffect(() => {
    if (rail || state !== "cling" || reduced()) return;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let rest = 0;
    const onScroll = () => {
      const now = performance.now();
      const dy = window.scrollY - lastY;
      const v = Math.abs(dy) / Math.max(8, now - lastT);
      lastY = window.scrollY;
      lastT = now;
      if (v <= FAST || now < rest) return;
      rest = now + 1000;
      const p = clipParts();
      if (p) brace(p, dy > 0 ? -1 : 1);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [rail, state]);

  // ── Hero visibility drives S1 ⇄ S2 (home only) ───────────────────────────
  useEffect(() => {
    if (context !== "home") return;
    const hero = document.getElementById("hero");
    if (!hero) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = (entry?.intersectionRatio ?? 0) >= 1 - HERO_LEFT_AT; // half out of view = left
        heroVisible.current = visible;
        send({ type: visible ? "HERO_ENTERED" : "HERO_LEFT" });
      },
      { threshold: [0, 1 - HERO_LEFT_AT, 1] },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, [context]);

  // ── ASSISTANT invitation: at Contact the awake cat waves once and the
  //    "Ask the cat" hint shows for a moment. It never opens anything itself.
  useEffect(() => {
    if (context !== "home") return;
    const contact = document.getElementById("contact");
    if (!contact) return;
    let greeted = false;
    let hintTimer: number | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (greeted || !entry?.isIntersecting || prev.current !== "cling" || reduced()) return;
        const p = clipParts();
        if (!p) return;
        greeted = true;
        greet(p);
        if (hint.current) {
          gsap.to(hint.current, { opacity: 1, duration: 0.2, delay: 0.3 });
          hintTimer = window.setTimeout(() => {
            if (hint.current) gsap.to(hint.current, { opacity: 0, clearProps: "opacity", duration: 0.3 });
          }, 2600);
        }
      },
      { threshold: 0.35 },
    );
    io.observe(contact);
    return () => {
      io.disconnect();
      window.clearTimeout(hintTimer);
    };
  }, [context]);

  // ── Any "ask the cat" control (hero cat, contact) opens the assistant ────
  useEffect(() => {
    const onOpen = () => requestOpen();
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
    // Opened from the rail: the cat drops to the corner, where the panel grows from it.
    const lift = Number(gsap.getProperty(d, "y")) || 0;
    gsap.set(d, { autoAlpha: 1, y: 0 });
    gsap.set(p, { autoAlpha: 1, yPercent: 0, y: 0, clipPath: "none" });
    gsap.set(scrim.current, { autoAlpha: 1 });
    const pr = p.getBoundingClientRect();
    const dr = inner.getBoundingClientRect();
    const perchY = pr.top - dr.bottom + (sheet ? 14 : 10); // sit on the panel's top edge
    panelTl.current?.kill();
    const tl = gsap.timeline({ onComplete: () => title.current?.focus() });
    panelTl.current = tl;
    if (lift && !rm) tl.fromTo(inner, { y: lift }, { y: 0, duration: 0.24, ease: "power2.in" }, 0);

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
    if (state !== "jump") pendingOpen.current = false; // a leap that never landed drops its request
    const first = !mounted.current;
    mounted.current = true;
    const rm = reduced();
    const p = clipParts();
    if (!p) return;
    const ctx = gsap.context(() => {
      const hero = heroCat();
      const gripping = isRail() && state === "cling";

      // Awake states settle into the rest pose (the jump, sleep and wake-up drive their own).
      if (state === "cling" || state === "awaken" || state === "observer") awakePose(p, gripping, rm ? 0 : 0.3);

      // S1 → S2: JUMP (crouch, take-off, apex) → FALL (gravity, legs dangling)
      // → GRAB the rail (squash, damped swing) or LAND in the dock.
      if (state === "jump") {
        // Rail mode: the landing spot is on the rail, at the reading line.
        if (isRail()) gsap.set(d, { y: railY() });
        if (first || !hero) {
          gsap.set(d, { autoAlpha: 1 });
          if (hero) gsap.set(hero, { autoAlpha: 0 });
          awakePose(p, isRail(), 0);
          landed();
          return;
        }
        const hr = hero.getBoundingClientRect();
        const dr = inner.getBoundingClientRect();
        const dx = hr.left + hr.width / 2 - (dr.left + dr.width / 2);
        const dy = hr.top + hr.height / 2 - (dr.top + dr.height / 2);
        gsap.set(d, { autoAlpha: 1 });
        if (rm) {
          gsap.to(hero, { autoAlpha: 0, duration: 0.16 });
          awakePose(p, isRail(), 0);
          gsap.fromTo(d, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.16, onComplete: landed });
          return;
        }
        gsap.set(hero, { autoAlpha: 0 });
        const seen = hr.bottom > 0 && hr.top < window.innerHeight;
        // Phones: no leap. It vanishes from the hero in a puff of stars and
        // appears, by the same magic, as the corner button.
        if (mobile()) {
          const at = seen ? 0.14 : 0;
          if (seen) sparkle(hr.left + hr.width / 2, hr.top + hr.height / 2);
          gsap
            .timeline({ onComplete: landed })
            .set(inner, { x: 0, y: 0, scale: 0, rotation: -120 }, 0)
            .add(() => {
              sparkle(dr.left + dr.width / 2, dr.top + dr.height / 2, { count: 11, spread: 60 });
            }, at)
            .to(inner, { scale: 1, rotation: 0, duration: 0.42, ease: "back.out(1.8)" }, at)
            .add(land(p), at + 0.34);
          return;
        }
        // Too fast for the leap (no time to crouch, or the hero cat is long gone):
        // it is already in the air, falling, and catches the rail or lands.
        if (tooFast() || hr.bottom < -60) {
          gsap
            .timeline({ onComplete: landed })
            .set(inner, { x: 0, y: -(dr.top + dr.height + 24), scale: 1, rotation: 0 }, 0)
            .add(falling(p, 0.08), 0)
            .to(inner, { y: 0, duration: 0.46, ease: "power2.in" }, 0)
            .add(isRail() ? grab(p) : land(p), 0.46);
          return;
        }
        // Apex above both ends of the leap, but never above the visible page (under the nav).
        const apex = Math.max(Math.min(dy, 0) - 70, 90 - dr.top);
        const tl = gsap.timeline({ onComplete: landed });
        tl.set(inner, { x: dx, y: dy, scale: hr.width / dr.width, rotation: 0 })
          .add(crouch(p, 0.1))
          .addLabel("air")
          .add(airborne(p, 0.2), "air")
          .to(inner, { x: 0, scale: 1, duration: 0.5, ease: "power1.inOut" }, "air")
          .to(inner, { y: apex, duration: 0.22, ease: "power2.out" }, "air")
          .add(falling(p, 0.22), "air+=0.22")
          .to(inner, { y: 0, duration: 0.28, ease: "power2.in" }, "air+=0.22")
          .add(isRail() ? grab(p) : land(p), "air+=0.5");
        // The push-off knocks its letter down; the letter springs back up.
        const o = perch();
        if (o) {
          tl.to(o, { y: 150, rotation: 9, transformOrigin: "30% 100%", duration: 0.18, ease: "power2.in" }, "air").to(
            o,
            { y: 0, rotation: 0, duration: 1.1, ease: "elastic.out(1, 0.38)" },
            "air+=0.24",
          );
        }
        return;
      }

      // S2–S4 → S1: reverse jump back into the hero slot.
      if (state === "observer" && from !== "observer") {
        const o = perch();
        const back = () => {
          gsap.set(d, { autoAlpha: 0, y: 0 });
          gsap.set(inner, { x: 0, y: 0, scale: 1, rotation: 0 });
          if (hero) gsap.to(hero, { autoAlpha: 1, duration: rm ? 0.16 : 0.12 });
        };
        if (o) gsap.to(o, { y: 0, rotation: 0, duration: 0.2, overwrite: "auto" });
        if (rm || !hero) {
          gsap.to(d, { autoAlpha: 0, duration: 0.16, onComplete: back });
          return;
        }
        const hr = hero.getBoundingClientRect();
        const dr = inner.getBoundingClientRect();
        const seen = hr.bottom > 0 && hr.top < window.innerHeight;
        // Phones: the magic again, the other way round.
        if (mobile()) {
          sparkle(dr.left + dr.width / 2, dr.top + dr.height / 2, { count: 11, spread: 60 });
          gsap.to(inner, {
            scale: 0,
            rotation: 120,
            duration: 0.24,
            ease: "power2.in",
            onComplete: () => {
              back();
              if (seen) sparkle(hr.left + hr.width / 2, hr.top + hr.height / 2);
            },
          });
          return;
        }
        // A real leap home: crouch, an arc, and it lands on its letter, which takes the weight.
        const tx = hr.left + hr.width / 2 - (dr.left + dr.width / 2);
        const ty = hr.top + hr.height / 2 - (dr.top + dr.height / 2);
        const tl = gsap.timeline({ onComplete: back });
        tl.set(p.paws, { opacity: 0 }, 0)
          .add(crouch(p, 0.08))
          .addLabel("air")
          .add(airborne(p, 0.16), "air")
          .to(inner, { x: tx, scale: hr.width / dr.width, duration: 0.42, ease: "power1.inOut" }, "air")
          .to(inner, { y: Math.min(ty, 0) - 56, duration: 0.18, ease: "power2.out" }, "air")
          .to(inner, { y: ty, duration: 0.24, ease: "power2.in" }, "air+=0.18")
          .add(land(p), "air+=0.42");
        if (o && seen) {
          tl.to(o, { y: 46, duration: 0.07, ease: "power2.out" }, "air+=0.42").to(o, { y: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" }, "air+=0.49");
        }
        return;
      }

      if (state === "observer") {
        gsap.set(d, { autoAlpha: 0 });
        if (hero) gsap.set(hero, { autoAlpha: 1 });
        return;
      }

      // Docked states are visible; the hero slot is empty.
      if (state === "cling" || state === "sleep" || state === "waking") {
        gsap.set(d, { autoAlpha: 1 });
        if (hero) gsap.set(hero, { autoAlpha: 0 });
      }

      // S4 · SLEEP. On the rail: eyes close, it lets go and FALLS down the rail,
      // lands in the corner, then curls up (settle). In the dock: it just curls up.
      if (state === "sleep") {
        if (rm) {
          gsap.set(d, { y: 0 });
          settle(p).progress(1).pause();
          return;
        }
        const lifted = (Number(gsap.getProperty(d, "y")) || 0) < -1;
        const tl = gsap.timeline();
        if (lifted) {
          tl.to(p.eyes, { scaleY: 0.1, duration: 0.2 }, 0)
            .set(p.paws, { opacity: 0 }, 0.2)
            .add(falling(p, 0.2), 0.2)
            .to(d, { y: 0, duration: 0.45, ease: "power2.in" }, 0.2)
            .add(land(p), 0.65)
            .add(settle(p), 0.8);
        } else {
          tl.add(settle(p), 0);
        }
        return;
      }

      // WAKING: an ear twitch, eyes open, it rises and stretches; then it is awake
      // (cling), and on the rail it climbs back up to the reading line.
      if (state === "waking") {
        if (rm) {
          awakePose(p, false, 0);
          send({ type: "WOKE" });
          return;
        }
        wake(p).call(() => send({ type: "WOKE" }));
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
      if (match?.action) {
        const target = match.action; // "projects" | "contact" — both are home sections
        window.setTimeout(() => {
          if (context === "home") {
            close();
            window.setTimeout(
              () => document.getElementById(target)?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" }),
              350,
            );
          } else {
            window.location.assign(target === "projects" ? projectsHref : projectsHref.replace("#projects", "#contact"));
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

  const disc = small || rail ? "size-11" : "size-14";
  const catSize = small ? "w-[26px]" : rail ? "w-[30px]" : "w-10";

  return (
    <div ref={root} data-cat-assistant={state}>
      {/* Scrim: dims the page on mobile, catches outside clicks everywhere. */}
      <div
        ref={scrim}
        aria-hidden="true"
        onClick={close}
        className="invisible fixed inset-0 z-[60] bg-transparent opacity-0 max-md:bg-ink/40"
      />

      {rail && <SectionRail shown={state !== "observer"} />}

      {/* The dock: the curled cat is the closed assistant button (S3/S4). In rail mode it sits on the rail. */}
      <div
        ref={dock}
        data-cat-dock
        className={`invisible fixed z-[70] opacity-0 ${rail ? "right-1 bottom-4" : "right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(1rem+env(safe-area-inset-bottom))]"}`}
      >
        <div ref={dockInner} className="relative">
          <button
            ref={button}
            type="button"
            aria-label={ui.open}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => (open ? close() : requestOpen())}
            className={`group relative flex ${disc} items-end justify-center rounded-full border border-ink/14 bg-paper pb-1.5 focus-visible:outline-ink`}
          >
            <CatFigure className={`${catSize} overflow-visible`} />
            {/* Zzz — only while asleep */}
            <span
              aria-hidden="true"
              className={`pointer-events-none text-note absolute -top-4 -left-1 text-[0.9375rem] text-gray-500 ${state === "sleep" ? "" : "hidden"}`}
            >
              <span className="cat-z">z</span>
              <span className="cat-z [animation-delay:600ms]">z</span>
              <span className="cat-z [animation-delay:1200ms]">z</span>
            </span>
            {/* Hover / focus hint (desktop); also shown once by the Contact greeting. */}
            <span
              ref={hint}
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

        <header className="flex shrink-0 items-start justify-between gap-3 px-5 pb-2 md:pt-4.5">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id={titleId} ref={title} tabIndex={-1} className="font-display text-title font-bold outline-none">
              {ui.title}
            </h2>
            <p className="text-note text-[1rem] text-gray-500">{ui.subtitle}</p>
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
              <span className="text-note text-[0.9375rem] text-gray-500">{m.from === "cat" ? ui.cat : ui.you}</span>
              <p className={`text-[0.9375rem] leading-normal text-pretty ${m.from === "you" ? "text-paper-300" : ""}`}>{m.text}</p>
            </div>
          ))}
          {typing && (
            <p className="text-note text-[0.9375rem] text-gray-500" aria-live="off">
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

        <form onSubmit={onSubmit} className="flex shrink-0 items-center gap-2 px-4 py-3">
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
