import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { MatchResults, MatchType, PlayerProfile, Schedule } from "../interfaces";
import { loadMatchBuilderState } from "./matchBuilderStorage";

const matchBuilderSlice = createSlice({
  name: "matchBuilder",
  initialState: loadMatchBuilderState(),
  reducers: {
    setPlayers(state, action: PayloadAction<PlayerProfile[]>) {
      state.players = action.payload;
    },
    setMatchType(state, action: PayloadAction<MatchType>) {
      state.matchType = action.payload;
    },
    setNumMatches(state, action: PayloadAction<number>) {
      state.numMatches = action.payload;
    },
    setNumCourts(state, action: PayloadAction<number>) {
      state.numCourts = action.payload;
    },
    setCourtNumbers(state, action: PayloadAction<number[]>) {
      state.courtNumbers = action.payload;
    },
    setCourtNumbersText(state, action: PayloadAction<string>) {
      state.courtNumbersText = action.payload;
    },
    setSchedule(state, action: PayloadAction<Schedule | null>) {
      state.schedule = action.payload;
    },
    setMatchResults(state, action: PayloadAction<MatchResults>) {
      state.matchResults = action.payload;
    },
    setIsRosterOpen(state, action: PayloadAction<boolean>) {
      state.isRosterOpen = action.payload;
    },
  },
});

export const {
  actions: matchBuilderActions,
  reducer: matchBuilderReducer,
} = matchBuilderSlice;
