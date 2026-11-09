/** Cat / assistant state machine — see CLAUDE.md §4 and Cat Journey R03 storyboard. */

export type CatState = "observer" | "jump" | "cling" | "sleep" | "awaken";

export type CatEvent =
  | { type: "HERO_LEFT" }        // hero ≥60% out of view
  | { type: "HERO_ENTERED" }     // hero back in view → reverse jump
  | { type: "LANDED" }           // jump timeline complete
  | { type: "IDLE" }             // 4s without scroll / pointer
  | { type: "ACTIVITY" }         // scroll resumed
  | { type: "OPEN" }             // click cat or rail icon
  | { type: "CLOSE" };           // ×, Escape

export const IDLE_MS = 4000;

const table: Record<CatState, Partial<Record<CatEvent["type"], CatState>>> = {
  observer: { HERO_LEFT: "jump", OPEN: "awaken" },
  jump:     { LANDED: "cling", HERO_ENTERED: "observer" },
  cling:    { IDLE: "sleep", OPEN: "awaken", HERO_ENTERED: "observer" },
  sleep:    { ACTIVITY: "cling", OPEN: "awaken", HERO_ENTERED: "observer" },
  awaken:   { CLOSE: "sleep" },
};

export function transition(state: CatState, event: CatEvent): CatState {
  return table[state][event.type] ?? state;
}
