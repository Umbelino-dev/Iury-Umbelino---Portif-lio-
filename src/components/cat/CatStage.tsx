"use client";

import { useEffect, useRef, type RefObject } from "react";
import { gsap, MQ, SplitText } from "@/lib/gsap";
import { CatFigure } from "./CatFigure";
import { airborne, catParts, crouch, land, pawSwipe, pretend, prime, startle, stretch, tailChase, tailFlick, walk, yawn, type CatParts } from "./clips";
import { Director, type Behaviour } from "./director";
import { sparkle } from "./magic";
import { DROWSY_MS, type CatState } from "./states";

/** What the director knows about the visitor right now. */
interface Mood {
  /** ms since the page last scrolled. */
  calm: number;
  /** ms since any input (scroll, pointer, key, touch). */
  idle: number;
  /** ms since the pointer last moved (Infinity on touch). */
  moved: number;
  pointer: { x: number; y: number } | null;
  /** The cat is inside the pictures (between two portals). */
  away: boolean;
  awayFor: number;
}

const W = 48; // the actor at scale 1 (CatFigure is 4:5)
const H = 60;
const clamp = gsap.utils.clamp;
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)] as T;

/** Everything outside a box: the cat walks behind a picture's edge. */
const outside = (r: DOMRect) =>
  `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${r.left}px ${r.top}px, ${r.right}px ${r.top}px, ${r.right}px ${r.bottom}px, ${r.left}px ${r.bottom}px, ${r.left}px ${r.top}px)`;
/** Only inside a box, minus an optional cover (something in the picture it passes behind). */
const inside = (r: DOMRect, cover?: [number, number, number]) => {
  const box = `${r.left}px ${r.top}px, ${r.right}px ${r.top}px, ${r.right}px ${r.bottom}px, ${r.left}px ${r.bottom}px, ${r.left}px ${r.top}px`;
  if (!cover) return `polygon(${box})`;
  const [x0, x1, top] = cover;
  const cl = r.left + r.width * x0;
  const cr = r.left + r.width * x1;
  const ct = r.top + r.height * top;
  return `polygon(evenodd, ${box}, ${cl}px ${ct}px, ${cr}px ${ct}px, ${cr}px ${r.bottom}px, ${cl}px ${r.bottom}px, ${cl}px ${ct}px)`;
};

/**
 * The cat's stage (R13): a fixed, inert layer with one roaming figure (the
 * "actor"), and the director that decides what the awake cat does with a quiet
 * moment. One cat, one place: when a scene needs the cat somewhere else, the
 * docked figure is hidden and the actor takes over from the same spot; when the
 * scene ends (or anything interrupts it) the actor is hidden and the docked
 * figure is back. The disc stays where it is: it is still the assistant button.
 *
 * Scenes (all rare, all cancellable at once; none runs with reduced motion):
 * - peek: it leaves its place and looks in over an edge of the screen (eyes and
 *   ears only, paws on the edge, chin on the edge, half a face from the side),
 *   slowly; it ducks when the pointer comes close and may look again;
 * - typeWalk: on a section title, on a visual copy of the letters (the real
 *   heading stays in the DOM, untouched): it hides behind the first letter,
 *   walks the tops of the letters, sits between two, nudges the last one, swats
 *   it down, plays with it; the letter goes back to its place;
 * - chase: it runs after the pointer along the bottom of the window, hops,
 *   swats, sometimes pins it under a paw, then loses interest;
 * - portalIn / portalOut: it walks behind the edge of a picture, is seen inside
 *   it, and later comes out of another picture (`data-cat-portal`);
 * - in place: a stretch, a wash, a spin after its own tail, a yawn when the
 *   visitor has gone quiet, a start when the window changes.
 * Between scenes it watches the pointer from its place and swats at it when it
 * comes within reach; on touch it looks at the tap.
 *
 * The actor carries a hairline of paper-coloured light, so the graphite figure
 * reads on dark surfaces (on light ones it disappears into the page).
 *
 * The layer never takes pointer events, never moves the page, and only animates
 * transform, opacity and clip-path. Dev hook: `window.dispatchEvent(new
 * CustomEvent("cat:play", { detail: "peek" }))` starts a scene now.
 */
export function CatStage({
  state,
  rail,
  dockInner,
  busy,
}: {
  state: CatState;
  rail: boolean;
  dockInner: RefObject<HTMLDivElement | null>;
  /** True while a scene runs: the cat does not fall asleep in the middle of one. */
  busy: RefObject<boolean>;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state !== "cling") return;
    if (window.matchMedia(MQ.reduced).matches) return;
    const st = stage.current;
    const w = wrap.current;
    const inner = dockInner.current;
    const lean = w?.querySelector<HTMLElement>("[data-cat-lean]");
    if (!st || !w || !inner || !lean) return;
    const actor = catParts(w, lean);
    if (!actor) return;
    const p: CatParts = actor;
    prime(p);

    const fine = window.matchMedia(MQ.finePointer).matches;
    const phone = window.matchMedia("(max-width: 767px)").matches;
    const now = () => performance.now();
    let lastScroll = now();
    let lastInput = now();
    let lastMove = -Infinity;
    let pointer: Mood["pointer"] = null;
    let yawned = false;
    let away: { since: number; from: Element } | null = null;
    const visited = new Set<string>();

    // ── the actor ──────────────────────────────────────────────────────────
    const dockSvg = () => inner.querySelector<SVGSVGElement>("svg");
    /** The docked figure's parts, as they are (no re-priming: on the rail it pivots at its grip). */
    const dockParts = () => catParts(inner);
    const rest = () => {
      gsap.set(p.frame, { scaleX: 1, scaleY: 1, rotation: 0, x: 0, y: 0 });
      gsap.set([p.legL, p.legR], { y: 0, rotation: 0 });
      gsap.set(p.eyes, { scaleY: 1, scale: 1, x: 0, y: 0 });
      gsap.set([p.eyeL, p.eyeR], { scaleY: 1 });
      gsap.set(p.gaze, { x: 0, y: 0 });
      gsap.set(p.look, { rotation: 0 });
      gsap.set(p.head, { y: 0, rotation: 0 });
      gsap.set(p.body, { scaleY: 1 });
      gsap.set([p.tail, p.ears], { rotation: 0, y: 0 });
      gsap.set([p.paws, p.hold, p.yawn], { opacity: 0 });
    };
    /** Put the actor's feet at a point of the viewport. */
    const put = (x: number, y: number, scale = 1, rotation = 0) => gsap.set(w, { x: x - W / 2, y: y - H, scale, rotation, transformOrigin: "50% 100%" });
    const hideActor = () => {
      gsap.killTweensOf(w);
      gsap.set(w, { autoAlpha: 0, zIndex: "auto" });
      st.style.clipPath = "";
      st.style.zIndex = "";
    };
    /** The actor takes over from the docked figure, on the same spot. */
    const leaveDock = () => {
      const svg = dockSvg();
      const r = (svg ?? inner).getBoundingClientRect();
      rest();
      put(r.left + r.width / 2, r.bottom, r.width / W);
      gsap.set(w, { autoAlpha: 1 });
      if (svg) gsap.set(svg, { autoAlpha: 0 });
      return { x: r.left + r.width / 2, y: r.bottom };
    };
    /** The docked figure is back; the actor is gone. Safe to call at any time. */
    const backInDock = (pop = true) => {
      hideActor();
      away = null;
      const svg = dockSvg();
      if (!svg) return;
      gsap.killTweensOf(svg, "opacity,visibility,autoAlpha");
      // A fade from wherever it is, never a `fromTo`: a killed tween's lazy first
      // render would otherwise leave the figure half-transparent.
      if (pop) gsap.to(svg, { autoAlpha: 1, duration: 0.2 });
      else gsap.set(svg, { autoAlpha: 1 });
    };
    let leaps = 0;
    /** A leap of the actor: crouch, arc, landing. */
    const leap = (
      tl: gsap.core.Timeline,
      from: { x: number; y: number },
      to: { x: number; y: number },
      { lift = 60, d = 0.5, scale }: { lift?: number; d?: number; scale?: number } = {},
    ) => {
      const l = `leap${leaps++}`;
      tl.add(crouch(p, 0.09))
        .addLabel(l)
        .add(airborne(p, 0.16), l)
        .to(w, { x: to.x - W / 2, duration: d, ease: "power1.inOut", ...(scale ? { scale } : {}) }, l)
        .to(w, { y: Math.min(from.y, to.y) - lift - H, duration: d * 0.45, ease: "power2.out" }, l)
        .to(w, { y: to.y - H, duration: d * 0.55, ease: "power2.in" }, `${l}+=${d * 0.45}`)
        .add(land(p), `${l}+=${d}`);
    };
    const leapHome = (tl: gsap.core.Timeline, from: { x: number; y: number }) => {
      const r = (dockSvg() ?? inner).getBoundingClientRect();
      leap(tl, from, { x: r.left + r.width / 2, y: r.bottom }, { scale: r.width / W, d: 0.55, lift: 70 });
      tl.add(() => backInDock(false));
    };

    // ── scenes ─────────────────────────────────────────────────────────────

    /** 14 · It looks in over an edge of the screen. */
    const peek: Behaviour<Mood> = {
      id: "peek",
      priority: 1,
      weight: 3,
      cooldown: 80_000,
      when: (m) => m.calm > 3500 && m.idle < DROWSY_MS && !m.away,
      run: (done) => {
        type Kind = "eyes" | "paws" | "chin" | "left" | "right";
        const kinds: Kind[] = phone ? ["eyes", "paws", "chin"] : rail ? ["eyes", "paws", "chin", "left"] : ["eyes", "paws", "chin", "left", "right"];
        const s = phone ? 1.5 : 1.9;
        let tl: gsap.core.Timeline | null = null;
        let wait: gsap.core.Tween | null = null;
        let again = 0;
        let ended = false;
        let live = false; // on show: the pointer can scare it
        let head = { x: 0, y: 0 };
        let hide = { x: 0, y: 0 };
        const finish = () => {
          if (ended) return;
          ended = true;
          backInDock();
          done();
        };
        const appear = () => {
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const kind = pick(kinds);
          rest();
          let shown = { x: 0, y: 0 };
          let rotation = 0;
          if (kind === "left" || kind === "right") {
            const y = rand(vh * 0.5, vh * 0.82);
            const dir = kind === "left" ? 1 : -1;
            rotation = dir * 9;
            hide = { x: kind === "left" ? -W * s * 0.7 : vw + W * s * 0.7, y };
            shown = { x: kind === "left" ? W * s * 0.04 : vw - W * s * 0.04, y };
            head = { x: shown.x, y: y - H * s * 0.7 };
          } else {
            // away from the corner button, and not under the pointer
            let x = rand(70, vw - (phone ? 150 : 230));
            if (pointer && Math.abs(pointer.x - x) < 240) x = clamp(70, vw - (phone ? 150 : 230), pointer.x + (pointer.x > vw / 2 ? -320 : 320));
            const visible = kind === "eyes" ? 0.43 : kind === "paws" ? 0.56 : 0.51;
            if (kind !== "eyes") gsap.set(p.hold, { opacity: 1 });
            if (kind === "chin") gsap.set(p.head, { y: 4 });
            hide = { x, y: vh + H * s + 8 };
            shown = { x, y: vh + H * s * (1 - visible) };
            head = { x, y: vh - 24 };
          }
          put(hide.x, hide.y, s, rotation);
          gsap.set(w, { autoAlpha: 1 });
          const half = { x: (hide.x + shown.x * 2) / 3, y: (hide.y + shown.y * 2) / 3 };
          live = true;
          tl = gsap
            .timeline({ onComplete: finish })
            // slowly, in two moves, as if checking the room
            .to(w, { x: half.x - W / 2, y: half.y - H, duration: 0.75, ease: "power1.out" })
            .to(w, { x: shown.x - W / 2, y: shown.y - H, duration: 0.6, ease: "power1.out" }, "+=0.4")
            .to(p.gaze, { x: 2.5, duration: 0.3 }, "+=0.35")
            .to(p.gaze, { x: -2.5, duration: 0.4 }, "+=0.5")
            .to(p.gaze, { x: 0, duration: 0.3 }, "+=0.4")
            .to(p.eyes, { scaleY: 0.1, duration: 0.07, yoyo: true, repeat: 1 }, "+=0.3")
            .to(p.ears, { y: -3, duration: 0.1, yoyo: true, repeat: 1 }, "+=0.5")
            .to({}, { duration: rand(0.8, 2.4) })
            .add(() => {
              live = false;
            })
            .to(w, { x: hide.x - W / 2, y: hide.y - H, duration: 0.45, ease: "power2.in" });
        };
        // It leaves its place first; the disc stays, empty.
        const svg = dockSvg();
        if (svg) gsap.to(svg, { autoAlpha: 0, duration: 0.2 });
        wait = gsap.delayedCall(rand(0.6, 1.4), appear);
        return {
          cancel: () => {
            ended = true;
            tl?.kill();
            wait?.kill();
            backInDock();
          },
          pointer: (x, y) => {
            if (!live) return;
            const d = Math.hypot(x - head.x, y - head.y);
            if (d > 150) {
              // it watches the pointer while it is out
              gsap.to(p.gaze, { x: clamp(-3, 3, (x - head.x) / 70), y: clamp(-2, 2, (y - head.y) / 90), duration: 0.25, overwrite: "auto" });
              return;
            }
            // too close: it ducks, fast, and may look again from somewhere else
            live = false;
            tl?.kill();
            tl = gsap.timeline().to(w, { x: hide.x - W / 2, y: hide.y - H, duration: 0.14, ease: "power2.in" });
            if (again++ < 2 && Math.random() < 0.75) wait = gsap.delayedCall(rand(2, 4.5), appear);
            else wait = gsap.delayedCall(0.5, finish);
          },
        };
      },
    };

    /** 15 · The letters of a section title are things it can walk on, sit between and knock over. */
    const titleInView = () =>
      Array.from(document.querySelectorAll<HTMLElement>('main h2[id$="-title"]')).filter((h) => {
        const r = h.getBoundingClientRect();
        return r.top > 120 && r.bottom < window.innerHeight - 110 && r.width > 120 && (h.textContent ?? "").trim().length >= 3;
      });
    const typeWalk: Behaviour<Mood> = {
      id: "typeWalk",
      priority: 1,
      weight: 3,
      cooldown: 110_000,
      when: (m) => m.calm > 3000 && m.idle < DROWSY_MS && !m.away && titleInView().length > 0,
      run: (done) => {
        const titles = titleInView();
        const h = titles.find((t) => !visited.has(t.id)) ?? titles[0];
        if (!h) {
          done();
          return { cancel: () => {} };
        }
        visited.add(h.id);
        if (visited.size > 4) visited.clear();
        const cs = getComputedStyle(h);
        const fs = parseFloat(cs.fontSize);
        const r = h.getBoundingClientRect();
        // A visual copy of the letters, over the heading. The heading itself stays
        // in the DOM (only made transparent): its text, its name and its place
        // in the outline never change.
        const ghost = document.createElement("div");
        ghost.className = h.className;
        ghost.setAttribute("aria-hidden", "true");
        ghost.textContent = (h.getAttribute("aria-label") ?? h.textContent ?? "").trim();
        Object.assign(ghost.style, { position: "absolute", left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, margin: "0", color: cs.color, zIndex: "2" });
        const probe = document.createElement("span");
        probe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
        ghost.prepend(probe);
        st.appendChild(ghost);
        const baseline = probe.getBoundingClientRect().bottom;
        probe.remove();
        const split = SplitText.create(ghost, { type: "chars", aria: "none" });
        const ctx = document.createElement("canvas").getContext("2d");
        if (ctx) ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const line = (split.chars[0] as HTMLElement | undefined)?.getBoundingClientRect().top ?? 0;
        const chars = (split.chars as HTMLElement[])
          .map((el) => {
            const b = el.getBoundingClientRect();
            const ink = ctx?.measureText(el.textContent ?? "").actualBoundingBoxAscent || fs * 0.7;
            return { el, left: b.left, right: b.right, cx: b.left + b.width / 2, top: baseline - ink + 2, line: b.top };
          })
          .filter((c) => Math.abs(c.line - line) < fs * 0.5 && c.right > c.left);
        const cleanup = () => {
          split.revert();
          ghost.remove();
          h.style.opacity = "";
        };
        const first = chars[0];
        const last = chars[chars.length - 1];
        if (chars.length < 3 || !first || !last) {
          cleanup();
          done();
          return { cancel: () => {} };
        }
        h.style.opacity = "0";
        const s = clamp(0.62, 1.25, (fs * 0.46) / H);
        const start = leaveDock();
        const tl = gsap.timeline({
          onComplete: () => {
            cleanup();
            done();
          },
        });
        const press = (c: (typeof chars)[number], depth: number, at: string | number) =>
          tl.to(c.el, { yPercent: depth, duration: 0.08, ease: "power2.out" }, at).to(c.el, { yPercent: 0, duration: 0.55, ease: "elastic.out(1, 0.4)" }, ">");

        // 1 · behind the first letter: it lands out of sight, looks over the top, climbs on
        gsap.set(w, { zIndex: 1 });
        leap(tl, start, { x: first.cx, y: baseline }, { scale: s, d: 0.62, lift: 100 });
        tl.to(w, { y: first.top + H * s * 0.52 - H, duration: 0.45, ease: "power1.out" }, "+=0.15")
          .to(p.gaze, { x: -2.5, duration: 0.2 }, "+=0.1")
          .to(p.gaze, { x: 2.5, duration: 0.3 }, "+=0.3")
          .to(p.gaze, { x: 0, duration: 0.2 }, "+=0.25")
          .set(w, { zIndex: 3 })
          .to(w, { y: first.top - 12 - H, duration: 0.14, ease: "power2.out" })
          .to(w, { y: first.top - H, duration: 0.12, ease: "power2.in" })
          .addLabel("on");
        press(first, 6, "on");

        // 2 · across the tops, one letter at a time; half-way it sits between two
        const mid = chars.length >= 4 ? Math.floor((chars.length - 1) / 2) : -1;
        for (let i = 1; i < chars.length - 1; i++) {
          const c = chars[i];
          const before = chars[i - 1];
          if (!c || !before) continue;
          const leg = i % 2 ? p.legR : p.legL;
          const l = `step${i}`;
          tl.addLabel(l, "+=0.06")
            .to(w, { x: c.cx - W / 2, duration: 0.24, ease: "sine.inOut" }, l)
            .to(w, { y: Math.min(before.top, c.top) - 7 - H, duration: 0.12, ease: "sine.out" }, l)
            .to(w, { y: c.top - H, duration: 0.12, ease: "sine.in" }, `${l}+=0.12`)
            .to(leg, { y: -5, rotation: 10, duration: 0.12, yoyo: true, repeat: 1 }, l)
            .to(p.look, { rotation: 6, duration: 0.2 }, l);
          press(c, 4.5, `${l}+=0.24`);
          const next = chars[i + 1];
          if (i === mid && next) {
            // it settles into the gap; the two letters make room and close again
            const gap = (c.right + next.left) / 2;
            const seat = Math.max(c.top, next.top) + fs * 0.16;
            const g = `sit${i}`;
            tl.addLabel(g, "+=0.1")
              .to(c.el, { x: -fs * 0.07, rotation: -3, duration: 0.2 }, g)
              .to(next.el, { x: fs * 0.07, rotation: 3, duration: 0.2 }, g)
              .to(w, { x: gap - W / 2, y: seat - H, duration: 0.22, ease: "sine.inOut" }, g)
              .to(p.look, { rotation: 0, duration: 0.2 }, g)
              .to(p.frame, { scaleY: 0.93, duration: 0.2 }, g)
              .to(p.eyes, { scaleY: 0.1, duration: 0.07, yoyo: true, repeat: 1 }, `${g}+=0.45`)
              .add(tailFlick(p), `${g}+=0.6`)
              .to(p.frame, { scaleY: 1, duration: 0.15 }, `${g}+=1.15`)
              .to(w, { x: c.cx - W / 2, y: c.top - H, duration: 0.18 }, `${g}+=1.15`)
              .to([c.el, next.el], { x: 0, rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" }, `${g}+=1.2`);
          }
        }

        // 3 · the last letter: a nudge with the head (it rocks), then a swat (it falls)
        const stand = chars[chars.length - 2] ?? first;
        const drop = fs * 0.5;
        gsap.set(last.el, { transformOrigin: "100% 100%" });
        tl.addLabel("nudge", "+=0.25")
          .to(p.frame, { rotation: 12, x: 3, duration: 0.18, ease: "power2.in" }, "nudge")
          .to(last.el, { rotation: 11, duration: 0.16, ease: "power2.out" }, "nudge+=0.1")
          .to(p.frame, { rotation: 0, x: 0, duration: 0.22 }, "nudge+=0.26")
          .to(last.el, { rotation: 0, duration: 1, ease: "elastic.out(1, 0.28)" }, "nudge+=0.26")
          .addLabel("swat", "+=0.1")
          .add(pawSwipe(p, 1), "swat")
          .to(last.el, { rotation: 97, x: fs * 0.1, duration: 0.34, ease: "power2.in" }, "swat+=0.12")
          .to(last.el, { y: drop, duration: 0.3, ease: "power2.in" }, "swat+=0.2")
          .to(last.el, { rotation: 90, duration: 0.5, ease: "elastic.out(1, 0.4)" }, "swat+=0.5")
          // it watches what it did
          .to(p.look, { rotation: 11, duration: 0.2 }, "swat+=0.5")
          .to(p.gaze, { x: 2.5, y: 2.5, duration: 0.2 }, "swat+=0.5")
          .to(p.ears, { y: -3, duration: 0.15 }, "swat+=0.5")
          .to({}, { duration: 0.75 });
        // 4 · down beside the fallen letter, two more swats, then home while the letter goes back
        const beside = { x: last.left - W * s * 0.1, y: baseline + drop };
        leap(tl, { x: stand.cx, y: stand.top }, beside, { lift: 26, d: 0.36 });
        tl.to(p.ears, { y: 0, duration: 0.15 }, "<");
        for (let k = 0; k < 2; k++) {
          tl.add(pawSwipe(p, 1), "+=0.12").to(last.el, { rotation: 76, duration: 0.13, ease: "power2.out", yoyo: true, repeat: 1 }, "<+=0.13");
        }
        tl.to(p.look, { rotation: 0, duration: 0.2 }, "+=0.2").to(p.gaze, { x: 0, y: 0, duration: 0.2 }, "<").addLabel("home", "+=0.15");
        tl.to(last.el, { rotation: 0, x: 0, y: 0, duration: 0.9, ease: "power2.inOut" }, "home");
        leapHome(tl, beside);

        return {
          cancel: () => {
            tl.kill();
            cleanup();
            backInDock();
          },
        };
      },
    };

    /** 17 · It runs after the pointer along the bottom of the window. */
    const chase: Behaviour<Mood> = {
      id: "chase",
      priority: 1,
      weight: 2,
      cooldown: 70_000,
      when: (m) => fine && !m.away && m.calm > 1500 && m.moved < 1200 && !!m.pointer && m.pointer.y > window.innerHeight * 0.3,
      run: (done) => {
        const vw = window.innerWidth;
        const floor = window.innerHeight - 3;
        const s = 1.15;
        const start = leaveDock();
        let x = clamp(40, vw - 40, start.x - 50);
        let raf = 0;
        let alive = true;
        let last = now();
        let busy = 0; // until when a hop / catch is playing
        const began = now();
        const intro = gsap.timeline();
        let outro: gsap.core.Timeline | null = null;
        leap(intro, start, { x, y: floor }, { scale: s, d: 0.42, lift: 46 });
        const lose = () => {
          // interest gone: it sits, watches a moment, and goes home
          if (!alive) return;
          alive = false;
          cancelAnimationFrame(raf);
          gsap.set([p.legL, p.legR], { y: 0, rotation: 0 });
          outro = gsap.timeline({ onComplete: done });
          outro.to(p.frame, { rotation: 0, scaleY: 0.95, duration: 0.2 }).to(p.look, { rotation: 0, duration: 0.3 }, "<").to({}, { duration: 1.1 }).to(p.frame, { scaleY: 1, duration: 0.15 });
          leapHome(outro, { x, y: floor });
        };
        const loop = () => {
          if (!alive) return;
          raf = requestAnimationFrame(loop);
          const t = now();
          const dt = Math.min(48, t - last) / 1000;
          last = t;
          if (t < busy) return;
          const px = pointer?.x ?? x;
          const py = pointer?.y ?? 0;
          const dx = px - x;
          const moving = Math.abs(dx) > 34;
          if (moving) x = clamp(34, vw - 34, x + Math.sign(dx) * Math.min(Math.abs(dx) - 30, 480 * dt));
          gsap.set(w, { x: x - W / 2, y: floor - H });
          gsap.set(p.look, { rotation: clamp(-10, 10, dx / 10) });
          gsap.set(p.gaze, { x: clamp(-3, 3, dx / 40), y: clamp(-2.5, 1, (py - floor + 60) / 60) });
          const step = Math.floor(t / 85) % 2;
          gsap.set(p.frame, { rotation: moving ? Math.sign(dx) * 6 : 0, scaleY: moving ? 0.94 : 1 });
          gsap.set(p.legL, { y: moving && step ? -6 : 0, rotation: moving ? (step ? 16 : -10) * Math.sign(dx) : 0 });
          gsap.set(p.legR, { y: moving && !step ? -6 : 0, rotation: moving ? (step ? -10 : 16) * Math.sign(dx) : 0 });
          gsap.set(p.tail, { rotation: moving ? -Math.sign(dx) * 24 : 0 });
          const reach = floor - py;
          if (!moving && reach < 200 && reach > 0) {
            const side = dx >= 0 ? 1 : -1;
            if (reach < 80 && Math.random() < 0.45) {
              // caught: a paw on the pointer, held for a moment. The stage goes over
              // the cursor layer; it still takes no pointer events.
              busy = t + 1100;
              st.style.zIndex = "95";
              gsap
                .timeline({ onComplete: () => (st.style.zIndex = "") })
                .to(w, { x: px - side * 14 * s - W / 2, y: Math.min(floor, py + H * s * 0.5) - H, duration: 0.12, ease: "power2.out" })
                .to(side > 0 ? p.legR : p.legL, { y: -15, rotation: -side * 100, duration: 0.1 }, "<")
                .to(p.ears, { y: -3, duration: 0.1 }, "<")
                .add(tailFlick(p), "+=0.15")
                .to(side > 0 ? p.legR : p.legL, { y: 0, rotation: 0, duration: 0.2 }, "+=0.35")
                .to(p.ears, { y: 0, duration: 0.2 }, "<")
                .to(w, { y: floor - H, duration: 0.15 }, "<");
            } else {
              // a small jump and a swat that misses
              busy = t + 620;
              gsap.timeline().to(w, { y: floor - H - clamp(10, 48, reach - 50), duration: 0.16, ease: "power2.out", yoyo: true, repeat: 1 }).add(pawSwipe(p, side), 0.04);
            }
          }
          if (t - began > 5400 || t - lastMove > 1700) lose();
        };
        intro.add(() => {
          last = now();
          loop();
        });
        return {
          keepOnScroll: false,
          cancel: () => {
            alive = false;
            cancelAnimationFrame(raf);
            intro.kill();
            outro?.kill();
            backInDock();
          },
        };
      },
    };

    /** 19 · Pictures it can walk into and out of. */
    const portals = (min: number) =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-cat-portal]")).filter((f) => {
        const r = f.getBoundingClientRect();
        const seen = Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 76));
        return r.height > 120 && seen / r.height >= min && r.width > 160;
      });
    const portalSpec = (f: HTMLElement) => {
      const r = f.getBoundingClientRect();
      const floor = r.top + r.height * (Number(f.dataset.catFloor) || 0.9);
      const cover = f.dataset.catCover?.split(",").map(Number) as [number, number, number] | undefined;
      // the side with room to stand outside the frame
      const dir = r.left >= window.innerWidth - r.right ? 1 : -1; // 1 = it walks in from the left
      const s = clamp(0.75, 1.5, (r.height * 0.17) / H);
      const out = { x: dir > 0 ? r.left - W * s * 0.75 : r.right + W * s * 0.75, y: floor };
      return { r, floor, cover, dir, s, out };
    };
    const portalIn: Behaviour<Mood> = {
      id: "portalIn",
      priority: 1,
      weight: 2,
      cooldown: 150_000,
      when: (m) => m.calm > 3000 && m.idle < DROWSY_MS && !m.away && portals(0.8).length > 0,
      run: (done) => {
        const f = pick(portals(0.8));
        const { r, floor, cover, dir, s, out } = portalSpec(f);
        const start = leaveDock();
        const tl = gsap.timeline({
          onComplete: () => {
            // it is in the pictures now: the actor is gone, its place stays empty
            hideActor();
            away = { since: now(), from: f };
            done();
          },
        });
        const deep = s * 0.86; // a little smaller once it is "in" the picture
        const seat = r.left + r.width * (dir > 0 ? rand(0.16, 0.26) : rand(0.74, 0.84));
        const far = dir > 0 ? r.right + W * deep : r.left - W * deep;
        leap(tl, start, out, { scale: s, d: 0.62, lift: 90 });
        tl.to(p.look, { rotation: dir * 10, duration: 0.2 }, "+=0.1") // it studies the picture
          .to(p.gaze, { x: dir * 2.5, y: -1.5, duration: 0.2 }, "<")
          .to(p.ears, { y: -3, duration: 0.12, yoyo: true, repeat: 1 }, "+=0.35")
          .to({}, { duration: 0.5 })
          .to(p.gaze, { x: 0, y: 0, duration: 0.2 })
          // in through the edge: outside the frame it passes behind the picture…
          .add(() => (st.style.clipPath = outside(r)))
          .add(walk(p, w, () => (dir > 0 ? r.left + W * s * 0.7 : r.right - W * s * 0.7) - W / 2, { steps: 3, d: 0.8, dir }))
          // …and is seen again inside it
          .add(() => {
            st.style.clipPath = inside(r, cover);
            gsap.set(w, { x: (dir > 0 ? r.left - W * deep * 0.6 : r.right + W * deep * 0.6) - W / 2, y: floor - H, scale: deep });
          })
          .add(walk(p, w, () => seat - W / 2, { steps: 3, d: 0.9, dir }))
          .to(p.look, { rotation: 0, duration: 0.25 })
          .to(p.frame, { scaleY: 0.94, duration: 0.2 }, "<") // sits, looks out at the visitor
          .to(p.eyes, { scaleY: 0.1, duration: 0.07, yoyo: true, repeat: 1 }, "+=0.5")
          .add(tailFlick(p), "+=0.3")
          .to(p.frame, { scaleY: 1, duration: 0.15 }, "+=0.5")
          // on through the picture (behind whatever is in it) and out of sight
          .add(walk(p, w, () => far - W / 2, { steps: 5, d: 1.5, dir }));
        return {
          cancel: () => {
            tl.kill();
            backInDock();
          },
        };
      },
    };
    const portalOut: Behaviour<Mood> = {
      id: "portalOut",
      priority: 5,
      weight: 1,
      cooldown: 0,
      when: (m) => m.away && m.awayFor > 2500 && m.calm > 1200 && portals(0.7).length > 0,
      run: (done) => {
        const options = portals(0.7);
        const f = options.find((o) => o !== away?.from) ?? options[0];
        if (!f) {
          backInDock();
          done();
          return { cancel: () => {} };
        }
        const { r, floor, cover, dir, s, out } = portalSpec(f);
        const deep = s * 0.86;
        rest();
        st.style.clipPath = inside(r, cover);
        // it comes from the far inner edge towards the side it can step out of
        put(dir > 0 ? r.right + W * deep * 0.6 : r.left - W * deep * 0.6, floor, deep);
        gsap.set(w, { autoAlpha: 1 });
        const tl = gsap.timeline({ onComplete: done });
        tl.add(walk(p, w, () => (dir > 0 ? r.left - W * deep * 0.6 : r.right + W * deep * 0.6) - W / 2, { steps: 6, d: 1.9, dir: -dir }))
          .add(() => {
            st.style.clipPath = outside(r);
            gsap.set(w, { x: (dir > 0 ? r.left + W * s * 0.7 : r.right - W * s * 0.7) - W / 2, scale: s });
          })
          .add(walk(p, w, () => out.x - W / 2, { steps: 3, d: 0.8, dir: -dir }))
          .add(() => (st.style.clipPath = ""))
          .to(p.look, { rotation: 0, duration: 0.2 })
          .add(stretch(p, 0.6), "+=0.1");
        leapHome(tl, out);
        return {
          cancel: () => {
            tl.kill();
            backInDock();
          },
        };
      },
    };
    /** No picture came by: it turns up in its place again, by its phone magic. */
    const portalHome: Behaviour<Mood> = {
      id: "portalHome",
      priority: 10,
      weight: 1,
      cooldown: 0,
      when: (m) => m.away && m.awayFor > 26_000 && portals(0.7).length === 0,
      run: (done) => {
        const r = (dockSvg() ?? inner).getBoundingClientRect();
        sparkle(r.left + r.width / 2, r.top + r.height / 2, { count: 9, spread: 46 });
        backInDock();
        done();
        return { cancel: () => {} };
      },
    };

    /** 21 · Small things it does on the spot. `progress(1)` on cancel leaves it at rest. */
    const onTheSpot = (id: string, weight: number, cooldown: number, clip: (d: CatParts) => gsap.core.Timeline, when: (m: Mood) => boolean = (m) => m.calm > 5000 && m.idle < DROWSY_MS): Behaviour<Mood> => ({
      id,
      priority: 1,
      weight,
      cooldown,
      when: (m) => !m.away && when(m),
      run: (done) => {
        const d = dockParts();
        if (!d) {
          done();
          return { cancel: () => {} };
        }
        const tl = clip(d).eventCallback("onComplete", done);
        return { keepOnScroll: true, cancel: () => tl.progress(1).kill() };
      },
    });
    const drowsy: Behaviour<Mood> = {
      ...onTheSpot("drowsy", 1, 0, (d) => yawn(d), (m) => m.idle >= DROWSY_MS && !yawned),
      priority: 10,
      run: (done) => {
        yawned = true;
        const d = dockParts();
        if (!d) {
          done();
          return { cancel: () => {} };
        }
        const tl = yawn(d).eventCallback("onComplete", done);
        // unlike the others it does not snap back: the heavy eyelids stay until it sleeps or stirs
        return { keepOnScroll: true, cancel: () => tl.kill() };
      },
    };

    const director = new Director<Mood>(
      [
        drowsy,
        portalHome,
        portalOut,
        peek,
        typeWalk,
        chase,
        portalIn,
        onTheSpot("stretch", 1.5, 70_000, (d) => stretch(d, 0.8)),
        onTheSpot("wash", 1, 90_000, (d) => pretend(d)),
        onTheSpot("tailChase", 1, 160_000, (d) => tailChase(d), (m) => m.calm > 6000 && m.idle < DROWSY_MS && !rail),
      ],
      () => {
        const t = now();
        return { calm: t - lastScroll, idle: t - lastInput, moved: t - lastMove, pointer, away: !!away, awayFor: away ? t - away.since : 0 };
      },
      { tick: 1500, chance: 0.4, gap: [12_000, 28_000], warmup: 7000, onChange: (id) => (busy.current = id !== null) },
    );

    // ── between scenes: it watches the pointer from its place, and swats when it can ──
    let watchFrame = 0;
    let stillTimer: number | undefined;
    let lastSwat = 0;
    const settleLook = () => {
      const d = dockParts();
      if (!d || director.active) return;
      gsap.to(d.look, { rotation: 0, duration: 0.4, overwrite: "auto" });
      gsap.to(d.gaze, { x: 0, y: 0, duration: 0.4, overwrite: "auto" });
      gsap.to(d.ears, { y: 0, duration: 0.3, overwrite: "auto" });
    };
    const lookAt = (x: number, y: number, mayHop: boolean) => {
      const d = dockParts();
      const svg = dockSvg();
      if (!d || !svg || director.active || away) return;
      const r = svg.getBoundingClientRect();
      const dx = x - (r.left + r.width / 2);
      const dy = y - (r.top + r.height * 0.35);
      const dist = Math.hypot(dx, dy);
      gsap.to(d.look, { rotation: clamp(-9, 9, dx / 45), svgOrigin: "50 62", duration: 0.3, overwrite: "auto" });
      gsap.to(d.gaze, { x: clamp(-3, 3, dx / 90), y: clamp(-2, 2, dy / 110), duration: 0.25, overwrite: "auto" });
      gsap.to(d.ears, { y: dist < 220 ? -3 : 0, duration: 0.2, overwrite: "auto" });
      const t = now();
      if (mayHop && dist < 100 && dist > 26 && t - lastSwat > 5000) {
        lastSwat = t;
        pawSwipe(d, dx >= 0 ? 1 : -1);
        gsap.to(d.frame, { y: -5, duration: 0.12, ease: "power2.out", yoyo: true, repeat: 1 });
      }
      window.clearTimeout(stillTimer);
      stillTimer = window.setTimeout(settleLook, 1600);
    };

    // ── inputs ─────────────────────────────────────────────────────────────
    const onScroll = () => {
      lastScroll = lastInput = now();
      yawned = false;
      const sc = director.activeScene;
      if (sc && !sc.keepOnScroll) director.interrupt();
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointer = { x: e.clientX, y: e.clientY };
      lastMove = lastInput = now();
      yawned = false;
      director.activeScene?.pointer?.(e.clientX, e.clientY);
      if (!watchFrame)
        watchFrame = requestAnimationFrame(() => {
          watchFrame = 0;
          if (pointer) lookAt(pointer.x, pointer.y, true);
        });
    };
    const onDown = (e: PointerEvent) => {
      lastInput = now();
      yawned = false;
      // touch stands in for the pointer: it looks at the tap, and swats at a close one
      if (e.pointerType === "touch" && !inner.contains(e.target as Node)) lookAt(e.clientX, e.clientY, true);
    };
    const onKey = () => {
      lastInput = now();
    };
    let lastW = window.innerWidth;
    const onResize = () => {
      director.interrupt();
      if (Math.abs(window.innerWidth - lastW) < 120) return;
      lastW = window.innerWidth;
      const d = dockParts();
      if (d && !away) startle(d);
    };
    const onPlay = (e: Event) => {
      director.play(String((e as CustomEvent).detail), true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    window.addEventListener("cat:play", onPlay);
    director.start();

    return () => {
      director.stop();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("cat:play", onPlay);
      cancelAnimationFrame(watchFrame);
      window.clearTimeout(stillTimer);
      // whatever was going on, the cat is in its place when the state changes
      backInDock(false);
      busy.current = false;
    };
  }, [state, rail, dockInner, busy]);

  return (
    <div ref={stage} aria-hidden="true" data-cat-stage className="pointer-events-none fixed inset-0 z-[66] overflow-hidden">
      <div ref={wrap} className="invisible absolute top-0 left-0 h-[60px] w-12 opacity-0 will-change-transform [filter:drop-shadow(0_0_0.7px_rgb(243_241_235/0.75))_drop-shadow(0_0_0.7px_rgb(243_241_235/0.55))]">
        <span data-cat-lean className="block h-full w-full">
          <CatFigure className="block h-full w-full overflow-visible" />
        </span>
      </div>
    </div>
  );
}
