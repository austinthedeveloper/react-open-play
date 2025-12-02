import type { OpponentLevel } from "./opponentLevel";

export interface Profile {
  ratingRange: string; // e.g. "3.0 – 3.6"
  defaultOpponentLevel: OpponentLevel;
}
