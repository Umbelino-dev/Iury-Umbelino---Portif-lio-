import { contacts, experience, site, skills } from "@/content/profile";
import type { Locale } from "@/i18n/routing";

/**
 * schema.org Person — only verified facts (CV), and only published contact links
 * in `sameAs`. Rendered once, on the home page.
 */
export function PersonJsonLd({ locale }: { locale: Locale }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: `${site.url}/${locale}`,
    jobTitle: experience.role[locale],
    worksFor: experience.publishEmployer ? { "@type": "Organization", name: experience.employer } : undefined,
    knowsAbout: [...skills.filter((k) => k.daily).slice(0, 3).map((k) => k.name.en), "AI-assisted product development"],
    // No alumniOf: both degrees are still in progress, and alumniOf reads as "graduated".
  };
  const sameAs = contacts.filter((c) => c.publish && c.kind !== "email").map((c) => c.href);
  if (sameAs.length) Object.assign(data, { sameAs });
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output only; "<" escaped so the payload cannot close the tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
