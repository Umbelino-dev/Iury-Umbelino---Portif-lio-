import type { ReactNode } from "react";

/**
 * The section's name as its heading: one system for every home section
 * (Sobre, Projetos, Lab, Abordagem, Contato). Satoshi Black at display size,
 * the same voice as the lettered name in the hero, so each section opens with a
 * clear anchor. No numbers, no rules: the name itself is the signpost.
 */
export const sectionTitleClass =
  "font-display text-[clamp(3.25rem,1.5rem+7.4vw,8.75rem)] leading-[0.86] font-black tracking-[-0.05em] text-balance";

export function SectionTitle({
  id,
  children,
  className = "",
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 id={id} className={`${sectionTitleClass} ${className}`}>
      {children}
    </h2>
  );
}
