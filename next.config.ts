import type { NextConfig } from "next";

/**
 * next-intl wiring without `next-intl/plugin`.
 *
 * For this site the plugin only adds one alias: `next-intl/config` → the request
 * config (no trailingSlash, basePath or experimental features are used). But the
 * plugin module loads `@swc/core` and `@parcel/watcher` at import time for its
 * message extractor, and @swc/core's native loader refuses to start when the
 * cache directory's parents are writable by other users, which is the case in
 * Cloudflare's build image (builds failed with ERR_SWC_NATIVE_CACHE on
 * 2026-11-13). Declaring the alias here does the same job without loading them.
 * If extraction, `trailingSlash` or `basePath` are ever needed, go back to the
 * plugin and solve the SWC cache instead.
 */
const I18N_REQUEST_CONFIG = "./src/i18n/request.ts";

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
  // Turbopack (default): relative alias, as next-intl/plugin sets it.
  turbopack: {
    resolveAlias: { "next-intl/config": I18N_REQUEST_CONFIG },
  },
  // Webpack (`next build --webpack`): absolute alias.
  webpack(config: { context: string; resolve: { alias: Record<string, string> } }) {
    config.resolve.alias["next-intl/config"] = `${config.context}/${I18N_REQUEST_CONFIG.slice(2)}`;
    return config;
  },
};

export default nextConfig;
