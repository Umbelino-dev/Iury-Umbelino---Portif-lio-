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

## Answers from Iury (2026-11-09)
- Giassi, DOX, SQL and PL/SQL may be named publicly → `experience.publishEmployer = true`.
- Contacts stay hidden; Iury will send the real email and LinkedIn.
- Koinonia / Via Hebraica: details and screenshots coming; leave as is.
- Copiloto / Tendências / Zeff / UMB stay (product vision), `confirmed: false`, status only concept or in-development (Tendências moved prototype → concept).
- M1 starts only after Iury sends Homepage R02 screenshots (desktop + mobile). Received so far: desktop Hero and desktop Night→Day transition (start state).

## Still open
- Koinonia: review the first-person copy (chapters 02–03), 2–3 real lessons for "O que aprendi", screenshots for the cover (16:9), Fig. 02 Painel (4:3) and Fig. 03 Radar (3:4). Confirm it is fine to describe the audit findings publicly.
1. Real email + LinkedIn.
2. Koinonia and Via Hebraica: role, stack, screenshots.
3. Portrait photos (real + "cybernetic" alternate, aligned 4:5) — placeholders until then.
4. Final domain → `NEXT_PUBLIC_SITE_URL`.
5. Homepage R02 mobile screenshots (the PDF sent was Case Study Mobile R01 — used for M4 and the cat silhouette).
6. Lab entries: real experiments (title, question, status, year, media) or confirm the placeholders.
7. Project covers (4:3) → `cover` in `src/content/projects.ts`.
8. Portrait photos: drop both 4:5 files in `public/portrait/` and fill `src/content/portrait.ts` (same crop, aligned).

## Decisions taken
- Static export over OpenNext (no runtime needed; OpenNext also pins Next ≥16.4.5).
- Status `live` replaces the design's `Completed` (a product in use is not "completed").
- Tagline stays English in both locales.
- Hero keeps the poetic intro, with an eyebrow showing the current stack (Iury, 2026-11-09).
- The About traits copy (T.01–T.03) is the design's, translated; it states intent, not achievements.
