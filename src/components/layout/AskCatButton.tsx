"use client";

import { CAT_OPEN } from "@/components/cat/states";

/** Opens the cat assistant from anywhere on the page (one cat, many ways in). */
export function AskCatButton({ label, className }: { label: string; className?: string }) {
  return (
    <button type="button" aria-haspopup="dialog" onClick={() => window.dispatchEvent(new Event(CAT_OPEN))} className={className}>
      {label} <span aria-hidden="true">→</span>
    </button>
  );
}
