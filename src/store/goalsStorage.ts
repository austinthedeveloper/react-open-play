import { DEFAULT_PROFILE, NUM_MATCHES_DEFAULT } from "../data";
import type { MatchGoal, OpponentLevel, Profile } from "../interfaces";
import { GOAL_TEMPLATES } from "../data";
import { randomId } from "../utilities";

const STORAGE_KEY = "pickle-goals:goals-page";
const opponentLevels: OpponentLevel[] = ["lower", "same", "higher"];
const isOpponentLevel = (value: unknown): value is OpponentLevel =>
  opponentLevels.includes(value as OpponentLevel);
const ratingRanges = ["2-2.5", "3-3.5", "3.5-4", "4+"] as const;
const isRatingRange = (value: unknown): value is (typeof ratingRanges)[number] =>
  ratingRanges.includes(value as (typeof ratingRanges)[number]);

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
  ratingRange?: string;
};

export type GoalsState = {
  profile: Profile;
  numMatches: number;
  matches: MatchGoal[];
};

export const loadGoalsState = (): GoalsState => {
  let numMatches = NUM_MATCHES_DEFAULT;
  let defaultOpponentLevel = DEFAULT_PROFILE.defaultOpponentLevel;
  let ratingRange = DEFAULT_PROFILE.ratingRange;
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
        if (isRatingRange(parsed.ratingRange)) {
          ratingRange = parsed.ratingRange;
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
    ratingRange,
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
      ratingRange: profile.ratingRange,
    })
  );
};
