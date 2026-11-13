"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { CatState } from "@/components/cat/states";
import { MQ } from "@/lib/gsap";
import { CatAnimationController } from "./CatAnimationController";
import { fitCamera } from "./CatCamera";
import { CatInteractionController } from "./CatInteractionController";
import { resolvePose, type Moment } from "./resolve";

/** The Blender character, exported by SR_BIGODES_3D/scripts/export_glb.py. */
const MODEL = "/models/sr-bigodes.glb";
/** Heights in the model (1 = the sitting cat, ears included); see public/models/sr-bigodes.json. */
const GRIP = 1.07; // where the front paws hold on, in the hanging clips
const LEDGE = 0.93; // the edge under the chin, in the peeking clip
/** How big the model is next to the 2D figure's box, per place (model units per box height). */
const SIZE = { hero: 1.12, rail: 2.6, dock: 1.4, actor: 1.3 };

interface Rig {
  root: THREE.Group;
  anim: CatAnimationController;
  face: CatInteractionController;
}

/**
 * Sr. Bigodes on the page, in real time: the GLB's skinned meshes, materials,
 * morph targets and animation clips, nothing redrawn.
 *
 * The page's cat logic stays the director (`components/cat`: the FSM, the rail's
 * grip levels, the scenes). Its 2D figures are still in the DOM as the buttons
 * and the measured boxes, but they are not painted once this model is up
 * (`html[data-cat3d]`). Every frame this component reads where the current
 * figure's box is and what is happening to it, puts the model there (feet,
 * gripping paws or ledge on the same spot), and plays the clip that state calls
 * for (`resolve.ts`). The body is never slid around as a rigid object: walking,
 * hanging, slipping, falling, landing, climbing, sleeping and stretching are
 * clips on the rig; head, eyes, eyelids and expression are added on top
 * (`CatInteractionController`).
 */
export function CatModel() {
  const scene = useThree((s) => s.scene);
  const rig = useRef<Rig | null>(null);
  const quality = useRef({ frames: 0, time: 0, dpr: 1 });
  const motion = useRef({ x: 0, y: 0, vx: 0, vy: 0, unit: 0, yaw: 0, seen: false, place: "", w: 0, h: 0 });

  useEffect(() => {
    let alive = true;
    const root = new THREE.Group();
    root.visible = false;
    scene.add(root);
    // Studio light in the spirit of the Blender scene: a soft key from the upper
    // left, sky/ground fill, and two rim lights from behind that draw the black
    // silhouette on dark surfaces.
    const sun = (color: number, intensity: number, x: number, y: number, z: number) => {
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(x, y, z);
      return light;
    };
    const lights = [new THREE.HemisphereLight(0xf3f1eb, 0x26262a, 1.25), sun(0xfff7ee, 2.6, -0.5, 0.8, 1), sun(0xeef2ff, 3.4, -1, 0.55, -0.9), sun(0xfff4e6, 2.8, 1, 0.45, -0.8)];
    lights.forEach((l) => scene.add(l));

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      MODEL,
      (gltf) => {
        if (!alive) return;
        gltf.scene.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.frustumCulled = false; // skinned: its box does not follow the pose
        });
        root.add(gltf.scene);
        rig.current = { root, anim: new CatAnimationController(gltf.scene, gltf.animations), face: new CatInteractionController(gltf.scene) };
      },
      undefined,
      () => {
        // The model did not load: the page keeps its 2D figure.
      },
    );

    const onMove = (e: PointerEvent) => {
      if (rig.current && e.pointerType !== "touch") rig.current.face.pointer = { x: e.clientX, y: e.clientY };
    };
    const onDown = (e: PointerEvent) => {
      if (rig.current) rig.current.face.pointer = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      alive = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      rig.current?.anim.dispose();
      rig.current = null;
      scene.remove(root);
      lights.forEach((l) => scene.remove(l));
      delete document.documentElement.dataset.cat3d;
    };
  }, [scene]);

  useFrame(({ camera, size, setDpr }, delta) => {
    const r = rig.current;
    if (!r) return;
    // Adaptive quality: when frames run long the canvas renders at a lower pixel
    // ratio (down to 0.5), and climbs back when there is headroom again.
    const q = quality.current;
    q.time += delta;
    if (++q.frames >= 24) {
      const avg = q.time / q.frames;
      const max = Math.min(window.devicePixelRatio || 1, 1.75);
      const next = avg > 0.034 ? Math.max(0.5, q.dpr * 0.75) : avg < 0.014 ? Math.min(max, q.dpr * 1.2) : q.dpr;
      if (Math.abs(next - q.dpr) > 0.01) {
        q.dpr = next;
        setDpr(next);
      }
      q.frames = 0;
      q.time = 0;
    }
    if (motion.current.w !== size.width || motion.current.h !== size.height) {
      motion.current.w = size.width;
      motion.current.h = size.height;
      fitCamera(camera, size.width, size.height);
    }
    const dt = Math.min(delta, 0.05);
    const still = window.matchMedia(MQ.reduced).matches;
    const host = document.querySelector<HTMLElement>("[data-cat-assistant]");
    const stage = document.querySelector<HTMLElement>("[data-cat-stage]");
    const wrap = stage?.firstElementChild as HTMLElement | null | undefined;
    const dock = document.querySelector<HTMLElement>("[data-cat-dock]");
    if (!host) {
      r.root.visible = false;
      return;
    }
    const state = host.dataset.catAssistant as CatState;
    const railMode = host.dataset.catRail !== undefined;

    // Which 2D figure is "the cat" right now: the roaming actor, the hero slot, or its docked place.
    let el: Element | null = null;
    let place: Moment["place"] = "dock";
    const actorOn = !!wrap && (wrap.style.visibility === "inherit" || wrap.style.visibility === "visible") && parseFloat(wrap.style.opacity || "1") > 0.05;
    if (actorOn && wrap) {
      el = wrap.querySelector("svg");
      place = "actor";
    } else if (state === "observer") {
      const slot = Array.from(document.querySelectorAll<HTMLElement>('[data-cat-root="observer"]')).find((n) => n.offsetParent !== null);
      el = slot?.querySelector("svg") ?? null;
      place = "hero";
    } else {
      const svg = dock?.querySelector<SVGSVGElement>("svg") ?? null;
      // the docked figure is hidden while the cat is away (inside the pictures)
      el = svg && svg.style.visibility !== "hidden" ? svg : null;
    }
    const box = el?.getBoundingClientRect();
    if (!box || box.width < 2) {
      r.root.visible = false;
      motion.current.seen = false;
      return;
    }

    const m = motion.current;
    const k = place === "hero" ? SIZE.hero : place === "actor" ? SIZE.actor : railMode ? SIZE.rail : SIZE.dock;
    const unitTarget = box.height * k;
    const fresh = !m.seen || m.place !== place;
    m.unit = fresh ? unitTarget : m.unit + (unitTarget - m.unit) * (1 - Math.exp(-dt * 10));
    const cx = box.left + box.width / 2;
    if (fresh) {
      m.vx = m.vy = 0;
    } else if (dt > 0) {
      m.vx += ((cx - m.x) / dt - m.vx) * 0.3;
      m.vy += ((box.bottom - m.y) / dt - m.vy) * 0.3;
    }
    m.x = cx;
    m.y = box.bottom;
    m.seen = true;
    m.place = place;

    const pose = resolvePose({ state, place, rail: railMode, grip: dock?.dataset.catGrip, act: wrap?.dataset.catAct, vx: m.vx, vy: m.vy, unit: m.unit });
    if (r.anim.has(pose.clip)) r.anim.play(pose.clip, { once: pose.once, speed: pose.speed, fade: still ? 0 : pose.clip === "Caindo" ? 0.12 : 0.26 });
    r.anim.update(still ? 0 : dt);

    // Anchor: the same point of the page under its feet, in its paws, or under its chin.
    let originY = box.bottom;
    if (pose.anchor === "grip") originY = box.top + GRIP * m.unit;
    else if (pose.anchor === "ledge") {
      const up = THREE.MathUtils.clamp((window.innerHeight - box.top) / (0.45 * box.height), 0, 1.1);
      originY = window.innerHeight + m.unit * (LEDGE + 0.5 * (1 - up));
    }
    r.root.position.set(cx - size.width / 2, size.height / 2 - originY, 0);
    r.root.scale.setScalar(m.unit);
    const yawTarget = (pose.heading ?? 0) * 1.2;
    m.yaw += (yawTarget - m.yaw) * (still ? 1 : 1 - Math.exp(-dt * 9));
    r.root.rotation.y = m.yaw;
    r.root.visible = true;

    r.face.setFace(pose.face);
    r.face.update(dt, r.root, { x: cx, y: originY - 0.82 * m.unit }, !!pose.looks, still);

    // The canvas follows the stage's own layering: behind a title's letters when
    // the scene says so, and cut where the cat is behind a picture's edge.
    const c = document.querySelector<HTMLElement>("[data-cat-scene]");
    if (c) {
      const z = place === "actor" && wrap?.style.zIndex === "1" ? "65" : "67";
      if (c.style.zIndex !== z) c.style.zIndex = z;
      const clip = stage?.style.clipPath ?? "";
      if (c.style.clipPath !== clip) c.style.clipPath = clip;
    }
    if (document.documentElement.dataset.cat3d !== "on") document.documentElement.dataset.cat3d = "on";
  });

  return null;
}
