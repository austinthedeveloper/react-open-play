import type { OpponentLevel } from "./opponentLevel";
import type { GoalType } from "./goalType";

export interface GoalEntity {
  id: string;
  type: GoalType;
  goalText: string;
  opponentLevel?: OpponentLevel | null;
  createdAt: number;
  updatedAt: number;
  createdById?: string | null;
  createdByName?: string | null;
  createdByPhotoUrl?: string | null;
  updatedById?: string | null;
  updatedByName?: string | null;
  updatedByPhotoUrl?: string | null;
}
