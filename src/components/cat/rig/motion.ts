import { gsap } from "@/lib/gsap";
import { FRONT } from "./CatFront";
import { SIDE, jointOf, type LegKey } from "./CatSide";
import { Tail } from "./tail";

/**
 * Motion for the two rigs. Binding a rig (`frontRig` / `sideRig`) finds the parts
 * and sets every pivot once; the behaviours below are pure functions of a rig
 * that return GSAP tweens/timelines, so the caller (the director) owns and
 * kills them. Only transform properties and the tail path are animated.
 */

const q = <T extends Element = SVGGElement>(svg: Element, part: string) => {
  const el = svg.querySelector<T>(`[data-part="${part}"]`);
  if (!el) throw new Error(`cat rig: missing part "${part}"`);
  return el;
};

/* ------------------------------------------------------------------ front */

export interface FrontRig {
  svg: SVGSVGElement;
  root: SVGGElement;
  body: SVGGElement;
  head: SVGGElement;
  earL: SVGGElement;
  earR: SVGGElement;
  eyeL: SVGGElement;
  eyeR: SVGGElement;
  gazeL: SVGGElement;
  gazeR: SVGGElement;
  pupilL: SVGEllipseElement;
  pupilR: SVGEllipseElement;
  whiskers: SVGGElement;
  legL: SVGGElement;
  legR: SVGGElement;
  tail: Tail;
}

export function frontRig(svg: SVGSVGElement): FrontRig {
  const r: FrontRig = {
    svg,
    root: q(svg, "root"),
    body: q(svg, "body"),
    head: q(svg, "head"),
    earL: q(svg, "ear-l"),
    earR: q(svg, "ear-r"),
    eyeL: q(svg, "eye-l"),
    eyeR: q(svg, "eye-r"),
    gazeL: q(svg, "gaze-l"),
    gazeR: q(svg, "gaze-r"),
    pupilL: q<SVGEllipseElement>(svg, "pupil-l"),
    pupilR: q<SVGEllipseElement>(svg, "pupil-r"),
    whiskers: q(svg, "whiskers"),
    legL: q(svg, "leg-l"),
    legR: q(svg, "leg-r"),
    tail: new Tail([q<SVGPathElement>(svg, "tail")], FRONT.tail, FRONT.tailRest),
  };
  const p = FRONT.pivots;
  const pivots: [Element, string][] = [
    [r.root, p.root],
    [r.body, p.body],
    [r.head, p.head],
    [r.earL, p.earL],
    [r.earR, p.earR],
    [r.eyeL, p.eyeL],
    [r.eyeR, p.eyeR],
    [r.pupilL, p.pupilL],
    [r.pupilR, p.pupilR],
    [r.legL, p.legL],
    [r.legR, p.legR],
    [r.whiskers, p.head],
  ];
  for (const [el, o] of pivots) gsap.set(el, { svgOrigin: o });
  return r;
}

/** Breathing: the chest swells a little, the head floats with it. */
export function breathe(r: FrontRig, period = 3.4) {
  return gsap
    .timeline({ repeat: -1, yoyo: true, defaults: { duration: period / 2, ease: "sine.inOut" } })
    .to(r.body, { scaleY: 1.016, scaleX: 1.008 }, 0)
    .to(r.head, { y: -0.7 }, 0);
}

/** A blink: fast close, slower open (eyes squash on their own centres). */
export function blink(r: FrontRig, double = false) {
  const tl = gsap.timeline();
  const once = (at: number) =>
    tl.to([r.eyeL, r.eyeR], { scaleY: 0.08, duration: 0.07, ease: "power2.in" }, at).to([r.eyeL, r.eyeR], { scaleY: 1, duration: 0.13, ease: "power2.out" }, at + 0.09);
  once(0);
  if (double) once(0.26);
  return tl;
}

/** One ear flicks back and settles (follow-through on the tip). */
export function earTwitch(r: FrontRig, side: "l" | "r") {
  const ear = side === "l" ? r.earL : r.earR;
  const dir = side === "l" ? -1 : 1;
  return gsap
    .timeline()
    .to(ear, { rotation: dir * 16, scaleY: 0.92, duration: 0.07, ease: "power2.out" })
    .to(ear, { rotation: 0, scaleY: 1, duration: 0.5, ease: "elastic.out(1.1, 0.35)" });
}

/**
 * Where the cat looks. nx, ny in -1…1 (screen direction from the cat). The
 * pupils lead, the head follows later and less: eyes first, then the head.
 */
export function looker(r: FrontRig) {
  const px = [gsap.quickTo([r.gazeL, r.gazeR], "x", { duration: 0.18, ease: "power3.out" }), gsap.quickTo([r.gazeL, r.gazeR], "y", { duration: 0.18, ease: "power3.out" })];
  const hr = gsap.quickTo(r.head, "rotation", { duration: 0.7, ease: "power3.out" });
  const hx = gsap.quickTo(r.head, "x", { duration: 0.7, ease: "power3.out" });
  return (nx: number, ny: number) => {
    const cx = gsap.utils.clamp(-1, 1, nx);
    const cy = gsap.utils.clamp(-1, 1, ny);
    px[0]!(cx * 2.6);
    px[1]!(cy * 1.8);
    hr(cx * 7);
    hx(cx * 1.6);
  };
}

/**
 * Curious: a beat of stillness, then ears up and out, head tilts, eyes widen,
 * pupils open round (the sheet's "?" face), the tail tip lifts.
 */
export function curious(r: FrontRig) {
  return gsap
    .timeline()
    .to([r.earL, r.earR], { y: 1, duration: 0.1, ease: "power1.in" }, 0)
    .to(r.earL, { y: -2.4, rotation: -9, duration: 0.32, ease: "back.out(2.4)" }, 0.12)
    .to(r.earR, { y: -2.4, rotation: 9, duration: 0.32, ease: "back.out(2.4)" }, 0.15)
    .to(r.head, { rotation: 15, duration: 0.55, ease: "back.out(1.8)" }, 0.12)
    .to([r.eyeL, r.eyeR], { scale: 1.12, duration: 0.3, ease: "back.out(2)" }, 0.12)
    .to([r.pupilL, r.pupilR], { scaleX: 2.5, scaleY: 0.86, duration: 0.35, ease: "power2.out" }, 0.16)
    .to(r.whiskers, { scaleX: 1.06, y: -0.6, duration: 0.3 }, 0.14)
    .add(r.tail.pose([4, -4, -40, -70, -78], { duration: 0.6, ease: "back.out(1.6)" }), 0.1);
}

/** Back to the neutral face (no snapping: every part eases home). */
export function neutral(r: FrontRig, d = 0.45) {
  return gsap
    .timeline({ defaults: { duration: d, ease: "power2.inOut" } })
    .to([r.earL, r.earR], { y: 0, rotation: 0, scaleY: 1 }, 0)
    .to(r.head, { rotation: 0 }, 0)
    .to([r.eyeL, r.eyeR], { scale: 1 }, 0)
    .to([r.pupilL, r.pupilR], { scaleX: 1, scaleY: 1 }, 0)
    .to(r.whiskers, { scaleX: 1, y: 0 }, 0)
    .add(r.tail.pose(FRONT.tailRest, { duration: d + 0.2 }), 0);
}

/** Anticipation before turning or getting up: a small dip. */
export function dip(r: FrontRig, d = 0.14) {
  return gsap.timeline().to(r.root, { scaleY: 0.95, scaleX: 1.03, duration: d, ease: "power2.in" });
}

/* ------------------------------------------------------------------- side */

export interface SideRig {
  svg: SVGSVGElement;
  root: SVGGElement;
  torso: SVGGElement;
  head: SVGGElement;
  ear: SVGGElement;
  eye: SVGGElement;
  pupil: SVGEllipseElement;
  /** Segments of each leg, top to paw. */
  legs: Record<LegKey, SVGGElement[]>;
  tail: Tail;
}

const LEGS: LegKey[] = ["nf", "ff", "nh", "fh"];

export function sideRig(svg: SVGSVGElement): SideRig {
  const legs = Object.fromEntries(
    LEGS.map((k) => [k, SIDE.legs[k].joints.slice(0, -1).map((_, i) => q(svg, `${k}-${i}`))]),
  ) as Record<LegKey, SVGGElement[]>;
  const r: SideRig = {
    svg,
    root: q(svg, "root"),
    torso: q(svg, "torso"),
    head: q(svg, "head"),
    ear: q(svg, "ear"),
    eye: q(svg, "eye"),
    pupil: q<SVGEllipseElement>(svg, "pupil"),
    legs,
    tail: new Tail([q<SVGPathElement>(svg, "tail")], SIDE.tail, SIDE.tailLow),
  };
  gsap.set(r.root, { svgOrigin: "85 124" });
  gsap.set(r.torso, { svgOrigin: `${SIDE.hip[0]} ${SIDE.hip[1]}` });
  gsap.set(r.head, { svgOrigin: `${SIDE.neck[0]} ${SIDE.neck[1]}` });
  gsap.set(r.ear, { svgOrigin: "137 26" });
  gsap.set(r.eye, { svgOrigin: "143 38.5" });
  for (const k of LEGS) legs[k].forEach((seg, i) => gsap.set(seg, { svgOrigin: jointOf(k, i) }));
  return r;
}

/** Standing still: every joint home, tail low with a lazy sway. */
export function stand(r: SideRig, d = 0.4) {
  const segs = LEGS.flatMap((k) => r.legs[k]);
  return gsap
    .timeline({ defaults: { duration: d, ease: "power2.inOut" } })
    .to(segs, { rotation: 0 }, 0)
    .to([r.torso, r.head, r.root], { rotation: 0, y: 0, scaleX: 1, scaleY: 1 }, 0)
    .to(r.eye, { scaleY: 1 }, 0)
    .add(r.tail.pose(SIDE.tailLow, { duration: d + 0.3 }), 0);
}

const ease = (s: number) => 0.5 - 0.5 * Math.cos(Math.PI * s);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Joint angles of one leg at its local phase u ∈ [0,1): stance 0–0.6, swing 0.6–1. */
function legPose(kind: "front" | "hind", u: number, reach: number): number[] {
  const STANCE = 0.6;
  if (kind === "front") {
    const A = 15 * reach;
    if (u < STANCE) {
      const s = u / STANCE;
      return [lerp(-A, A, s), 6 * s];
    }
    const s = (u - STANCE) / (1 - STANCE);
    return [lerp(A, -A, ease(s)), lerp(6, 0, s) + 50 * Math.sin(Math.PI * s)];
  }
  const B = 13 * reach;
  if (u < STANCE) {
    const s = u / STANCE;
    // the hock opens as the leg pushes back
    return [lerp(-B, B, s), -8 * s, 6 * s];
  }
  const s = (u - STANCE) / (1 - STANCE);
  const lift = Math.sin(Math.PI * s);
  return [lerp(B, -B, ease(s)), lerp(-8, 0, s) + 22 * lift, lerp(6, 0, s) - 26 * lift];
}

/** Lateral-sequence walk, like a real cat: left hind, left fore, right hind, right fore. */
const PHASE: Record<LegKey, number> = { nh: 0, nf: 0.25, fh: 0.5, ff: 0.75 };

export interface Gait {
  /** 0 = standing, 1 = full walk; tween it to start/stop without a pop. */
  weight: number;
  /** Cycle position, 0…1. */
  t: number;
  /** Seconds per stride (both pairs of legs). */
  period: number;
  stop: () => void;
}

/**
 * The walk cycle. One clock drives every joint as a function of phase, scaled
 * by `weight`, so starting, stopping and turning blend from any instant.
 * Returns the gait handle; `stop()` blends out and kills the clock.
 */
export function walk(r: SideRig, { period = 1.05, reach = 1 } = {}): Gait {
  const setters = LEGS.map((k) => r.legs[k].map((seg) => gsap.quickSetter(seg, "rotation")));
  const setRootY = gsap.quickSetter(r.root, "y");
  const setTorso = gsap.quickSetter(r.torso, "rotation");
  const setHead = gsap.quickSetter(r.head, "rotation");
  const gait: Gait = { weight: 0, t: 0, period, stop: () => {} };

  const apply = () => {
    const w = gait.weight;
    LEGS.forEach((k, li) => {
      const u = (gait.t + PHASE[k]) % 1;
      const pose = legPose(k.endsWith("f") ? "front" : "hind", u, reach);
      setters[li]!.forEach((set, i) => set((pose[i] ?? 0) * w));
    });
    // Two bobs per stride (one per pair), a slight roll, the head counter-steadied.
    const bob = Math.cos(gait.t * Math.PI * 4);
    setRootY(-1.1 * (0.5 - 0.5 * bob) * w);
    setTorso(1.2 * Math.sin(gait.t * Math.PI * 2) * w);
    setHead(-1.6 * Math.sin(gait.t * Math.PI * 2) * w);
  };

  const clock = gsap.to(gait, { t: "+=1", duration: period, ease: "none", repeat: -1, onUpdate: apply, modifiers: { t: (v: number) => v % 1 } });
  gsap.to(gait, { weight: 1, duration: 0.35, ease: "power2.out", onUpdate: apply });
  r.tail.pose(SIDE.tailUp, { duration: 0.5 });
  r.tail.sway(9, period, 0.8);

  gait.stop = () => {
    gsap.killTweensOf(gait, "weight");
    gsap.to(gait, {
      weight: 0,
      duration: 0.32,
      ease: "power2.inOut",
      onUpdate: apply,
      onComplete: () => clock.kill(),
    });
  };
  return gait;
}

/**
 * Body speed for a gait, in viewBox units per second, so paws do not slide:
 * a front paw sweeps 2·L·sin(A) while planted (60% of the stride).
 */
export function walkSpeed(period: number, reach = 1) {
  const legLen = 52;
  const sweep = 2 * legLen * Math.sin((15 * reach * Math.PI) / 180);
  return sweep / (0.6 * period);
}

/**
 * The play-bow stretch (sheet: row 3). The torso pivots down on the hip, the
 * forelegs reach out flat, the rump stays high, the tail goes up; eyes half
 * close at the peak; then a shiver of release and back to standing.
 */
export function stretch(r: SideRig) {
  const [nf0, nf1] = r.legs.nf;
  const [ff0, ff1] = r.legs.ff;
  const hind = [r.legs.nh[0], r.legs.fh[0]];
  const tl = gsap.timeline();
  tl.to([nf0, ff0], { rotation: -14, duration: 0.18, ease: "power1.inOut" }, 0)
    .to(r.torso, { rotation: 30, duration: 0.7, ease: "power2.inOut" }, 0.12)
    .to([nf0, ff0], { rotation: -70, duration: 0.7, ease: "power2.inOut" }, 0.12)
    .to([nf1, ff1], { rotation: -35, duration: 0.7, ease: "power2.inOut" }, 0.12)
    .to(hind, { rotation: 5, duration: 0.7, ease: "power2.inOut" }, 0.12)
    .to(r.head, { rotation: -22, duration: 0.7, ease: "power2.inOut" }, 0.12)
    .add(r.tail.pose([-112, 20, 26, 34, 40], { duration: 0.8, ease: "power2.out" }), 0.2)
    .to(r.eye, { scaleY: 0.18, duration: 0.25, ease: "power2.in" }, 0.6)
    .to(r.ear, { rotation: -14, duration: 0.3 }, 0.6)
    // hold, a tiny tremble at full extension
    .to(r.torso, { rotation: 31.5, duration: 0.12, yoyo: true, repeat: 3, ease: "sine.inOut" }, 0.9)
    // release
    .to(r.eye, { scaleY: 1, duration: 0.2 }, 1.55)
    .to(r.ear, { rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" }, 1.55)
    .to(r.torso, { rotation: 0, duration: 0.6, ease: "power3.inOut" }, 1.5)
    .to([nf0, ff0], { rotation: 0, duration: 0.6, ease: "power3.inOut" }, 1.5)
    .to([nf1, ff1], { rotation: 0, duration: 0.5, ease: "power2.inOut" }, 1.6)
    .to(hind, { rotation: 0, duration: 0.5 }, 1.5)
    .to(r.head, { rotation: 0, duration: 0.6, ease: "back.out(1.4)" }, 1.55)
    .add(r.tail.pose(SIDE.tailLow, { duration: 0.8 }), 1.6);
  return tl;
}
