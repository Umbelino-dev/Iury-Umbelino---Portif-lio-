# Iury Umbelino — Portfolio

Personal portfolio. Tagline: **"Curiosity builds what comes next."** (brand line, English in every locale, `lang="en"`).
Edited like an independent one-author magazine: each section opens with a typographic thesis, shows real evidence, closes with a question.

- **Design source of truth:** Claude Design project "Iury Umbelino — Direção Criativa R01" (https://claude.ai/artifact/8pT6pxPLwinMeP1UBA8UnM). Pages: *Direção Criativa R01* (tokens, type, rules), *Homepage R02* (sections, copy, interactions), *Case Study R01* + *Mobile R01*, *Cat Journey R03* (cat state machine; supersedes *Cat States R02*). When the design and this file disagree on a token, Direção Criativa R01 wins.
- **Content sources of truth:** Iury's CV and the portfolio audit (Claude Docs). Typed in `src/content/`.
- Progress and open questions live in `NOTES.md`, not here.

## Hard rule — no fabrication
Never invent achievements, metrics, test results, clients, testimonials, dates, roles or contact details. The design's copy is mostly placeholder. A fact without a source stays `undefined` and the UI omits it; data copied from the design carries `confirmed: false`. Never present unshipped work as shipped.

## Stack
- Next.js 16 App Router, React 19, TypeScript strict (`noUncheckedIndexedAccess`), `src/`, `@/*` alias.
- **Static export** (`output: "export"`) → Cloudflare Workers static assets (`wrangler.jsonc`, `./out`). No middleware, route handlers that need a runtime, server actions, ISR or image optimisation. `/` → `/pt` via `public/_redirects` (+ meta-refresh fallback in `src/app/page.tsx`).
- Tailwind CSS v4, CSS-first: all tokens in `src/app/globals.css` `@theme`. No `tailwind.config`.
- GSAP + ScrollTrigger + `@gsap/react` only (no second motion library). Import from `@/lib/gsap`, never from `gsap` directly.
- next-intl 4: locales `pt` (default) and `en`, `localePrefix: "always"`. Every page/layout under `[locale]` calls `hasLocale` + `setRequestLocale` and exports `generateStaticParams`. UI strings in `messages/{pt,en}.json` (pt is the type source); facts in `src/content/*` with `Localized<T>` fields.
- Fonts self-hosted via `next/font/local` (`src/fonts/*.woff2`): Space Grotesk (variable 300–700) + IBM Plex Sans 400/400i/500/600.

## Design tokens (Tailwind names)
| Token | Hex | Use |
|---|---|---|
| `ink` | #101010 | dark background, text on light |
| `ink-800` | #1B1B1B | dark surface, assistant |
| `gray-500` | #929292 | secondary text **on dark only** |
| `gray-600` | #5E5C57 | secondary text on light (5.8:1) |
| `paper-300` | #D9D7D0 | rules on light |
| `paper` | #F3F1EB | light background, text on dark |
| `paper-0` | #FFFFFF | image frames, raised panel |
| `signal` | #C8F169 | accent — max 2 uses per viewport; on light only as a highlighter behind ink, never as text (1.1:1) |

Type scale (`text-*`, fluid 375→1440): `display-xxl` 208→64, `display-xl` 120→48, `headline-l` 64→36, `headline-m` 40→28, `title` 24→20, `numeral` 96→56 (Grotesk); `lead` 22→19, `body` 17→16 /1.62 max 68ch, `ui` 15, `caption` 13, `label` 12 uppercase +0.1em (Plex). Grotesk never below 14px. On dark, titles under 40px go one weight up. Display breaks are hand-set per breakpoint; `text-wrap: balance` is the safety net.

Layout: `page-grid` utility = 12 cols (gutter 24, margin up to 56, max 1440) / 4 cols mobile (gutter 16, margin 20). Asymmetric: text 7 cols, air 5 — never centred by default. Spacing base 8; sections 160 desktop / 96 mobile. Radius 0, 1px rules, no shadows, no decorative gradients, no rounded cards. Pill + glass only for floating controls (nav, assistant). Project status is encoded by shape (StatusMark), not colour.

Accent on light: use the `highlight` utility (sized gradient that stays inside tight display leading), never `bg-signal` on inline text.

Surfaces: Hero dark → Night→Day transition → About light → Projects light → Lab dark → Approach light → Contact dark. Case study: light editorial. Mark light sections `data-surface="light"` (switches focus ring to ink). The nav hit-tests the line 44px from the top, so clipped layers report correctly; `data-nav-as` on a layer overrides the active item; dispatch `SURFACE_EVENT` (`components/layout/surface.ts`) when a surface changes without scrolling.

## Components
- Server Components by default. `"use client"` only for interaction, browser APIs or animation (Nav theme, DayNightTransition, PortraitReveal, ProjectIndex floating image, CatAssistant).
- Folders: `components/layout` (primitives), `components/sections` (home), `components/case-study`, `components/media`, `components/cat`. Extract a component for real reuse or a clear responsibility, not per element.
- Project and Lab markup are generated from `src/content/projects.ts` and `src/content/lab.ts`; never hand-duplicate their copy. Real media goes in `cover` / `media` (`MediaImage`); without it the UI draws the editorial placeholder.
- Case studies: `/[locale]/projects/[slug]`, generated only for projects whose `caseStudy.confirmed` is true (`getCaseStudies()` in `src/content/projects.ts`; `dynamicParams = false`). Chapters without body/steps/figures are not rendered — never fill one with invented copy (e.g. "What I learned" stays out until Iury writes it). On mobile, text blocks keep `max-md:pr-12`: the right 48px are the cat lane; figures run full bleed under it.
- Never link to a destination that does not exist (no dead "#" links, no "read the study" without a study).
- Fixed/sticky overlays that span the width (the nav strip) must be `pointer-events: none`, with only their controls re-enabled.

## Motion
- Durations: fast 160 (hover/focus), base 320 (states/panels), slow 640 (entrances/reveal). One easing: `--ease-out-soft` `cubic-bezier(0.2,0.7,0.1,1)`.
- Animate only transform, opacity, clip-path, mask. Never layout properties.
- Use `useGSAP` (scoped context, auto-revert) and `gsap.matchMedia()` with `MQ` from `@/lib/gsap`. Kill ScrollTriggers, listeners and observers on unmount.
- Content is present in the server HTML. Entrance start states live in CSS under `.js` (class added by an inline script in `[locale]/layout.tsx`) inside `prefers-reduced-motion: no-preference`, with a 3s CSS failsafe; GSAP then animates with `fromTo` (zero any `y` GSAP would parse from the CSS) and no `clearProps`.
- `prefers-reduced-motion`: no jumps, lerps or breathing; instant swaps or hard cuts (Night→Day cuts at 50%). The global reset uses `transition: none` — never a tiny duration (it makes computed styles lag a frame).
- Scroll stages: the element with the tall height must be the sticky element's direct parent.
- Effects always use a block body: `useEffect(() => { … })`. Never return an expression — e.g. `scrollIntoView()` now returns a Promise in Chromium, which React then tries to call as the cleanup and crashes.
- No always-on rAF loops: loops start on interaction and stop on idle or `visibilitychange`. Custom cursor is optional sugar for `(pointer: fine)` only.

## The cat
One character. `CatFigure` (SVG, `data-cat` parts) is the only drawing; `CatObserver` is S1 (a button: it opens the assistant); `CatAssistant` owns S2–S5 with the typed FSM in `src/components/cat/states.ts` — transitions only via `send(event)`. Any other "ask the cat" control dispatches `CAT_OPEN`. Answers are scripted in `messages/*.json → assistant` and must only use verified facts; free text matches chip keywords or gets the honest "I'm a scripted prototype" fallback. **Desktop deviation from R03:** S3 "cling" is the docked cat bottom-right (the dock R03 uses on mobile), not a 30px rail, so it never overlaps copy. Panel open/close timelines live outside the per-state `gsap.context` (`panelTl`) so a state change cannot kill them mid-way. States: S1 observer (hero slot, head ±10°/eyes ±3px toward pointer, no reaction over text) → S2 jump (420ms arc, hero 60% out of view) → S3 cling (30px right rail, follows the 40% reading line, lerp 0.12) → S4 sleep (4s idle, curls bottom-right: **the curled cat is the closed assistant button**, 56px, `aria-label`) → S5 awaken (panel 360×520 max grows from the cat via clip-path; `role="dialog"`, Esc closes, focus in/out). Mobile: no rail — a bottom-right dock and a bottom sheet. Never opens by itself, never covers copy or nav. Same geometry, graphite body, lime eyes in every state.

## Accessibility & performance gates
Semantic landmarks, one h1 per page, ordered headings; visible focus; hit targets ≥44px; text contrast ≥4.5:1; works with keyboard, touch and reduced motion; no hover-only content (on `(hover: none)` project images sit above titles). Image width/height always set; LCP image prioritised; no layout shift from fonts. Never report Lighthouse/CWV numbers that were not measured.

## Commands
- `npm run typecheck` (runs `next typegen` first) · `npm run lint` · `npm run build` (writes `./out`) · `npm run check` (all three).
- `npm run preview` serves `./out` (note: `serve` does not apply `_redirects`).
- `npm run deploy` = build + `wrangler deploy` (needs Cloudflare auth — Iury's step). Full deploy guide in `README.md`; `NEXT_PUBLIC_SITE_URL` must be set **at build time** (canonical, hreflang, OG, sitemap, JSON-LD).
- SEO: per-page metadata (canonical + hreflang + OG/Twitter with `public/og-image.png`), `src/app/sitemap.ts` and `robots.ts` (`dynamic = "force-static"`), `src/app/icon.svg`, `PersonJsonLd` (verified facts only). `public/_headers` sets security + cache headers.
- Cloud sessions: no integrated preview. Validate by serving `out/` and driving Playwright (pre-installed Chromium) at 390/768/1440 with and without reduced motion.
