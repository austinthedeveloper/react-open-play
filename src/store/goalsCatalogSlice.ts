import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { GoalEntity } from "../interfaces";

export type GoalsCatalogState = {
  globalGoals: GoalEntity[];
  userGoals: GoalEntity[];
  isLoading: boolean;
  error: string | null;
};

const initialState: GoalsCatalogState = {
  globalGoals: [],
  userGoals: [],
  isLoading: false,
  error: null,
};

const goalsCatalogSlice = createSlice({
  name: "goalsCatalog",
  initialState,
  reducers: {
    setGlobalGoals(state, action: PayloadAction<GoalEntity[]>) {
      state.globalGoals = action.payload;
    },
    setUserGoals(state, action: PayloadAction<GoalEntity[]>) {
      state.userGoals = action.payload;
    },
    addUserGoal(state, action: PayloadAction<GoalEntity>) {
      state.userGoals = [action.payload, ...state.userGoals];
    },
    updateUserGoal(state, action: PayloadAction<GoalEntity>) {
      state.userGoals = state.userGoals.map((goal) =>
        goal.id === action.payload.id ? action.payload : goal
      );
    },
    removeUserGoal(state, action: PayloadAction<string>) {
      state.userGoals = state.userGoals.filter(
        (goal) => goal.id !== action.payload
      );
    },
    setGoalsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setGoalsError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  actions: goalsCatalogActions,
  reducer: goalsCatalogReducer,
} = goalsCatalogSlice;
