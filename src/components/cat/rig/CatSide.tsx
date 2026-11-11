import { CAT, capsule, tailPath, type Chain } from "./geometry";
import type { TailPose } from "./tail";

/**
 * Side rig — the cat in profile, facing right (sheet: the walking pose). Mirror
 * the whole svg (scaleX -1) to face left. viewBox 0 0 170 130, floor at y 124.
 *
 * Hierarchy (back to front):
 *   root › tail · far hind leg · torso (pivot: hip) › [far front leg · body ·
 *   near front leg · head (pivot: neck)] · near hind leg
 * Every leg is upper › lower, both groups rotating on their joint (`SIDE.legs`).
 * Far legs are a step darker so the four legs read in depth.
 */
type P = readonly [number, number];
/** A leg: joints from the body down to the paw, and a radius per joint. */
type Leg = { joints: readonly P[]; r: readonly number[] };

/** Front: shoulder › elbow › paw. Hind: hip › knee (forward) › hock (back) › paw. */
const FRONT_LEG: Leg = { joints: [[110, 68], [108, 96], [110, 120.5]], r: [5.6, 4, 3.4] };
const HIND_LEG: Leg = { joints: [[59, 63], [69, 80], [56, 101], [59, 120.5]], r: [13.5, 7, 3.6, 3.2] };

const shift = (l: Leg, dx: number): Leg => ({ joints: l.joints.map(([x, y]) => [x + dx, y] as const), r: l.r });

export const SIDE = {
  viewBox: "0 0 170 130",
  hip: [60, 64] as const,
  neck: [116, 50] as const,
  legs: {
    nf: FRONT_LEG,
    ff: shift(FRONT_LEG, -6),
    nh: HIND_LEG,
    fh: shift(HIND_LEG, 6),
  },
  tail: { x: 46, y: 57, lengths: [11, 11, 11, 10, 9] } satisfies Chain,
  /** Walking: up and back, the tip curling forward (the sheet's question-mark tail). */
  tailUp: [-128, 30, 30, 32, 36] as TailPose,
  /** Low and relaxed, standing still. */
  tailLow: [150, 14, -10, -16, -20] as TailPose,
} as const;

export type LegKey = keyof typeof SIDE.legs;
/** Pivot of segment `i` of a leg (its top joint), as an svgOrigin string. */
export const jointOf = (k: LegKey, i: number) => {
  const j = SIDE.legs[k].joints[i]!;
  return `${j[0]} ${j[1]}`;
};

/** Segments nest, so rotating one carries everything below it. */
function Segment({ id, leg, i, color }: { id: LegKey; leg: Leg; i: number; color: string }) {
  const a = leg.joints[i]!;
  const b = leg.joints[i + 1];
  if (!b) return null;
  const last = i + 2 === leg.joints.length;
  return (
    <g data-part={`${id}-${i}`}>
      <path d={capsule(a[0], a[1], leg.r[i]!, b[0], b[1], leg.r[i + 1]!)} fill={color} />
      {last ? <ellipse cx={b[0] + 1.8} cy={b[1] + 1} rx="4.6" ry="2.6" fill={color} /> : <Segment id={id} leg={leg} i={i + 1} color={color} />}
    </g>
  );
}

function LegShape({ id, leg, color }: { id: LegKey; leg: Leg; color: string }) {
  return <Segment id={id} leg={leg} i={0} color={color} />;
}

export function CatSide({ className }: { className?: string }) {
  const { legs } = SIDE;
  return (
    <svg viewBox={SIDE.viewBox} className={className} overflow="visible" aria-hidden="true" focusable="false">
      <g data-part="root">
        <path data-part="tail" d={tailPath(SIDE.tail, SIDE.tailUp)} fill="none" stroke={CAT.fur} strokeWidth="5.6" strokeLinecap="round" />
        <LegShape id="fh" leg={legs.fh} color={CAT.shade} />
        <g data-part="torso">
          <LegShape id="ff" leg={legs.ff} color={CAT.shade} />
          <path
            data-part="body"
            d="M44 58 C 44 49, 56 45.5, 72 46.5 C 88 47.5, 100 46, 110 42 C 118 39, 125 45, 124 55 C 123 65, 118 75, 108 77.5 C 97 80, 86 77, 76 77 C 68 77.5, 61 80.5, 53 79 C 45 77, 42 67, 44 58 Z"
            fill={CAT.fur}
          />
          <LegShape id="nf" leg={legs.nf} color={CAT.fur} />
          <g data-part="head">
            <path d="M117 34 C 116 22, 117 12, 120 5 C 126 11, 131 17, 134 24 Z" fill={CAT.shade} strokeLinejoin="round" />
            <path
              d="M116 44 C 115 30, 126 22, 138 22.5 C 148 23, 154 31, 154 40 C 156 44, 156 48, 153 50.5 C 150 55, 145 59, 136 60 C 125 61, 116.5 55, 116 44 Z"
              fill={CAT.fur}
            />
            <g data-part="ear">
              <path d="M128 27 C 129 17, 132 9, 137 2.5 C 141 10, 145 18, 147 27 Z" fill={CAT.fur} strokeLinejoin="round" />
              <path d="M132 24 C 133 17, 135 11, 137.5 7.5 C 140 12, 142 17, 143.5 23 Z" fill={CAT.inner} />
            </g>
            <g data-part="eye">
              <ellipse cx="143" cy="38.5" rx="4.6" ry="6.6" fill={CAT.eye} transform="rotate(-6 143 38.5)" />
              <ellipse data-part="pupil" cx="145" cy="39" rx="1.3" ry="4.8" fill={CAT.pupil} />
              <circle cx="141.6" cy="35.4" r="1" fill="#fff" opacity="0.85" />
            </g>
            <path d="M152.6 45.6 C 154 45.4, 155.4 46, 155.6 47 L 153.4 48.6 Z" fill={CAT.inner} />
            <g data-part="whiskers" stroke={CAT.whisker} strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.8">
              <path d="M148 51 L168 47 M148 52.5 L167 53.5 M147 54 L163 59.5" vectorEffect="non-scaling-stroke" />
            </g>
          </g>
        </g>
        <LegShape id="nh" leg={legs.nh} color={CAT.fur} />
      </g>
    </svg>
  );
}
