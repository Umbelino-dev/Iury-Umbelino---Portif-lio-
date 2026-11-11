"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, MQ } from "@/lib/gsap";
import { CatFront } from "../rig/CatFront";
import { CatSide } from "../rig/CatSide";
import { CatDirector, type Action, type Pose } from "../rig/director";

/**
 * Cat lab (phase 1): an internal review page for the character, not part of the
 * portfolio (no link, noindex, not in the sitemap), so its labels are not in
 * messages/*.json. Both rigs share one scale: 2px per SVG unit.
 */
const UNIT = 2;
const FRONT_W = 100 * UNIT;
const SIDE_W = 170 * UNIT;
/** Floors: front at y 124 of 125, side at y 124 of 130 → line both up on the stage floor. */
const FRONT_DROP = (125 - 124) * UNIT;
const SIDE_DROP = (130 - 124) * UNIT;

const POSES: { pose: Pose; label: string }[] = [
  { pose: "sit", label: "Sentar" },
  { pose: "curious", label: "Curioso" },
  { pose: "stand", label: "Levantar" },
  { pose: "walk", label: "Andar" },
];
const ACTIONS: { action: Action; label: string }[] = [
  { action: "stretch", label: "Alongar" },
  { action: "blink", label: "Piscar" },
  { action: "ear", label: "Orelha" },
];
const SPEEDS = [1, 0.5, 0.25];

const btn = "min-h-11 px-4 font-display text-ui font-bold underline underline-offset-4 decoration-1 hover:decoration-2 aria-pressed:no-underline aria-pressed:bg-ink aria-pressed:text-paper";

export function CatLab() {
  const stage = useRef<HTMLDivElement>(null);
  const actor = useRef<HTMLDivElement>(null);
  const front = useRef<HTMLDivElement>(null);
  const side = useRef<HTMLDivElement>(null);
  const director = useRef<CatDirector | null>(null);
  const [pose, setPose] = useState<Pose>("sit");
  const [speed, setSpeed] = useState(1);
  const [dark, setDark] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const st = stage.current;
    const a = actor.current;
    if (!st || !a || !front.current || !side.current) return;
    const isReduced = window.matchMedia(MQ.reduced).matches;
    setReduced(isReduced);
    const bounds = () => {
      const w = st.clientWidth;
      return { min: SIDE_W / 2 + 16, max: w - SIDE_W / 2 - 16 };
    };
    gsap.set(a, { x: st.clientWidth / 2 });
    const d = new CatDirector({ actor: a, front: front.current, side: side.current, bounds }, { reduced: isReduced, onPose: setPose });
    director.current = d;

    // The seated cat watches the pointer (eyes first, then the head).
    const onMove = (e: PointerEvent) => {
      const r = front.current?.getBoundingClientRect();
      if (!r) return;
      const hx = r.left + r.width / 2;
      const hy = r.top + r.height * 0.33;
      d.look((e.clientX - hx) / 320, (e.clientY - hy) / 220);
    };
    const onLeave = () => d.look(0, 0);
    st.addEventListener("pointermove", onMove);
    st.addEventListener("pointerleave", onLeave);
    return () => {
      st.removeEventListener("pointermove", onMove);
      st.removeEventListener("pointerleave", onLeave);
      d.destroy();
      director.current = null;
      gsap.globalTimeline.timeScale(1);
    };
  }, []);

  useEffect(() => {
    gsap.globalTimeline.timeScale(speed);
  }, [speed]);

  return (
    <main id="main" data-surface="light" className="min-h-screen bg-paper pb-24 text-ink">
      <div className="page-grid pt-16">
        <header className="col-span-full md:col-span-8">
          <h1 className="font-display text-headline-l font-black">Cat lab</h1>
          <p className="mt-4 max-w-[60ch] text-body text-gray-600">
            Fase 1 do personagem: os dois rigs (frente e perfil) e os estados sentado, curioso, em pé, andando e alongando. Página interna, fora do site. Passe o ponteiro no palco: sentado, o gato segue com os olhos.
          </p>
          {reduced ? <p className="mt-2 text-note text-gray-600">Movimento reduzido ativo: poses trocam sem animação.</p> : null}
        </header>
      </div>

      <div className="page-grid mt-10">
        <div className="col-span-full flex flex-wrap items-center gap-x-2 gap-y-3">
          {POSES.map((p) => (
            <button key={p.pose} type="button" className={btn} aria-pressed={pose === p.pose} onClick={() => director.current?.go(p.pose)}>
              {p.label}
            </button>
          ))}
          <span className="mx-3 text-note text-gray-600">ações</span>
          {ACTIONS.map((a) => (
            <button key={a.action} type="button" className={btn} onClick={() => director.current?.act(a.action)}>
              {a.label}
            </button>
          ))}
        </div>
        <div className="col-span-full mt-3 flex flex-wrap items-center gap-x-2 gap-y-3">
          <span className="text-note text-gray-600">velocidade</span>
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
            estado: {pose}
          </span>
        </div>
      </div>

      <div className="page-grid mt-6">
        <div
          ref={stage}
          data-cursor="none"
          className={`relative col-span-full h-[420px] overflow-hidden transition-colors duration-300 ${dark ? "bg-ink" : "bg-paper-0"}`}
        >
          <div ref={actor} className="absolute bottom-10 left-0 h-0 w-0">
            <div ref={front} className="absolute" style={{ width: FRONT_W, left: -FRONT_W / 2, bottom: -FRONT_DROP }}>
              <CatFront className="block w-full" />
            </div>
            <div ref={side} className="absolute" style={{ width: SIDE_W, left: -SIDE_W / 2, bottom: -SIDE_DROP }}>
              <CatSide className="block w-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="page-grid mt-16">
        <section className="col-span-full">
          <h2 className="font-display text-title font-bold">Modelo (turnaround)</h2>
          <div className="mt-6 flex flex-wrap items-end gap-12">
            <CatFront className="w-[160px]" />
            <CatSide className="w-[272px]" />
            <div style={{ transform: "scaleX(-1)" }}>
              <CatSide className="w-[272px]" />
            </div>
          </div>
        </section>
        <section className="col-span-full mt-16">
          <h2 className="font-display text-title font-bold">Tamanho real no site</h2>
          <p className="mt-2 text-note text-gray-600">44px (dock e trilho) e 80px.</p>
          <div className="mt-6 flex flex-wrap items-end gap-10">
            <CatFront className="w-[44px]" />
            <CatSide className="w-[75px]" />
            <CatFront className="w-[80px]" />
            <CatSide className="w-[136px]" />
            <div className="flex items-end gap-10 bg-ink p-4">
              <CatFront className="w-[44px]" />
              <CatSide className="w-[75px]" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
