import { configureStore } from "@reduxjs/toolkit";
import { goalsCatalogReducer } from "./goalsCatalogSlice";
import { goalsReducer } from "./goalsSlice";
import { saveGoalsState } from "./goalsStorage";
import { matchBuilderReducer } from "./matchBuilderSlice";
import { saveMatchBuilderState } from "./matchBuilderStorage";

export const store = configureStore({
  reducer: {
    goalsCatalog: goalsCatalogReducer,
    goals: goalsReducer,
    matchBuilder: matchBuilderReducer,
  },
});

store.subscribe(() => {
  saveGoalsState(store.getState().goals);
  saveMatchBuilderState(store.getState().matchBuilder);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
