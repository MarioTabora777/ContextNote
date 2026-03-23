import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../storage/keys";
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

// ============ HELPER: Persistir en AsyncStorage ============

const persistReminders = async (getState: () => RootState) => {
  const { reminders } = getState().reminders;
  await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
};

// ============ THUNKS (acciones asíncronas) ============

// Cargar recordatorios desde AsyncStorage
export const loadReminders = () => async (dispatch: AppDispatch) => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
    if (raw) {
      dispatch(setReminders(JSON.parse(raw)));
    } else {
      dispatch(setLoading(false));
    }
  } catch {
    dispatch(setLoading(false));
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
  await persistReminders(getState);
  return id;
};

// Actualizar recordatorio
export const updateReminder = (id: string, updates: Partial<Reminder>) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(updateReminderSync({ id, updates }));
    await persistReminders(getState);
  };

// Eliminar recordatorio
export const deleteReminder = (id: string) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(deleteReminderSync(id));
    await persistReminders(getState);
  };

// Eliminar todos los recordatorios
export const deleteAllReminders = () =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(deleteAllRemindersSync());
    await persistReminders(getState);
  };

// Limpiar todo el historial
export const clearAllHistory = () =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(clearAllHistorySync());
    await persistReminders(getState);
  };

// Toggle activar/desactivar
export const toggleReminder = (id: string) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(toggleReminderSync(id));
    await persistReminders(getState);
  };

// Toggle completado
export const toggleCompleted = (id: string) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(toggleCompletedSync(id));
    await persistReminders(getState);
  };

// Marcar como disparado
export const markTriggered = (id: string, type: "location" | "datetime") =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(markTriggeredSync({ id, type }));
    await persistReminders(getState);
  };

// ============ SELECTORES ============

export const selectReminders = (state: RootState) => state.reminders.reminders;
export const selectRemindersLoading = (state: RootState) => state.reminders.isLoading;

// Estadísticas
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

// Top disparados
export const selectTopTriggered = (limit = 5) => (state: RootState) => {
  return [...state.reminders.reminders]
    .filter(r => (r.triggerHistory?.length || 0) > 0)
    .sort((a, b) => (b.triggerHistory?.length || 0) - (a.triggerHistory?.length || 0))
    .slice(0, limit);
};

// Próximos recordatorios
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
