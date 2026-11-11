/**
 * The cat's geometry — one drawing for every state (CLAUDE.md §The cat).
 * Drawn after Iury's character sheet (2026-11-11): a black cat with a large
 * head, tall ears with a graphite inner, almond lime eyes with slit pupils,
 * whiskers, a slim seated body and a long tail curled on the floor. Only the
 * pose changes between states; the motion comes from `clips.ts`.
 *
 * The cat is black but lives mostly on dark surfaces, so every shape keeps a
 * faint graphite rim (`RIM`) to read against ink.
 *
 * Parts carry `data-cat` hooks so animation code can target them without
 * knowing the markup. Pivots (SVG user units, viewBox 0 0 100 125):
 * body → (50,125) · head and look → (50,62) neck · eyes → (50,41) ·
 * tail → (72,118) root · legs → (42,80) and (58,80) shoulders.
 * The two front legs stand in front of the chest: they walk, run, stretch and
 * wave. `paws` are hidden by default: they show only while the cat grips the rail.
 */
const FUR = "#141414";
const RIM = "#383838";
const INNER = "#4a4646";
const LIME = "#c8f169";

export const CAT_PIVOTS = {
  body: "50 125",
  head: "50 62",
  eyes: "50 41",
  tail: "72 118",
  legL: "42 80",
  legR: "58 80",
} as const;

export function CatFigure({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 125" className={className} aria-hidden="true" focusable="false" overflow="visible">
      {/* Tail resting on the floor to the right, tip curled up: its own group so it can swing. */}
      <g data-cat="tail">
        <path d="M70 118 C 84 124, 96 121, 96 111 C 96 106, 92 104, 89 106.5" fill="none" stroke={RIM} strokeWidth="7" strokeLinecap="round" />
        <path d="M70 118 C 84 124, 96 121, 96 111 C 96 106, 92 104, 89 106.5" fill="none" stroke={FUR} strokeWidth="5.4" strokeLinecap="round" />
      </g>
      <g data-cat="body">
        <path
          d="M40 58 C 36 66, 31 76, 28 88 C 24 98, 18 106, 19 113 C 20 118, 25 120, 32 120 L68 120 C 75 120, 80 118, 81 113 C 82 106, 76 98, 72 88 C 69 76, 64 66, 60 58 Z"
          fill={FUR}
          stroke={RIM}
          strokeWidth="1"
          strokeLinejoin="round"
        />
        {/* Haunches: one soft contour each. */}
        <path d="M29 100 C 33 105, 35.5 112, 34.5 120 M71 100 C 67 105, 64.5 112, 65.5 120" fill="none" stroke={RIM} strokeWidth="0.8" strokeLinecap="round" />
      </g>
      {/* Front legs, in front of the chest. Fill without a top edge, then the contour. */}
      <g data-cat="legs">
        <g data-cat="leg-l">
          <path d="M38.5 80 C 38 92, 38.5 108, 38 119 C 38 122.5, 40 123.6, 43 123.6 C 46 123.6, 46.6 122, 46 119 C 45.5 108, 45.5 92, 45.5 80 Z" fill={FUR} />
          <path d="M38.5 88 C 38.3 98, 38.4 110, 38 119 C 38 122.5, 40 123.6, 43 123.6 C 46 123.6, 46.6 122, 46 119 C 45.6 110, 45.5 98, 45.5 88 M41.6 121 L41.6 123.4" fill="none" stroke={RIM} strokeWidth="0.8" strokeLinecap="round" />
        </g>
        <g data-cat="leg-r">
          <path d="M61.5 80 C 62 92, 61.5 108, 62 119 C 62 122.5, 60 123.6, 57 123.6 C 54 123.6, 53.4 122, 54 119 C 54.5 108, 54.5 92, 54.5 80 Z" fill={FUR} />
          <path d="M61.5 88 C 61.7 98, 61.6 110, 62 119 C 62 122.5, 60 123.6, 57 123.6 C 54 123.6, 53.4 122, 54 119 C 54.4 110, 54.5 98, 54.5 88 M58.4 121 L58.4 123.4" fill="none" stroke={RIM} strokeWidth="0.8" strokeLinecap="round" />
        </g>
      </g>
      {/* look / gaze wrap head / eyes so scroll and pointer motion add up instead of fighting. */}
      <g data-cat="look">
        <g data-cat="head">
          <g data-cat="ears">
            <path d="M20 38 C 19 24, 21 11, 25 2 C 33 8, 40 14, 45 22 Z" fill={FUR} stroke={RIM} strokeWidth="1" strokeLinejoin="round" />
            <path d="M24.5 31 C 24.5 22, 25.5 14, 27.5 8.5 C 32 12, 36 16, 39.5 21 Z" fill={INNER} />
            <path d="M80 38 C 81 24, 79 11, 75 2 C 67 8, 60 14, 55 22 Z" fill={FUR} stroke={RIM} strokeWidth="1" strokeLinejoin="round" />
            <path d="M75.5 31 C 75.5 22, 74.5 14, 72.5 8.5 C 68 12, 64 16, 60.5 21 Z" fill={INNER} />
          </g>
          <path
            d="M50 18 C 64 18, 76 24, 80 36 C 83 44, 84 50, 79 55 C 72 61, 60 63, 50 63 C 40 63, 28 61, 21 55 C 16 50, 17 44, 20 36 C 24 24, 36 18, 50 18 Z"
            fill={FUR}
            stroke={RIM}
            strokeWidth="1"
          />
          {/* Whiskers: hairlines at any size. */}
          <g stroke="#8a8a8a" strokeWidth="0.75" vectorEffect="non-scaling-stroke" strokeLinecap="round" opacity="0.75" fill="none">
            <path d="M25 50 L3 46.5 M25 52.5 L4 54 M26 55 L8 61" vectorEffect="non-scaling-stroke" />
            <path d="M75 50 L97 46.5 M75 52.5 L96 54 M74 55 L92 61" vectorEffect="non-scaling-stroke" />
          </g>
          <path d="M47.8 50.6 L52.2 50.6 L50 53.2 Z" fill={INNER} strokeLinejoin="round" />
          <g data-cat="gaze">
            <g data-cat="eyes">
              <ellipse cx="37" cy="41" rx="7" ry="7.8" fill={LIME} transform="rotate(-10 37 41)" />
              <ellipse cx="63" cy="41" rx="7" ry="7.8" fill={LIME} transform="rotate(10 63 41)" />
              <ellipse cx="37.6" cy="41.4" rx="1.7" ry="5.6" fill="#101010" />
              <ellipse cx="62.4" cy="41.4" rx="1.7" ry="5.6" fill="#101010" />
              <circle cx="35" cy="37.8" r="1.2" fill="#ffffff" opacity="0.85" />
              <circle cx="60.8" cy="37.8" r="1.2" fill="#ffffff" opacity="0.85" />
            </g>
          </g>
        </g>
      </g>
      {/* Front paws gripping the rail (one above the other, like climbing a pole). */}
      <g data-cat="paws" opacity="0">
        <path d="M41 6 C 41 2, 44 0, 47 0 C 50 0, 53 2, 53 6 C 53 8.5, 51 9.5, 47 9.5 C 43 9.5, 41 8.5, 41 6 Z" fill={FUR} stroke={RIM} strokeWidth="1" />
        <path d="M47 17 C 47 13, 50 11, 53 11 C 56 11, 59 13, 59 17 C 59 19.5, 57 20.5, 53 20.5 C 49 20.5, 47 19.5, 47 17 Z" fill={FUR} stroke={RIM} strokeWidth="1" />
      </g>
    </svg>
  );
}
