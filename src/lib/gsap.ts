"use client";

import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, CustomEase, SplitText, useGSAP);

/** The project's single easing — mirrors --ease-out-soft in globals.css. */
export const EASE = CustomEase.create("soft", "0.2,0.7,0.1,1");

gsap.defaults({ ease: EASE, duration: 0.42 });

/** Motion tokens in seconds (fast / base / slow) — mirrors --duration-* in globals.css. */
export const DUR = { fast: 0.16, base: 0.32, slow: 0.64 } as const;

/** Shared media conditions — use with gsap.matchMedia(). */
export const MQ = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduced: "(prefers-reduced-motion: reduce)",
  finePointer: "(hover: hover) and (pointer: fine)",
  touch: "(hover: none)",
} as const;

export { gsap, ScrollTrigger, SplitText, useGSAP };
