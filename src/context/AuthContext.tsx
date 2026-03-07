import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../storage/keys";

type User = { id: string; email: string; name?: string };

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, name?: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
};


const AuthContext = createContext<AuthContextType | null>(null);


export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

 
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER);
        if (raw) setUser(JSON.parse(raw));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Login: guardo el usuario en estado y en AsyncStorage
  const login = async (email: string, name?: string): Promise<boolean> => {
    const u: User = { id: String(Date.now()), email, name };
    setUser(u);
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(u));
    return true;
  };

  // Register: igual que login pero con nombre obligatorio
  const register = async (email: string, _password: string, name: string): Promise<boolean> => {
    const u: User = { id: String(Date.now()), email, name };
    setUser(u);
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(u));
    return true;
  };

  // Logout: limpio el estado y borro de AsyncStorage
  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  };

  const value = useMemo(() => ({ user, isLoading, login, register, logout }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
