

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../storage/keys";
import { supabase, DbReminder } from "../services/supabase";
import { AppDispatch, RootState } from "./index";

// ============ TIPOS ============

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
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  scheduledDate?: string;
  scheduledTime?: string;
  priority: ReminderPriority;
  reminderType: ReminderType;
  isEnabled: boolean;
  isCompleted: boolean;
  createdAt: string;
  lastTriggeredAt?: string;
  triggerHistory: TriggerRecord[];
};

type RemindersState = {
  reminders: Reminder[];
  isLoading: boolean;
};

// ============ HELPERS ============

// Convertir de DB a App
const fromDb = (db: DbReminder): Reminder => ({
  id: db.id,
  title: db.title,
  note: db.note || undefined,
  latitude: db.latitude || undefined,
  longitude: db.longitude || undefined,
  radiusMeters: db.radius_meters || undefined,
  scheduledDate: db.scheduled_date || undefined,
  scheduledTime: db.scheduled_time || undefined,
  priority: db.priority,
  reminderType: db.reminder_type,
  isEnabled: db.is_enabled,
  isCompleted: db.is_completed,
  createdAt: db.created_at,
  lastTriggeredAt: db.last_triggered_at || undefined,
  triggerHistory: db.trigger_history || [],
});

// Convertir de App a DB
const toDb = (r: Reminder, userId: string): Omit<DbReminder, "created_at"> => ({
  id: r.id,
  user_id: userId,
  title: r.title,
  note: r.note || null,
  latitude: r.latitude || null,
  longitude: r.longitude || null,
  radius_meters: r.radiusMeters || null,
  scheduled_date: r.scheduledDate || null,
  scheduled_time: r.scheduledTime || null,
  priority: r.priority,
  reminder_type: r.reminderType,
  is_enabled: r.isEnabled,
  is_completed: r.isCompleted,
  last_triggered_at: r.lastTriggeredAt || null,
  trigger_history: r.triggerHistory,
});

// ============ ESTADO INICIAL ============

const initialState: RemindersState = {
  reminders: [],
  isLoading: true,
};

// ============ SLICE ============

const remindersSlice = createSlice({
  name: "reminders",
  initialState,
  reducers: {
    setReminders: (state, action: PayloadAction<Reminder[]>) => {
      state.reminders = action.payload;
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    addReminderSync: (state, action: PayloadAction<Reminder>) => {
      state.reminders = [action.payload, ...state.reminders];
    },
    updateReminderSync: (state, action: PayloadAction<{ id: string; updates: Partial<Reminder> }>) => {
      const index = state.reminders.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.reminders[index] = { ...state.reminders[index], ...action.payload.updates };
      }
    },
    deleteReminderSync: (state, action: PayloadAction<string>) => {
      state.reminders = state.reminders.filter(r => r.id !== action.payload);
    },
    deleteAllRemindersSync: (state) => {
      state.reminders = [];
    },
    clearAllHistorySync: (state) => {
      state.reminders = state.reminders.map(r => ({
        ...r,
        triggerHistory: [],
        lastTriggeredAt: undefined,
      }));
    },
    toggleReminderSync: (state, action: PayloadAction<string>) => {
      const index = state.reminders.findIndex(r => r.id === action.payload);
      if (index !== -1) {
        state.reminders[index].isEnabled = !state.reminders[index].isEnabled;
      }
    },
    toggleCompletedSync: (state, action: PayloadAction<string>) => {
      const index = state.reminders.findIndex(r => r.id === action.payload);
      if (index !== -1) {
        state.reminders[index].isCompleted = !state.reminders[index].isCompleted;
      }
    },
    markTriggeredSync: (state, action: PayloadAction<{ id: string; type: "location" | "datetime" }>) => {
      const index = state.reminders.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        const now = new Date().toISOString();
        state.reminders[index].lastTriggeredAt = now;
        state.reminders[index].triggerHistory.push({
          triggeredAt: now,
          type: action.payload.type,
        });
      }
    },
  },
});

export const {
  setReminders,
  setLoading,
  addReminderSync,
  updateReminderSync,
  deleteReminderSync,
  deleteAllRemindersSync,
  clearAllHistorySync,
  toggleReminderSync,
  toggleCompletedSync,
  markTriggeredSync,
} = remindersSlice.actions;

// ============ HELPER: Persistir localmente ============

const persistLocal = async (getState: () => RootState) => {
  const { reminders } = getState().reminders;
  await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
};

// ============ THUNKS ============

// Cargar recordatorios desde Supabase (o local si no hay conexión)
export const loadReminders = () => async (dispatch: AppDispatch, getState: () => RootState) => {
  try {
    const user = getState().auth.user;

    if (user) {
      // Intentar cargar desde Supabase
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const reminders = data.map(fromDb);
        dispatch(setReminders(reminders));
        // Guardar copia local
        await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
        return;
      }
    }

    // Fallback: cargar desde local
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
    if (raw) {
      dispatch(setReminders(JSON.parse(raw)));
    } else {
      dispatch(setLoading(false));
    }
  } catch {
    // Fallback local
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
    if (raw) {
      dispatch(setReminders(JSON.parse(raw)));
    } else {
      dispatch(setLoading(false));
    }
  }
};

// Agregar recordatorio
export const addReminder = (
  reminder: Omit<Reminder, "id" | "createdAt" | "triggerHistory" | "isCompleted">
) => async (dispatch: AppDispatch, getState: () => RootState): Promise<string> => {
  const id = String(Date.now());
  const newReminder: Reminder = {
    ...reminder,
    id,
    createdAt: new Date().toISOString(),
    triggerHistory: [],
    isCompleted: false,
  };

  dispatch(addReminderSync(newReminder));
  await persistLocal(getState);

  // Sincronizar con Supabase
  const user = getState().auth.user;
  if (user) {
    await supabase.from("reminders").insert(toDb(newReminder, user.id));
  }

  return id;
};

// Actualizar recordatorio
export const updateReminder = (id: string, updates: Partial<Reminder>) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(updateReminderSync({ id, updates }));
    await persistLocal(getState);

    // Sincronizar con Supabase
    const user = getState().auth.user;
    if (user) {
      const reminder = getState().reminders.reminders.find(r => r.id === id);
      if (reminder) {
        await supabase.from("reminders").upsert(toDb(reminder, user.id));
      }
    }
  };

// Eliminar recordatorio
export const deleteReminder = (id: string) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(deleteReminderSync(id));
    await persistLocal(getState);

    // Sincronizar con Supabase
    await supabase.from("reminders").delete().eq("id", id);
  };

// Eliminar todos los recordatorios
export const deleteAllReminders = () =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const user = getState().auth.user;
    dispatch(deleteAllRemindersSync());
    await persistLocal(getState);

    // Sincronizar con Supabase
    if (user) {
      await supabase.from("reminders").delete().eq("user_id", user.id);
    }
  };

// Limpiar historial
export const clearAllHistory = () =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(clearAllHistorySync());
    await persistLocal(getState);

    // Sincronizar con Supabase
    const user = getState().auth.user;
    if (user) {
      const reminders = getState().reminders.reminders;
      for (const r of reminders) {
        await supabase.from("reminders").update({
          trigger_history: [],
          last_triggered_at: null,
        }).eq("id", r.id);
      }
    }
  };

// Toggle activar/desactivar
export const toggleReminder = (id: string) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(toggleReminderSync(id));
    await persistLocal(getState);

    const reminder = getState().reminders.reminders.find(r => r.id === id);
    if (reminder) {
      await supabase.from("reminders").update({ is_enabled: reminder.isEnabled }).eq("id", id);
    }
  };

// Toggle completado
export const toggleCompleted = (id: string) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(toggleCompletedSync(id));
    await persistLocal(getState);

    const reminder = getState().reminders.reminders.find(r => r.id === id);
    if (reminder) {
      await supabase.from("reminders").update({ is_completed: reminder.isCompleted }).eq("id", id);
    }
  };

// Marcar como disparado
export const markTriggered = (id: string, type: "location" | "datetime") =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(markTriggeredSync({ id, type }));
    await persistLocal(getState);

    const reminder = getState().reminders.reminders.find(r => r.id === id);
    if (reminder) {
      await supabase.from("reminders").update({
        trigger_history: reminder.triggerHistory,
        last_triggered_at: reminder.lastTriggeredAt,
      }).eq("id", id);
    }
  };

// ============ SELECTORES ============

export const selectReminders = (state: RootState) => state.reminders.reminders;
export const selectRemindersLoading = (state: RootState) => state.reminders.isLoading;

export const selectStats = (state: RootState) => {
  const reminders = state.reminders.reminders;
  return {
    total: reminders.length,
    active: reminders.filter(r => r.isEnabled && !r.isCompleted).length,
    completed: reminders.filter(r => r.isCompleted).length,
    byPriority: {
      high: reminders.filter(r => r.priority === "high").length,
      medium: reminders.filter(r => r.priority === "medium").length,
      low: reminders.filter(r => r.priority === "low").length,
    },
  };
};

export const selectTopTriggered = (limit = 5) => (state: RootState) => {
  return [...state.reminders.reminders]
    .filter(r => (r.triggerHistory?.length || 0) > 0)
    .sort((a, b) => (b.triggerHistory?.length || 0) - (a.triggerHistory?.length || 0))
    .slice(0, limit);
};

export const selectUpcoming = (limit = 5) => (state: RootState) => {
  const now = new Date();
  return [...state.reminders.reminders]
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

export default remindersSlice.reducer;
