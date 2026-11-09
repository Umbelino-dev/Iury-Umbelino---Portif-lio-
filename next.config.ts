import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Fully static site: deployed as Cloudflare Workers static assets (see wrangler.jsonc).
  output: "export",
  reactStrictMode: true,
  poweredByHeader: false,
  // No image optimisation server in a static export: images are pre-sized at build time.
  images: { unoptimized: true },
};

export default withNextIntl(nextConfig);
