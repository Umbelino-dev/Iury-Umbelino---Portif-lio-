import type * as THREE from "three";

/**
 * The 3D cat in a three.js scene (Iury, 2026-11-11: Blender model, real-time).
 * Model + rig + body actions come from public/models/cat.glb, built by
 * scripts/cat3d/build_cat.py. This class adds what should react live on top
 * of the baked actions: blink, gaze toward the pointer (eyes lead, head
 * follows), ear flicks, tail sway, breathing; and it moves the cat on the
 * floor while it walks, turning round at the edges.
 *
 * three is passed in (dynamically imported by the caller), so nothing here
 * lands in a page bundle that does not show the cat.
 */
export type CatPose = "Sit" | "Stand" | "Walk";

type Three = typeof THREE;

interface Addons {
  GLTFLoader: typeof import("three/addons/loaders/GLTFLoader.js").GLTFLoader;
  RoomEnvironment: typeof import("three/addons/environments/RoomEnvironment.js").RoomEnvironment;
}

const COLORS = {
  Fur: 0x1a1a1a,
  Inner: 0x4a4646,
  Eye: 0xc8f169,
  Pupil: 0x0b0b0b,
  Shine: 0xffffff,
  Nose: 0x3a3434,
  Whisker: 0x8a8a8a,
} as const;

/** Units per second the cat travels at walk timeScale 1 (STRIDE / stride time in animate.py). */
const WALK_SPEED = 0.3;
const VIEW_HEIGHT = 1.45;

export class CatScene {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private clock: THREE.Clock;
  private mixer: THREE.AnimationMixer | null = null;
  private actions = new Map<CatPose, THREE.AnimationAction>();
  private current: THREE.AnimationAction | null = null;
  private cat: THREE.Object3D | null = null;
  private bones = new Map<string, THREE.Bone>();
  private raf = 0;
  private t = 0;
  private pose: CatPose = "Sit";
  private dir = 1;
  private turning = 0; // remaining turn time
  private look = { x: 0, y: 0, tx: 0, ty: 0 };
  private blinkT = 2;
  private blinkPhase = -1;
  private earT = 4;
  private earPhase = -1;
  private earSide = "L";
  private speed = 1;
  private disposed = false;

  constructor(
    private T: Three,
    private A: Addons,
    private canvas: HTMLCanvasElement,
    private opts: { reduced: boolean; onPose?: (p: CatPose) => void },
  ) {
    this.renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.scene = new T.Scene();
    const pm = new T.PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(new A.RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.35;
    const key = new T.DirectionalLight(0xffffff, 1.3);
    key.position.set(-2, 3, 3);
    const rim = new T.DirectionalLight(0xffffff, 1.6);
    rim.position.set(2.5, 2, -3);
    this.scene.add(key, rim, new T.HemisphereLight(0xffffff, 0x444444, 0.4));
    this.camera = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
    this.camera.position.set(0, 0.6, 6);
    this.camera.lookAt(0, 0.6, 0);
    this.clock = new T.Clock();
    this.scene.add(this.shadow());
    this.resize();
  }

  /** Soft contact shadow under the cat (the sheet's grey smudge). */
  private shadow() {
    const T = this.T;
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    if (g) {
      const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, "rgba(0,0,0,0.22)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, 64, 64);
    }
    const m = new T.Mesh(new T.PlaneGeometry(0.75, 0.42), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.002;
    m.name = "shadow";
    return m;
  }

  async load(url: string) {
    const T = this.T;
    const gltf = await new this.A.GLTFLoader().loadAsync(url);
    if (this.disposed) return;
    const cat = gltf.scene;
    cat.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const next = mats.map((m) => {
          const name = (m.name || "Fur") as keyof typeof COLORS;
          const color = COLORS[name] ?? COLORS.Fur;
          // eyes, pupils, shine, whiskers are flat (unlit), like the drawing;
          // fur and ears keep a soft sheen so the black shape reads in 3D
          if (name === "Eye" || name === "Pupil" || name === "Shine" || name === "Whisker") return new T.MeshBasicMaterial({ color });
          return new T.MeshStandardMaterial({ color, roughness: name === "Fur" ? 0.5 : 0.7, metalness: 0 });
        });
        mesh.material = next.length === 1 ? next[0]! : next;
        mesh.frustumCulled = false;
      }
      if ((o as THREE.Bone).isBone) this.bones.set(o.name, o as THREE.Bone);
    });
    this.cat = cat;
    this.scene.add(cat);
    this.mixer = new T.AnimationMixer(cat);
    for (const clip of gltf.animations) {
      const a = this.mixer.clipAction(clip);
      if (clip.name === "Sit" || clip.name === "Stand" || clip.name === "Walk") this.actions.set(clip.name, a);
    }
    this.play("Sit", 0);
    this.loop();
  }

  private bone(n: string) {
    return this.bones.get(n) ?? this.bones.get(n.replace(".", ""));
  }

  /** Cross-fade to a body action. Walking also moves the cat; the others face the viewer. */
  setPose(p: CatPose) {
    if (p === this.pose && this.current) return;
    this.pose = p;
    if (p === "Walk" && this.opts.reduced) {
      this.play("Stand", 0);
    } else this.play(p, this.opts.reduced ? 0 : 0.45);
    this.opts.onPose?.(p);
  }

  private play(p: CatPose, fade: number) {
    const next = this.actions.get(p);
    if (!next) return;
    next.reset().setEffectiveWeight(1).play();
    if (this.current && this.current !== next) this.current.crossFadeTo(next, fade, false);
    this.current = next;
  }

  setSpeed(s: number) {
    this.speed = s;
  }

  /** Pointer in -1…1 (screen, relative to the cat's head). */
  lookAt(x: number, y: number) {
    this.look.tx = Math.max(-1, Math.min(1, x));
    this.look.ty = Math.max(-1, Math.min(1, y));
  }

  resize() {
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    const aspect = w / h;
    this.camera.top = VIEW_HEIGHT / 2;
    this.camera.bottom = -VIEW_HEIGHT / 2;
    this.camera.left = (-VIEW_HEIGHT * aspect) / 2;
    this.camera.right = (VIEW_HEIGHT * aspect) / 2;
    this.camera.updateProjectionMatrix();
  }

  private halfWidth() {
    return this.camera.right - 0.5;
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05) * this.speed;
    this.t += dt;
    this.mixer?.update(dt);
    this.travel(dt);
    this.life(dt);
    this.renderer.render(this.scene, this.camera);
  };

  /** Walking: move along x, turn round at the edges; other poses ease back to facing the viewer. */
  private travel(dt: number) {
    const cat = this.cat;
    if (!cat) return;
    const shadow = this.scene.getObjectByName("shadow");
    const facing = this.pose === "Walk" && !this.opts.reduced ? (this.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : 0;
    if (this.pose === "Walk" && !this.opts.reduced) {
      const edge = this.halfWidth();
      if (this.turning > 0) {
        this.turning -= dt;
      } else {
        cat.position.x += this.dir * WALK_SPEED * dt;
        if (Math.abs(cat.position.x) > edge) {
          cat.position.x = Math.sign(cat.position.x) * edge;
          this.dir *= -1;
          this.turning = 0.7;
        }
      }
    }
    // turn smoothly toward the facing (a cat turns its whole body, in about half a second)
    const d = Math.atan2(Math.sin(facing - cat.rotation.y), Math.cos(facing - cat.rotation.y));
    cat.rotation.y += d * Math.min(1, dt * (this.turning > 0 ? 5 : 6));
    if (shadow) shadow.position.x = cat.position.x;
  }

  /** Procedural secondary motion, added on top of the mixer's pose each frame. */
  private life(dt: number) {
    if (this.opts.reduced || !this.cat) return;
    const T = this.T;
    const q = new T.Quaternion();
    const e = new T.Euler();
    const add = (name: string, x: number, y: number, z: number) => {
      const b = this.bone(name);
      if (!b) return;
      q.setFromEuler(e.set(x, y, z));
      b.quaternion.multiply(q);
    };

    // gaze: eyes lead fast, the head follows slowly and less
    const L = this.look;
    const k = 1 - Math.exp(-dt * 4);
    L.x += (L.tx - L.x) * k;
    L.y += (L.ty - L.y) * k;
    const facingViewer = this.pose !== "Walk";
    if (facingViewer) add("head", L.y * 0.25, L.x * 0.55, 0);
    add("eye.L", 0, L.tx * 0.25, 0);
    add("eye.R", 0, L.tx * 0.25, 0);

    // breathing
    const chest = this.bone("chest");
    if (chest) chest.scale.setScalar(1 + 0.012 * Math.sin(this.t * 1.9));

    // tail: a wave from root to tip (follow-through). Walking, the whole tail
    // sways; sitting, it lies on the floor and only the tip lifts and curls.
    const walking = this.pose === "Walk";
    for (let i = 0; i < 5; i++) {
      const w = walking ? 0.16 * (0.4 + i * 0.25) : i < 3 ? 0 : 0.18 * (i - 2);
      add(`tail.${i}`, 0, 0, w * Math.sin(this.t * (walking ? 6.3 : 1.3) - i * 0.7));
    }

    // blink every 2–6 s (sometimes double)
    this.blinkT -= dt;
    if (this.blinkT <= 0 && this.blinkPhase < 0) this.blinkPhase = 0;
    if (this.blinkPhase >= 0) {
      this.blinkPhase += dt;
      const p = this.blinkPhase / 0.18;
      const s = p < 0.4 ? 1 - p / 0.4 : Math.min(1, (p - 0.4) / 0.6);
      for (const n of ["eye.L", "eye.R"]) {
        const b = this.bone(n);
        if (b) b.scale.set(1, 1, Math.max(0.08, s));
      }
      if (p >= 1) {
        this.blinkPhase = -1;
        this.blinkT = Math.random() < 0.15 ? 0.12 : 2 + Math.random() * 4;
      }
    }

    // an ear flick every few seconds
    this.earT -= dt;
    if (this.earT <= 0 && this.earPhase < 0) {
      this.earPhase = 0;
      this.earSide = Math.random() < 0.5 ? "L" : "R";
    }
    if (this.earPhase >= 0) {
      this.earPhase += dt;
      const p = this.earPhase;
      const flick = p < 0.07 ? p / 0.07 : Math.exp(-(p - 0.07) * 9) * Math.cos((p - 0.07) * 30);
      add(`ear.${this.earSide}`, 0, 0, (this.earSide === "L" ? 1 : -1) * 0.45 * flick);
      if (p > 0.6) {
        this.earPhase = -1;
        this.earT = 3 + Math.random() * 6;
      }
    }
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.mixer?.stopAllAction();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.geometry.dispose();
        (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x.dispose());
      }
    });
    this.scene.environment?.dispose();
    this.renderer.dispose();
  }
}
