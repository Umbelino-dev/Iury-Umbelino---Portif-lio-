"use client";

import { useEffect, useRef, useState } from "react";
import { MQ } from "@/lib/gsap";
import type { CatPose, CatScene } from "../three/catScene";

/**
 * Cat lab: an internal review page for the 3D character (Blender model,
 * three.js at run time). Not part of the portfolio: no link, noindex, not in
 * the sitemap, so its labels are not in messages/*.json.
 */
const POSES: { pose: CatPose; label: string }[] = [
  { pose: "Sit", label: "Sentar" },
  { pose: "Stand", label: "Em pé" },
  { pose: "Walk", label: "Andar" },
];
const SPEEDS = [1, 0.5, 0.25];

const btn =
  "min-h-11 px-4 font-display text-ui font-bold underline underline-offset-4 decoration-1 hover:decoration-2 aria-pressed:no-underline aria-pressed:bg-ink aria-pressed:text-paper";

export function CatLab() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<CatScene | null>(null);
  const [pose, setPose] = useState<CatPose>("Sit");
  const [speed, setSpeed] = useState(1);
  const [dark, setDark] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let cancelled = false;
    let scene: CatScene | null = null;
    const isReduced = window.matchMedia(MQ.reduced).matches;
    setReduced(isReduced);

    (async () => {
      try {
        const [T, { GLTFLoader }, { RoomEnvironment }, { CatScene }] = await Promise.all([
          import("three"),
          import("three/addons/loaders/GLTFLoader.js"),
          import("three/addons/environments/RoomEnvironment.js"),
          import("../three/catScene"),
        ]);
        if (cancelled) return;
        scene = new CatScene(T, { GLTFLoader, RoomEnvironment }, el, { reduced: isReduced, onPose: setPose });
        sceneRef.current = scene;
        await scene.load("/models/cat.glb");
        if (!cancelled) setStatus("ready");
      } catch (err) {
        console.error(err);
        if (!cancelled) setStatus("error");
      }
    })();

    const onResize = () => scene?.resize();
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      // the cat's head sits around the middle, a third from the top
      scene?.lookAt((e.clientX - (r.left + r.width / 2)) / (r.width / 2), (e.clientY - (r.top + r.height * 0.35)) / (r.height / 2));
    };
    const onLeave = () => scene?.lookAt(0, 0);
    window.addEventListener("resize", onResize);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      scene?.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setSpeed(speed);
  }, [speed]);

  return (
    <main id="main" data-surface="light" className="min-h-screen bg-paper pb-24 text-ink">
      <div className="page-grid pt-16">
        <header className="col-span-full md:col-span-8">
          <h1 className="font-display text-headline-l font-black">Cat lab</h1>
          <p className="mt-4 max-w-[60ch] text-body text-gray-600">
            O gato em 3D: modelo, rig e animações feitos no Blender (scripts/cat3d), rodando em three.js. Passe o ponteiro no palco: ele segue com os olhos e a cabeça. Página interna, fora do site.
          </p>
          {reduced ? <p className="mt-2 text-note text-gray-600">Movimento reduzido ativo: só poses, sem andar nem movimento secundário.</p> : null}
        </header>
      </div>

      <div className="page-grid mt-10">
        <div className="col-span-full flex flex-wrap items-center gap-x-2 gap-y-3">
          {POSES.map((p) => (
            <button key={p.pose} type="button" className={btn} aria-pressed={pose === p.pose} onClick={() => sceneRef.current?.setPose(p.pose)}>
              {p.label}
            </button>
          ))}
          <span className="mx-3 text-note text-gray-600">velocidade</span>
          {SPEEDS.map((s) => (
            <button key={s} type="button" className={btn} aria-pressed={speed === s} onClick={() => setSpeed(s)}>
              {s}×
            </button>
          ))}
          <span className="mx-3 text-note text-gray-600">fundo</span>
          <button type="button" className={btn} aria-pressed={!dark} onClick={() => setDark(false)}>
            Claro
          </button>
          <button type="button" className={btn} aria-pressed={dark} onClick={() => setDark(true)}>
            Escuro
          </button>
          <span className="ml-auto text-note text-gray-600" aria-live="polite">
            {status === "loading" ? "carregando o modelo…" : status === "error" ? "o modelo não carregou" : `pose: ${pose}`}
          </span>
        </div>
      </div>

      <div className="page-grid mt-6">
        <canvas
          ref={canvas}
          data-cursor="none"
          aria-label="O gato em 3D"
          role="img"
          className={`col-span-full block h-[480px] w-full transition-colors duration-300 ${dark ? "bg-ink" : "bg-[#EBEBEB]"}`}
        />
      </div>
    </main>
  );
}
