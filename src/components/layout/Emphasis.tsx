import { Fragment } from "react";

/**
 * Renders `**key term**` marks from content strings as semibold spans, so a list
 * can be scanned by its key terms. Everything else stays plain text.
 */
export function Emphasis({ text }: { text: string }) {
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-ink">
        {part}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
