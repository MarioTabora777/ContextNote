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
            state.reminders = action.payload;
        },
        addReminder: (state, action: PayloadAction<Reminder>) => {
            state.reminders.unshift(action.payload);
        },
        updateReminder: (state, action: PayloadAction<Reminder>) => {
            const index = state.reminders.findIndex(r => r.id === action.payload.id);
            if (index !== -1) {
                state.reminders[index] = action.payload;
            }
        },
        deleteReminder: (state, action: PayloadAction<string>) => {
            state.reminders = state.reminders.filter(r => r.id !== action.payload);
        },
        toggleReminder: (state, action: PayloadAction<string>) => {
            const index = state.reminders.findIndex(r => r.id === action.payload);
            if (index !== -1) {
                state.reminders[index].isEnabled = !state.reminders[index].isEnabled;
            }
        },
        toggleCompleted: (state, action: PayloadAction<string>) => {
            const index = state.reminders.findIndex(r => r.id === action.payload);
            if (index !== -1) {
                state.reminders[index].isCompleted = !state.reminders[index].isCompleted;
            }
        },
        markTriggered: (state, action: PayloadAction<{ id: string; type: "location" | "datetime" }>) => {
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
            state.reminders = state.reminders.map(r => ({
                ...r,
                triggerHistory: [],
                lastTriggeredAt: undefined,
            }));
        },
        clearReminders: () => initialState,
        selectReminder: (state, action: PayloadAction<Reminder | null>) => {
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
