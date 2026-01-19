import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  MatchResults,
  MatchSession,
  MatchType,
  PlayerProfile,
  Schedule,
} from "../interfaces";
import { formatCourtNumbers, loadMatchBuilderState } from "./matchBuilderStorage";

const syncActiveSession = (state: ReturnType<typeof loadMatchBuilderState>) => {
  if (!state.activeMatchId) {
    return;
  }
  const session = state.matchHistory.find(
    (entry) => entry.id === state.activeMatchId
  );
  if (!session) {
    return;
  }
  session.matchType = state.matchType;
  session.players = state.players;
  session.numMatches = state.numMatches;
  session.numCourts = state.numCourts;
  session.courtNumbers = state.courtNumbers;
  session.schedule = state.schedule;
  session.matchResults = state.matchResults;
};

const matchBuilderSlice = createSlice({
  name: "matchBuilder",
  initialState: loadMatchBuilderState(),
  reducers: {
    setPlayers(state, action: PayloadAction<PlayerProfile[]>) {
      state.players = action.payload;
      syncActiveSession(state);
    },
    setMatchType(state, action: PayloadAction<MatchType>) {
      state.matchType = action.payload;
      syncActiveSession(state);
    },
    setNumMatches(state, action: PayloadAction<number>) {
      state.numMatches = action.payload;
      syncActiveSession(state);
    },
    setNumCourts(state, action: PayloadAction<number>) {
      state.numCourts = action.payload;
      syncActiveSession(state);
    },
    setCourtNumbers(state, action: PayloadAction<number[]>) {
      state.courtNumbers = action.payload;
      syncActiveSession(state);
    },
    setCourtNumbersText(state, action: PayloadAction<string>) {
      state.courtNumbersText = action.payload;
    },
    setSchedule(state, action: PayloadAction<Schedule | null>) {
      state.schedule = action.payload;
      syncActiveSession(state);
    },
    setMatchResults(state, action: PayloadAction<MatchResults>) {
      state.matchResults = action.payload;
      syncActiveSession(state);
    },
    setIsRosterOpen(state, action: PayloadAction<boolean>) {
      state.isRosterOpen = action.payload;
    },
    createMatchSession(
      state,
      action: PayloadAction<{ id: string; schedule: Schedule }>
    ) {
      const { id, schedule } = action.payload;
      const newSession: MatchSession = {
        id,
        createdAt: Date.now(),
        matchType: state.matchType,
        players: state.players,
        numMatches: state.numMatches,
        numCourts: state.numCourts,
        courtNumbers: state.courtNumbers,
        schedule,
        matchResults: {},
      };
      state.matchHistory = [newSession, ...state.matchHistory];
      state.activeMatchId = id;
      state.schedule = schedule;
      state.matchResults = {};
    },
    loadMatchSession(state, action: PayloadAction<string>) {
      const session = state.matchHistory.find(
        (entry) => entry.id === action.payload
      );
      if (!session) {
        return;
      }
      state.activeMatchId = session.id;
      state.matchType = session.matchType;
      state.players = session.players;
      state.numMatches = session.numMatches;
      state.numCourts = session.numCourts;
      state.courtNumbers = session.courtNumbers;
      state.courtNumbersText = formatCourtNumbers(session.courtNumbers);
      state.schedule = session.schedule;
      state.matchResults = session.matchResults;
    },
    removeMatchSession(state, action: PayloadAction<string>) {
      state.matchHistory = state.matchHistory.filter(
        (entry) => entry.id !== action.payload
      );
      if (state.activeMatchId === action.payload) {
        state.activeMatchId = null;
      }
    },
    clearActiveMatch(state) {
      state.activeMatchId = null;
    },
  },
});

export const {
  actions: matchBuilderActions,
  reducer: matchBuilderReducer,
} = matchBuilderSlice;
