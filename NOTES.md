# Session notes

Temporary progress log. Permanent rules live in `CLAUDE.md`.

## Status
- [x] **M0 — Foundation** (2026-11-09): scaffold from the design, static export + next-intl (pt/en), tokens, typed content, Cloudflare config, CI.
- [x] **M1 — Nav + Hero + cat S1** (2026-11-09): glass nav (desktop pill / mobile menu, theme read from `data-surface`), hero composition from Homepage R02, GSAP opening reveal, `CatObserver` (S1), PT/EN switcher.
  - Validated in Playwright at 390/768/1440: no console errors or failed requests, no horizontal scroll, h1 = "Iury Umbelino", keyboard order and ≥44px targets, mobile menu (Esc + focus return), locale switch, reduced motion and no-JS render the final state, cat turns toward the pointer and ignores text.
  - Deviations from the design: h1 now reads the full name (design hid "Umbelino" from AT); on mobile the cat sits beside "Iury" because "Umbelino" fills the width; dropped the "cat · 3D pending" prototype label.
  - Nav links to #about/#projects/#lab/#contact point to sections that land in M2–M5.
- [x] **M2 — Night→Day + About + Experience** (2026-11-09): sticky scroll stage with clip-path scrub (hard cut at 50% with reduced motion), `Portrait` placeholder slot, `PortraitReveal` radial mask (mouse / press-and-hold / 44px toggle), traits T.01–T.03, experience block from the CV, hero eyebrow with the current stack.
  - Validated in Playwright at 360/390/768/1440, PT + EN: no console errors, no horizontal scroll, both portrait frames at the same y on every width, nav theme and active item follow the visible layer (motion and reduced motion), mask 150px on hover / full frame on hold and toggle, no-JS stacks both layers.
  - Bugs found and fixed: sticky stage scrolled away (260vh was on the wrong parent); the global reduced-motion reset turned every style change into a one-frame transition (now `transition: none`); the highlighter overlapped the previous line (now a sized gradient, `highlight` utility).
- [x] **M3 — Projects + Lab + Approach** (2026-11-09): editorial project index from `projects.ts` with the floating 4:3 preview (lerp 0.14, tilt ≤ 4°, edge flip, 200ms crossfade, keyboard anchoring, images above titles on touch), `StatusMark` (status by shape), Lab with the controlled broken grid (CSS 3D cube, pointer crosshair, sound score — all placeholders), Approach with stepped columns.
  - Validated in Playwright (1440 desktop, iPhone 13, Pixel 7, reduced motion): preview shows/crossfades/settles/stops, other rows fade to 25%, flips left near the edge, keyboard focus anchors right; touch shows all 6 images inline and no float; Lab crosshair + cube follow the pointer; nav theme/active right on every section (none on Approach); no overflow, no console errors. M1/M2 regressions re-run clean.
  - Bug found and fixed: the full-width nav strip captured the pointer, blocking hover/clicks on content scrolling under its empty area (present since M1).
  - Only Koinonia and Via Hebraica link out (real sites, new tab); other rows stay plain until their case studies exist (M4).
  - Lab: E.02/E.03 shown as concepts with no year (the design claimed "Prototype 2026" / "Archived 2025"); "Read the study" links removed — no studies exist. The cat's perch on E.01 waits for the single CatAssistant (M5).
  - The floating preview uses a 1px hairline instead of the prototype's drop shadow ("no shadows" rule).
- [x] **M4 — Case study template + Koinonia** (2026-11-09): typed `CaseStudy` (chapters with body / ruled steps / figures, `MediaSlot` placeholders), route `/[locale]/projects/[slug]` (only confirmed cases), `CaseHero`, sticky-numeral `Chapter`, `MediaFrame`, `NextProject`, reading-progress hairline, `Nav variant="case"`; index row now opens the case study.
  - Koinonia copy is sourced from the private repo `Umbelino-dev/koinonia.app` @7aba644 (README, docs/PRODUTO.md, docs/AUDITORIA.md, docs/historico, git log: 2026-08-16 → 2026-10-05, 521 commits) plus Iury's role statement. Chapters: problem · how it was built (5 moves) · what curation found (the Sep 2026 audit) · the product. "What I learned" omitted until Iury writes it.
  - Via Hebraica: `caseStudy.confirmed: false` → no page (404); its index row still opens viahebraica.app.
  - Validated (1440/768/360/iPhone 13, PT/EN, reduced motion, no-JS): one h1, ordered headings, canonical + hreflang, sticky numeral at 96px on desktop only, mobile text ends 48px from the edge, full-bleed figures, progress 0→1, locale switch keeps the route, back pill → #projects, no overflow, no console errors. M1–M3 regressions clean.
  - Fixed: the nav wrapped onto two lines on phones (now one line down to 320px, "← Projetos" below 640px).
- [x] **M5 — Cat assistant, Contact, Footer, SEO, deploy guide** (2026-11-09):
  - `CatAssistant`: S1 observer (hero cat is now a button) → S2 arc jump to the dock → S3 docked, eyes follow reading progress → S4 sleep after 4s (eyes shut, body settles, z z z) → S5 panel. Desktop: dark glass panel 360×520 grown with a clip-path circle from the cat, which rides up and perches on its top edge. Mobile: bottom sheet (70% / 590px max), scrim, drag handle (>30% or flick closes), visualViewport for the keyboard. `role="dialog"` + `aria-modal`, focus to title on open, Tab trapped, Esc / × / scrim close, focus back to the cat, page `inert` + scroll lock. Reduced motion: 160ms crossfades. Case pages start docked (44px button, project chips).
  - Scripted answers rewritten from verified facts (the prototype's "creative director / four products" copy was not true). Free text → keyword match or honest fallback.
  - Contact: tagline at full scale, "next." in lime. No contact is published yet → the section says so and "Ask the cat" is the primary action; flipping `publish: true` in `profile.ts` brings back the email button + rows. Footer on home and case pages.
  - SEO: OG/Twitter (og-image.png 1200×630 rendered from the project's fonts), sitemap with hreflang, robots, icon.svg (the cat), Person JSON-LD (no alumniOf — degrees in progress), `_headers`. README: Cloudflare deploy guide, checked against Cloudflare's docs via Context7 (developers.cloudflare.com is blocked in this environment).
  - Validated (1440 desktop, iPhone 13, case page, reduced motion): every state transition, open from dock / hero cat / contact, chips + keyword + fallback, focus trap, Esc, drag-to-close, scrim tap, "see projects" scroll, close-at-hero returns to S1; M1–M4 regressions clean; no console errors. SEO URLs verified with `NEXT_PUBLIC_SITE_URL=https://example.com`.
  - Bugs found and fixed: an effect returning `scrollIntoView()` (a Promise in current Chromium) crashed the page on the first chip; a keypress waking the cat mid-close killed the close animation (panel stuck open, focus lost).
  - Not done: Lighthouse / Core Web Vitals not measured (no Lighthouse in this environment). Real-device testing pending.

- [x] **Final polish** (2026-11-09): real portraits (aligned + cropped together, reveal verified), Koinonia cover + Fig. 02 Mapa do sistema + Fig. 03 Marca (native 1200:630, captions describe only what is shown; the Radar slot was dropped — no real screenshot), "O que aprendi" in Iury's words (EN translated), contacts published (email, LinkedIn, GitHub) + assistant contact chip, image pipeline with WebP variants and a custom next/image loader, dock no longer covers the reveal toggle, contact rows stack on mobile.
  - Lighthouse 13.6 via `wrangler dev` (lab): see README table — home mobile went from 89 (LCP 3.7 s: the intro faded in after hydration) to 99–100 (LCP 1.1 s) by keeping the intro visible from first paint; everything else 100.
  - `wrangler dev` confirmed `/` → 302 `/pt`, security headers, immutable cache on `/_next/static`, 404 page.

- [x] **Redesign R2: creative direction, lettering, copy, cat rail, cursor** (2026-11-09). Report: https://claude.ai/artifact/MChe7Lo1MARkqMD9Hg9bnA (audit, 10 references with verified/not-verified flags, 3 directions, the 3 hero mocks, measurements).
  - Direction "Publication" with kinetic accents in three places only (name entrance, cat, cursor). Fonts: Bricolage Grotesque (display) + IBM Plex Sans (body) + Instrument Serif italic (statement). Space Grotesk removed.
  - Hero: the name is an SVG lettering (`scripts/lettering.py` → `src/components/hero/name-paths.ts`) with the y's tail running into the b's stem. Long intro replaced by one positioning line. Statement and cat placed in the mark's coordinates. No descender can clip (checked at 320/390/768/1280/1440/1920). Mobile: name first, hero sized to content.
  - Night→Day screen removed (components, CSS, `transition.*` messages). Hero CTA → #about.
  - Copy rewritten PT + EN: 0 em-dashes in UI copy (`npm run copy:check`). Iury's lesson kept verbatim. "Leio todas as mensagens" removed (unverifiable promise).
  - Cat: tail group + paws in `CatFigure`; `SectionRail` + rail cling from 1440px with a fine pointer (anticipation, stretch, squash, tail whip; rides the page and climbs back to the 40% line; slides down to sleep). Below 1440 the dock stays (the margin is narrower than the 44px cat). Deviation from the plan: the plan said ≥1280.
  - Cursor (`components/layout/Cursor.tsx`): dot + lagged ring, link / label / text / hidden / press states; labels "ver projeto", "visitar site", "ver a máquina", "pergunte"; native cursor on form fields; not mounted on touch.
  - Section titles rise word by word (`data-split`, SplitText, no masks; skipped above the fold, with a highlight, and with reduced motion). OG image regenerated with the lettering (built from a scratch HTML page, not a repo script).
  - Validated: `npm run check`; Playwright regressions M3–M6 + hero (reduced motion, no-JS, EN) + rail + cursor (states, text selection, touch) with no console errors.
  - Lighthouse 13.6 (wrangler dev): desktop 99–100; mobile /pt 96/99/98 over 3 runs, /en 98, case 96 (TBT 140–230 ms, up from 80–110). A11y / BP / SEO 100, CLS 0 everywhere. Next: defer cursor + SplitText to idle to win TBT back.

- [x] **Hero refinement** (2026-11-09):
  - Ligature rebuilt: Bricolage's y is a u-shape whose right stem (x 294–438) hooks left to x 10; the old join hung a rectangle from the hook's end, hence the sharp bend and the off-axis stem. Now the hook is replaced by the right stem continuing straight down (depth −216), drawn at the b stem's exact width (145) on the same axis, and y ∪ b is one outline (skia-pathops union). Line 2 shift went from −257 to +26.5 units. Checked at 3× zoom: no step, gap or double edge. Trade-off: without the hook the y reads more like a u with a long stem; the ligature is what makes it a y.
  - Follow-up (Iury: the straight y looked like a u): the u-bowl is gone. The y's left arm now curves down into the straight stem (outer edge meets it at −40, inner at 120, a V-shaped counter), so it reads as a y; the stem still runs straight into the b.
  - Mobile hero: own composition below 768px (name → statement left-aligned with the cat at the row's end → stack line, intro, link). Centered statement tested and rejected (fights the left-aligned name and intro). Checked at 360/375/390/414/430: no overflow, no overlaps, statement 2 lines at 24.6–26.3px.
  - Cat in the hero: scrubbed ScrollTrigger (start top, end 60%, scrub 0.6): eyes, head and body turn toward the name, settle, then crouch before the jump. Reduced motion: static.
  - Instrument Serif is now preloaded (the in-flow statement caused CLS 0.001 on mobile from the font swap; now 0).
  - Lighthouse (wrangler dev): /pt mobile 93/95/97 over 3 runs (TBT 180–300 ms), desktop 99; /en mobile 97, desktop 99; case mobile 97. A11y/BP/SEO 100, CLS 0.

- [x] **R3: Satoshi, dot cursor, cat state machine, bilingual tagline, section markers** (2026-11-10):
  - Type: Satoshi (Iury's choice over Instrument Serif / General Sans). Licence: ITF FFL forbids distributing the files through a public repo, so they are fetched at build time by `scripts/fonts.mjs` (never committed). Bricolage removed.
  - Lettering: Satoshi 900; the y's V is cut where it is as wide as the b stem (bisection, y = 2.23, stem 154 units) and runs straight into the b as one outline; glyph overlaps unioned (fixed a hairline sliver in the e).
  - Cursor: ring removed; one dot (8 → 18px on links), label pill beside it, I-beam on text.
  - Cat: front legs added to CatFigure (feet under the body); `clips.ts`; hero scrub walk/run; jump/fall/grab; rail release fall; new `waking` state; Contact greeting; tap mid-leap opens on landing. Tested in Playwright (1440, 1280, reduced motion, iPhone): every state in order, scroll-back mid-jump, open while waking, no console errors or warnings.
  - Tagline per locale (PT "A curiosidade constrói o que vem a seguir."); meta and share images per locale (`scripts/og.cjs`).
  - Section markers (`SectionMarker`) on About, Projects, Lab, Approach, Contact; nav items carry the same numbers (bright when active).
  - Lighthouse 13.6 (wrangler dev): /pt mobile 93/96/97 (TBT 200–310 ms), desktop 99; /en mobile 96, desktop 99; case mobile 99, desktop 100. A11y/BP/SEO 100, CLS 0.
  - Open: Lab entry numerals (01–03) sit right after the chapter numeral 03; consider smaller entry numerals if it reads as noise.

- [x] **R4: Iury's review of R3** (2026-11-10):
  - Hero: statement in Satoshi 500 (Iury's choice), name first and the positioning line under it on desktop too; edition/topics line and the "(00) Índice · Rolar" rule removed; footer edition removed.
  - Cursor: no I-beam over text. Nav: numbers removed, the active dot is back.
  - Sections: numbers, "01 / 05" and rules removed; the section name is the h2 at display size (`SectionTitle`) on About, Projects, Lab, Approach, Contact; theses became display paragraphs.
  - About: traits side by side; the portrait reveal (human × machine) is replaced by `PhotoLoop`, an endless strip (scroll speed and direction drive it, cards lean with velocity, hover pauses, reduced motion = manual scroll). For now it shows the two existing photos; Iury will send event photos (LinkedIn photos can't be fetched from here: login wall).
  - Experience: "(01.1)" label and top rules removed; the path is an animated `Timeline`.
  - Fixed: SplitText put aria-label on paragraphs (a11y 96 → 100 with `aria: "none"` on non-headings); locale switch name now includes "EN".
  - Lighthouse (wrangler dev): /pt mobile 94/95/95 (TBT 250–290 ms), desktop 99; /en 96 / 99; case mobile 99. A11y/BP/SEO 100, CLS 0.
  - Open: more photos for the carousel; the greeting hint at Contact briefly overlaps copy next to the rail (2.6 s).

- [x] **R5: coverflow carousel + interactive timeline** (2026-11-10):
  - Carousel (Iury's pick "grows at the centre"; the Envato reference could not be opened: network-blocked): scale 1 → 0.72, opacity 1 → 0.55, rotateY ±14° by distance to the screen centre. Fixed: `quickSetter("scale")` is a no-op shorthand; use scaleX/scaleY.
  - Timeline: horizontal/vertical, hover details, click panel, keyboard and Esc. **Texts to review (Iury asked me to write them; only known facts used, `confirmed: false`):** summaries and "more" for Jovem Aprendiz, Operador de Caixas, Auxiliar Administrativo; durations are computed from the periods.
  - A11y fixes: no half-faded captions (contrast); step buttons keep their visible text as their name.
  - Lighthouse: /pt mobile 95/91/96 (TBT 240–370 ms), desktop 99; /en 96 / 99; case 99. A11y/BP/SEO 100, CLS 0.

- [x] **R6: project stage, career axis, graphic system** (2026-11-11):
  - Projects: the editorial list + floating preview became `ProjectStage` (horizontal strip, frames of different proportions, front project named at display size, drag / arrows / ruler ticks / keys, native scroll-snap underneath). `ProjectList.tsx` removed. The Envato reference could not be opened again (host blocked in this environment), so the composition follows the brief's words, not the reference.
  - Timeline: drawn to scale on a month ruler (the 4-month gap and the quick succession of roles are visible), texts climbing in columns with elbow connectors, hover lights a role's whole path, panel under the axis with org / area / duration / CV highlights / daily stack (current role only, from the CV).
  - System: `Ruler` primitive, `text-index` and `bleed-inset` utilities; 22 hand-written mono label classes replaced by `text-index`. Rules in CLAUDE.md §Graphic system.
  - Validated in Playwright: 1440 / 768 / iPhone 13, PT + EN, reduced motion; buttons, ticks, keys, drag, click-behind, touch swipe; timeline hover, click, Esc; no horizontal overflow, no console errors; case study regression clean. `npm run check` passes. Lighthouse not re-measured.
  - Open: drag throw tuned by eye (factor 110); real covers for P.02–P.06 will change the strip's rhythm (placeholders cycle 3:4 / 1:1 / 4:3).

- [x] **R7: no markers** (2026-11-11, Iury: remove T.01/E.02 codes, rules, lines and squares; keep the fonts; real design, not generic devices):
  - Removed across home + case study: index codes (T./E./P./S./A.), numbered labels and big chapter/step/lab numerals, every content rule and divider, the `Ruler`, square markers (StatusMark, nav dots), hero blueprint grid, Lab column grid, crop marks, spec bars, crosshair + coordinates, monospace.
  - New voice: Instrument Serif italic (`text-note`) for dates, status, captions and field names. Copy without codes or middle-dot strings (hero stack line, Lab notes; "640ms" dropped: unsourced).
  - Projects: typographic posters for missing covers; the names are the index. Timeline: staircase of type, roles grow toward today. Approach: verbs step down, no numerals. Lab: hand-drawn pointer stroke.
  - Validated (Playwright 1440/1024/768/390/iPhone 13, PT+EN, reduced motion): stage navigation, timeline hover/click/Esc, no overflow, no console errors; `npm run check` and copy check pass.

- [x] **R8: Iury's review of R7** (2026-11-11):
  - Annotations: Instrument Serif italic → Satoshi Medium, muted (Iury: the curved face did not work).
  - Projects: back to the editorial list with the floating image (`ProjectList`), without codes or rules; `ProjectStage` removed.
  - Hero: name centred both ways, intro on the same left edge; "Iury" and "Umbelino" flush left (lettering.py splits the 190-unit gap: line 1 tracking +23.9, line 2 −51.9). OG images not regenerated yet.
  - About: traits as whole words in stepped full-width rows. PhotoLoop restyled after Iury's reference video (fanned glossy cards, progressive frosted base, rim light, step-by-step dealing).
  - Timeline: one line drawn left → right on scroll with a lime tip; roles light up as it passes. Vertical on small screens.
  - Validated (Playwright 1780/1440/390, iPhone 13, reduced motion): hero alignment measured (I and U at the same x), no console errors.

- [x] **R9** (2026-11-11): traits side by side, smaller, whole words sized to the column. Photos: PhotoLoop (≈20 cards × 3 backdrop-filter layers, recomputed every frame) replaced by `PhotoDeck`, a 4-card deck that tweens only on change; frosted base from a pre-blurred image copy. Measured in headless Chromium: 250 frames in 4.2 s during a deal, none over 34 ms. Open: Iury to send 3–4 photos (only the two portraits exist, so the deck repeats them).

- [x] **R10** (2026-11-11): About reordered: thesis line removed; summary + "O que faço" first, then tools/learning/education, the photo deck, the traits, the path. PhotoDeck: hover lift, a box rising from the pointer, click opens a dialog with story + LinkedIn embed + link. Open: Iury to send the LinkedIn photos and, per photo, summary, story, post URL and embed URL (`src/content/gallery.ts`).

- [x] **R11** (2026-11-12): deck photos from Iury's LinkedIn (Startup Weekend team, Startup Weekend solo, CRIO Conecta selfie) + the portrait; summaries and the posts' text (verbatim from Iury's screenshots, EN translated) in `gallery.ts`. Open: the three lnkd.in links (dDd-BCfN, dqdj2qYm, dQYGyAR3) could not be resolved from the cloud session (LinkedIn is blocked), so which link is which post is unknown; `linkedin.url`/`embed` stay empty until Iury says. Third parties appear in two photos (posted publicly by Iury).

- [x] **R12** (2026-11-12): photo panel with a fixed, centred photo; post copies replaced by "O que agregou" (from Iury's posts, to review; the academic side is not in the posts, waiting for Iury); LinkedIn links mapped (CRIO last day dDd-BCfN, second day dQYGyAR3, Startup Weekend dqdj2qYm; portrait → profile). Dot cursor kept inside dialogs (top-layer popovers). Career line finishes while in view.

- [x] **R13: performance** (2026-11-13). Measured with a 4× CPU throttle + devtools trace. Panel open/close: frames over 50 ms 33 → 4, raster 345 → 19 ms (backdrop blur removed, no deck re-deal behind the panel, panel on its own layer while it moves, memoised cards). Scroll raster 588 → ~250 ms (build-time pre-blurred card bases instead of CSS blur; smaller card shadows; hover lift on its own layer). Live after deploy (4× throttle): panel open/close frames over 50 ms 34 → 1. Cloudflare builds broke the same day (ERR_SWC_NATIVE_CACHE from next-intl/plugin loading @swc/core); fixed by setting the alias in next.config.ts without the plugin. Remaining: `showModal` itself (~16 ms real) and the radial glows (~30 ms raster, kept: part of the look).

## Answers from Iury (2026-11-09)
- Giassi, DOX, SQL and PL/SQL may be named publicly → `experience.publishEmployer = true`.
- Contacts stay hidden; Iury will send the real email and LinkedIn.
- Koinonia / Via Hebraica: details and screenshots coming; leave as is.
- Copiloto / Tendências / Zeff / UMB stay (product vision), `confirmed: false`, status only concept or in-development (Tendências moved prototype → concept).
- M1 starts only after Iury sends Homepage R02 screenshots (desktop + mobile). Received so far: desktop Hero and desktop Night→Day transition (start state).

## Still open
- Deploy (Iury): Cloudflare account, connect the repo, set `NEXT_PUBLIC_SITE_URL` (build variable), custom domain — steps in README.
- Optional later: a real screenshot of the Care Radar (Fig. 04), Via Hebraica case study, real Lab experiments, field CWV after deploy, test on physical phones.

## Decisions taken
- Static export over OpenNext (no runtime needed; OpenNext also pins Next ≥16.4.5).
- Status `live` replaces the design's `Completed` (a product in use is not "completed").
- Tagline stays English in both locales.
- Hero keeps the poetic intro, with an eyebrow showing the current stack (Iury, 2026-11-09).
- The About traits copy (T.01–T.03) is the design's, translated; it states intent, not achievements.
