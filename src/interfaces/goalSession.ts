import type { MatchGoal } from "./matchGoal";
import type { OpponentLevel } from "./opponentLevel";

export type GoalSession = {
  id: string;
  createdAt: number;
  numMatches: number;
  ratingRange: string;
  defaultOpponentLevel: OpponentLevel;
  matches: MatchGoal[];
  ownerId?: string | null;
  allowedUserIds?: string[];
};
