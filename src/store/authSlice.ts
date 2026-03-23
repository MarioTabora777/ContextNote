import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../storage/keys";
import { AppDispatch } from "./index";

// ============ TIPOS ============

export type User = {
  id: string;
  email: string;
  name?: string;
};

type AuthState = {
  user: User | null;
  isLoading: boolean;
};

// ============ ESTADO INICIAL ============

const initialState: AuthState = {
  user: null,
  isLoading: true,
};

// ============ SLICE ============

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
      state.isLoading = false;
    },
  },
});

export const { setUser, setLoading, clearUser } = authSlice.actions;

// ============ THUNKS (acciones asíncronas) ============

// Cargar usuario desde AsyncStorage al iniciar la app
export const loadUser = () => async (dispatch: AppDispatch) => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (raw) {
      dispatch(setUser(JSON.parse(raw)));
    } else {
      dispatch(setLoading(false));
    }
  } catch {
    dispatch(setLoading(false));
  }
};

// Login: guarda usuario en estado y AsyncStorage
export const login = (email: string, name?: string) => async (dispatch: AppDispatch) => {
  const user: User = { id: String(Date.now()), email, name };
  await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
  dispatch(setUser(user));
  return true;
};

// Register: igual que login pero con nombre obligatorio
export const register = (email: string, _password: string, name: string) => async (dispatch: AppDispatch) => {
  const user: User = { id: String(Date.now()), email, name };
  await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
  dispatch(setUser(user));
  return true;
};

// Logout: limpia estado y AsyncStorage
export const logout = () => async (dispatch: AppDispatch) => {
  await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  dispatch(clearUser());
};

export default authSlice.reducer;
