import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import authReducer from "./authSlice";
import remindersReducer from "./remindersSlice";

// ============ CONFIGURACIÓN DEL STORE ============

export const store = configureStore({
  reducer: {
    auth: authReducer,
    reminders: remindersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Necesario para AsyncStorage
    }),
});

// ============ TIPOS ============

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ============ HOOKS TIPADOS ============

// Usar estos hooks en lugar de useDispatch y useSelector directamente
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
