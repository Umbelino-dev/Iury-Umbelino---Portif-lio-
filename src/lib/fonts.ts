import localFont from "next/font/local";

export const display = localFont({
  src: [{ path: "../fonts/SpaceGrotesk-Variable.woff2", weight: "300 700", style: "normal" }],
  variable: "--font-space-grotesk",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "sans-serif"],
});

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
  fallback: ["system-ui", "sans-serif"],
});
