import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pt", "en"],
  defaultLocale: "pt",
  // Static export has no middleware, so every URL carries its locale.
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
