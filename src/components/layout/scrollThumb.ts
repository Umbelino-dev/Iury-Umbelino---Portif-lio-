/**
 * The site's scrollbar thumb, as geometry (viewport px). Shared by the custom
 * scrollbar (`ScrollBar`) and the cat, which clings to the thumb: one formula,
 * so the cat's paws are always where the thumb is drawn.
 */
export const BAR = {
  /** Hit strip at the right edge of the window. */
  width: 14,
  /** The thumb's centre line, from the right edge. */
  inset: 7,
  /** Gap at the top and bottom of the track. */
  pad: 6,
  /** Shortest thumb. */
  min: 48,
} as const;

export function scrollThumb() {
  const vh = window.innerHeight;
  const vw = document.documentElement.clientWidth || window.innerWidth;
  const doc = Math.max(document.documentElement.scrollHeight, vh);
  const track = vh - BAR.pad * 2;
  const h = Math.min(track, Math.max(BAR.min, (track * vh) / doc));
  const max = doc - vh;
  const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  const top = BAR.pad + p * (track - h);
  return { x: vw - BAR.inset, top, h, y: top + h / 2, scrollable: max > 1 };
}
