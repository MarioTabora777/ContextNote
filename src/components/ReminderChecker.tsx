/**
 * ReminderChecker.tsx
 *
 * Componente invisible que verifica cada 30 segundos
 * si hay recordatorios por fecha que ya deberían activarse.
 * Muestra notificaciones push reales cuando encuentra coincidencias.
 */

import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useReminders } from "../store/hooks";
import {
  notify,
  setupNotificationChannel,
  ensureNotificationsPermission,
} from "../utils/notifications";

export default function ReminderChecker() {
  const { reminders, markTriggered } = useReminders();
  const appState = useRef(AppState.currentState);
  const lastCheck = useRef<string[]>([]); // IDs ya notificados en esta sesión
  const initialized = useRef(false);

  // Configurar canal de notificaciones al montar
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setupNotificationChannel();
      ensureNotificationsPermission();
    }
  }, []);

  useEffect(() => {
    // Función que verifica recordatorios
    const checkReminders = async () => {
      const now = new Date();

      // Filtrar recordatorios que ya deberían activarse
      const hits = reminders.filter((r) => {
        // Ya fue notificado en esta sesión
        if (lastCheck.current.includes(r.id)) return false;

        // Debe estar habilitado y no completado
        if (!r.isEnabled || r.isCompleted) return false;

        // Debe ser tipo datetime o both
        if (r.reminderType === "location") return false;

        // Debe tener fecha
        if (!r.scheduledDate) return false;

        // Crear fecha en hora local
        const [year, month, day] = r.scheduledDate.split("-").map(Number);
        const [hours, minutes] = (r.scheduledTime || "00:00")
          .split(":")
          .map(Number);
        const scheduled = new Date(year, month - 1, day, hours, minutes);

        return scheduled <= now;
      });

      // Notificar cada uno
      if (hits.length > 0) {
        for (const r of hits) {
          // Marcar como notificado para no repetir
          lastCheck.current.push(r.id);

          // Registrar activación
          markTriggered(r.id, "datetime");

          // Enviar notificación push real
          await notify(
            "ContextNote",
            r.title + (r.note ? `\n${r.note}` : "")
          );
        }
      }
    };

    // Verificar inmediatamente al montar
    checkReminders();

    // Verificar cada 30 segundos
    const interval = setInterval(checkReminders, 30000);

    // También verificar cuando la app vuelve al frente
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        checkReminders();
      }
      appState.current = nextState;
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [reminders, markTriggered]);

  // Este componente no renderiza nada
  return null;
}
