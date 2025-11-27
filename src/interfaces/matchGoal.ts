import type { GoalResult } from "./goalResult";
import type { OpponentLevel } from "./opponentLevel";

export interface MatchGoal {
  id: string;
  index: number; // 1..N
  opponentLevel: OpponentLevel;
  goalText: string;
  played: boolean;
  result: GoalResult;
}
