import { gsap } from "@/lib/gsap";

/**
 * The cat's motion vocabulary (Cat Journey R03): every move is a pure function
 * that returns a GSAP timeline for one drawing of the cat (CatFigure). No React
 * state; callers own the timelines (scrubbed in the hero by CatObserver, played
 * per state by CatAssistant) and kill them through their gsap.context.
 *
 * `body` here means the whole figure transform target (`frame`): the span or
 * svg the caller passes, transformed from its bottom centre. Part groups are
 * the `data-cat` hooks inside the SVG; svg pivots are listed in CatFigure.
 */
export interface CatParts {
  frame: Element; // whole-figure transform target (squash, stretch, lean)
  body: SVGGElement | null;
  head: SVGGElement | null;
  look: SVGGElement | null;
  gaze: SVGGElement | null;
  eyes: SVGGElement | null;
  ears: SVGGElement | null;
  tail: SVGGElement | null;
  paws: SVGGElement | null;
  legL: SVGRectElement | null;
  legR: SVGRectElement | null;
  eyeL: SVGGElement | null;
  eyeR: SVGGElement | null;
  yawn: SVGElement | null;
  hold: SVGGElement | null;
}

export function catParts(scope: Element, frame?: Element | null): CatParts | null {
  const q = <T extends Element>(name: string) => scope.querySelector<T>(`[data-cat="${name}"]`);
  const target = frame ?? scope.querySelector("svg");
  if (!target) return null;
  return {
    frame: target,
    body: q("body"),
    head: q("head"),
    look: q("look"),
    gaze: q("gaze"),
    eyes: q("eyes"),
    ears: q("ears"),
    tail: q("tail"),
    paws: q("paws"),
    legL: q("leg-l"),
    legR: q("leg-r"),
    eyeL: q("eye-l"),
    eyeR: q("eye-r"),
    yawn: q("yawn"),
    hold: q("hold"),
  };
}

/** Pivots, once per drawing (SVG user units; the frame pivots on its feet). */
export function prime(p: CatParts) {
  gsap.set(p.frame, { transformOrigin: "50% 100%" });
  const svg: [Element | null, string][] = [
    [p.body, "50 125"],
    [p.head, "50 62"],
    [p.look, "50 62"],
    [p.eyes, "50 40"],
    [p.tail, "80 118"],
    [p.legL, "33 100"],
    [p.legR, "67 100"],
    [p.eyeL, "35.5 40"],
    [p.eyeR, "64.5 40"],
    [p.yawn, "50 57.6"],
  ];
  for (const [el, origin] of svg) if (el) gsap.set(el, { svgOrigin: origin });
}

const legs = (p: CatParts) => [p.legL, p.legR].filter(Boolean) as Element[];

/** Play bow: long and low, front legs forward, tail up, then back to sitting. */
export function stretch(p: CatParts, d = 0.6) {
  const tl = gsap.timeline();
  tl.to(p.frame, { scaleX: 1.14, scaleY: 0.84, duration: d * 0.45, ease: "power2.out" }, 0)
    .to(legs(p), { y: 3, rotation: (i) => (i ? -14 : 14), duration: d * 0.45, ease: "power2.out" }, 0)
    .to(p.ears, { y: -3, duration: d * 0.3 }, 0)
    .to(p.tail, { rotation: -26, duration: d * 0.45 }, 0)
    .to(p.frame, { scaleX: 1, scaleY: 1, duration: d * 0.55, ease: "back.out(2)" }, d * 0.45)
    .to(legs(p), { y: 0, rotation: 0, duration: d * 0.4 }, d * 0.5)
    .to(p.ears, { y: 0, duration: d * 0.3 }, d * 0.5)
    .to(p.tail, { rotation: 0, duration: d * 0.5, ease: "elastic.out(1, 0.5)" }, d * 0.5);
  return tl;
}

/**
 * Walk: alternating front legs, a small bob, the tail lagging behind, the head
 * steady and turned the way it goes. `mover` is what travels (`dx` px).
 */
export function walk(p: CatParts, mover: Element, dx: () => number, { steps = 3, d = 1, dir = -1 } = {}) {
  const tl = gsap.timeline();
  const beat = d / (steps * 2);
  tl.to(mover, { x: dx, duration: d, ease: "none" }, 0)
    .to(p.look, { rotation: dir * 6, duration: beat * 2 }, 0)
    .to(p.tail, { rotation: -dir * 10, duration: d / 2, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0);
  for (let i = 0; i < steps * 2; i++) {
    const lift = i % 2 ? p.legR : p.legL;
    const t = i * beat;
    if (lift) tl.to(lift, { y: -5, rotation: dir * 10, duration: beat / 2, ease: "sine.out" }, t).to(lift, { y: 0, rotation: 0, duration: beat / 2, ease: "sine.in" }, t + beat / 2);
    tl.to(p.frame, { y: -1.5, duration: beat / 2, ease: "sine.out" }, t).to(p.frame, { y: 0, duration: beat / 2, ease: "sine.in" }, t + beat / 2);
  }
  return tl;
}

/** Run: leaning and compressed, a fast leg cycle, tail streaming back. */
export function run(p: CatParts, mover: Element, dx: () => number, { strides = 4, d = 0.6, dir = 1 } = {}) {
  const tl = gsap.timeline();
  const beat = d / (strides * 2);
  tl.to(p.frame, { rotation: dir * 7, scaleY: 0.92, scaleX: 1.05, duration: beat * 2, ease: "power2.out" }, 0)
    .to(mover, { x: dx, duration: d, ease: "power1.in" }, 0)
    .to(p.tail, { rotation: -dir * 32, duration: beat * 2 }, 0)
    .to(p.look, { rotation: dir * 8, duration: beat * 2 }, 0);
  for (let i = 0; i < strides * 2; i++) {
    const lift = i % 2 ? p.legR : p.legL;
    if (lift) tl.to(lift, { y: -7, rotation: dir * 18, duration: beat / 2, ease: "power1.out" }, i * beat).to(lift, { y: 0, rotation: 0, duration: beat / 2 }, i * beat + beat / 2);
  }
  return tl;
}

/** Anticipation before a leap: low, wide, ears back. */
export function crouch(p: CatParts, d = 0.15) {
  return gsap.timeline().to(p.frame, { rotation: 0, scaleY: 0.84, scaleX: 1.08, duration: d, ease: "power2.in" }, 0).to(p.ears, { y: 2, duration: d }, 0);
}

/** Airborne: stretched long, legs reaching, tail trailing. */
export function airborne(p: CatParts, d = 0.18) {
  return gsap
    .timeline()
    .to(p.frame, { scaleX: 0.9, scaleY: 1.14, rotation: 0, duration: d, ease: "power1.out" }, 0)
    .to(legs(p), { y: 4, rotation: (i) => (i ? 22 : -22), duration: d }, 0)
    .to(p.ears, { y: 0, duration: d }, 0)
    .to(p.tail, { rotation: -28, duration: d }, 0);
}

/** Falling: gravity takes over, a slight tilt, legs dangling. */
export function falling(p: CatParts, d = 0.2) {
  return gsap
    .timeline()
    .to(p.frame, { rotation: 6, scaleX: 0.96, scaleY: 1.06, duration: d, ease: "power1.in" }, 0)
    .to(legs(p), { y: 6, rotation: (i) => (i ? 8 : -8), duration: d }, 0)
    .to(p.tail, { rotation: 18, duration: d }, 0);
}

/** Grab the rail: paws up, a squash on contact, then a damped swing. */
export function grab(p: CatParts) {
  return gsap
    .timeline()
    .set(p.paws, { opacity: 1 })
    .to(p.frame, { scaleX: 1.08, scaleY: 0.9, rotation: -5, duration: 0.08, ease: "power1.out" }, 0)
    .to(legs(p), { y: 0, rotation: 0, duration: 0.2 }, 0)
    .to(p.frame, { scaleX: 1, scaleY: 1, duration: 0.22, ease: "power2.out" }, 0.08)
    .to(p.frame, { rotation: 0, duration: 0.9, ease: "elastic.out(1, 0.35)" }, 0.08)
    .to(p.tail, { rotation: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" }, 0.08);
}

/** Land on the floor (the dock): squash and settle. */
export function land(p: CatParts) {
  return gsap
    .timeline()
    .to(p.frame, { scaleX: 1.1, scaleY: 0.88, rotation: 0, duration: 0.07, ease: "power1.out" }, 0)
    .to(legs(p), { y: 0, rotation: 0, duration: 0.12 }, 0)
    .to(p.frame, { scaleX: 1, scaleY: 1, duration: 0.18, ease: "power2.out" }, 0.07)
    .to(p.tail, { rotation: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" }, 0.07);
}

/**
 * Settle into sleep: eyes first, then the body curls and the tail wraps.
 * Then slow breathing for `breaths` breaths (bounded: it stops on its own, and
 * GSAP's ticker does not run in a hidden tab).
 */
export function settle(p: CatParts, delay = 0, breaths = 11) {
  return gsap
    .timeline({ delay })
    .to(p.eyes, { scaleY: 0.1, duration: 0.2 }, 0)
    .to(p.paws, { opacity: 0, duration: 0.12 }, 0)
    .to(p.body, { scaleY: 0.82, duration: 0.52, ease: "power2.in" }, 0.2)
    .to(p.head, { y: 6, rotation: -4, duration: 0.52 }, 0.2)
    .to(legs(p), { y: 2, rotation: 0, duration: 0.4 }, 0.2)
    .to(p.tail, { rotation: 26, duration: 0.6, ease: "power2.out" }, 0.3)
    .to(p.frame, { scaleY: 1.03, duration: 1.4, ease: "sine.inOut", yoyo: true, repeat: breaths * 2 - 1 }, 0.9);
}

/** Wake: an ear twitch, eyes open, the body rises, a stretch. */
export function wake(p: CatParts) {
  return gsap
    .timeline()
    .to(p.frame, { scaleY: 1, duration: 0.1 }, 0)
    .to(p.ears, { y: -4, duration: 0.1, yoyo: true, repeat: 1 }, 0)
    .to(p.eyes, { scaleY: 1, duration: 0.12 }, 0.08)
    .to(p.body, { scaleY: 1, duration: 0.24, ease: "power2.out" }, 0.12)
    .to(p.head, { y: 0, rotation: 0, duration: 0.24 }, 0.12)
    .to(p.tail, { rotation: 0, duration: 0.3 }, 0.12)
    .add(stretch(p, 0.5), 0.3);
}

/** Greeting: ears up, one paw raised in a small wave, eyes toward the page. */
export function greet(p: CatParts) {
  return gsap
    .timeline()
    .to(p.ears, { y: -4, duration: 0.14 }, 0)
    .to(p.gaze, { x: -2.5, y: -1, duration: 0.2 }, 0)
    .to(p.legR, { y: -14, rotation: -150, duration: 0.24, ease: "back.out(1.6)" }, 0.05)
    .to(p.legR, { rotation: -125, duration: 0.14, yoyo: true, repeat: 3, ease: "sine.inOut" }, 0.3)
    .to(p.legR, { y: 0, rotation: 0, duration: 0.24, ease: "power2.inOut" }, 0.9)
    .to(p.ears, { y: 0, duration: 0.2 }, 0.9)
    .to(p.gaze, { x: 0, y: 0, duration: 0.3 }, 1);
}

/** A tail flick, for idle moments (paired with blinks). */
export function tailFlick(p: CatParts) {
  return gsap.timeline().to(p.tail, { rotation: -14, duration: 0.18, ease: "power1.out" }).to(p.tail, { rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
}

/**
 * Lost its grip on the rail (a scroll too fast to hold on to): paws off, legs
 * dangling, ears back, eyes wide, the tail thrown the other way. `dir` is the
 * way the page pulls it (1 = down, -1 = up). `grab` catches the rail again.
 */
export function letGo(p: CatParts, dir: number, d = 0.12) {
  return gsap
    .timeline()
    .set(p.paws, { opacity: 0 }, 0)
    .to(p.frame, { rotation: dir * 9, scaleX: 0.94, scaleY: 1.1, duration: d, ease: "power1.out", overwrite: "auto" }, 0)
    .to(legs(p), { y: 6, rotation: (i) => (i ? 12 : -12), duration: d, overwrite: "auto" }, 0)
    .to(p.ears, { y: 2, duration: d, overwrite: "auto" }, 0)
    .to(p.eyes, { scale: 1.2, duration: d, overwrite: "auto" }, 0)
    .to(p.tail, { rotation: -dir * 30, duration: d, overwrite: "auto" }, 0);
}

/**
 * Braced against a fast scroll (the dock, where there is nothing to fall from):
 * low and wide, ears back, tail streaming with the page, then it straightens up.
 */
export function brace(p: CatParts, dir: number) {
  return gsap
    .timeline()
    .to(p.frame, { scaleX: 1.08, scaleY: 0.88, duration: 0.1, ease: "power2.out", overwrite: "auto" }, 0)
    .to(p.ears, { y: 2.5, duration: 0.1, overwrite: "auto" }, 0)
    .to(p.eyes, { scale: 1.18, duration: 0.1, overwrite: "auto" }, 0)
    .to(p.tail, { rotation: -dir * 26, duration: 0.12, overwrite: "auto" }, 0)
    .to(p.frame, { scaleX: 1, scaleY: 1, duration: 0.5, ease: "elastic.out(1, 0.45)" }, 0.28)
    .to(p.ears, { y: 0, duration: 0.2 }, 0.28)
    .to(p.eyes, { scale: 1, duration: 0.2 }, 0.28)
    .to(p.tail, { rotation: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" }, 0.28);
}

/**
 * Climbing the rail hand over hand: the two paws and the legs alternate.
 * `step` is how many grips it has taken so far; call it as the cat moves.
 */
export function climbStep(p: CatParts, step: number) {
  const paws = p.paws ? Array.from(p.paws.children) : [];
  const odd = step % 2 === 1;
  gsap.to(paws, { y: (i) => (i === (odd ? 0 : 1) ? -3 : 0), duration: 0.09, overwrite: "auto" });
  gsap.to(legs(p), { rotation: (i) => (i === (odd ? 0 : 1) ? 9 : -9), duration: 0.09, overwrite: "auto" });
}

/** Back to a still grip after climbing. */
export function climbRest(p: CatParts) {
  const paws = p.paws ? Array.from(p.paws.children) : [];
  gsap.to(paws, { y: 0, duration: 0.16, overwrite: "auto" });
  gsap.to(legs(p), { rotation: 0, duration: 0.2, overwrite: "auto" });
}

/** A yawn: the head tips back, the eyes squeeze shut, the mouth opens wide, then it settles. */
export function yawn(p: CatParts, d = 1.1) {
  return gsap
    .timeline()
    .to(p.head, { rotation: -7, y: -1, duration: d * 0.25, ease: "sine.out" }, 0)
    .to(p.eyes, { scaleY: 0.12, duration: d * 0.2 }, 0.05)
    .to(p.ears, { y: 2, duration: d * 0.25 }, 0)
    .fromTo(p.yawn, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1.25, duration: d * 0.3, ease: "sine.out" }, d * 0.1)
    .to(p.yawn, { scale: 0.3, opacity: 0, duration: d * 0.25, ease: "sine.in" }, d * 0.62)
    .to(p.head, { rotation: 0, y: 0, duration: d * 0.3 }, d * 0.66)
    .to(p.ears, { y: 0, duration: d * 0.2 }, d * 0.66)
    .to(p.eyes, { scaleY: 0.62, duration: d * 0.2 }, d * 0.75); // heavy-lidded afterwards
}

/** Looking for a comfortable spot: a glance each way and a small shuffle on the spot. */
export function nest(p: CatParts, d = 0.9) {
  return gsap
    .timeline()
    .to(p.look, { rotation: -9, duration: d * 0.22 }, 0)
    .to(p.look, { rotation: 8, duration: d * 0.26 }, d * 0.28)
    .to(p.look, { rotation: 0, duration: d * 0.2 }, d * 0.6)
    .to(p.frame, { x: -2, rotation: -3, duration: d * 0.2, ease: "sine.inOut" }, d * 0.1)
    .to(p.frame, { x: 2, rotation: 3, duration: d * 0.3, ease: "sine.inOut" }, d * 0.35)
    .to(p.frame, { x: 0, rotation: 0, duration: d * 0.25, ease: "sine.inOut" }, d * 0.7)
    .to(p.tail, { rotation: 14, duration: d * 0.4, yoyo: true, repeat: 1 }, d * 0.1);
}

/** Asleep, something stirs: one ear, or the tip of the tail. */
export function twitch(p: CatParts, ear = true) {
  return ear
    ? gsap.timeline().to(p.ears, { y: -2.5, duration: 0.09, yoyo: true, repeat: 3 })
    : gsap.timeline().to(p.tail, { rotation: "+=9", duration: 0.16, yoyo: true, repeat: 1, ease: "sine.inOut" });
}

/**
 * Waking, slowly (never an instant switch): an ear moves, one eye opens and
 * looks, then the other, the head comes up, the body rises, a stretch. From a
 * deep sleep it yawns first.
 */
export function wakeSlow(p: CatParts, deep = false) {
  const tl = gsap.timeline();
  tl.to(p.frame, { scaleY: 1, duration: 0.2 }, 0)
    .to(p.ears, { y: -3, duration: 0.1, yoyo: true, repeat: deep ? 5 : 3 }, 0)
    // one eye: the left stays shut while the pair opens
    .set(p.eyeL, { scaleY: 0.1 }, 0.42)
    .to(p.eyes, { scaleY: 1, duration: 0.18 }, 0.42)
    .to(p.gaze, { x: 2, duration: 0.2 }, 0.62)
    .to(p.gaze, { x: -2, duration: 0.24 }, 0.92)
    .to(p.eyeL, { scaleY: 1, duration: 0.16 }, 1.2)
    .to(p.gaze, { x: 0, duration: 0.2 }, 1.3)
    .to(p.head, { y: 0, rotation: 0, duration: 0.36, ease: "power2.out" }, 1.3)
    .to(p.body, { scaleY: 1, duration: 0.34, ease: "power2.out" }, 1.45)
    .to(p.tail, { rotation: 0, duration: 0.4 }, 1.45);
  if (deep) tl.add(yawn(p, 1), 1.8).to(p.eyes, { scaleY: 1, duration: 0.15 }, 2.8);
  tl.add(stretch(p, 0.6), deep ? 2.85 : 1.8);
  return tl;
}

/** A swipe of one front paw, up and across (`side`: 1 = its right paw, -1 = left). */
export function pawSwipe(p: CatParts, side = 1) {
  const leg = side > 0 ? p.legR : p.legL;
  return gsap
    .timeline()
    .to(leg, { y: -15, rotation: -side * 128, duration: 0.14, ease: "power2.out" }, 0)
    .to(p.frame, { rotation: side * 5, duration: 0.14 }, 0)
    .to(leg, { rotation: -side * 92, duration: 0.09, ease: "power1.in" }, 0.14)
    .to(leg, { y: 0, rotation: 0, duration: 0.22, ease: "power2.inOut" }, 0.26)
    .to(p.frame, { rotation: 0, duration: 0.22 }, 0.26);
}

/** Startled: a jump on the spot, eyes wide, ears flat, tail up. */
export function startle(p: CatParts) {
  return gsap
    .timeline()
    .to(p.frame, { y: -9, scaleX: 0.92, scaleY: 1.12, duration: 0.09, ease: "power2.out" }, 0)
    .to(p.eyes, { scale: 1.3, duration: 0.08 }, 0)
    .to(p.ears, { y: 3, duration: 0.08 }, 0)
    .to(p.tail, { rotation: -34, duration: 0.1 }, 0)
    .to(p.frame, { y: 0, scaleX: 1.06, scaleY: 0.92, duration: 0.12, ease: "power2.in" }, 0.12)
    .to(p.frame, { scaleX: 1, scaleY: 1, duration: 0.3, ease: "elastic.out(1, 0.5)" }, 0.24)
    .to(p.eyes, { scale: 1, duration: 0.4 }, 0.5)
    .to(p.ears, { y: 0, duration: 0.3 }, 0.5)
    .to(p.tail, { rotation: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" }, 0.4);
}

/** Round and round after its own tail, then a dizzy shake of the head. */
export function tailChase(p: CatParts) {
  return gsap
    .timeline()
    .to(p.look, { rotation: 12, duration: 0.2 }, 0)
    .to(p.gaze, { x: 3, y: 2, duration: 0.2 }, 0)
    .to(p.tail, { rotation: -18, duration: 0.12, yoyo: true, repeat: 3 }, 0.1)
    .to(p.frame, { rotation: 720, scaleX: 0.9, scaleY: 0.9, duration: 1.1, ease: "power1.inOut" }, 0.5)
    .set(p.frame, { rotation: 0 }, 1.6)
    .to(p.frame, { scaleX: 1, scaleY: 1, duration: 0.2 }, 1.6)
    .to(p.look, { rotation: -7, duration: 0.09, yoyo: true, repeat: 5, ease: "sine.inOut" }, 1.65)
    .to(p.look, { rotation: 0, duration: 0.2 }, 2.25)
    .to(p.gaze, { x: 0, y: 0, duration: 0.3 }, 2.25);
}

/** Nothing happened: a glance each way, then it licks a paw as if that was the plan. */
export function pretend(p: CatParts) {
  return gsap
    .timeline()
    .to(p.look, { rotation: -10, duration: 0.16 }, 0)
    .to(p.look, { rotation: 10, duration: 0.2 }, 0.3)
    .to(p.look, { rotation: 0, duration: 0.16 }, 0.62)
    .to(p.legL, { y: -17, rotation: 138, duration: 0.2, ease: "power2.out" }, 0.8)
    .to(p.head, { y: 3, rotation: 6, duration: 0.2 }, 0.8)
    .to(p.eyes, { scaleY: 0.5, duration: 0.15 }, 0.85)
    .to(p.head, { y: 1, duration: 0.14, yoyo: true, repeat: 3, ease: "sine.inOut" }, 1.0)
    .to(p.legL, { y: 0, rotation: 0, duration: 0.22 }, 1.6)
    .to(p.head, { y: 0, rotation: 0, duration: 0.22 }, 1.6)
    .to(p.eyes, { scaleY: 1, duration: 0.15 }, 1.6);
}
