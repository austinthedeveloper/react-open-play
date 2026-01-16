import { configureStore } from "@reduxjs/toolkit";
import { goalsReducer } from "./goalsSlice";
import { saveGoalsState } from "./goalsStorage";

export const store = configureStore({
  reducer: {
    goals: goalsReducer,
  },
});

store.subscribe(() => {
  saveGoalsState(store.getState().goals);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
