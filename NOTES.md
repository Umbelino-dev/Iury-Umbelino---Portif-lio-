# Session notes

Temporary progress log. Permanent rules live in `CLAUDE.md`.

## Status
- [x] **M0 — Foundation** (2026-11-09): scaffold from the design, static export + next-intl (pt/en), tokens, typed content, Cloudflare config, CI.
- [ ] M1 — Nav + Hero
- [ ] M2 — Night→Day transition + About
- [ ] M3 — Projects + Lab + Approach
- [ ] M4 — Case study template (Koinonia first)
- [ ] M5 — Cat assistant, Contact, Footer, SEO, audit, deploy guide

## Open content questions (block M2–M5, not M1)
1. May the site name Giassi and describe the DOX / SQL / PL-SQL work? (`experience.publishEmployer`)
2. Which contacts go public? (`contacts[].publish` — email, LinkedIn, GitHub from the CV)
3. Koinonia: exact role (front, database, auth?), stack (audit saw Supabase), screenshots.
4. Via Hebraica: tools used and Iury's part.
5. Copiloto / Tendências / Zeff / UMB: confirm status, year and a one-line summary — or drop them.
6. Portrait photos (real + "cybernetic" alternate, aligned 4:5) — placeholders until then.
7. Final domain → `NEXT_PUBLIC_SITE_URL`.
8. Screenshots of the design pages (Homepage R02 desktop + mobile) for visual comparison: running the design's own JS was blocked in this environment, so it was read statically.

## Decisions taken
- Static export over OpenNext (no runtime needed; OpenNext also pins Next ≥16.4.5).
- Status `live` replaces the design's `Completed` (a product in use is not "completed").
- Tagline stays English in both locales.
