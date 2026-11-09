/**
 * Cat / assistant state machine — Cat Journey R03. One cat, one place at a time.
 *
 *  observer ─HERO_LEFT→ jump ─LANDED→ cling ─IDLE→ sleep
 *     ▲                               ▲  │           │
 *     └──────── HERO_ENTERED ─────────┘  └─ACTIVITY──┘
 *  observer | cling | sleep ─OPEN→ awaken ─CLOSE→ sleep
 *
 * "cling" has two places (CatAssistant): the R03 rail from 1440px with a fine pointer
 * (home only), where the right page margin can hold the cat; otherwise the docked,
 * awake cat in the bottom-right corner (the dock R03 uses on mobile).
 */

export type CatState = "observer" | "jump" | "cling" | "sleep" | "awaken";

export type CatEvent =
  | { type: "HERO_LEFT" } // hero ≥60% out of view
  | { type: "HERO_ENTERED" } // hero back in view → reverse jump
  | { type: "LANDED" } // jump timeline complete
  | { type: "IDLE" } // 4s without scroll / input
  | { type: "ACTIVITY" } // scroll resumed
  | { type: "OPEN" } // click / tap the cat (any of its places)
  | { type: "CLOSE" }; // ×, Escape, scrim, drag down

export const IDLE_MS = 4000;

const table: Record<CatState, Partial<Record<CatEvent["type"], CatState>>> = {
  observer: { HERO_LEFT: "jump", OPEN: "awaken" },
  jump: { LANDED: "cling", HERO_ENTERED: "observer" },
  cling: { IDLE: "sleep", OPEN: "awaken", HERO_ENTERED: "observer" },
  sleep: { ACTIVITY: "cling", OPEN: "awaken", HERO_ENTERED: "observer" },
  awaken: { CLOSE: "sleep" },
};

export function transition(state: CatState, event: CatEvent): CatState {
  return table[state][event.type] ?? state;
}

/** Window event any "ask the cat" control dispatches (hero cat, contact button). */
export const CAT_OPEN = "cat:open";
