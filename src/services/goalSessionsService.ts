import type { GoalSession, MatchGoal, OpponentLevel } from "../interfaces";
import { authService } from "./authService";

export type GoalSessionApi = {
  sessionId: string;
  createdAt: number;
  numMatches: number;
  ratingRange: string;
  defaultOpponentLevel: OpponentLevel | string;
  matches: MatchGoal[];
  ownerId?: string | null;
  allowedUserIds?: string[];
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

const normalizeArray = <T,>(value: T[] | null | undefined) =>
  Array.isArray(value) ? value : [];

const toApiSession = (session: GoalSession): GoalSessionApi => ({
  sessionId: session.id,
  createdAt: session.createdAt,
  numMatches: session.numMatches,
  ratingRange: session.ratingRange,
  defaultOpponentLevel: session.defaultOpponentLevel,
  matches: session.matches,
  ownerId: session.ownerId,
  allowedUserIds: session.allowedUserIds,
});

const fromApiSession = (session: GoalSessionApi): GoalSession => ({
  id: session.sessionId,
  createdAt: session.createdAt,
  numMatches: session.numMatches,
  ratingRange: session.ratingRange,
  defaultOpponentLevel: session.defaultOpponentLevel as OpponentLevel,
  matches: normalizeArray(session.matches),
  ownerId: session.ownerId ?? null,
  allowedUserIds: normalizeArray(session.allowedUserIds),
});

export const goalSessionsService = {
  async list() {
    const sessions = await request<GoalSessionApi[]>("/goal-sessions");
    return sessions.map(fromApiSession);
  },
  async get(sessionId: string) {
    const session = await request<GoalSessionApi>(
      `/goal-sessions/${sessionId}`
    );
    return fromApiSession(session);
  },
  async create(session: GoalSession) {
    const sessionApi = await request<GoalSessionApi>("/goal-sessions", {
      method: "POST",
      body: JSON.stringify(toApiSession(session)),
    });
    return fromApiSession(sessionApi);
  },
  async update(sessionId: string, patch: Partial<GoalSession>) {
    const payload = { ...patch, sessionId };
    const sessionApi = await request<GoalSessionApi>(
      `/goal-sessions/${sessionId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
    return fromApiSession(sessionApi);
  },
  remove(sessionId: string) {
    return request<{ deletedCount?: number }>(`/goal-sessions/${sessionId}`, {
      method: "DELETE",
    });
  },
};
