import { descender, glyphs, viewBox } from "./name-paths";

/**
 * "Iury / Umbelino" lettered in Bricolage Grotesque (scripts/lettering.py).
 * The y's hooked tail drops into the stem of the b: the question flows into "build".
 * Pure SVG, so nothing can clip a descender; the h1 carries the readable name.
 *
 * Hooks for motion: [data-glyph] per letter (data-line 1|2) and [data-join] for the
 * joining stem, which draws downward (transform-origin: top).
 */
export function NameMark({ className, joinClassName }: { className?: string; joinClassName?: string }) {
  return (
    <svg
      viewBox={viewBox}
      className={className}
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
      overflow="visible"
      data-namemark
    >
      {glyphs.map((g) => (
        <path key={g.id} d={g.d} data-glyph={g.id} data-line={g.line} />
      ))}
      <rect
        data-join
        x={descender.x}
        y={descender.y}
        width={descender.width}
        height={descender.height}
        className={joinClassName}
        style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}
      />
    </svg>
  );
}
