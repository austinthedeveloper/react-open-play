import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { MatchGoal, OpponentLevel } from "../interfaces";
import { GOAL_TEMPLATES } from "../data";
import { randomId } from "../utilities";
import { loadGoalsState } from "./goalsStorage";

const opponentLevels: OpponentLevel[] = ["lower", "same", "higher"];
const isOpponentLevel = (value: unknown): value is OpponentLevel =>
  opponentLevels.includes(value as OpponentLevel);
const ratingRanges = ["2-2.5", "3-3.5", "3.5-4", "4+"] as const;
const isRatingRange = (value: unknown): value is (typeof ratingRanges)[number] =>
  ratingRanges.includes(value as (typeof ratingRanges)[number]);

const generateMatches = (level: OpponentLevel, count: number): MatchGoal[] => {
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
};

const goalsSlice = createSlice({
  name: "goals",
  initialState: loadGoalsState(),
  reducers: {
    setNumMatches(state, action: PayloadAction<number>) {
      state.numMatches = action.payload;
    },
    setDefaultOpponentLevel(state, action: PayloadAction<OpponentLevel>) {
      if (!isOpponentLevel(action.payload)) {
        return;
      }
      state.profile.defaultOpponentLevel = action.payload;
    },
    setRatingRange(state, action: PayloadAction<string>) {
      if (!isRatingRange(action.payload)) {
        return;
      }
      state.profile.ratingRange = action.payload;
    },
    setMatches(state, action: PayloadAction<MatchGoal[]>) {
      state.matches = action.payload;
    },
    updateMatch(
      state,
      action: PayloadAction<{ id: string; patch: Partial<MatchGoal> }>
    ) {
      state.matches = state.matches.map((match) =>
        match.id === action.payload.id
          ? { ...match, ...action.payload.patch }
          : match
      );
    },
    regenerateMatches(state) {
      state.matches = generateMatches(
        state.profile.defaultOpponentLevel,
        state.numMatches
      );
    },
  },
});

export const { actions: goalsActions, reducer: goalsReducer } = goalsSlice;
