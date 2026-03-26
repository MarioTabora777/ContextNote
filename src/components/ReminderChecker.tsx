/**
 * ReminderChecker.tsx - COMPONENTE CORE DE LA APP
 *
 * Este es el "cerebro" de ContextNote. Verifica cada 30 segundos:
 * 1. Recordatorios por FECHA/HORA → ¿Ya pasó la fecha programada?
 * 2. Recordatorios por UBICACIÓN → ¿El usuario está cerca? (GEOFENCING)
 *
 * GEOFENCING: Técnica que crea "cercas virtuales" alrededor de ubicaciones.
 * Cuando el usuario entra en el radio definido, se dispara una notificación.
 *
 * ARQUITECTURA:
 * - Es un componente "headless" (no renderiza UI, retorna null)
 * - Se monta en App.tsx y corre en background mientras la app está abierta
 * - Usa useRef para evitar notificaciones duplicadas en la misma sesión
 * - Se reactiva cuando la app vuelve del background (AppState listener)
 *
 * FLUJO GEOFENCING:
 * 1. Obtiene ubicación actual del usuario (GPS)
 * 2. Para cada recordatorio tipo "location", calcula distancia con Haversine
 * 3. Si distancia <= radio → dispara notificación push
 */

import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import * as Location from "expo-location";
import { useReminders } from "../store/hooks";
import {
  notify,
  setupNotificationChannel,
  ensureNotificationsPermission,
} from "../utils/notifications";
import { distanceMeters } from "../utils/geo";

export default function ReminderChecker() {
  const { reminders, markTriggered } = useReminders();
  const appState = useRef(AppState.currentState);
  const lastCheckDatetime = useRef<string[]>([]); // IDs notificados por fecha
  const lastCheckLocation = useRef<string[]>([]); // IDs notificados por ubicación
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
    // ============ VERIFICAR RECORDATORIOS POR FECHA/HORA ============
    const checkDatetimeReminders = async () => {
      const now = new Date();

      const hits = reminders.filter((r) => {
        if (lastCheckDatetime.current.includes(r.id)) return false;
        if (!r.isEnabled || r.isCompleted) return false;
        if (r.reminderType === "location") return false;
        if (!r.scheduledDate) return false;

        const [year, month, day] = r.scheduledDate.split("-").map(Number);
        const [hours, minutes] = (r.scheduledTime || "00:00")
          .split(":")
          .map(Number);
        const scheduled = new Date(year, month - 1, day, hours, minutes);

        return scheduled <= now;
      });

      for (const r of hits) {
        lastCheckDatetime.current.push(r.id);
        markTriggered(r.id, "datetime");
        await notify(
          "ContextNote - Recordatorio",
          r.title + (r.note ? `\n${r.note}` : "")
        );
      }
    };

    // ============ VERIFICAR RECORDATORIOS POR UBICACIÓN (GEOFENCING) ============
    const checkLocationReminders = async () => {
      try {
        // Verificar permisos de ubicación
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted") return;

        // Obtener ubicación actual
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        // Filtrar recordatorios por ubicación
        const locationReminders = reminders.filter((r) => {
          if (lastCheckLocation.current.includes(r.id)) return false;
          if (!r.isEnabled || r.isCompleted) return false;
          if (r.reminderType === "datetime") return false;
          if (!r.latitude || !r.longitude) return false;
          return true;
        });

        for (const r of locationReminders) {
          // Calcular distancia entre usuario y recordatorio
          const distance = distanceMeters(
            userLat,
            userLng,
            r.latitude!,
            r.longitude!
          );

          const radius = r.radiusMeters || 300;

          // Si está dentro del radio, notificar
          if (distance <= radius) {
            lastCheckLocation.current.push(r.id);
            markTriggered(r.id, "location");
            await notify(
              "ContextNote - Llegaste al lugar",
              r.title + (r.note ? `\n${r.note}` : "")
            );
          }
        }
      } catch (error) {
        // Silenciar errores de ubicación para no molestar al usuario
        console.log("Error verificando ubicación:", error);
      }
    };

    // ============ FUNCIÓN PRINCIPAL ============
    const checkAllReminders = async () => {
      await checkDatetimeReminders();
      await checkLocationReminders();
    };

    // Verificar inmediatamente al montar
    checkAllReminders();

    // Verificar cada 30 segundos
    const interval = setInterval(checkAllReminders, 30000);

    // También verificar cuando la app vuelve al frente
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        checkAllReminders();
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
