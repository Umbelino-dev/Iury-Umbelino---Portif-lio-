/**
 * The cat's behaviour controller (R13). The FSM in `states.ts` says where the cat
 * is (observer, jump, cling, sleep, waking, awaken); the director decides what an
 * awake, settled cat does with its time: peek from an edge, walk a title, chase
 * the pointer, slip into a picture, chase its tail.
 *
 * Rules it enforces:
 * - one behaviour at a time: nothing starts while a scene is running;
 * - conditions: a behaviour is eligible only while its `when()` holds;
 * - priority: among the eligible, the highest priority wins;
 * - probability: within that priority, the pick is weighted, and a tick only
 *   fires some of the time, so the cat is never on a schedule;
 * - cooldowns: one per behaviour, plus a quiet gap after every scene;
 * - safe interruption: `interrupt()` cancels the running scene, and a scene's
 *   `cancel` must put everything back at once.
 *
 * It runs on a jittered timer, never a frame loop, and only while started.
 */
export interface Scene {
  /** Stop now and restore everything the scene touched. */
  cancel: () => void;
  /** Optional: the scene wants pointer positions while it runs. */
  pointer?: (x: number, y: number) => void;
  /** Scenes that survive scrolling (edge peeks retreat by themselves). Default: scroll cancels. */
  keepOnScroll?: boolean;
}

export interface Behaviour<C> {
  id: string;
  /** Higher wins when several are eligible. */
  priority: number;
  /** Relative chance among eligible behaviours of the same priority. */
  weight: number;
  /** Milliseconds before this behaviour may run again. */
  cooldown: number;
  when: (c: C) => boolean;
  /** Start the scene; call `done` when it ends by itself. */
  run: (done: () => void, c: C) => Scene;
}

export interface DirectorOptions {
  /** Timer period (ms), jittered ±30%. */
  tick?: number;
  /** Chance that an eligible tick actually starts something. */
  chance?: number;
  /** Quiet time after a scene: [min, max] ms. */
  gap?: [number, number];
  /** Quiet time after `start()`. */
  warmup?: number;
  /** Told whenever a scene starts (its id) or ends (null). */
  onChange?: (active: string | null) => void;
}

export class Director<C> {
  private timer: number | undefined;
  private readyAt = new Map<string, number>();
  private quietUntil = 0;
  private scene: Scene | null = null;
  private current: string | null = null;
  private running = false;
  private opts: Required<DirectorOptions>;

  constructor(
    private behaviours: Behaviour<C>[],
    private conditions: () => C,
    opts: DirectorOptions = {},
  ) {
    this.opts = { tick: 1500, chance: 0.4, gap: [12000, 30000], warmup: 6000, onChange: () => {}, ...opts };
  }

  get active() {
    return this.current;
  }
  get activeScene() {
    return this.scene;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.quietUntil = Math.max(this.quietUntil, performance.now() + this.opts.warmup);
    this.arm();
  }

  /** Stop the timer and cancel whatever is running. */
  stop() {
    this.running = false;
    window.clearTimeout(this.timer);
    this.interrupt();
  }

  /** Cancel the running scene, if any. It goes on cooldown like any other. */
  interrupt() {
    const { scene, current } = this;
    if (!scene || !current) return;
    this.scene = null;
    this.current = null;
    scene.cancel();
    this.finish(current);
    this.opts.onChange(null);
  }

  /** Start a behaviour now, whatever the odds (it must still be allowed by `when`). */
  play(id: string, force = false) {
    const b = this.behaviours.find((x) => x.id === id);
    if (!b) return false;
    const c = this.conditions();
    if (!force && !b.when(c)) return false;
    this.interrupt();
    this.begin(b, c);
    return true;
  }

  private arm() {
    window.clearTimeout(this.timer);
    if (!this.running) return;
    this.timer = window.setTimeout(() => this.tick(), this.opts.tick * (0.7 + Math.random() * 0.6));
  }

  private tick() {
    this.arm();
    if (this.scene || document.visibilityState !== "visible") return;
    const now = performance.now();
    const c = this.conditions();
    const eligible = this.behaviours.filter((b) => now >= (this.readyAt.get(b.id) ?? 0) && b.when(c));
    if (!eligible.length) return;
    const top = Math.max(...eligible.map((b) => b.priority));
    // Urgent behaviours (priority ≥ 10) ignore the quiet gap and the dice.
    if (top < 10 && (now < this.quietUntil || Math.random() > this.opts.chance)) return;
    const pool = eligible.filter((b) => b.priority === top);
    let roll = Math.random() * pool.reduce((sum, b) => sum + b.weight, 0);
    const pick = pool.find((b) => (roll -= b.weight) <= 0) ?? pool[0];
    if (pick) this.begin(pick, c);
  }

  private begin(b: Behaviour<C>, c: C) {
    this.current = b.id;
    let ended = false;
    const done = () => {
      if (ended || this.current !== b.id) return;
      ended = true;
      this.scene = null;
      this.current = null;
      this.finish(b.id);
      this.opts.onChange(null);
    };
    this.opts.onChange(b.id);
    this.scene = b.run(done, c);
    // A scene that ended synchronously leaves nothing to cancel.
    if (ended) this.scene = null;
  }

  private finish(id: string) {
    const b = this.behaviours.find((x) => x.id === id);
    const now = performance.now();
    if (b) this.readyAt.set(id, now + b.cooldown);
    const [min, max] = this.opts.gap;
    this.quietUntil = now + min + Math.random() * (max - min);
  }
}
