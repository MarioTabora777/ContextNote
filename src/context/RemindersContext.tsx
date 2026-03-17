/**
 * RemindersContext.tsx
 *
 * Contexto global para manejar los recordatorios de la app.
 * Usa AsyncStorage para persistir los datos localmente.
 * Todas las pantallas acceden a los recordatorios a través de useReminders().
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../storage/keys";

// ============ TIPOS ============

// Prioridad: afecta el color visual de la tarjeta
export type ReminderPriority = "high" | "medium" | "low";

// Tipo de recordatorio: define si se activa por ubicación, fecha/hora, o ambos
export type ReminderType = "location" | "datetime" | "both";

// Registro de cada vez que se activa un recordatorio (para el historial)
export type TriggerRecord = {
  triggeredAt: string;  // Fecha ISO cuando se activó
  type: "location" | "datetime";  // Cómo se activó
};

// Estructura principal de un recordatorio
export type Reminder = {
  id: string;
  title: string;
  note?: string;

  // Campos para recordatorios por UBICACIÓN (opcionales si es solo por fecha)
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;  // Radio en metros para detectar cercanía

  // Campos para recordatorios por FECHA/HORA (opcionales si es solo por ubicación)
  scheduledDate?: string;  // Formato: "2024-03-15"
  scheduledTime?: string;  // Formato: "14:30"

  // Configuración general
  priority: ReminderPriority;
  reminderType: ReminderType;
  isEnabled: boolean;      // Si está activo (switch on/off)
  isCompleted: boolean;    // Si ya se marcó como completado
  createdAt: string;
  lastTriggeredAt?: string;
  triggerHistory: TriggerRecord[];  // Historial de todas las activaciones
};

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
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Función auxiliar: guarda en estado Y en AsyncStorage
  const persist = async (data: Reminder[]) => {
    setReminders(data);
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(data));
  };

  // Al montar el componente, cargamos los recordatorios guardados
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

  // ============ FUNCIONES CRUD ============

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
    await persist([newR, ...reminders]);
    return id;
  };

  // Actualizar campos de un recordatorio existente
  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    const updated = reminders.map(r => (r.id === id ? { ...r, ...updates } : r));
    await persist(updated);
  };

  // Eliminar recordatorio
  const deleteReminder = async (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    await persist(updated);
  };

  // Eliminar TODOS los recordatorios
  const deleteAllReminders = async () => {
    await persist([]);
  };

  // Limpiar historial de activaciones de todos los recordatorios
  const clearAllHistory = async () => {
    const updated = reminders.map(r => ({
      ...r,
      triggerHistory: [],
      lastTriggeredAt: undefined,
    }));
    await persist(updated);
  };

  // Activar/desactivar recordatorio (switch)
  const toggleReminder = async (id: string) => {
    const updated = reminders.map(r => (r.id === id ? { ...r, isEnabled: !r.isEnabled } : r));
    await persist(updated);
  };

  // Marcar como completado/pendiente
  const toggleCompleted = async (id: string) => {
    const updated = reminders.map(r => (r.id === id ? { ...r, isCompleted: !r.isCompleted } : r));
    await persist(updated);
  };

  // Registrar que el recordatorio se activó (para el historial)
  const markTriggered = async (id: string, type: "location" | "datetime") => {
    const now = new Date().toISOString();
    const updated = reminders.map(r =>
      r.id === id
        ? {
            ...r,
            lastTriggeredAt: now,
            // Agregamos al historial de activaciones
            triggerHistory: [...(r.triggerHistory || []), { triggeredAt: now, type }],
          }
        : r
    );
    await persist(updated);
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
