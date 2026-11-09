import localFont from "next/font/local";

/**
 * Display: Bricolage Grotesque (variable weight 200–800, latin). Headings and UI display.
 * The hero name is NOT set in this font at runtime: it is pre-lettered SVG
 * (scripts/lettering.py → src/components/hero/NameMark.tsx), so only the weight
 * axis ships here (41 KB) — width/optical-size are used at lettering time only.
 */
export const display = localFont({
  src: [{ path: "../fonts/BricolageGrotesque-Variable.woff2", weight: "200 800", style: "normal" }],
  variable: "--font-bricolage",
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
  preload: false,
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "serif"],
});
