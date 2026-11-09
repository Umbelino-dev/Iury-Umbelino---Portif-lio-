# Session notes

Temporary progress log. Permanent rules live in `CLAUDE.md`.

## Status
- [x] **M0 — Foundation** (2026-11-09): scaffold from the design, static export + next-intl (pt/en), tokens, typed content, Cloudflare config, CI.
- [x] **M1 — Nav + Hero + cat S1** (2026-11-09): glass nav (desktop pill / mobile menu, theme read from `data-surface`), hero composition from Homepage R02, GSAP opening reveal, `CatObserver` (S1), PT/EN switcher.
  - Validated in Playwright at 390/768/1440: no console errors or failed requests, no horizontal scroll, h1 = "Iury Umbelino", keyboard order and ≥44px targets, mobile menu (Esc + focus return), locale switch, reduced motion and no-JS render the final state, cat turns toward the pointer and ignores text.
  - Deviations from the design: h1 now reads the full name (design hid "Umbelino" from AT); on mobile the cat sits beside "Iury" because "Umbelino" fills the width; dropped the "cat · 3D pending" prototype label.
  - Nav links to #about/#projects/#lab/#contact point to sections that land in M2–M5.
- [ ] M2 — Night→Day transition + About
- [ ] M3 — Projects + Lab + Approach
- [ ] M4 — Case study template (Koinonia first)
- [ ] M5 — Cat assistant, Contact, Footer, SEO, audit, deploy guide

## Answers from Iury (2026-11-09)
- Giassi, DOX, SQL and PL/SQL may be named publicly → `experience.publishEmployer = true`.
- Contacts stay hidden; Iury will send the real email and LinkedIn.
- Koinonia / Via Hebraica: details and screenshots coming; leave as is.
- Copiloto / Tendências / Zeff / UMB stay (product vision), `confirmed: false`, status only concept or in-development (Tendências moved prototype → concept).
- M1 starts only after Iury sends Homepage R02 screenshots (desktop + mobile). Received so far: desktop Hero and desktop Night→Day transition (start state).

## Still open
1. Real email + LinkedIn.
2. Koinonia and Via Hebraica: role, stack, screenshots.
3. Portrait photos (real + "cybernetic" alternate, aligned 4:5) — placeholders until then.
4. Final domain → `NEXT_PUBLIC_SITE_URL`.
5. Homepage R02 mobile screenshots (the PDF sent was Case Study Mobile R01 — used for M4 and the cat silhouette).
6. Hero intro copy comes from the design ("I design and build AI products…"). The audit suggested making the current role visible in the first screen — Iury to decide.

## Decisions taken
- Static export over OpenNext (no runtime needed; OpenNext also pins Next ≥16.4.5).
- Status `live` replaces the design's `Completed` (a product in use is not "completed").
- Tagline stays English in both locales.
