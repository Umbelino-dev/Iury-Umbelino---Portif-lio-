/**
 * The cat's geometry — one drawing for every state (CLAUDE.md §The cat).
 * Graphite body, the same head and ears, lime eyes; only the pose changes.
 * Placeholder geometry until the approved 3D cat exists.
 *
 * Parts carry `data-cat` hooks so animation code can target them without
 * knowing the markup. Pivots (SVG user units, viewBox 0 0 100 125):
 * body → (50,125) · head → (50,62) neck · eyes → (50,40) · tail → (80,118).
 * `paws` are hidden by default: they show only while the cat grips the rail.
 */
export function CatFigure({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 125" className={className} aria-hidden="true" focusable="false">
      {/* Tail curling up the right side: its own group so it can swing. */}
      <g data-cat="tail">
        <path d="M80 118 C 98 116, 100 96, 92 84" fill="none" stroke="#2a2a2a" strokeWidth="7" strokeLinecap="round" />
      </g>
      <g data-cat="body">
        <path
          d="M18 125 L18 86 C18 66 30 56 50 56 C70 56 82 66 82 86 L82 125 Z"
          fill="#1b1b1b"
          stroke="#333333"
          strokeWidth="1"
        />
      </g>
      <g data-cat="head">
        <g data-cat="ears">
          <path d="M22 30 L27 4 L46 18 Z" fill="#1f1f1f" stroke="#333333" strokeWidth="1" strokeLinejoin="round" />
          <path d="M78 30 L73 4 L54 18 Z" fill="#1f1f1f" stroke="#333333" strokeWidth="1" strokeLinejoin="round" />
        </g>
        <rect x="18" y="14" width="64" height="48" rx="20" fill="#1f1f1f" stroke="#333333" strokeWidth="1" />
        <g data-cat="eyes">
          <circle cx="39" cy="40" r="3.8" fill="#c8f169" />
          <circle cx="61" cy="40" r="3.8" fill="#c8f169" />
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
