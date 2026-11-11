/**
 * Shared geometry for the cat rigs (Cat character, phase 1).
 *
 * Limbs are tapered capsules built from their joints, so a rig is described by
 * joint positions (and pivots are exactly those joints). The tail is a chain of
 * segments whose relative angles are animated; `tailPath` turns the chain into a
 * smooth path every frame it moves.
 */

/** The character sheet's palette (Iury, 2026-11-11). */
export const CAT = {
  fur: "#1A1A1A",
  /** Far-side limbs and inner contours: a step darker, so the silhouette reads in depth. */
  shade: "#111111",
  /** Inner ear and nose. */
  inner: "#4A4646",
  eye: "#C8F169",
  pupil: "#0B0B0B",
  whisker: "#7A7A7A",
} as const;

const f = (n: number) => Math.round(n * 100) / 100;

/** A tapered capsule from (x1,y1) radius r1 to (x2,y2) radius r2. */
export function capsule(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const a1 = [x1 + nx * r1, y1 + ny * r1];
  const a2 = [x2 + nx * r2, y2 + ny * r2];
  const b2 = [x2 - nx * r2, y2 - ny * r2];
  const b1 = [x1 - nx * r1, y1 - ny * r1];
  return `M${f(a1[0]!)} ${f(a1[1]!)} L${f(a2[0]!)} ${f(a2[1]!)} A${r2} ${r2} 0 0 0 ${f(b2[0]!)} ${f(b2[1]!)} L${f(b1[0]!)} ${f(b1[1]!)} A${r1} ${r1} 0 0 0 ${f(a1[0]!)} ${f(a1[1]!)} Z`;
}

export interface Chain {
  x: number;
  y: number;
  /** Segment lengths, root to tip. */
  lengths: readonly number[];
}

/** Joint points of a chain: `angles` are relative degrees (the first one is absolute; 0 = +x, -90 = up). */
export function chainPoints(chain: Chain, angles: readonly number[]) {
  const pts: [number, number][] = [[chain.x, chain.y]];
  let a = 0;
  let x = chain.x;
  let y = chain.y;
  chain.lengths.forEach((l, i) => {
    a += angles[i] ?? 0;
    const r = (a * Math.PI) / 180;
    x += Math.cos(r) * l;
    y += Math.sin(r) * l;
    pts.push([x, y]);
  });
  return pts;
}

/** A smooth open path through the chain's joints (Catmull-Rom → cubic Bézier). */
export function tailPath(chain: Chain, angles: readonly number[]) {
  const p = chainPoints(chain, angles);
  let d = `M${f(p[0]![0])} ${f(p[0]![1])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i]!;
    const p1 = p[i]!;
    const p2 = p[i + 1]!;
    const p3 = p[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}
