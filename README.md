# Iury Umbelino — Portfolio

Next.js 16 (static export) · TypeScript · Tailwind CSS v4 · GSAP · next-intl (pt / en) · Cloudflare Workers static assets.

```bash
npm install
npm run dev        # http://localhost:3000/pt
npm run check      # typecheck + lint + build (writes ./out)
```

## Deploy (Cloudflare)
The site is fully static: `npm run build` writes `./out`, which `wrangler.jsonc` serves as Workers static assets.

1. `npx wrangler login` (once).
2. `NEXT_PUBLIC_SITE_URL=https://your-domain npm run deploy`.

Alternatively connect the GitHub repo in the Cloudflare dashboard (Workers → Import repository) with build command `npm run build` and deploy command `npx wrangler deploy`.

Conventions, tokens and the cat state machine: see `CLAUDE.md`. Fonts (Space Grotesk, IBM Plex Sans) are self-hosted under the SIL Open Font License 1.1.
