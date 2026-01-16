import { DEFAULT_PROFILE, NUM_MATCHES_DEFAULT } from "../data";
import type { MatchGoal, OpponentLevel, Profile } from "../interfaces";
import { GOAL_TEMPLATES } from "../data";
import { randomId } from "../utilities";

const STORAGE_KEY = "pickle-goals:goals-page";
const opponentLevels: OpponentLevel[] = ["lower", "same", "higher"];
const isOpponentLevel = (value: unknown): value is OpponentLevel =>
  opponentLevels.includes(value as OpponentLevel);

function generateMatches(level: OpponentLevel, count: number): MatchGoal[] {
  const templates = GOAL_TEMPLATES[level];
  return Array.from({ length: count }, (_, i) => {
    const template = templates[Math.floor(Math.random() * templates.length)];
    return {
      id: randomId(),
      index: i + 1,
      opponentLevel: level,
      goalText: template,
      played: false,
      result: "pending",
    };
  });
}

type StoredGoalsState = {
  matches?: MatchGoal[];
  numMatches?: number;
  defaultOpponentLevel?: OpponentLevel;
};

export type GoalsState = {
  profile: Profile;
  numMatches: number;
  matches: MatchGoal[];
};

export const loadGoalsState = (): GoalsState => {
  let numMatches = NUM_MATCHES_DEFAULT;
  let defaultOpponentLevel = DEFAULT_PROFILE.defaultOpponentLevel;
  let matches: MatchGoal[] | null = null;

  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredGoalsState;
        if (typeof parsed.numMatches === "number") {
          numMatches = parsed.numMatches;
        }
        if (isOpponentLevel(parsed.defaultOpponentLevel)) {
          defaultOpponentLevel = parsed.defaultOpponentLevel;
        }
        if (Array.isArray(parsed.matches)) {
          matches = parsed.matches;
        }
      }
    } catch {
      matches = null;
    }
  }

  const profile: Profile = {
    ...DEFAULT_PROFILE,
    defaultOpponentLevel,
  };

  return {
    profile,
    numMatches,
    matches: matches ?? generateMatches(defaultOpponentLevel, numMatches),
  };
};

export const saveGoalsState = ({
  profile,
  numMatches,
  matches,
}: GoalsState) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      matches,
      numMatches,
      defaultOpponentLevel: profile.defaultOpponentLevel,
    })
  );
};
