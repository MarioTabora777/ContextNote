import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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

interface RemindersState {
    reminders: Reminder[];
    selectedReminder: Reminder | null;
}

const initialState: RemindersState = {
    reminders: [],
    selectedReminder: null,
};

const remindersSlice = createSlice({
    name: 'reminders',
    initialState,
    reducers: {
        setReminders: (state, action: PayloadAction<Reminder[]>) => {
            console.log("[REDUX] setReminders - Cargando recordatorios:", action.payload.length);
            state.reminders = action.payload;
        },
        addReminder: (state, action: PayloadAction<Reminder>) => {
            console.log("[REDUX] addReminder - Nuevo recordatorio:", action.payload.title);
            console.log("[REDUX] Estado anterior:", state.reminders.length, "recordatorios");
            state.reminders.unshift(action.payload);
            console.log("[REDUX] Estado nuevo:", state.reminders.length, "recordatorios");
        },
        updateReminder: (state, action: PayloadAction<Reminder>) => {
            console.log("[REDUX] updateReminder - Actualizando:", action.payload.id);
            const index = state.reminders.findIndex(r => r.id === action.payload.id);
            if (index !== -1) {
                state.reminders[index] = action.payload;
            }
        },
        deleteReminder: (state, action: PayloadAction<string>) => {
            console.log("[REDUX] deleteReminder - Eliminando ID:", action.payload);
            console.log("[REDUX] Estado anterior:", state.reminders.length, "recordatorios");
            state.reminders = state.reminders.filter(r => r.id !== action.payload);
            console.log("[REDUX] Estado nuevo:", state.reminders.length, "recordatorios");
        },
        toggleReminder: (state, action: PayloadAction<string>) => {
            const index = state.reminders.findIndex(r => r.id === action.payload);
            if (index !== -1) {
                const newState = !state.reminders[index].isEnabled;
                console.log("[REDUX] toggleReminder - ID:", action.payload, "-> isEnabled:", newState);
                state.reminders[index].isEnabled = newState;
            }
        },
        toggleCompleted: (state, action: PayloadAction<string>) => {
            const index = state.reminders.findIndex(r => r.id === action.payload);
            if (index !== -1) {
                const newState = !state.reminders[index].isCompleted;
                console.log("[REDUX] toggleCompleted - ID:", action.payload, "-> isCompleted:", newState);
                state.reminders[index].isCompleted = newState;
            }
        },
        markTriggered: (state, action: PayloadAction<{ id: string; type: "location" | "datetime" }>) => {
            console.log("[REDUX] markTriggered - ID:", action.payload.id, "Tipo:", action.payload.type);
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
        clearAllHistory: (state) => {
            console.log("[REDUX] clearAllHistory - Limpiando historial de todos los recordatorios");
            state.reminders = state.reminders.map(r => ({
                ...r,
                triggerHistory: [],
                lastTriggeredAt: undefined,
            }));
        },
        clearReminders: () => {
            console.log("[REDUX] clearReminders - Eliminando todos los recordatorios");
            return initialState;
        },
        selectReminder: (state, action: PayloadAction<Reminder | null>) => {
            console.log("[REDUX] selectReminder:", action.payload?.title || "null");
            state.selectedReminder = action.payload;
        },
    },
});

export const {
    setReminders,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
    toggleCompleted,
    markTriggered,
    clearAllHistory,
    clearReminders,
    selectReminder
} = remindersSlice.actions;

export default remindersSlice.reducer;
