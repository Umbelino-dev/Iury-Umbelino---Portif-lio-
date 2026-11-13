import { useId } from "react";

/**
 * The cat's geometry: one drawing for every state (CLAUDE.md §The cat).
 * Graphite body, lime eyes; only the pose changes. Redrawn 2026-11-13 (Iury):
 * continuous Bézier silhouettes instead of a circle + triangles + rectangle,
 * a soft rim of light along the top of each part, wide eyes with round pupils, two
 * catchlights and a faint lime glow (on hover the glow brightens and the ears perk).
 *
 * Parts carry `data-cat` hooks so animation code can target them without
 * knowing the markup. Pivots (SVG user units, viewBox 0 0 100 125):
 * body → (50,125) · head and look → (50,62) neck · eyes → (50,40) · tail → (80,118) ·
 * legs → (41,86) and (59,86) shoulders.
 * Idle-only hooks, never touched by the clip library (so the two never fight over
 * one transform): `tail-wave` (the path itself, its shape tweened), `ear-r`
 * (twitch), `ear-tilt-l/r` (CSS, perk on hover) and `glow` (CSS, brighter on hover).
 * `paws` are hidden by default: they show only while the cat grips the rail.
 */
export const TAIL_REST = "M79 117 C93 118 99 107 95 95 C92 87 92 80 97 75";
export const TAIL_WAVE = "M79 117 C94 117 98 104 93 93 C89 85 91 77 94 71";

const FUR = "#1c1c1c";
const FUR_FRONT = "#232323";

export function CatFigure({ className }: { className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const rim = `url(#rim-${id})`;
  const glow = `url(#glow-${id})`;
  return (
    <svg viewBox="0 0 100 125" className={className} aria-hidden="true" focusable="false">
      <defs>
        {/* Rim light: bright on each part's upper edge, gone by its middle. */}
        <linearGradient id={`rim-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfdbe6" stopOpacity="0.62" />
          <stop offset="0.3" stopColor="#cfdbe6" stopOpacity="0.14" />
          <stop offset="0.6" stopColor="#cfdbe6" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`glow-${id}`}>
          <stop offset="0" stopColor="#c8f169" stopOpacity="0.55" />
          <stop offset="1" stopColor="#c8f169" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Tail: an S that curls up the right side. The outer group swings (clips), the path waves (idle). */}
      <g data-cat="tail">
        <path data-cat="tail-wave" d={TAIL_REST} fill="none" stroke={FUR} strokeWidth="6.5" strokeLinecap="round" />
      </g>

      {/* Sitting body: a soft pear, haunches wide at the base. */}
      <g data-cat="body">
        <path
          d="M50 54 C63 54 71 63 75 78 C78 89 85 100 83 110 C82 116.5 77 119 69 119 L31 119 C23 119 18 116.5 17 110 C15 100 22 89 25 78 C29 63 37 54 50 54 Z"
          fill={FUR}
          stroke={rim}
          strokeWidth="1"
        />
        {/* Haunch: the back leg folded under, read only by a slightly lighter curve. */}
        <path d="M73 90 C81 95 83 106 78 115" fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M27 90 C19 95 17 106 22 115" fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" />
      </g>

      {/* Front legs, in front of the chest, paws resting on the letter. */}
      <g data-cat="legs">
        <path
          data-cat="leg-l"
          d="M37 86 C37 81.5 45 81.5 45 86 L45.6 117 C46.2 121.2 44.6 123.6 41 123.6 C37.4 123.6 35.8 121.2 36.4 117 Z"
          fill={FUR_FRONT}
        />
        <path
          data-cat="leg-r"
          d="M55 86 C55 81.5 63 81.5 63 86 L63.6 117 C64.2 121.2 62.6 123.6 59 123.6 C55.4 123.6 53.8 121.2 54.4 117 Z"
          fill={FUR_FRONT}
        />
        {/* Toes: two tiny creases on each paw. */}
        <path d="M39.4 120.6 L39.6 123 M42.6 120.6 L42.4 123 M57.4 120.6 L57.6 123 M60.6 120.6 L60.4 123" stroke="#141414" strokeWidth="0.7" strokeLinecap="round" />
      </g>

      {/* look / gaze wrap head / eyes so scroll and pointer motion add up instead of fighting. */}
      <g data-cat="look">
        <g data-cat="head">
          <g data-cat="ears">
            <g data-cat="ear-tilt-l">
              <path d="M22 31 C19.5 21 20 12 22.5 6.8 C23.4 4.9 25.6 4.6 27.2 5.9 C33 10.5 38 15 42 20.5 Z" fill={FUR} stroke={rim} strokeWidth="1" />
              <path d="M25.5 22 C24.6 16.5 25 11.8 26.4 9.4 C30 12.2 33 15.2 35.4 18.6 Z" fill="#272727" />
            </g>
            {/* The right ear twitches now and then (idle). Pivot at its base. */}
            <g data-cat="ear-r">
              <g data-cat="ear-tilt-r">
                <path d="M78 31 C80.5 21 80 12 77.5 6.8 C76.6 4.9 74.4 4.6 72.8 5.9 C67 10.5 62 15 58 20.5 Z" fill={FUR} stroke={rim} strokeWidth="1" />
                <path d="M74.5 22 C75.4 16.5 75 11.8 73.6 9.4 C70 12.2 67 15.2 64.6 18.6 Z" fill="#272727" />
              </g>
            </g>
          </g>
          {/* Head: round crown, cheeks that widen low, a soft chin. */}
          <path
            d="M50 62 C36 62 21.5 58 18.8 46 C16.6 36 21 27 29 21.5 C35 17.6 42 16.5 50 16.5 C58 16.5 65 17.6 71 21.5 C79 27 83.4 36 81.2 46 C78.5 58 64 62 50 62 Z"
            fill={FUR}
            stroke={rim}
            strokeWidth="1"
          />
          {/* Muzzle: nose and a small mouth, barely lighter than the fur. */}
          <path d="M47.6 48.2 C48.6 47.4 51.4 47.4 52.4 48.2 C51.8 49.5 50.8 50.3 50 50.3 C49.2 50.3 48.2 49.5 47.6 48.2 Z" fill="#363636" />
          <path d="M50 50.3 C50 52.2 48.6 53.4 46.8 53 M50 50.3 C50 52.2 51.4 53.4 53.2 53" fill="none" stroke="#333" strokeWidth="0.8" strokeLinecap="round" />
          {/* Whiskers, faint. */}
          <path d="M40 50 C33 49 27 49.5 21 51 M40 52.5 C34 53 28 54.5 23 57 M60 50 C67 49 73 49.5 79 51 M60 52.5 C66 53 72 54.5 77 57" fill="none" stroke="#3a3a3a" strokeWidth="0.55" strokeLinecap="round" opacity="0.8" />
          <g data-cat="gaze">
            <g data-cat="eyes">
              {/* Glow behind the eyes, shown on hover (CSS). */}
              <g data-cat="glow">
                <circle cx="39" cy="40" r="9" fill={glow} />
                <circle cx="61" cy="40" r="9" fill={glow} />
              </g>
              <ellipse cx="39" cy="40" rx="5.2" ry="4.9" transform="rotate(8 39 40)" fill="#c8f169" />
              <ellipse cx="61" cy="40" rx="5.2" ry="4.9" transform="rotate(-8 61 40)" fill="#c8f169" />
              {/* Round, open pupils (Iury preferred them to slits, 2026-11-13). */}
              <g data-cat="pupils" fill="#0e0e0e">
                <ellipse cx="39.5" cy="40.3" rx="2.6" ry="3.4" />
                <ellipse cx="61.5" cy="40.3" rx="2.6" ry="3.4" />
              </g>
              <circle cx="41.2" cy="38.2" r="1.1" fill="#f3f1eb" />
              <circle cx="63.2" cy="38.2" r="1.1" fill="#f3f1eb" />
              <circle cx="38.2" cy="42" r="0.5" fill="#f3f1eb" opacity="0.6" />
              <circle cx="60.2" cy="42" r="0.5" fill="#f3f1eb" opacity="0.6" />
            </g>
          </g>
        </g>
      </g>

      {/* Front paws gripping the rail (one above the other, like climbing a pole). */}
      <g data-cat="paws" opacity="0">
        <path d="M41 4.5 C41 1.5 43.5 0 47 0 C50.5 0 53 1.5 53 4.5 C53 7.5 50.5 9 47 9 C43.5 9 41 7.5 41 4.5 Z" fill={FUR_FRONT} stroke={rim} strokeWidth="0.8" />
        <path d="M47 15.5 C47 12.5 49.5 11 53 11 C56.5 11 59 12.5 59 15.5 C59 18.5 56.5 20 53 20 C49.5 20 47 18.5 47 15.5 Z" fill={FUR_FRONT} stroke={rim} strokeWidth="0.8" />
      </g>
    </svg>
  );
}
