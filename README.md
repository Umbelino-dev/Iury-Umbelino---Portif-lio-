# Iury Umbelino — Portfolio

Next.js 16 (static export) · TypeScript · Tailwind CSS v4 · GSAP · next-intl (pt / en) · Cloudflare Workers static assets.

```bash
npm install
npm run dev        # http://localhost:3000/pt
npm run check      # typecheck + lint + build (writes ./out)
```

Conventions, tokens, the cat state machine and the content rules live in `CLAUDE.md`. Progress and open questions live in `NOTES.md`.

---

## Deploying to Cloudflare

The site is **fully static**. `npm run build` writes plain HTML, CSS, JS and images to `./out`. Cloudflare serves that folder as **Workers static assets**. There is no Worker script and no server runtime, and no adapter (such as OpenNext) is needed.

What is already configured in the repo:

| File | What it does |
| --- | --- |
| `wrangler.jsonc` | Worker name `iury-umbelino-portfolio`; serves `./out`. Uses `html_handling: "auto-trailing-slash"` so `/pt` serves `pt.html`, and `not_found_handling: "404-page"` so unknown URLs get `404.html` with a 404 status. |
| `public/_redirects` | `/ → /pt` (302): Portuguese is the default language. |
| `public/_headers` | Security headers on every response, plus a one-year immutable cache for hashed files in `/_next/static/*`. |
| `src/app/sitemap.ts`, `src/app/robots.ts` | Generated at build time as `/sitemap.xml` and `/robots.txt`. |

### Set the site URL first

Canonical links, `hreflang`, Open Graph, the sitemap and the structured data all need the public address. It is read **at build time** from:

```
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

No trailing slash. Without it, the build falls back to `http://localhost:3000`, and link previews on LinkedIn or WhatsApp will point to the wrong place.

### Option A: from GitHub, automatically (recommended)

Every push to the production branch builds and deploys.

1. In the Cloudflare dashboard, open **Workers & Pages → Create → Import a repository**, and connect GitHub to `Umbelino-dev/Iury-Umbelino---Portif-lio-`.
2. Build settings:
   - **Git branch:** `main` (or whichever branch you publish from)
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy` (the default)
   - **Root directory:** leave empty
3. Under **Build variables and secrets**, add `NEXT_PUBLIC_SITE_URL`. It has to be a *build* variable. Runtime variables (Settings → Variables & Secrets) do not exist for a static site and would not reach the build.
4. Save and deploy. The first deploy gives you a `*.workers.dev` URL.

Workers Builds uses the Wrangler version in `package.json`.

### Option B: from your computer, one-off

```bash
npx wrangler login
```

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com npm run deploy
```

`npm run deploy` runs `npm run build` and then `wrangler deploy`.

### Custom domain

In the Worker: **Settings → Domains & Routes → Add → Custom domain**, and enter the domain. The domain has to be on Cloudflare DNS. Then set `NEXT_PUBLIC_SITE_URL` to that domain and redeploy.

### Checking a deploy

- `/` redirects to `/pt`, and `/en` shows the English edition.
- `/pt/projects/koinonia` loads. Any unknown URL shows the bilingual 404.
- `/sitemap.xml` lists both languages with absolute URLs on your domain.
- Paste the URL into LinkedIn's Post Inspector or a WhatsApp chat: the preview shows `og-image.png`.

---

## Content

- Facts live in `src/content/` (`profile.ts`, `projects.ts`, `lab.ts`, `portrait.ts`). UI strings live in `messages/{pt,en}.json`.
- Nothing is invented. A fact without a source stays `undefined` and the UI hides it. Items copied from the design prototype carry `confirmed: false`.
- **Contacts:** set `publish: true` on an entry in `contacts` (`src/content/profile.ts`). The Contact section switches from "coming soon" to the email button and links on its own.
- **Images:** add files under `public/` and fill `src` / `width` / `height` in the matching content entry (`portrait`, `cover`, `media`). Until then, the editorial placeholders render.
- **The cat's answers** are scripted (`messages/*.json → assistant`). No language model is involved. A real one would need its own Worker, because this site has no server.

Fonts (Space Grotesk, IBM Plex Sans) are self-hosted under the SIL Open Font License 1.1.
