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

type StoredMatchBuilderState = {
  matchType?: MatchType;
  players?: PlayerProfile[];
  numMatches?: number;
  numCourts?: number;
  courtNumbers?: number[] | string;
  schedule?: Schedule | null;
  matchResults?: MatchResults;
  isRosterOpen?: boolean;
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

  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredMatchBuilderState;
        if (parsed.matchType) {
          matchType = MATCH_TYPES.some(
            (option) => option.value === parsed.matchType
          )
            ? parsed.matchType
            : DEFAULT_MATCH_TYPE;
        }
        if (Array.isArray(parsed.players)) {
          players = parsed.players.map((player, index) => ({
            id: player.id || randomId(),
            name: player.name || `Player ${index + 1}`,
            color: player.color || PLAYER_COLORS[index % PLAYER_COLORS.length],
            gender: (player.gender ?? "") as GenderOption,
          }));
        }
        if (typeof parsed.numMatches === "number") {
          numMatches = parsed.numMatches;
        }
        if (typeof parsed.numCourts === "number") {
          numCourts = parsed.numCourts;
        }
        if (Array.isArray(parsed.courtNumbers)) {
          const normalized = parsed.courtNumbers
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value) && value > 0)
            .map((value) => Math.floor(value));
          courtNumbers = normalized;
          courtNumbersText = formatCourtNumbers(normalized);
        } else if (typeof parsed.courtNumbers === "string") {
          courtNumbers = parseCourtNumbers(parsed.courtNumbers);
          courtNumbersText = parsed.courtNumbers;
        }
        if (parsed.schedule && Array.isArray(parsed.schedule.matches)) {
          schedule = { matches: parsed.schedule.matches };
        }
        if (parsed.matchResults && typeof parsed.matchResults === "object") {
          matchResults = parsed.matchResults;
        }
        if (typeof parsed.isRosterOpen === "boolean") {
          isRosterOpen = parsed.isRosterOpen;
        }
      }
    } catch {
      // ignore storage parse errors
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
    })
  );
};
