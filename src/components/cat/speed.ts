/**
 * How fast the page is scrolling, and how suddenly it got there.
 *
 * Scroll events arrive unevenly (two can be a couple of milliseconds apart, a
 * single wheel notch can move 100px at once), so speed is read over a window
 * of time, never from one event to the next: `v` is the distance covered in the
 * last `windowMs` (px per ms), `a` is how quickly that speed is rising
 * (px per ms²). A pause longer than `gapMs` starts a new gesture.
 */
export function speedometer(windowMs = 120, gapMs = 250) {
  let samples: { t: number; y: number }[] = [];
  let lastV = 0;
  let lastT = 0;
  return (y: number, t: number) => {
    const prev = samples[samples.length - 1];
    if (prev && t - prev.t > gapMs) {
      samples = [prev.t < t - windowMs ? { t: t - windowMs, y: prev.y } : prev];
      lastV = 0;
    }
    samples.push({ t, y });
    while (samples.length > 2 && t - (samples[0]?.t ?? t) > windowMs) samples.shift();
    const first = samples[0] ?? { t, y };
    const v = Math.abs(y - first.y) / Math.max(windowMs, t - first.t);
    const a = lastT ? Math.max(0, v - lastV) / Math.max(16, t - lastT) : 0;
    lastV = v;
    lastT = t;
    return { v, a };
  };
}
