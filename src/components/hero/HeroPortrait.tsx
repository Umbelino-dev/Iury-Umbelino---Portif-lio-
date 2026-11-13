import Image from "next/image";
import type { ReactNode } from "react";
import { contacts, type ContactLink } from "@/content/profile";
import { portrait } from "@/content/portrait";
import type { Locale } from "@/i18n/routing";

/**
 * Hero portrait card + social links (bottom-right of the first screen).
 *
 * - Photo: `portrait.base` in src/content/portrait.ts (swap the file there, not here).
 * - Links: every `contacts` entry with `publish: true`, except email (the hero already
 *   has "Fale comigo"). To add Instagram, fill its entry in src/content/profile.ts.
 *
 * At rest the photo is black and white; on hover it takes its colour back and gets a
 * thin signal rim. The card links to the Profile section, but stays out of the tab
 * order: "Conheça a pessoa" is the same destination for keyboard users.
 */
const ICONS: Partial<Record<ContactLink["kind"], ReactNode>> = {
  // Lucide-style outline glyphs, inlined (no icon dependency for three marks).
  github: (
    <>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </>
  ),
  linkedin: (
    <>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </>
  ),
  instagram: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
};

const social = contacts.filter((c) => c.publish && c.href && ICONS[c.kind]);

export function HeroPortrait({ locale, profileLabel, className = "" }: { locale: Locale; profileLabel: string; className?: string }) {
  const img = portrait.base;
  if (!img.src) return null;
  return (
    <a
      href="#about"
      tabIndex={-1}
      aria-label={profileLabel}
      className={`group/portrait relative block aspect-[4/5] flex-none overflow-hidden rounded-[1rem] bg-ink-800 ring-1 ring-paper/10 transition-[box-shadow,translate] duration-(--duration-base) ease-out hover:-translate-y-1 hover:ring-signal motion-reduce:hover:translate-y-0 ${className}`}
    >
      <Image
        src={img.src}
        alt={img.alt[locale]}
        width={img.width}
        height={img.height}
        sizes="12rem"
        loading="eager"
        className="h-full w-full object-cover object-[50%_18%] contrast-110 grayscale transition-[filter] duration-(--duration-slow) ease-out group-hover/portrait:grayscale-0"
      />
    </a>
  );
}

export function HeroSocial({ label, newTab, className = "" }: { label: string; newTab: string; className?: string }) {
  if (social.length === 0) return null;
  return (
    <nav aria-label={label} className={className}>
      <ul className="flex gap-1">
        {social.map((c) => (
          <li key={c.kind}>
            <a
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${c.kind === "github" ? "GitHub" : c.kind === "linkedin" ? "LinkedIn" : "Instagram"} (${newTab})`}
              className="flex size-11 items-center justify-center text-paper opacity-60 transition-[opacity,color] duration-(--duration-fast) hover:text-signal hover:opacity-100 focus-visible:opacity-100"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {ICONS[c.kind]}
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
