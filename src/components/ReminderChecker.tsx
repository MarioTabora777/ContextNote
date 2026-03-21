/**
 * ReminderChecker.tsx
 *
 * Componente invisible que verifica cada 30 segundos
 * si hay recordatorios por fecha que ya deberían activarse.
 * Muestra un Alert cuando encuentra coincidencias.
 */

import { useEffect, useRef } from "react";
import { Alert, AppState } from "react-native";
import { useReminders } from "../context/RemindersContext";

export default function ReminderChecker() {
  const { reminders, markTriggered, toggleCompleted } = useReminders();
  const appState = useRef(AppState.currentState);
  const lastCheck = useRef<string[]>([]); // IDs ya notificados

  useEffect(() => {
    // Funcion que verifica recordatorios
    const checkReminders = () => {
      const now = new Date();

      // Filtrar recordatorios que ya deberían activarse
      const hits = reminders.filter((r) => {
        // Ya fue notificado en esta sesion
        if (lastCheck.current.includes(r.id)) return false;

        // Debe estar habilitado y no completado
        if (!r.isEnabled || r.isCompleted) return false;

        // Debe ser tipo datetime o both
        if (r.reminderType === "location") return false;

        // Debe tener fecha
        if (!r.scheduledDate) return false;

        // Crear fecha en hora local
        const [year, month, day] = r.scheduledDate.split("-").map(Number);
        const [hours, minutes] = (r.scheduledTime || "00:00").split(":").map(Number);
        const scheduled = new Date(year, month - 1, day, hours, minutes);

        return scheduled <= now;
      });

      // Notificar cada uno
      if (hits.length > 0) {
        hits.forEach((r) => {
          // Marcar como notificado para no repetir
          lastCheck.current.push(r.id);

          // Registrar activacion
          markTriggered(r.id, "datetime");
        });

        // Mostrar Alert con todos los recordatorios
        const titles = hits.map((r) => `• ${r.title}`).join("\n");
        Alert.alert(
          "ContextNote - Recordatorio",
          hits.length === 1
            ? hits[0].title
            : `Tienes ${hits.length} recordatorios:\n${titles}`
        );
      }
    };

    // Verificar inmediatamente al montar
    checkReminders();

    // Verificar cada 30 segundos
    const interval = setInterval(checkReminders, 30000);

    // Tambien verificar cuando la app vuelve al frente
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
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
