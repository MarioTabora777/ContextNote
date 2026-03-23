/**
 * RemindersContext.tsx
 *
 * Contexto global para manejar los recordatorios de la app.
 * Usa Redux para el estado y AsyncStorage para persistir los datos.
 * Todas las pantallas acceden a los recordatorios a través de useReminders().
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../storage/keys";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import * as remindersActions from "../store/slices/remindersSlice";

// Re-exportar tipos desde el slice de Redux
export type { Reminder, ReminderPriority, ReminderType, TriggerRecord } from "../store/slices/remindersSlice";
import { Reminder, ReminderPriority } from "../store/slices/remindersSlice";

// Funciones disponibles en el contexto
type RemindersContextType = {
  reminders: Reminder[];
  isLoading: boolean;
  addReminder: (r: Omit<Reminder, "id" | "createdAt" | "triggerHistory" | "isCompleted">) => Promise<string>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  deleteAllReminders: () => Promise<void>;
  clearAllHistory: () => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  toggleCompleted: (id: string) => Promise<void>;
  markTriggered: (id: string, type: "location" | "datetime") => Promise<void>;
  getStats: () => { total: number; active: number; completed: number; byPriority: Record<ReminderPriority, number> };
  getTopTriggered: (limit?: number) => Reminder[];
  getUpcoming: (limit?: number) => Reminder[];
};

// ============ CONTEXTO ============

const RemindersContext = createContext<RemindersContextType | null>(null);

// Hook para usar el contexto en cualquier componente
export const useReminders = () => {
  const ctx = useContext(RemindersContext);
  if (!ctx) throw new Error("useReminders must be used within RemindersProvider");
  return ctx;
};

// ============ PROVIDER ============

export const RemindersProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const reminders = useAppSelector(state => state.reminders.reminders);
  const [isLoading, setIsLoading] = useState(true);

  // Función auxiliar: guarda en Redux Y en AsyncStorage
  const persist = async (data: Reminder[]) => {
    dispatch(remindersActions.setReminders(data));
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(data));
  };

  // Al montar el componente, cargamos los recordatorios guardados
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
        if (raw) {
          dispatch(remindersActions.setReminders(JSON.parse(raw)));
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [dispatch]);

  // ============ FUNCIONES CRUD (usando Redux) ============

  // Crear nuevo recordatorio - devuelve el ID generado
  const addReminder = async (r: Omit<Reminder, "id" | "createdAt" | "triggerHistory" | "isCompleted">): Promise<string> => {
    const id = String(Date.now());
    const newR: Reminder = {
      ...r,
      id,
      createdAt: new Date().toISOString(),
      triggerHistory: [],
      isCompleted: false,
    };
    dispatch(remindersActions.addReminder(newR));
    const updated = [newR, ...reminders];
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(updated));
    return id;
  };

  // Actualizar campos de un recordatorio existente
  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    const reminder = reminders.find(r => r.id === id);
    if (reminder) {
      dispatch(remindersActions.updateReminder({ ...reminder, ...updates }));
      const updated = reminders.map(r => (r.id === id ? { ...r, ...updates } : r));
      await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(updated));
    }
  };

  // Eliminar recordatorio
  const deleteReminder = async (id: string) => {
    dispatch(remindersActions.deleteReminder(id));
    const updated = reminders.filter(r => r.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(updated));
  };

  // Eliminar TODOS los recordatorios
  const deleteAllReminders = async () => {
    dispatch(remindersActions.clearReminders());
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify([]));
  };

  // Limpiar historial de activaciones de todos los recordatorios
  const clearAllHistory = async () => {
    dispatch(remindersActions.clearAllHistory());
    const updated = reminders.map(r => ({
      ...r,
      triggerHistory: [],
      lastTriggeredAt: undefined,
    }));
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(updated));
  };

  // Activar/desactivar recordatorio (switch)
  const toggleReminder = async (id: string) => {
    dispatch(remindersActions.toggleReminder(id));
    const updated = reminders.map(r => (r.id === id ? { ...r, isEnabled: !r.isEnabled } : r));
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(updated));
  };

  // Marcar como completado/pendiente
  const toggleCompleted = async (id: string) => {
    dispatch(remindersActions.toggleCompleted(id));
    const updated = reminders.map(r => (r.id === id ? { ...r, isCompleted: !r.isCompleted } : r));
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(updated));
  };

  // Registrar que el recordatorio se activó (para el historial)
  const markTriggered = async (id: string, type: "location" | "datetime") => {
    dispatch(remindersActions.markTriggered({ id, type }));
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
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(updated));
  };

  // ============ FUNCIONES DE ESTADÍSTICAS (para el Dashboard) ============

  // Obtener estadísticas generales
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

  // Obtener los recordatorios más activados (ordenados por cantidad de activaciones)
  const getTopTriggered = (limit = 5) => {
    return [...reminders]
      .filter(r => (r.triggerHistory?.length || 0) > 0)
      .sort((a, b) => (b.triggerHistory?.length || 0) - (a.triggerHistory?.length || 0))
      .slice(0, limit);
  };

  // Obtener próximos recordatorios por fecha (los que aún no han pasado)
  const getUpcoming = (limit = 5) => {
    const now = new Date();
    return [...reminders]
      .filter(r => {
        // Solo los que tienen fecha, están activos y no completados
        if (!r.scheduledDate || r.isCompleted || !r.isEnabled) return false;
        const scheduled = new Date(`${r.scheduledDate}T${r.scheduledTime || "00:00"}`);
        return scheduled >= now;  // Fecha futura
      })
      .sort((a, b) => {
        // Ordenar por fecha más cercana primero
        const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime || "00:00"}`);
        const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime || "00:00"}`);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, limit);
  };

  // Memorizamos el value para evitar re-renders innecesarios
  const value = useMemo(
    () => ({
      reminders,
      isLoading,
      addReminder,
      updateReminder,
      deleteReminder,
      deleteAllReminders,
      clearAllHistory,
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
