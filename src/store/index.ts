import { configureStore } from "@reduxjs/toolkit";
//importar Reducer con alias
import remindersReducer from "./slices/remindersSlice";

export const store = configureStore({
    reducer: {
        reminders: remindersReducer,
    },
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
