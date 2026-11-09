# Session notes

Temporary progress log. Permanent rules live in `CLAUDE.md`.

## Status
- [x] **M0 — Foundation** (2026-11-09): scaffold from the design, static export + next-intl (pt/en), tokens, typed content, Cloudflare config, CI.
- [ ] M1 — Nav + Hero
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
5. Homepage R02 mobile screenshots.

## Decisions taken
- Static export over OpenNext (no runtime needed; OpenNext also pins Next ≥16.4.5).
- Status `live` replaces the design's `Completed` (a product in use is not "completed").
- Tagline stays English in both locales.
