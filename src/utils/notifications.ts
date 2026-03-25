/**
 * notifications.ts
 *
 * Servicio de notificaciones con fallback para Expo Go.
 * - En Expo Go: usa Alert (limitado pero funciona)
 * - En APK/Development Build: usa expo-notifications (completo)
 */

import { Alert, Platform } from "react-native";
import Constants from "expo-constants";

// Detectar si estamos en Expo Go
const isExpoGo = Constants.appOwnership === "expo";

// Variables para el módulo de notificaciones (cargado dinámicamente)
let Notifications: typeof import("expo-notifications") | null = null;

// Cargar expo-notifications solo si NO estamos en Expo Go
if (!isExpoGo) {
  try {
    Notifications = require("expo-notifications");

    // Configurar comportamiento cuando llega notificación con app en primer plano
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    console.log("expo-notifications no disponible, usando fallback");
  }
}

/**
 * Solicita permisos de notificaciones.
 */
export async function ensureNotificationsPermission(): Promise<boolean> {
  if (!Notifications) return true; // En Expo Go no necesitamos permisos para Alert

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Muestra una notificación inmediatamente.
 */
export async function notify(title: string, body: string): Promise<void> {
  if (!Notifications) {
    // Fallback: usar Alert en Expo Go
    Alert.alert(title, body);
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
}

/**
 * Programa una notificación para una fecha/hora específica.
 */
export async function scheduleNotification(
  id: string,
  title: string,
  body: string,
  scheduledDate: string,
  scheduledTime: string
): Promise<string | null> {
  // En Expo Go no podemos programar, solo guardamos el recordatorio
  if (!Notifications) {
    console.log(`[Expo Go] Recordatorio guardado: ${title} para ${scheduledDate} ${scheduledTime}`);
    return id;
  }

  try {
    const [year, month, day] = scheduledDate.split("-").map(Number);
    const [hours, minutes] = (scheduledTime || "00:00").split(":").map(Number);
    const triggerDate = new Date(year, month - 1, day, hours, minutes);

    if (triggerDate <= new Date()) {
      console.log("Fecha ya pasó, no se programa notificación");
      return null;
    }

    await cancelNotification(id);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { reminderId: id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
      identifier: id,
    });

    console.log(`Notificación programada: ${title} para ${triggerDate.toLocaleString()}`);
    return notificationId;
  } catch (error) {
    console.error("Error programando notificación:", error);
    return null;
  }
}

/**
 * Cancela una notificación programada.
 */
export async function cancelNotification(id: string): Promise<void> {
  if (!Notifications) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (error) {
    // Ignorar si no existe
  }
}

/**
 * Cancela todas las notificaciones programadas.
 */
export async function cancelAllNotifications(): Promise<void> {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Configura el canal de notificaciones para Android.
 */
export async function setupNotificationChannel(): Promise<void> {
  if (!Notifications || Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("reminders", {
    name: "Recordatorios",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#4A90D9",
    sound: "default",
  });
}

/**
 * Indica si las notificaciones nativas están disponibles.
 */
export function isNotificationsAvailable(): boolean {
  return Notifications !== null;
}
