import {
  DEFAULT_COURTS,
  DEFAULT_MATCHES,
  DEFAULT_MATCH_TYPE,
  DEFAULT_PLAYERS,
  MATCH_TYPES,
  PLAYER_COLORS,
  STORAGE_KEY,
} from "../data";
import type {
  GenderOption,
  MatchSession,
  MatchResults,
  MatchType,
  PlayerProfile,
  Schedule,
} from "../interfaces";
import { buildDefaultPlayers } from "../utilities";
import { randomId } from "../utilities";

export const parseCourtNumbers = (value: string) => {
  const numbers: number[] = [];
  const seen = new Set<number>();
  const tokens = value.split(/[^0-9]+/);
  for (const token of tokens) {
    if (!token) {
      continue;
    }
    const parsed = Number(token);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      continue;
    }
    const normalized = Math.floor(parsed);
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    numbers.push(normalized);
  }
  return numbers;
};

export const formatCourtNumbers = (values: number[]) => values.join(", ");

const resolveMatchType = (value: MatchType | undefined) =>
  MATCH_TYPES.some((option) => option.value === value)
    ? value
    : DEFAULT_MATCH_TYPE;

const normalizePlayers = (players?: PlayerProfile[]) => {
  if (!Array.isArray(players)) {
    return buildDefaultPlayers(DEFAULT_PLAYERS);
  }
  return players.map((player, index) => ({
    id: player.id || randomId(),
    name: player.name || `Player ${index + 1}`,
    color: player.color || PLAYER_COLORS[index % PLAYER_COLORS.length],
    gender: (player.gender ?? "") as GenderOption,
  }));
};

const normalizeCourtNumbers = (input?: number[] | string) => {
  if (Array.isArray(input)) {
    const normalized = input
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0)
      .map((value) => Math.floor(value));
    return {
      courtNumbers: normalized,
      courtNumbersText: formatCourtNumbers(normalized),
    };
  }
  if (typeof input === "string") {
    return {
      courtNumbers: parseCourtNumbers(input),
      courtNumbersText: input,
    };
  }
  return { courtNumbers: [], courtNumbersText: "" };
};

const normalizeSchedule = (schedule?: Schedule | null) =>
  schedule && Array.isArray(schedule.matches)
    ? { matches: schedule.matches }
    : null;

const normalizeMatchResults = (matchResults?: MatchResults) =>
  matchResults && typeof matchResults === "object" ? matchResults : {};

const resolveNumber = (value: unknown, fallback: number) =>
  typeof value === "number" ? value : fallback;

type StoredMatchSession = {
  id?: string;
  createdAt?: number;
  matchType?: MatchType;
  players?: PlayerProfile[];
  numMatches?: number;
  numCourts?: number;
  courtNumbers?: number[] | string;
  schedule?: Schedule | null;
  matchResults?: MatchResults;
};

type StoredMatchBuilderState = {
  matchType?: MatchType;
  players?: PlayerProfile[];
  numMatches?: number;
  numCourts?: number;
  courtNumbers?: number[] | string;
  schedule?: Schedule | null;
  matchResults?: MatchResults;
  isRosterOpen?: boolean;
  matchHistory?: StoredMatchSession[];
  activeMatchId?: string | null;
};

export type MatchBuilderState = {
  players: PlayerProfile[];
  matchType: MatchType;
  numMatches: number;
  numCourts: number;
  courtNumbers: number[];
  courtNumbersText: string;
  schedule: Schedule | null;
  matchResults: MatchResults;
  isRosterOpen: boolean;
  matchHistory: MatchSession[];
  activeMatchId: string | null;
};

export const loadMatchBuilderState = (): MatchBuilderState => {
  let matchType = DEFAULT_MATCH_TYPE;
  let players = buildDefaultPlayers(DEFAULT_PLAYERS);
  let numMatches = DEFAULT_MATCHES;
  let numCourts = DEFAULT_COURTS;
  let courtNumbers: number[] = [];
  let courtNumbersText = "";
  let schedule: Schedule | null = null;
  let matchResults: MatchResults = {};
  let isRosterOpen = true;
  let matchHistory: MatchSession[] = [];
  let activeMatchId: string | null = null;

  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredMatchBuilderState;
        matchType = resolveMatchType(parsed.matchType);
        players = normalizePlayers(parsed.players);
        numMatches = resolveNumber(parsed.numMatches, DEFAULT_MATCHES);
        numCourts = resolveNumber(parsed.numCourts, DEFAULT_COURTS);
        const normalizedCourts = normalizeCourtNumbers(parsed.courtNumbers);
        courtNumbers = normalizedCourts.courtNumbers;
        courtNumbersText = normalizedCourts.courtNumbersText;
        schedule = normalizeSchedule(parsed.schedule);
        matchResults = normalizeMatchResults(parsed.matchResults);
        if (typeof parsed.isRosterOpen === "boolean") {
          isRosterOpen = parsed.isRosterOpen;
        }
        if (Array.isArray(parsed.matchHistory)) {
          matchHistory = parsed.matchHistory
            .map((entry) => {
              if (!entry || typeof entry !== "object") {
                return null;
              }
              const sessionPlayers = normalizePlayers(entry.players);
              const sessionCourts = normalizeCourtNumbers(entry.courtNumbers);
              return {
                id: typeof entry.id === "string" ? entry.id : randomId(),
                createdAt:
                  typeof entry.createdAt === "number"
                    ? entry.createdAt
                    : Date.now(),
                matchType: resolveMatchType(entry.matchType),
                players: sessionPlayers,
                numMatches: resolveNumber(entry.numMatches, DEFAULT_MATCHES),
                numCourts: resolveNumber(entry.numCourts, DEFAULT_COURTS),
                courtNumbers: sessionCourts.courtNumbers,
                schedule: normalizeSchedule(entry.schedule),
                matchResults: normalizeMatchResults(entry.matchResults),
              } satisfies MatchSession;
            })
            .filter((entry): entry is MatchSession => Boolean(entry));
        }
        if (typeof parsed.activeMatchId === "string") {
          activeMatchId = parsed.activeMatchId;
        }
      }
    } catch {
      // ignore storage parse errors
    }
  }

  if (activeMatchId) {
    const activeSession = matchHistory.find(
      (session) => session.id === activeMatchId
    );
    if (activeSession) {
      matchType = activeSession.matchType;
      players = activeSession.players;
      numMatches = activeSession.numMatches;
      numCourts = activeSession.numCourts;
      courtNumbers = activeSession.courtNumbers;
      courtNumbersText = formatCourtNumbers(activeSession.courtNumbers);
      schedule = activeSession.schedule;
      matchResults = activeSession.matchResults;
    } else {
      activeMatchId = null;
    }
  }

  return {
    players,
    matchType,
    numMatches,
    numCourts,
    courtNumbers,
    courtNumbersText,
    schedule,
    matchResults,
    isRosterOpen,
    matchHistory,
    activeMatchId,
  };
};

export const saveMatchBuilderState = ({
  matchType,
  players,
  numMatches,
  numCourts,
  courtNumbers,
  schedule,
  matchResults,
  isRosterOpen,
  matchHistory,
  activeMatchId,
}: MatchBuilderState) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      matchType,
      players,
      numMatches,
      numCourts,
      courtNumbers,
      schedule,
      matchResults,
      isRosterOpen,
      matchHistory,
      activeMatchId,
    })
  );
};
