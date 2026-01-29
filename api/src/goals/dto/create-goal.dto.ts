export type GoalType = "global" | "user";

export class CreateGoalDto {
  goalId?: string;
  goalText: string;
  opponentLevel?: string | null;
  type?: GoalType;
  createdAt?: number;
  updatedAt?: number;
  createdById?: string | null;
  createdByName?: string | null;
  createdByPhotoUrl?: string | null;
  updatedById?: string | null;
  updatedByName?: string | null;
  updatedByPhotoUrl?: string | null;
}
