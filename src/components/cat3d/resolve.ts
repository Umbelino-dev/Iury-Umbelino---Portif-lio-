import type { CatState } from "@/components/cat/states";

/**
 * Which clip the model plays, and how it is anchored, for a given moment.
 *
 * The site's cat logic (the FSM in `cat/states.ts`, the rail's grip levels, the
 * director's scenes) decides where the cat is and what is happening to it; this
 * is the one place that turns that into the body's movement. Nothing here moves
 * the model: it only names the clip the rig should be playing.
 */
export type Anchor = "feet" | "grip" | "ledge" | "pole";
export interface Pose {
  clip: string;
  /** feet: the model stands on the point · grip: its front paws hold it · ledge: its paws rest on it, under the chin · pole: it clings, side-on, to the scrollbar's thumb. */
  anchor: Anchor;
  once?: boolean;
  speed?: number;
  /** Which way it faces: 0 the visitor, ±1 along the screen. */
  heading?: number;
  /** Exact turn (radians), when the pose needs a set side: π/2 = side-on, belly to the right edge. */
  yaw?: number;
  /** It may turn its head and eyes to the pointer. */
  looks?: boolean;
  /** Expression morph targets, 0–1. */
  face?: Record<string, number>;
}

export interface Moment {
  state: CatState;
  /** Where the figure is: the hero slot, its docked place, or roaming (a scene). */
  place: "hero" | "dock" | "actor";
  rail: boolean;
  /** Rail grip: "1" firm · "2" paws sliding · "3" one paw · "4" lost · "land" · "sit" · "climb". */
  grip?: string;
  /** What a scene says it is doing ("peek", "peek-side"). */
  act?: string;
  /** Screen velocity of the figure, px per second. */
  vx: number;
  vy: number;
  /** Size of the figure on screen, px per model unit (speeds are judged against it). */
  unit: number;
}

const SCARED = { Surpreso: 0.8 };
/** Side-on, belly to the right edge of the window (where the scrollbar is). */
const SIDE = Math.PI / 2;

/** Moving on its own feet: walk or run the way it goes; still: sit. */
function onFoot(m: Moment): Pose {
  const speed = Math.abs(m.vx) / Math.max(1, m.unit); // body lengths per second, roughly
  if (m.vy > 4 * m.unit && Math.abs(m.vy) > Math.abs(m.vx)) return { clip: "Caindo", anchor: "feet", face: SCARED };
  if (speed > 2.6) return { clip: "Correndo", anchor: "feet", heading: Math.sign(m.vx), speed: Math.min(1.6, speed / 3) };
  if (speed > 0.35) return { clip: "Andando", anchor: "feet", heading: Math.sign(m.vx), speed: Math.max(0.8, Math.min(1.8, speed / 0.9)) };
  return { clip: "Sentado_Idle", anchor: "feet", looks: true };
}

export function resolvePose(m: Moment): Pose {
  if (m.place === "actor") {
    if (m.act === "peek") return { clip: "Espiando", anchor: "ledge", looks: true, face: { Curioso: 0.6 } };
    return onFoot(m);
  }
  switch (m.state) {
    case "observer":
      return onFoot(m);
    case "jump":
      // in the air, side-on, the way it leaps (to the scrollbar it always goes right)
      return { clip: "Caindo", anchor: "feet", yaw: (m.rail || m.vx >= 0 ? 1 : -1) * SIDE, face: { Surpreso: 0.3 } };
    case "sleep":
      // on the rail it lets go and falls to the corner before it curls up
      if (m.vy > 2.5 * m.unit) return { clip: "Caindo", anchor: "feet" };
      return { clip: "Dormindo", anchor: "feet", face: { Dormindo: 1 } };
    case "waking":
      return { clip: "Espreguicando", anchor: "feet", once: true, face: { Feliz: 0.5 } };
    case "awaken":
      return { clip: "Curioso", anchor: "feet", looks: true, face: { Curioso: 0.8 } };
    case "cling":
      if (!m.rail) return { clip: "Sentado_Idle", anchor: "feet", looks: true };
      switch (m.grip) {
        case "2":
          return { clip: "Agarrado_Deslizando", anchor: "pole", yaw: SIDE, face: { Surpreso: 0.4 } };
        case "3":
          return { clip: "Agarrado_UmaPata", anchor: "pole", yaw: SIDE, face: { Surpreso: 0.7 } };
        case "4":
          return { clip: "Caindo", anchor: "feet", yaw: SIDE, face: SCARED };
        case "land":
          return { clip: "Pousando", anchor: "feet", yaw: SIDE, once: true };
        case "sit":
          return { clip: "Sentado_Idle", anchor: "feet", looks: true };
        case "climb":
          return { clip: "Agarrado_Escalando", anchor: "pole", yaw: SIDE };
        default:
          return { clip: "Agarrado", anchor: "pole", yaw: SIDE, looks: true };
      }
  }
}
