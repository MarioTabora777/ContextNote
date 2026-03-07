import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../storage/keys";

export type ReminderPriority = "high" | "medium" | "low";
export type ReminderType = "location" | "datetime" | "both";

export type TriggerRecord = {
  triggeredAt: string;
  type: "location" | "datetime";
};

export type Reminder = {
  id: string;
  title: string;
  note?: string;
  // Ubicación (opcional si solo es por fecha)
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  // Fecha/hora (opcional si solo es por ubicación)
  scheduledDate?: string;
  scheduledTime?: string;
  // Configuración
  priority: ReminderPriority;
  reminderType: ReminderType;
  isEnabled: boolean;
  isCompleted: boolean;
  createdAt: string;
  lastTriggeredAt?: string;
  triggerHistory: TriggerRecord[];
};

type RemindersContextType = {
  reminders: Reminder[];
  isLoading: boolean;
  addReminder: (r: Omit<Reminder, "id" | "createdAt" | "triggerHistory" | "isCompleted">) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  toggleCompleted: (id: string) => Promise<void>;
  markTriggered: (id: string, type: "location" | "datetime") => Promise<void>;
  getStats: () => { total: number; active: number; completed: number; byPriority: Record<ReminderPriority, number> };
  getTopTriggered: (limit?: number) => Reminder[];
  getUpcoming: (limit?: number) => Reminder[];
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

  const addReminder = async (r: Omit<Reminder, "id" | "createdAt" | "triggerHistory" | "isCompleted">) => {
    const newR: Reminder = {
      ...r,
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
      triggerHistory: [],
      isCompleted: false,
    };
    await persist([newR, ...reminders]);
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    const updated = reminders.map(r => (r.id === id ? { ...r, ...updates } : r));
    await persist(updated);
  };

  const deleteReminder = async (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    await persist(updated);
  };

  const toggleReminder = async (id: string) => {
    const updated = reminders.map(r => (r.id === id ? { ...r, isEnabled: !r.isEnabled } : r));
    await persist(updated);
  };

  const toggleCompleted = async (id: string) => {
    const updated = reminders.map(r => (r.id === id ? { ...r, isCompleted: !r.isCompleted } : r));
    await persist(updated);
  };

  const markTriggered = async (id: string, type: "location" | "datetime") => {
    const now = new Date().toISOString();
    const updated = reminders.map(r =>
      r.id === id
        ? {
            ...r,
            lastTriggeredAt: now,
            triggerHistory: [...(r.triggerHistory || []), { triggeredAt: now, type }],
          }
        : r
    );
    await persist(updated);
  };

  const getStats = () => {
    const total = reminders.length;
    const active = reminders.filter(r => r.isEnabled && !r.isCompleted).length;
    const completed = reminders.filter(r => r.isCompleted).length;
    const byPriority: Record<ReminderPriority, number> = {
      high: reminders.filter(r => r.priority === "high").length,
      medium: reminders.filter(r => r.priority === "medium").length,
      low: reminders.filter(r => r.priority === "low").length,
    };
    return { total, active, completed, byPriority };
  };

  const getTopTriggered = (limit = 5) => {
    return [...reminders]
      .filter(r => (r.triggerHistory?.length || 0) > 0)
      .sort((a, b) => (b.triggerHistory?.length || 0) - (a.triggerHistory?.length || 0))
      .slice(0, limit);
  };

  const getUpcoming = (limit = 5) => {
    const now = new Date();
    return [...reminders]
      .filter(r => {
        if (!r.scheduledDate || r.isCompleted || !r.isEnabled) return false;
        const scheduled = new Date(`${r.scheduledDate}T${r.scheduledTime || "00:00"}`);
        return scheduled >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime || "00:00"}`);
        const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime || "00:00"}`);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, limit);
  };

  const value = useMemo(
    () => ({
      reminders,
      isLoading,
      addReminder,
      updateReminder,
      deleteReminder,
      toggleReminder,
      toggleCompleted,
      markTriggered,
      getStats,
      getTopTriggered,
      getUpcoming,
    }),
    [reminders, isLoading]
  );

  return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>;
};
