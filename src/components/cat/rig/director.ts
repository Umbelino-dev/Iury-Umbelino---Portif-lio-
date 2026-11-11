import { gsap } from "@/lib/gsap";
import { SIDE } from "./CatSide";
import {
  blink,
  breathe,
  curious,
  dip,
  earTwitch,
  frontRig,
  looker,
  neutral,
  sideRig,
  stand,
  stretch,
  walk,
  walkSpeed,
  type FrontRig,
  type Gait,
  type SideRig,
} from "./motion";

/**
 * The character's behaviour state machine (phase 1). Poses are nodes, and the
 * director only ever moves along edges, so asking for "walk" while sitting
 * plays sit → stand → walk: the cat never teleports between drawings.
 *
 *   curious ── sit ── stand ── walk
 *                       │
 *                    (stretch: an action from stand, back to stand)
 *
 * Requests made mid-transition are not dropped: the newest target wins and the
 * walk toward it resumes when the current edge finishes.
 */
export type Pose = "sit" | "curious" | "stand" | "walk";
export type Action = "stretch" | "blink" | "ear";

const EDGES: Record<Pose, Pose[]> = {
  sit: ["curious", "stand"],
  curious: ["sit"],
  stand: ["sit", "walk"],
  walk: ["stand"],
};

function route(from: Pose, to: Pose): Pose[] {
  const prev = new Map<Pose, Pose | null>([[from, null]]);
  const queue: Pose[] = [from];
  while (queue.length) {
    const n = queue.shift()!;
    if (n === to) break;
    for (const m of EDGES[n]) {
      if (prev.has(m)) continue;
      prev.set(m, n);
      queue.push(m);
    }
  }
  const path: Pose[] = [];
  for (let n: Pose | null | undefined = to; n; n = prev.get(n)) path.unshift(n);
  return path;
}

export interface Stage {
  /** Moves along x (the cat's position on the floor, its centre). */
  actor: HTMLElement;
  /** Wrapper of the front svg / of the side svg (the side one flips to face left). */
  front: HTMLElement;
  side: HTMLElement;
  /** Horizontal limits for the walk, px, in the actor's x space. */
  bounds: () => { min: number; max: number };
}

const play = (tl: gsap.core.Animation, reduced: boolean) =>
  new Promise<void>((resolve) => {
    if (reduced) {
      tl.progress(1);
      resolve();
    } else tl.eventCallback("onComplete", () => resolve());
  });

export class CatDirector {
  pose: Pose = "sit";
  private target: Pose = "sit";
  private busy = false;
  private actions: Action[] = [];
  private F: FrontRig;
  private S: SideRig;
  private gait: Gait | null = null;
  private mover: gsap.core.Tween | null = null;
  private dir: 1 | -1 = 1;
  private life: gsap.core.Animation[] = [];
  private lifeTimer: gsap.core.Tween | null = null;
  readonly look: (nx: number, ny: number) => void;

  constructor(
    private stage: Stage,
    private opts: { reduced: boolean; onPose?: (p: Pose) => void },
  ) {
    const fsvg = stage.front.querySelector("svg");
    const ssvg = stage.side.querySelector("svg");
    if (!fsvg || !ssvg) throw new Error("cat director: missing rig svg");
    this.F = frontRig(fsvg);
    this.S = sideRig(ssvg);
    this.look = looker(this.F);
    gsap.set([stage.front, stage.side], { transformOrigin: "50% 100%" });
    gsap.set(stage.side, { autoAlpha: 0 });
    this.startLife();
  }

  /** Ask for a pose; the director walks the graph to it. */
  go(target: Pose) {
    this.target = target;
    void this.step();
  }

  /** One-shot actions queue behind the current edge. */
  act(a: Action) {
    this.actions.push(a);
    if (a === "stretch" && this.pose !== "stand") this.target = "stand";
    void this.step();
  }

  private async step(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    while (true) {
      if (this.pose === this.target) {
        const a = this.actions.shift();
        if (!a) break;
        await this.runAction(a);
        continue;
      }
      const next = route(this.pose, this.target)[1];
      if (!next) break;
      await this.edge(this.pose, next);
      this.pose = next;
      this.opts.onPose?.(next);
    }
    this.busy = false;
  }

  private async runAction(a: Action) {
    const { reduced } = this.opts;
    if (a === "stretch" && this.pose === "stand") await play(stretch(this.S), reduced);
    else if (a === "blink" && this.frontShown()) await play(blink(this.F), reduced);
    else if (a === "ear" && this.frontShown()) await play(earTwitch(this.F, Math.random() < 0.5 ? "l" : "r"), reduced);
  }

  private frontShown() {
    return this.pose === "sit" || this.pose === "curious";
  }

  private async edge(from: Pose, to: Pose) {
    const { reduced } = this.opts;
    const key = `${from}>${to}`;
    switch (key) {
      case "sit>curious":
        return play(curious(this.F), reduced);
      case "curious>sit":
        return play(neutral(this.F), reduced);
      case "sit>stand":
        this.stopLife();
        await play(dip(this.F), reduced);
        await this.swap("side");
        this.S.tail.sway(4, 3.2);
        return;
      case "stand>sit":
        await play(stand(this.S, 0.25), reduced);
        await this.swap("front");
        this.startLife();
        return;
      case "stand>walk":
        this.startWalk();
        return;
      case "walk>stand":
        this.stopWalk();
        // a turn may have been mid-way: the side view must be the one on
        gsap.killTweensOf([this.stage.front, this.stage.side]);
        gsap.set(this.stage.front, { autoAlpha: 0 });
        gsap.set(this.stage.side, { autoAlpha: 1, scaleX: this.dir, scaleY: 1 });
        await play(stand(this.S, 0.3), reduced);
        this.S.tail.sway(4, 3.2);
        return;
    }
  }

  /**
   * Change drawing (front ↔ side). The outgoing one squashes as it fades, the
   * incoming one stretches back from the same squash: at this speed the eye
   * reads a turn, not a cut.
   */
  private swap(to: "front" | "side") {
    const out = to === "side" ? this.stage.front : this.stage.side;
    const inn = to === "side" ? this.stage.side : this.stage.front;
    const sx = to === "side" ? this.dir : 1;
    if (this.opts.reduced) {
      gsap.set(out, { autoAlpha: 0 });
      gsap.set(inn, { autoAlpha: 1, scaleX: sx, scaleY: 1 });
      gsap.set(this.F.root, { scaleX: 1, scaleY: 1 });
      return Promise.resolve();
    }
    const tl = gsap
      .timeline()
      .to(out, { autoAlpha: 0, scaleY: 0.94, duration: 0.09, ease: "power1.in" }, 0)
      .fromTo(inn, { autoAlpha: 0, scaleX: sx * 0.86, scaleY: 0.94 }, { autoAlpha: 1, scaleX: sx, scaleY: 1, duration: 0.22, ease: "back.out(2)" }, 0.05)
      .set(out, { scaleY: 1 })
      .set(this.F.root, { scaleX: 1, scaleY: 1 });
    return play(tl, false);
  }

  /* walking ------------------------------------------------------------ */

  private pxPerUnit() {
    return this.stage.side.getBoundingClientRect().width / Number(SIDE.viewBox.split(" ")[2]);
  }

  private startWalk() {
    if (this.opts.reduced) return; // no travel without motion: the cat stands
    const period = 1.05;
    this.gait = walk(this.S, { period });
    this.travel(walkSpeed(period) * this.pxPerUnit());
  }

  /** Walk to the edge it faces; there, turn around (through the front view) and go on. */
  private travel(speed: number) {
    const { min, max } = this.stage.bounds();
    const x = Number(gsap.getProperty(this.stage.actor, "x"));
    const goal = this.dir === 1 ? max : min;
    const dist = Math.abs(goal - x);
    this.mover = gsap.to(this.stage.actor, {
      x: goal,
      duration: dist / speed,
      ease: "none",
      delay: 0.12, // the legs start before the body travels
      onComplete: () => void this.turnAround(speed),
    });
  }

  private async turnAround(speed: number) {
    if (this.pose !== "walk" || this.target !== "walk") return;
    this.gait?.stop();
    this.gait = null;
    await this.swap("front");
    this.dir = this.dir === 1 ? -1 : 1;
    await play(gsap.timeline().to({}, { duration: 0.18 }), false);
    await this.swap("side");
    if (this.pose !== "walk" || this.target !== "walk") return;
    this.gait = walk(this.S, { period: 1.05 });
    this.travel(speed);
  }

  private stopWalk() {
    this.mover?.kill();
    this.mover = null;
    this.gait?.stop();
    this.gait = null;
  }

  /* idle life ----------------------------------------------------------- */

  /**
   * While seated: breathing, a slow tail, and every few seconds one small thing
   * (a blink, sometimes double; an ear flick; a tail flick). Never two at once.
   */
  private startLife() {
    if (this.opts.reduced) return;
    this.stopLife();
    this.life = [breathe(this.F), this.F.tail.sway(5, 3.6, 0.9)];
    const next = () => {
      this.lifeTimer = gsap.delayedCall(gsap.utils.random(2.2, 5.5), () => {
        if (this.frontShown() && !this.busy) {
          const roll = Math.random();
          if (roll < 0.6) blink(this.F, roll < 0.15);
          else if (roll < 0.85) earTwitch(this.F, roll < 0.72 ? "l" : "r");
          else this.F.tail.pose([10, -10, -44, -74, -60], { duration: 0.25, ease: "power2.out", yoyo: true, repeat: 1 });
        }
        next();
      });
    };
    next();
  }

  private stopLife() {
    this.life.forEach((a) => a.kill());
    this.life = [];
    this.lifeTimer?.kill();
    this.lifeTimer = null;
    this.F.tail.still(0.3);
    gsap.to(this.F.body, { scaleY: 1, scaleX: 1, duration: 0.2 });
    gsap.to(this.F.head, { y: 0, duration: 0.2 });
  }

  destroy() {
    this.stopLife();
    this.stopWalk();
    this.F.tail.kill();
    this.S.tail.kill();
  }
}
