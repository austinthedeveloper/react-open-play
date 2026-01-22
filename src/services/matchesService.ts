import type { MatchResults, MatchSession, MatchType, PlayerProfile, Schedule } from "../interfaces";

export type MatchSessionApi = {
  sessionId: string;
  createdAt: number;
  matchType: MatchType | string;
  players: PlayerProfile[];
  numMatches: number;
  numCourts: number;
  courtNumbers: number[];
  schedule: Schedule | null;
  matchResults: MatchResults;
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
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || response.statusText);
  }

  return text ? (JSON.parse(text) as T) : (null as T);
};

const toApiSession = (session: MatchSession): MatchSessionApi => ({
  sessionId: session.id,
  createdAt: session.createdAt,
  matchType: session.matchType,
  players: session.players,
  numMatches: session.numMatches,
  numCourts: session.numCourts,
  courtNumbers: session.courtNumbers,
  schedule: session.schedule,
  matchResults: session.matchResults,
});

const normalizeArray = <T,>(value: T[] | null | undefined) =>
  Array.isArray(value) ? value : [];

const fromApiSession = (session: MatchSessionApi): MatchSession => ({
  id: session.sessionId,
  createdAt: session.createdAt,
  matchType: session.matchType as MatchType,
  players: normalizeArray(session.players),
  numMatches: session.numMatches,
  numCourts: session.numCourts,
  courtNumbers: normalizeArray(session.courtNumbers),
  schedule: session.schedule ?? null,
  matchResults: session.matchResults ?? {},
});

export const matchesService = {
  async list() {
    const sessions = await request<MatchSessionApi[]>("/matches");
    return sessions.map(fromApiSession);
  },
  async get(sessionId: string) {
    const session = await request<MatchSessionApi>(`/matches/${sessionId}`);
    return fromApiSession(session);
  },
  async create(session: MatchSession) {
    const sessionApi = await request<MatchSessionApi>("/matches", {
      method: "POST",
      body: JSON.stringify(toApiSession(session)),
    });
    return fromApiSession(sessionApi);
  },
  async update(sessionId: string, patch: Partial<MatchSession>) {
    const payload = { ...patch, sessionId };
    const sessionApi = await request<MatchSessionApi>(`/matches/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return fromApiSession(sessionApi);
  },
  remove(sessionId: string) {
    return request<{ deletedCount?: number }>(`/matches/${sessionId}`, {
      method: "DELETE",
    });
  },
};
