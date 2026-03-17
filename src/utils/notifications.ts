import { Alert } from "react-native";

// Version simplificada - solo usa Alerts, no depende de expo-notifications

// Siempre retorna true (no necesitamos permisos para Alerts)
export async function ensureNotificationsPermission(): Promise<boolean> {
  return true;
}

// Muestra un Alert inmediatamente
export async function notify(title: string, body: string): Promise<void> {
  Alert.alert(title, body);
}

// No programa nada real, solo guarda el recordatorio
export async function scheduleNotification(
  id: string,
  title: string,
  body: string,
  scheduledDate: string,
  scheduledTime: string
): Promise<string | null> {
  console.log("Recordatorio guardado:", title, "para", scheduledDate, scheduledTime);
  return id;
}

// No hace nada (no hay notificaciones que cancelar)
export async function cancelNotification(id: string): Promise<void> {
  // No-op
}

// No hace nada
export async function cancelAllNotifications(): Promise<void> {
  // No-op
}
