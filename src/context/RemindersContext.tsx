import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../storage/keys";

export type Reminder = {
  id: string;
  title: string;
  note?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isEnabled: boolean;
  createdAt: string;
  lastTriggeredAt?: string;
};

type RemindersContextType = {
  reminders: Reminder[];
  isLoading: boolean;
  addReminder: (r: Omit<Reminder, "id" | "createdAt">) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  markTriggered: (id: string) => Promise<void>;
};

const RemindersContext = createContext<RemindersContextType | null>(null);

export const useReminders = () => {
  const ctx = useContext(RemindersContext);
  if (!ctx) throw new Error("useReminders must be used within RemindersProvider");
  return ctx;
};

export const RemindersProvider = ({ children }: { children: React.ReactNode }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  
  const persist = async (data: Reminder[]) => {
    setReminders(data);
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(data));
  };

  // Cargo los recordatorios guardados al iniciar
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
        if (raw) setReminders(JSON.parse(raw));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const addReminder = async (r: Omit<Reminder, "id" | "createdAt">) => {
    const newR: Reminder = {
      ...r,
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
    };
    await persist([newR, ...reminders]);
  };

  const toggleReminder = async (id: string) => {
    const updated = reminders.map(r => (r.id === id ? { ...r, isEnabled: !r.isEnabled } : r));
    await persist(updated);
  };

  const markTriggered = async (id: string) => {
    const updated = reminders.map(r =>
      r.id === id ? { ...r, lastTriggeredAt: new Date().toISOString() } : r
    );
    await persist(updated);
  };

  const value = useMemo(
    () => ({ reminders, isLoading, addReminder, toggleReminder, markTriggered }),
    [reminders, isLoading]
  );

  return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>;
};
