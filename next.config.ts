import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Fully static site: deployed as Cloudflare Workers static assets (see wrangler.jsonc).
  output: "export",
  reactStrictMode: true,
  poweredByHeader: false,
  // No image optimisation server in a static export: `npm run images` pre-builds WebP
  // variants at these widths and the custom loader points srcset at them.
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    deviceSizes: [640, 960, 1280, 1920],
    imageSizes: [],
  },
};

export default withNextIntl(nextConfig);
