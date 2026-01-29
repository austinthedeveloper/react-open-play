import type { GoalEntity, GoalType, OpponentLevel } from "../interfaces";
import { authService } from "./authService";

export type GoalEntityApi = {
  goalId: string;
  type: GoalType | string;
  goalText: string;
  opponentLevel?: OpponentLevel | string | null;
  createdAt: number;
  updatedAt: number;
  createdById?: string | null;
  createdByName?: string | null;
  createdByPhotoUrl?: string | null;
  updatedById?: string | null;
  updatedByName?: string | null;
  updatedByPhotoUrl?: string | null;
};

export type CreateUserGoalInput = {
  goalId?: string;
  goalText: string;
  opponentLevel?: OpponentLevel | null;
};

export type UpdateUserGoalInput = {
  goalText?: string;
  opponentLevel?: OpponentLevel | null;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

const requireApiBaseUrl = () => {
  if (!apiBaseUrl) {
    throw new Error("Missing VITE_API_BASE_URL");
  }
  return apiBaseUrl;
};

const request = async <T>(path: string, options: RequestInit = {}) => {
  const baseUrl = requireApiBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authService.getAuthHeaders(),
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || response.statusText);
  }

  return text ? (JSON.parse(text) as T) : (null as T);
};

const fromApiGoal = (goal: GoalEntityApi): GoalEntity => ({
  id: goal.goalId,
  type: goal.type as GoalType,
  goalText: goal.goalText,
  opponentLevel: (goal.opponentLevel as OpponentLevel | null | undefined) ?? null,
  createdAt: goal.createdAt,
  updatedAt: goal.updatedAt,
  createdById: goal.createdById ?? null,
  createdByName: goal.createdByName ?? null,
  createdByPhotoUrl: goal.createdByPhotoUrl ?? null,
  updatedById: goal.updatedById ?? null,
  updatedByName: goal.updatedByName ?? null,
  updatedByPhotoUrl: goal.updatedByPhotoUrl ?? null,
});

export const goalsService = {
  async listGlobal() {
    const goals = await request<GoalEntityApi[]>("/goals/global");
    return goals.map(fromApiGoal);
  },
  async listUser(createdById: string) {
    const goals = await request<GoalEntityApi[]>(`/goals/user/${createdById}`);
    return goals.map(fromApiGoal);
  },
  async createGlobal(goal: CreateUserGoalInput) {
    const goalApi = await request<GoalEntityApi>("/goals/global", {
      method: "POST",
      body: JSON.stringify(goal),
    });
    return fromApiGoal(goalApi);
  },
  async createUser(goal: CreateUserGoalInput) {
    const goalApi = await request<GoalEntityApi>("/goals", {
      method: "POST",
      body: JSON.stringify(goal),
    });
    return fromApiGoal(goalApi);
  },
  async updateUser(goalId: string, patch: UpdateUserGoalInput) {
    const goalApi = await request<GoalEntityApi>(`/goals/${goalId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    return fromApiGoal(goalApi);
  },
  removeUser(goalId: string) {
    return request<{ deletedCount?: number }>(`/goals/${goalId}`, {
      method: "DELETE",
    });
  },
};
