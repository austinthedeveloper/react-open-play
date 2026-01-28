import type { CreateGoalSessionDto } from "./create-goal-session.dto";

export class UpdateGoalSessionDto implements Partial<CreateGoalSessionDto> {
  sessionId?: string;
  createdAt?: number;
  numMatches?: number;
  ratingRange?: string;
  defaultOpponentLevel?: string;
  matches?: CreateGoalSessionDto["matches"];
  allowedUserIds?: CreateGoalSessionDto["allowedUserIds"];
}
