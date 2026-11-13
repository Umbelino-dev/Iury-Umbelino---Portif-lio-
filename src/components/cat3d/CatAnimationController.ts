import * as THREE from "three";

/**
 * Plays the model's own animation clips (authored on the Blender rig, exported in
 * the GLB) with THREE.AnimationMixer, cross-fading between them. One clip is
 * current at a time; a one-shot clip holds its last frame and reports `finished`.
 */
export class CatAnimationController {
  readonly mixer: THREE.AnimationMixer;
  private actions = new Map<string, THREE.AnimationAction>();
  current: string | null = null;
  /** The current one-shot clip has played through. */
  finished = false;

  constructor(root: THREE.Object3D, clips: THREE.AnimationClip[]) {
    this.mixer = new THREE.AnimationMixer(root);
    for (const clip of clips) this.actions.set(clip.name, this.mixer.clipAction(clip));
    this.mixer.addEventListener("finished", (e) => {
      if (this.current && e.action === this.actions.get(this.current)) this.finished = true;
    });
  }

  has(name: string) {
    return this.actions.has(name);
  }

  play(name: string, { fade = 0.28, once = false, speed = 1 }: { fade?: number; once?: boolean; speed?: number } = {}) {
    const next = this.actions.get(name);
    if (!next) return;
    if (name === this.current) {
      next.timeScale = speed;
      return;
    }
    const prev = this.current ? this.actions.get(this.current) : undefined;
    next.reset();
    next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = once;
    next.timeScale = speed;
    next.enabled = true;
    next.setEffectiveWeight(1);
    next.play();
    if (prev && fade > 0) next.crossFadeFrom(prev, fade, false);
    else prev?.stop();
    this.current = name;
    this.finished = false;
  }

  update(dt: number) {
    this.mixer.update(dt);
  }

  dispose() {
    this.mixer.stopAllAction();
  }
}
