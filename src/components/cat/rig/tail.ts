import { gsap } from "@/lib/gsap";
import { tailPath, type Chain } from "./geometry";

export type TailPose = readonly [number, number, number, number, number];

/**
 * The tail as a living chain: a base pose (five relative angles) plus a sway
 * wave that travels from root to tip with a lag, so the tip follows through
 * after the root. Everything is a tween on one plain object; `render` rewrites
 * the path only while one of those tweens runs (no loop of its own).
 */
export class Tail {
  readonly s = { phase: 0, amp: 0, lag: 0.7, b0: 0, b1: 0, b2: 0, b3: 0, b4: 0 };
  private swayTween: gsap.core.Tween | null = null;

  constructor(
    private readonly paths: SVGPathElement[],
    private readonly chain: Chain,
    pose: TailPose,
  ) {
    this.set(pose);
  }

  /** Wave weight per segment: the root barely moves, the tip carries the motion. */
  private static W = [0.35, 0.6, 0.85, 1, 1.15];

  render = () => {
    const { s } = this;
    const base = [s.b0, s.b1, s.b2, s.b3, s.b4];
    const angles = base.map((b, i) => b + s.amp * Tail.W[i]! * Math.sin(s.phase - i * s.lag));
    const d = tailPath(this.chain, angles);
    for (const p of this.paths) p.setAttribute("d", d);
  };

  set(pose: TailPose) {
    const [b0, b1, b2, b3, b4] = pose;
    Object.assign(this.s, { b0, b1, b2, b3, b4 });
    this.render();
  }

  /** Tween to a base pose (the sway keeps running on top). */
  pose(pose: TailPose, vars: gsap.TweenVars = {}) {
    const [b0, b1, b2, b3, b4] = pose;
    return gsap.to(this.s, { b0, b1, b2, b3, b4, duration: 0.5, ease: "sine.inOut", ...vars, onUpdate: this.render });
  }

  /** Start (or retune) the sway: `amp` degrees at the tip, one wave every `period` seconds. */
  sway(amp: number, period: number, lag = 0.7) {
    this.swayTween?.kill();
    gsap.to(this.s, { amp, lag, duration: 0.6, ease: "sine.inOut", onUpdate: this.render });
    this.swayTween = gsap.to(this.s, { phase: `+=${Math.PI * 2}`, duration: period, ease: "none", repeat: -1, onUpdate: this.render });
    return this.swayTween;
  }

  /** Let the wave die out, then stop its tween. */
  still(duration = 0.6) {
    return gsap.to(this.s, {
      amp: 0,
      duration,
      ease: "sine.out",
      onUpdate: this.render,
      onComplete: () => {
        this.swayTween?.kill();
        this.swayTween = null;
      },
    });
  }

  kill() {
    this.swayTween?.kill();
    gsap.killTweensOf(this.s);
  }
}
