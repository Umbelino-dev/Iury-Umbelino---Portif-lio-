import { gsap } from "@/lib/gsap";

const STAR = "polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)";

/**
 * A puff of small four-point stars around a point of the viewport: the cat's
 * magic on phones, where it does not leap but vanishes from the hero and appears
 * as the corner button (and back). The stars are throwaway nodes in a fixed,
 * inert layer; they take the page's opposite tone (`mix-blend-difference`), so
 * they read on dark and light surfaces. Transform and opacity only; the layer
 * removes itself when the puff ends.
 */
export function sparkle(x: number, y: number, { count = 10, spread = 52 } = {}) {
  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:0;height:0;z-index:75;pointer-events:none;mix-blend-mode:difference`;
  const stars = Array.from({ length: count }, (_, i) => {
    const s = document.createElement("span");
    const size = 8 + (i % 3) * 4;
    s.style.cssText = `position:absolute;left:${-size / 2}px;top:${-size / 2}px;width:${size}px;height:${size}px;background:#f3f1eb;clip-path:${STAR}`;
    layer.appendChild(s);
    return s;
  });
  document.body.appendChild(layer);
  const remove = () => layer.remove();
  const failsafe = window.setTimeout(remove, 1600);
  const angle = (i: number) => (i / count) * Math.PI * 2 + (i % 2 ? 0.35 : -0.2);
  const reach = (i: number) => spread * (0.65 + (i % 3) * 0.22);
  return gsap
    .timeline({
      onComplete: () => {
        window.clearTimeout(failsafe);
        remove();
      },
    })
    .fromTo(
      stars,
      { x: 0, y: 0, scale: 0, rotation: 0, opacity: 1 },
      {
        x: (i) => Math.cos(angle(i)) * reach(i),
        y: (i) => Math.sin(angle(i)) * reach(i) - 6,
        scale: 1,
        rotation: (i) => (i % 2 ? 140 : -140),
        duration: 0.42,
        ease: "power2.out",
        stagger: 0.012,
      },
      0,
    )
    .to(stars, { opacity: 0, scale: 0.2, duration: 0.3, ease: "power1.in", stagger: 0.012 }, 0.3);
}
