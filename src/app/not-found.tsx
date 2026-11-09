import { display, sans } from "@/lib/fonts";

// Global 404 (exported as out/404.html). Bilingual because no locale is known here.
export default function NotFound() {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body className="surface-dark min-h-dvh font-sans">
        <main className="page-grid min-h-dvh content-center gap-y-6 py-24">
          <p className="col-span-full font-mono text-label uppercase text-gray-500">Erro 404 · Error 404</p>
          <h1 className="col-span-full font-display text-headline-l font-semibold md:col-span-8">
            Página não encontrada. <span lang="en">Page not found.</span>
          </h1>
          {/* Full-page navigation on purpose: this page owns its own <html>, outside the locale layout. */}
          {/* eslint-disable @next/next/no-html-link-for-pages */}
          <p className="col-span-full flex gap-6 text-ui font-medium">
            <a className="underline underline-offset-4" href="/pt">Voltar ao início →</a>
            <a className="underline underline-offset-4" href="/en" lang="en">Back to home →</a>
          </p>
          {/* eslint-enable @next/next/no-html-link-for-pages */}
        </main>
      </body>
    </html>
  );
}
