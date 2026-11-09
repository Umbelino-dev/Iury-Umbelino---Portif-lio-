import Link from "next/link";
import { routing } from "@/i18n/routing";

// Cloudflare answers `/` with a 302 to /pt (public/_redirects) before this file is served.
// This page is the no-JS fallback for any other static host.
const target = `/${routing.defaultLocale}`;

export default function RootPage() {
  return (
    <html lang="pt-BR">
      <head>
        <meta httpEquiv="refresh" content={`0; url=${target}`} />
        <link rel="canonical" href={target} />
        <meta name="robots" content="noindex" />
      </head>
      <body style={{ background: "#101010", color: "#f3f1eb", fontFamily: "system-ui, sans-serif" }}>
        <p>
          <Link href={target}>Iury Umbelino →</Link>
        </p>
      </body>
    </html>
  );
}
