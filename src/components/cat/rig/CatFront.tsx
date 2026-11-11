import { CAT, capsule, tailPath, type Chain } from "./geometry";
import type { TailPose } from "./tail";

/**
 * Front rig — the cat seated, facing the viewer (sheet: row 2, first pose).
 * viewBox 0 0 100 125, floor at y 124. Parts carry `data-part`; pivots live in
 * FRONT (SVG user units), so motion code never guesses them.
 *
 * Hierarchy: root › tail | body › legs | head › ears, whiskers, eyes › pupils.
 * Each eye is its own group (blink = scaleY on it); pupils sit in `gaze` so the
 * look moves inside the eyes while the head turns on its own.
 */
export const FRONT = {
  viewBox: "0 0 100 125",
  pivots: {
    root: "50 124",
    body: "50 124",
    head: "50 62",
    earL: "28 30",
    earR: "72 30",
    eyeL: "37 41",
    eyeR: "63 41",
    pupilL: "37.4 41.4",
    pupilR: "62.6 41.4",
    legL: "42 82",
    legR: "58 82",
  },
  tail: { x: 69, y: 119, lengths: [8, 8, 7, 6, 5] } satisfies Chain,
  tailRest: [8, -8, -34, -58, -62] as TailPose,
} as const;

const legL = capsule(41.6, 82, 3.6, 41.8, 120.5, 3.2);
const legR = capsule(58.4, 82, 3.6, 58.2, 120.5, 3.2);

export function CatFront({ className }: { className?: string }) {
  const tail = tailPath(FRONT.tail, FRONT.tailRest);
  return (
    <svg viewBox={FRONT.viewBox} className={className} overflow="visible" aria-hidden="true" focusable="false">
      <g data-part="root">
        <path data-part="tail" d={tail} fill="none" stroke={CAT.fur} strokeWidth="5.6" strokeLinecap="round" />
        <g data-part="body">
          <path
            d="M40 58 C 36 66, 31 76, 28 88 C 24 98, 18 106, 19 113 C 20 119, 26 121, 33 121 L67 121 C 74 121, 80 119, 81 113 C 82 106, 76 98, 72 88 C 69 76, 64 66, 60 58 Z"
            fill={CAT.fur}
          />
          {/* Haunches, a faint inner contour (the sheet's only linework). */}
          <path d="M29 101 C 33 106, 35.5 113, 34.5 121 M71 101 C 67 106, 64.5 113, 65.5 121" fill="none" stroke={CAT.shade} strokeWidth="1.1" strokeLinecap="round" />
          <g data-part="leg-l">
            <path d={legL} fill={CAT.fur} stroke={CAT.shade} strokeWidth="0.9" />
            <ellipse cx="41.4" cy="121.6" rx="4.4" ry="2.6" fill={CAT.fur} />
          </g>
          <g data-part="leg-r">
            <path d={legR} fill={CAT.fur} stroke={CAT.shade} strokeWidth="0.9" />
            <ellipse cx="58.6" cy="121.6" rx="4.4" ry="2.6" fill={CAT.fur} />
          </g>
        </g>
        <g data-part="head">
          <g data-part="ear-l">
            <path d="M20 38 C 19 24, 21 11, 25 2 C 33 8, 40 14, 45 22 Z" fill={CAT.fur} strokeLinejoin="round" />
            <path d="M24.5 31 C 24.5 22, 25.5 14, 27.5 8.5 C 32 12, 36 16, 39.5 21 Z" fill={CAT.inner} />
          </g>
          <g data-part="ear-r">
            <path d="M80 38 C 81 24, 79 11, 75 2 C 67 8, 60 14, 55 22 Z" fill={CAT.fur} strokeLinejoin="round" />
            <path d="M75.5 31 C 75.5 22, 74.5 14, 72.5 8.5 C 68 12, 64 16, 60.5 21 Z" fill={CAT.inner} />
          </g>
          <path
            d="M50 18 C 64 18, 76 24, 80 36 C 83 44, 84 50, 79 55 C 72 61, 60 63, 50 63 C 40 63, 28 61, 21 55 C 16 50, 17 44, 20 36 C 24 24, 36 18, 50 18 Z"
            fill={CAT.fur}
          />
          <g data-part="whiskers" stroke={CAT.whisker} strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.8">
            <path d="M25 50 L3 46.5 M25 52.5 L4 54 M26 55 L8 61" vectorEffect="non-scaling-stroke" />
            <path d="M75 50 L97 46.5 M75 52.5 L96 54 M74 55 L92 61" vectorEffect="non-scaling-stroke" />
          </g>
          <path d="M47.9 51 C 49 50.6, 51 50.6, 52.1 51 L50 53.3 Z" fill={CAT.inner} strokeLinejoin="round" />
          <g data-part="eye-l">
            <ellipse cx="37" cy="41" rx="7.6" ry="8.4" fill={CAT.eye} transform="rotate(-10 37 41)" />
            <g data-part="gaze-l">
              <ellipse data-part="pupil-l" cx="37.4" cy="41.4" rx="1.8" ry="6" fill={CAT.pupil} />
            </g>
            <circle cx="34.6" cy="37.4" r="1.3" fill="#fff" opacity="0.85" />
          </g>
          <g data-part="eye-r">
            <ellipse cx="63" cy="41" rx="7.6" ry="8.4" fill={CAT.eye} transform="rotate(10 63 41)" />
            <g data-part="gaze-r">
              <ellipse data-part="pupil-r" cx="62.6" cy="41.4" rx="1.8" ry="6" fill={CAT.pupil} />
            </g>
            <circle cx="60.2" cy="37.4" r="1.3" fill="#fff" opacity="0.85" />
          </g>
        </g>
      </g>
    </svg>
  );
}
