export type GoalMatchStatus = {
  id: string;
  index: number;
  opponentLevel: string;
  goalText: string;
  played: boolean;
  result: string;
};

export class CreateGoalSessionDto {
  sessionId: string;
  createdAt: number;
  numMatches: number;
  ratingRange: string;
  defaultOpponentLevel: string;
  matches: GoalMatchStatus[];
  allowedUserIds?: string[];
}
