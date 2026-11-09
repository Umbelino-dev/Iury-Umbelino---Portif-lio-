import { getMessages } from "next-intl/server";
import type { AssistantScript, AssistantUI } from "./CatAssistant";

/**
 * Builds the assistant's scripted copy on the server (messages/*.json → assistant.*),
 * so the client bundle carries only the strings for the current page and locale.
 */
export async function assistantProps(kind: "home" | "case", slug?: string) {
  const { assistant } = (await getMessages()) as unknown as {
    assistant: { ui: Record<string, string>; home: AssistantScript; cases: Record<string, AssistantScript> };
  };
  const ui = assistant.ui;
  const script: AssistantScript = (kind === "case" && slug && assistant.cases[slug]) || assistant.home;
  const assistantUI: AssistantUI = {
    title: ui.title ?? "",
    subtitle: (kind === "case" ? ui.subtitleCase : ui.subtitle) ?? "",
    open: (kind === "case" ? ui.openCase : ui.open) ?? "",
    hint: ui.hint ?? "",
    close: ui.close ?? "",
    handle: ui.handle ?? "",
    placeholder: (kind === "case" ? ui.placeholderCase : ui.placeholder) ?? "",
    send: ui.send ?? "",
    thinking: ui.thinking ?? "",
    you: ui.you ?? "",
    cat: ui.cat ?? "",
    log: ui.log ?? "",
  };
  return { script, ui: assistantUI };
}
