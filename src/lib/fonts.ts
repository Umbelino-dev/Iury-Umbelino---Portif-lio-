import localFont from "next/font/local";

/**
 * Display: Satoshi (variable weight 300–900, Indian Type Foundry, ITF Free Font
 * License). Headings, numerals and display UI. The file is not in git: the
 * license forbids distributing it through a public repository, so
 * scripts/fonts.mjs fetches the official woff2 before every build (npm prebuild).
 * The hero name is NOT set in this font at runtime: it is pre-lettered SVG
 * (scripts/lettering.py → src/components/hero/name-paths.ts).
 */
export const display = localFont({
  src: [{ path: "../fonts/Satoshi-Variable.woff2", weight: "300 900", style: "normal" }],
  variable: "--font-satoshi",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
  fallback: ["system-ui", "sans-serif"],
});

/** Text: IBM Plex Sans — body, UI, metadata. */
export const sans = localFont({
  src: [
    { path: "../fonts/IBMPlexSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/IBMPlexSans-Italic.woff2", weight: "400", style: "italic" },
    { path: "../fonts/IBMPlexSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/IBMPlexSans-SemiBold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-ibm-plex-sans",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
  fallback: ["system-ui", "sans-serif"],
});

/** Editorial voice: Instrument Serif italic — only the statement and pull lines. */
export const serif = localFont({
  src: [{ path: "../fonts/InstrumentSerif-Italic.woff2", weight: "400", style: "italic" }],
  variable: "--font-instrument-serif",
  display: "swap",
  preload: true, // the statement is in the first screen (in flow on phones): avoid a swap shift
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "serif"],
});
