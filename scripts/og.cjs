/* eslint-disable @typescript-eslint/no-require-imports -- a plain Node (CommonJS) dev script */
// Renders the share images, one per locale: public/og-image-{pt,en}.png (1200×630).
// Dev-only. Uses Playwright's Chromium (pre-installed in cloud sessions; locally:
// `npx playwright install chromium`). Run after `scripts/lettering.py` or a copy change:
//   node scripts/og.cjs
// Inputs: the lettered name (src/components/hero/name-paths.ts), the tagline in
// messages/*.json, the cat drawing (CatFigure) and the self-hosted Satoshi
// (run `node scripts/fonts.mjs` first on a fresh clone).
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

// name-paths.ts → plain object (it only holds `export const x = <json> as const;`).
const mark = {};
new Function("exports", read("src/components/hero/name-paths.ts").replace(/export const (\w+)[^=]*=/g, "exports.$1 =").replace(/ as const/g, ""))(mark);

// CatFigure's SVG markup, from its TSX (static drawing, JSX attributes → SVG).
const cat = read("src/components/cat/CatFigure.tsx")
  .match(/<svg[\s\S]*?<\/svg>/)[0]
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
  .replace(/ className=\{className\}| aria-hidden="true"| focusable="false"| data-cat-figure=""/g, "")
  .replace(/strokeWidth/g, "stroke-width")
  .replace(/strokeLinecap/g, "stroke-linecap")
  .replace(/strokeLinejoin/g, "stroke-linejoin")
  .replace(/data-cat="[^"]*"/g, "")
  .replace("<svg", '<svg class="cat"');

// Fonts inlined as data URIs, so the page needs no file or network access.
const font = (p) => `url(data:font/woff2;base64,${fs.readFileSync(path.join(ROOT, p)).toString("base64")}) format('woff2')`;
const paths = mark.glyphs.map((g) => `<path d="${g.d}"/>`).join("") + `<path d="${mark.ligature.d}"/>`;
const a = mark.anchors;

const page = (m) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Satoshi;src:${font("src/fonts/Satoshi-Variable.woff2")};font-weight:300 900}
@font-face{font-family:Plex;src:${font("src/fonts/IBMPlexSans-Medium.woff2")};font-weight:500}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#101010;color:#F3F1EB;font-family:Plex;position:relative;overflow:hidden}
.glow{position:absolute;inset:0;background:radial-gradient(ellipse 55% 60% at 68% 52%,rgba(243,241,235,.075),transparent 75%)}
.top,.rule{position:absolute;left:56px;right:56px;display:flex;justify-content:space-between;font-size:15px;letter-spacing:.1em;text-transform:uppercase;color:#929292}
.top{top:44px}.rule{bottom:44px;border-top:1px solid #2a2a2a;padding-top:14px}
.mark{position:absolute;left:70px;top:50%;transform:translateY(-50%);width:1060px;container-type:inline-size}
.mark svg.name{display:block;width:100%;height:auto;fill:#F3F1EB;overflow:visible}
.tag{position:absolute;top:${a.xHeight1}%;left:${a.line1Right + 5}%;max-width:${100 - a.line1Right - 7}%;font-family:Satoshi;font-weight:500;font-size:3.5cqw;line-height:1.08;letter-spacing:-.025em}
.tag b{color:#C8F169;font-weight:500}
.cat{position:absolute;bottom:${100 - a.oTop}%;left:${a.oCenter}%;width:6.5cqw;transform:translateX(-50%);overflow:visible}
</style></head><body>
<div class="glow"></div>
<div class="mark"><svg class="name" viewBox="${mark.viewBox}">${paths}</svg>
<p class="tag">${m.hero.tagline.lead}<br>${m.hero.tagline.rest} <b>${m.hero.tagline.accent}</b></p>${cat}</div>
</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const tab = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const locale of ["pt", "en"]) {
    const m = JSON.parse(read(`messages/${locale}.json`));
    await tab.setContent(page(m), { waitUntil: "load" });
    await tab.evaluate(() => document.fonts.ready);
    const out = path.join(ROOT, `public/og-image-${locale}.png`);
    await tab.screenshot({ path: out });
    console.log("og:", path.relative(ROOT, out));
  }
  await browser.close();
})();
