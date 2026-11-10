import { getTranslations } from "next-intl/server";

/**
 * Footer row: copyright and back to top. Right padding keeps
 * the last link clear of the docked cat.
 */
export async function Footer({ topHref, tone = "dark" }: { topHref: string; tone?: "dark" | "light" }) {
  const t = await getTranslations("footer");
  return (
    <footer
      className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t pt-2 pr-22 text-label font-medium tracking-label uppercase ${
        tone === "dark" ? "border-[#2a2a2a] text-gray-500" : "border-paper-300 text-gray-600"
      }`}
    >
      <span>{t("rights")}</span>
      <a
        href={topHref}
        className={`flex min-h-11 items-center transition-colors duration-(--duration-fast) ${tone === "dark" ? "text-paper hover:text-signal" : "text-ink"}`}
      >
        {t("top")} <span aria-hidden="true">&nbsp;↑</span>
      </a>
    </footer>
  );
}
