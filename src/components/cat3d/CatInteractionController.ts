import * as THREE from "three";

const clamp = THREE.MathUtils.clamp;

/**
 * What the pointer and time do to the face: the head and the eyes turn to the
 * pointer (on top of whatever clip is playing), the eyelids blink, and the
 * expression morph targets ease to their targets. Everything here is applied
 * after the mixer has posed the rig, every frame, so it adds to the clip.
 */
export class CatInteractionController {
  private head: THREE.Object3D | null;
  private eyes: { node: THREE.Object3D; rest: THREE.Quaternion }[] = [];
  private morphMeshes: THREE.Mesh[] = [];
  private weights = new Map<string, number>();
  private targets = new Map<string, number>();
  private yaw = 0;
  private pitch = 0;
  private blinkAt = 2;
  private blink = 0;
  private clock = 0;
  pointer: { x: number; y: number } | null = null;

  private qh = new THREE.Quaternion();
  private qp = new THREE.Quaternion();
  private qd = new THREE.Quaternion();
  private e = new THREE.Euler(0, 0, 0, "YXZ");

  constructor(root: THREE.Object3D) {
    this.head = root.getObjectByName("head") ?? null;
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh && mesh.morphTargetDictionary) this.morphMeshes.push(mesh);
      if (/Olho/.test(o.name) && !(o as THREE.Mesh).isMesh) this.eyes.push({ node: o, rest: o.quaternion.clone() });
    });
    // an eye exported as a single mesh has no group around it
    if (!this.eyes.length) root.traverse((o) => /Olho/.test(o.name) && this.eyes.push({ node: o, rest: o.quaternion.clone() }));
  }

  /** Expression morph targets for this moment; anything not named eases back to 0. */
  setFace(face: Record<string, number> = {}) {
    for (const key of this.targets.keys()) this.targets.set(key, 0);
    for (const [key, v] of Object.entries(face)) this.targets.set(key, v);
  }

  /**
   * @param headAt where the head is on screen (px), to aim from
   * @param looks  whether this pose lets it look around
   * @param still  reduced motion: no blinking, no easing
   */
  update(dt: number, root: THREE.Object3D, headAt: { x: number; y: number }, looks: boolean, still: boolean) {
    // head and eyes toward the pointer
    let ty = 0;
    let tp = 0;
    if (looks && this.pointer && !still) {
      ty = clamp((this.pointer.x - headAt.x) / 420, -1, 1) * 0.62;
      tp = clamp((this.pointer.y - headAt.y) / 420, -1, 1) * 0.36;
    }
    const k = still ? 1 : 1 - Math.exp(-dt * 7);
    this.yaw += (ty - this.yaw) * k;
    this.pitch += (tp - this.pitch) * k;
    if (this.head?.parent && (Math.abs(this.yaw) > 1e-3 || Math.abs(this.pitch) > 1e-3)) {
      root.updateMatrixWorld(true);
      this.head.getWorldQuaternion(this.qh);
      this.head.parent.getWorldQuaternion(this.qp);
      this.qd.setFromEuler(this.e.set(this.pitch * 0.7, this.yaw * 0.7, 0));
      this.qh.premultiply(this.qd);
      this.head.quaternion.copy(this.qp.invert().multiply(this.qh));
    }
    for (const eye of this.eyes) {
      this.qd.setFromEuler(this.e.set(this.pitch * 0.5, this.yaw * 0.55, 0));
      eye.node.quaternion.copy(eye.rest).multiply(this.qd);
    }

    // blink
    this.clock += dt;
    if (!still && this.clock > this.blinkAt) {
      this.blink = 0.16;
      this.blinkAt = this.clock + 2.4 + Math.random() * 3.6;
    }
    this.blink = Math.max(0, this.blink - dt);
    const lid = this.blink > 0 ? Math.sin((this.blink / 0.16) * Math.PI) : 0;

    // expressions ease in and out
    const ease = still ? 1 : 1 - Math.exp(-dt * 9);
    for (const [key, target] of this.targets) {
      const now = this.weights.get(key) ?? 0;
      this.weights.set(key, now + (target - now) * ease);
    }
    const asleep = (this.weights.get("Dormindo") ?? 0) > 0.5;
    for (const mesh of this.morphMeshes) {
      const dict = mesh.morphTargetDictionary;
      const inf = mesh.morphTargetInfluences;
      if (!dict || !inf) continue;
      for (const [key, w] of this.weights) {
        const i = dict[key];
        if (i !== undefined) inf[i] = w;
      }
      const b = dict.Piscar;
      if (b !== undefined) inf[b] = asleep ? 0 : lid;
    }
  }
}
