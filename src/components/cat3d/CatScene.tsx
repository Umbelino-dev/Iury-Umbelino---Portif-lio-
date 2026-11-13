"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import * as THREE from "three";
import { MQ } from "@/lib/gsap";
import { FOV } from "./CatCamera";
import { CatModel } from "./CatModel";

/**
 * The cat's WebGL layer: one transparent canvas over the page, fixed to the
 * window, that never takes pointer events. Three.js through React Three Fiber;
 * loaded on its own (dynamic import, after first paint), so it costs the first
 * screen nothing. The scene's contents are set up in `CatModel`.
 *
 * The render loop runs every frame while the tab is shown (the browser pauses it
 * in a hidden tab): the cat is always breathing somewhere on the page. This is
 * the one deliberate exception to "no always-on rAF loops". With reduced motion
 * it renders on demand instead.
 */
/**
 * With reduced motion nothing animates, so the canvas renders on demand: only
 * when the page scrolls, resizes or the pointer moves (the cat may change place).
 */
function OnDemand() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const kick = () => invalidate();
    const events = ["scroll", "resize", "pointermove", "pointerdown"] as const;
    events.forEach((e) => window.addEventListener(e, kick, { passive: true }));
    // the 2D layer moves without scrolling now and then (state changes): a slow safety tick
    const timer = window.setInterval(kick, 500);
    return () => {
      events.forEach((e) => window.removeEventListener(e, kick));
      window.clearInterval(timer);
    };
  }, [invalidate]);
  return null;
}

export default function CatScene() {
  const [reduced] = useState(() => window.matchMedia(MQ.reduced).matches);
  return (
    <div aria-hidden="true" data-cat-scene className="pointer-events-none fixed inset-0 z-[67]">
      <Canvas
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        dpr={1}
        frameloop={reduced ? "demand" : "always"}
        camera={{ fov: FOV }}
        style={{ pointerEvents: "none" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1;
        }}
      >
        <CatModel />
        {reduced && <OnDemand />}
      </Canvas>
    </div>
  );
}
