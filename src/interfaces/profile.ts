import type { OpponentLevel } from "./opponentLevel";

export interface Profile {
  ratingRange: string; // e.g. "3-3.5"
  defaultOpponentLevel: OpponentLevel;
}
