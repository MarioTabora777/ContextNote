/**
 * hooks.ts
 *
 * Hooks de compatibilidad que mantienen la misma API que los contextos originales.
 * Esto permite migrar a Redux sin cambiar todos los componentes de golpe.
 */

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./index";
import * as authActions from "./authSlice";
import * as remindersActions from "./remindersSlice";
import type { Reminder } from "./remindersSlice";

// ============ useAuth - Compatible con AuthContext ============

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const isLoading = useAppSelector(state => state.auth.isLoading);
  const error = useAppSelector(state => state.auth.error);

  const login = useCallback(
    async (email: string, password: string) => {
      return dispatch(authActions.login(email, password));
    },
    [dispatch]
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      return dispatch(authActions.register(email, password, name));
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    return dispatch(authActions.logout());
  }, [dispatch]);

  return { user, isLoading, error, login, register, logout };
};

// ============ useReminders - Compatible con RemindersContext ============

export const useReminders = () => {
  const dispatch = useAppDispatch();
  const reminders = useAppSelector(remindersActions.selectReminders);
  const isLoading = useAppSelector(remindersActions.selectRemindersLoading);
  const stats = useAppSelector(remindersActions.selectStats);

  const addReminder = useCallback(
    async (reminder: Omit<Reminder, "id" | "createdAt" | "triggerHistory" | "isCompleted">) => {
      return dispatch(remindersActions.addReminder(reminder));
    },
    [dispatch]
  );

  const updateReminder = useCallback(
    async (id: string, updates: Partial<Reminder>) => {
      return dispatch(remindersActions.updateReminder(id, updates));
    },
    [dispatch]
  );

  const deleteReminder = useCallback(
    async (id: string) => {
      return dispatch(remindersActions.deleteReminder(id));
    },
    [dispatch]
  );

  const deleteAllReminders = useCallback(async () => {
    return dispatch(remindersActions.deleteAllReminders());
  }, [dispatch]);

  const clearAllHistory = useCallback(async () => {
    return dispatch(remindersActions.clearAllHistory());
  }, [dispatch]);

  const toggleReminder = useCallback(
    async (id: string) => {
      return dispatch(remindersActions.toggleReminder(id));
    },
    [dispatch]
  );

  const toggleCompleted = useCallback(
    async (id: string) => {
      return dispatch(remindersActions.toggleCompleted(id));
    },
    [dispatch]
  );

  const markTriggered = useCallback(
    async (id: string, type: "location" | "datetime") => {
      return dispatch(remindersActions.markTriggered(id, type));
    },
    [dispatch]
  );

  const getStats = useCallback(() => stats, [stats]);

  const getTopTriggered = useCallback(
    (limit = 5) => {
      return [...reminders]
        .filter(r => (r.triggerHistory?.length || 0) > 0)
        .sort((a, b) => (b.triggerHistory?.length || 0) - (a.triggerHistory?.length || 0))
        .slice(0, limit);
    },
    [reminders]
  );

  const getUpcoming = useCallback(
    (limit = 5) => {
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
    },
    [reminders]
  );

  return {
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
  };
};
