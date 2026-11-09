import { getTranslations } from "next-intl/server";
import { contacts, site } from "@/content/profile";
import { AskCatButton } from "@/components/layout/AskCatButton";
import { Footer } from "@/components/layout/Footer";

/**
 * 07 · Contact — dark, mirroring the hero: the tagline returns at full scale and the
 * page ends on the thought it started with (Homepage R02 · N16). One primary action,
 * and contact rows that say exactly where they go.
 *
 * Only contacts with `publish: true` render. Until Iury confirms them, the section
 * says so and the cat is the primary action — never a placeholder address.
 */
export async function Contact() {
  const t = await getTranslations("contact");
  const published = contacts.filter((c) => c.publish);
  const email = published.find((c) => c.kind === "email");

  return (
    <section
      id="contact"
      data-nav-id="contact"
      data-surface="dark"
      aria-labelledby="contact-title"
      className="relative isolate overflow-hidden bg-ink pt-[clamp(7rem,10vw,11.25rem)] pb-8 text-paper"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -top-30 left-[10%] -z-10 h-[520px] w-[70%] bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(243,241,235,0.07),transparent_72%)]" />
      <div className="mx-auto flex max-w-(--container-page) flex-col gap-[clamp(3.5rem,6vw,7rem)] px-(--page-margin)">
        <div className="flex flex-wrap justify-between gap-4 text-label font-medium tracking-label text-gray-500 uppercase">
          <p>{t("label")}</p>
          <p>{t("open")}</p>
        </div>

        <h2 id="contact-title" lang="en" className="font-display text-[clamp(3.25rem,0.9rem+10vw,11.875rem)] leading-[0.88] font-bold tracking-[-0.045em] text-balance">
          {site.tagline.lead} {site.tagline.accent.replace(" next.", "")} <span className="text-signal">next.</span>
        </h2>

        <div className="flex flex-wrap items-end justify-between gap-x-[clamp(2rem,5vw,6rem)] gap-y-14">
          <div className="flex max-w-[560px] flex-[1_1_340px] flex-col gap-7">
            <p className="max-w-[36ch] text-[clamp(1.0625rem,1rem+0.4vw,1.25rem)] leading-normal text-pretty text-paper-300">
              {email ? t("lead") : t("pending")}
            </p>
            {email ? (
              <a
                href={email.href}
                className="flex min-h-14 items-center gap-3.5 self-start bg-paper px-6 py-4 font-display text-[clamp(1.0625rem,1rem+0.4vw,1.25rem)] font-semibold tracking-[-0.01em] text-ink transition-colors duration-(--duration-fast) hover:bg-signal"
              >
                {t("cta")} <span aria-hidden="true">→</span>
              </a>
            ) : (
              <AskCatButton
                label={t("askCat")}
                className="flex min-h-14 items-center gap-3.5 self-start bg-paper px-6 py-4 font-display text-[clamp(1.0625rem,1rem+0.4vw,1.25rem)] font-semibold tracking-[-0.01em] text-ink transition-colors duration-(--duration-fast) hover:bg-signal"
              />
            )}
          </div>

          {published.length > 0 && (
            <nav aria-label={t("links")} className="flex max-w-[560px] flex-[1_1_360px] flex-col border-b border-[#2a2a2a]">
              {published.map((c) => (
                <a
                  key={c.kind}
                  href={c.href}
                  target={c.kind === "email" ? undefined : "_blank"}
                  rel={c.kind === "email" ? undefined : "noopener noreferrer"}
                  // Mobile: label above the value, so a full email address fits on one line.
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 border-t border-[#2a2a2a] py-4.5 transition-colors duration-(--duration-fast) hover:text-signal md:grid-cols-[5.5rem_minmax(0,1fr)_auto]"
                >
                  <span className="col-span-2 font-mono text-[11px] tracking-[0.04em] text-gray-500 uppercase md:col-span-1">{t(`kinds.${c.kind}`)}</span>
                  <span className="font-display text-[clamp(1.125rem,1rem+0.5vw,1.5rem)] font-medium tracking-[-0.01em] [overflow-wrap:anywhere]">{c.label}</span>
                  <span aria-hidden="true" className="text-lg">↗</span>
                </a>
              ))}
            </nav>
          )}
        </div>

        <Footer topHref="#hero" />
      </div>
    </section>
  );
}
