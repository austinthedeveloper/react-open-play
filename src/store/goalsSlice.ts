import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  GoalSession,
  MatchGoal,
  OpponentLevel,
  Profile,
} from "../interfaces";
import { DEFAULT_PROFILE, NUM_MATCHES_DEFAULT } from "../data";
import { generateGoalMatches } from "../utilities";

const opponentLevels: OpponentLevel[] = ["lower", "same", "higher"];
const isOpponentLevel = (value: unknown): value is OpponentLevel =>
  opponentLevels.includes(value as OpponentLevel);
const ratingRanges = ["2-2.5", "3-3.5", "3.5-4", "4+"] as const;
const isRatingRange = (value: unknown): value is (typeof ratingRanges)[number] =>
  ratingRanges.includes(value as (typeof ratingRanges)[number]);

type GoalsState = {
  profile: Profile;
  numMatches: number;
  matches: MatchGoal[];
  goalSessions: GoalSession[];
  activeSessionId: string | null;
};

const syncActiveSession = (state: GoalsState) => {
  if (!state.activeSessionId) {
    return;
  }
  const session = state.goalSessions.find(
    (entry) => entry.id === state.activeSessionId
  );
  if (!session) {
    return;
  }
  session.numMatches = state.numMatches;
  session.ratingRange = state.profile.ratingRange;
  session.defaultOpponentLevel = state.profile.defaultOpponentLevel;
  session.matches = state.matches;
};

const goalsSlice = createSlice({
  name: "goals",
  initialState: {
    profile: { ...DEFAULT_PROFILE },
    numMatches: NUM_MATCHES_DEFAULT,
    matches: [],
    goalSessions: [],
    activeSessionId: null,
  } satisfies GoalsState,
  reducers: {
    setGoalSessions(state, action: PayloadAction<GoalSession[]>) {
      state.goalSessions = action.payload;
    },
    upsertGoalSession(state, action: PayloadAction<GoalSession>) {
      const session = action.payload;
      const index = state.goalSessions.findIndex(
        (entry) => entry.id === session.id
      );
      if (index >= 0) {
        state.goalSessions[index] = session;
        return;
      }
      state.goalSessions = [session, ...state.goalSessions];
    },
    setActiveGoalSession(state, action: PayloadAction<GoalSession>) {
      const session = action.payload;
      const index = state.goalSessions.findIndex(
        (entry) => entry.id === session.id
      );
      if (index >= 0) {
        state.goalSessions[index] = session;
      } else {
        state.goalSessions = [session, ...state.goalSessions];
      }
      state.activeSessionId = session.id;
      state.profile = {
        ratingRange: session.ratingRange,
        defaultOpponentLevel: session.defaultOpponentLevel,
      };
      state.numMatches = session.numMatches;
      state.matches = session.matches;
    },
    clearActiveGoalSession(state) {
      state.activeSessionId = null;
    },
    setNumMatches(state, action: PayloadAction<number>) {
      state.numMatches = action.payload;
      syncActiveSession(state);
    },
    setDefaultOpponentLevel(state, action: PayloadAction<OpponentLevel>) {
      if (!isOpponentLevel(action.payload)) {
        return;
      }
      state.profile.defaultOpponentLevel = action.payload;
      syncActiveSession(state);
    },
    setRatingRange(state, action: PayloadAction<string>) {
      if (!isRatingRange(action.payload)) {
        return;
      }
      state.profile.ratingRange = action.payload;
      syncActiveSession(state);
    },
    setMatches(state, action: PayloadAction<MatchGoal[]>) {
      state.matches = action.payload;
      syncActiveSession(state);
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
      syncActiveSession(state);
    },
    regenerateMatches(state) {
      state.matches = generateGoalMatches(
        state.profile.defaultOpponentLevel,
        state.numMatches
      );
      syncActiveSession(state);
    },
    removeGoalSession(state, action: PayloadAction<string>) {
      state.goalSessions = state.goalSessions.filter(
        (entry) => entry.id !== action.payload
      );
      if (state.activeSessionId === action.payload) {
        state.activeSessionId = null;
      }
    },
  },
});

export const { actions: goalsActions, reducer: goalsReducer } = goalsSlice;
