import type { ReactNode } from "react";

/**
 * The section's name as its heading: one system for every home section
 * (Perfil, Projetos, Contato, and Trajetória / Abordagem inside them). Since
 * Iury, 2026-11-13: the smaller editorial size first used by "Trajetória"
 * (Satoshi Bold at headline-m), not the old display-size titles. On dark,
 * titles under 40px go one weight up (CLAUDE.md), hence `dark`.
 */
export const sectionTitleClass = "font-display text-headline-m font-bold tracking-[-0.02em] text-balance";

export function SectionTitle({
  id,
  children,
  className = "",
  dark = false,
  as: Tag = "h2",
}: {
  id: string;
  children: ReactNode;
  className?: string;
  dark?: boolean;
  as?: "h2" | "h3";
}) {
  return (
    <Tag id={id} className={`${sectionTitleClass} ${dark ? "!font-black" : ""} ${className}`}>
      {children}
    </Tag>
  );
}
