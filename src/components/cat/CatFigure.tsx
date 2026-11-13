/**
 * The cat's geometry — one drawing for every state (CLAUDE.md §The cat).
 * It is Sr. Bigodes, the 3D model in `SR_BIGODES_3D/`, drawn flat from the front,
 * sitting: a wide head on a pear-shaped body, tall ears with a dusty inside, big
 * lime eyes with upright pupils, a small nose and mouth, whiskers. Graphite body
 * and lime eyes in every state; only the pose changes.
 *
 * Parts carry `data-cat` hooks so animation code can target them without
 * knowing the markup. Pivots (SVG user units, viewBox 0 0 100 125):
 * body → (50,125) · head and look → (50,62) neck · eyes → (50,40) · tail → (80,118) ·
 * legs → (33,100) and (67,100) shoulders.
 * The two legs sit behind the body, only the feet showing: they walk, run,
 * stretch and wave. `paws` are hidden by default: they show only while the cat
 * grips the rail; `hold` (paws on a ledge) and `yawn` (the open mouth) are hidden
 * too, until a clip shows them; `eye-l` / `eye-r` let one eye open before the other.
 * `scripts/og.cjs` reads this markup: keep it static SVG.
 */
export function CatFigure({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 125" className={className} aria-hidden="true" focusable="false" data-cat-figure="">
      {/* Tail sweeping out and up on the right: its own group so it can swing. */}
      <g data-cat="tail">
        <path d="M78 117 C 96 118, 103 100, 94 86" fill="none" stroke="#2a2a2a" strokeWidth="6.5" strokeLinecap="round" />
      </g>
      {/* Legs, behind the body: the feet show under it. */}
      <g data-cat="legs">
        <rect data-cat="leg-l" x="27" y="97" width="12" height="28" rx="6" fill="#1b1b1b" stroke="#333333" strokeWidth="1" />
        <rect data-cat="leg-r" x="61" y="97" width="12" height="28" rx="6" fill="#1b1b1b" stroke="#333333" strokeWidth="1" />
      </g>
      {/* Pear-shaped body: narrow shoulders under the head, wide where it sits. */}
      <g data-cat="body">
        <path
          d="M50 55 C 59 55, 65 61, 67 72 C 70 87, 83 92, 83 107 Q 83 118, 73 118 L 27 118 Q 17 118, 17 107 C 17 92, 30 87, 33 72 C 35 61, 41 55, 50 55 Z"
          fill="#1b1b1b"
          stroke="#333333"
          strokeWidth="1"
        />
        <path d="M50 118 L 50 103" fill="none" stroke="#2e2e2e" strokeWidth="1" strokeLinecap="round" />
      </g>
      {/* look / gaze wrap head / eyes so scroll and pointer motion add up instead of fighting. */}
      <g data-cat="look">
      <g data-cat="head">
        <g data-cat="ears">
          <path d="M19 31 L21 2 L46 17 Z" fill="#1f1f1f" stroke="#333333" strokeWidth="1" strokeLinejoin="round" />
          <path d="M81 31 L79 2 L54 17 Z" fill="#1f1f1f" stroke="#333333" strokeWidth="1" strokeLinejoin="round" />
          <path d="M24.5 24 L25 10 L37.5 18.5 Z" fill="#34282c" />
          <path d="M75.5 24 L75 10 L62.5 18.5 Z" fill="#34282c" />
        </g>
        <path
          d="M50 13 C 70 13, 84 23, 84 39 C 84 54, 70 63, 50 63 C 30 63, 16 54, 16 39 C 16 23, 30 13, 50 13 Z"
          fill="#1f1f1f"
          stroke="#333333"
          strokeWidth="1"
        />
        <g fill="none" stroke="#8a8a8a" strokeWidth="0.8" strokeLinecap="round">
          <path d="M29 52 L7 47 M29 54.5 L5 55 M29.5 57 L8 63" />
          <path d="M71 52 L93 47 M71 54.5 L95 55 M70.5 57 L92 63" />
        </g>
        <path d="M47.6 52 L52.4 52 L50 55 Z" fill="#0d0d0d" stroke="#3d3d3d" strokeWidth="0.6" strokeLinejoin="round" />
        <path d="M50 55 L50 56.6 M50 56.6 Q47.6 59.4 45 57.6 M50 56.6 Q52.4 59.4 55 57.6" fill="none" stroke="#3d3d3d" strokeWidth="0.9" strokeLinecap="round" />
        <g data-cat="gaze">
          <g data-cat="eyes">
            <g data-cat="eye-l">
              <ellipse cx="35.5" cy="40" rx="9" ry="11" transform="rotate(-7 35.5 40)" fill="#c8f169" />
              <ellipse cx="37" cy="40" rx="2.7" ry="7.2" fill="#101010" />
              <circle cx="33.4" cy="35.2" r="1.8" fill="#f3f1eb" />
            </g>
            <g data-cat="eye-r">
              <ellipse cx="64.5" cy="40" rx="9" ry="11" transform="rotate(7 64.5 40)" fill="#c8f169" />
              <ellipse cx="63" cy="40" rx="2.7" ry="7.2" fill="#101010" />
              <circle cx="59.4" cy="35.2" r="1.8" fill="#f3f1eb" />
            </g>
          </g>
        </g>
        {/* The open mouth of a yawn: hidden until a clip shows it. */}
        <ellipse data-cat="yawn" cx="50" cy="57.6" rx="3.6" ry="4.4" fill="#5a2630" stroke="#3d3d3d" strokeWidth="0.6" opacity="0" />
        {/* Paws on a ledge, under the chin: shown while it peeks over an edge. */}
        <g data-cat="hold" opacity="0">
          <rect x="24" y="58" width="14" height="9" rx="4.5" fill="#1f1f1f" stroke="#333333" strokeWidth="1" />
          <rect x="62" y="58" width="14" height="9" rx="4.5" fill="#1f1f1f" stroke="#333333" strokeWidth="1" />
        </g>
      </g>
      </g>
      {/* Front paws gripping the rail (one above the other, like climbing a pole). */}
      <g data-cat="paws" opacity="0">
        <rect x="41" y="0" width="12" height="9" rx="4.5" fill="#1f1f1f" stroke="#333333" strokeWidth="1" />
        <rect x="47" y="11" width="12" height="9" rx="4.5" fill="#1f1f1f" stroke="#333333" strokeWidth="1" />
      </g>
    </svg>
  );
}
