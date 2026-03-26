


import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { supabase } from "../services/supabase";
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
  error: string | null;
};

// ============ ESTADO INICIAL ============

const initialState: AuthState = {
  user: null,
  isLoading: true,
  error: null,
};

// ============ SLICE ============

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearUser: (state) => {
      state.user = null;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const { setUser, setLoading, setError, clearUser } = authSlice.actions;

// ============ HELPER ============

// Convierte el usuario de Supabase Auth a nuestro tipo User
const mapSupabaseUser = (supabaseUser: any): User => ({
  id: supabaseUser.id,
  email: supabaseUser.email || "",
  name: supabaseUser.user_metadata?.name || undefined,
});

// ============ THUNKS ============

// Cargar sesión existente al iniciar la app
export const loadUser = () => async (dispatch: AppDispatch) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      dispatch(setUser(mapSupabaseUser(session.user)));
    } else {
      dispatch(setLoading(false));
    }
  } catch {
    dispatch(setLoading(false));
  }
};

// Login con Supabase Auth nativo
export const login = (email: string, password: string) => async (dispatch: AppDispatch) => {
  dispatch(setLoading(true));
  dispatch(setError(null));

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (error) {
      // Traducir errores comunes
      if (error.message.includes("Invalid login credentials")) {
        dispatch(setError("Email o contraseña incorrectos"));
      } else if (error.message.includes("Email not confirmed")) {
        dispatch(setError("Debes confirmar tu email primero"));
      } else {
        dispatch(setError(error.message));
      }
      return false;
    }

    if (data.user) {
      dispatch(setUser(mapSupabaseUser(data.user)));
      return true;
    }

    dispatch(setError("Error al iniciar sesión"));
    return false;
  } catch (err) {
    dispatch(setError("Error de conexión"));
    return false;
  }
};

// Registro con Supabase Auth nativo
export const register = (email: string, password: string, name: string) => async (dispatch: AppDispatch) => {
  dispatch(setLoading(true));
  dispatch(setError(null));

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: { name }, // Guardar nombre en user_metadata
      },
    });

    if (error) {
      // Traducir errores comunes
      if (error.message.includes("already registered")) {
        dispatch(setError("Este email ya está registrado"));
      } else if (error.message.includes("Password should be")) {
        dispatch(setError("La contraseña debe tener al menos 6 caracteres"));
      } else {
        dispatch(setError(error.message));
      }
      return false;
    }

    if (data.user) {
      dispatch(setUser(mapSupabaseUser(data.user)));
      return true;
    }

    dispatch(setError("Error al crear cuenta"));
    return false;
  } catch (err) {
    dispatch(setError("Error de conexión"));
    return false;
  }
};

// Logout con Supabase Auth
export const logout = () => async (dispatch: AppDispatch) => {
  await supabase.auth.signOut();
  dispatch(clearUser());
};

export default authSlice.reducer;
