import Constants from "expo-constants";

// En Expo Go las push notifications no funcionan, entonces las cargo dinamicamente
const isExpoGo = Constants.appOwnership === "expo";

let Notifications: typeof import("expo-notifications") | null = null;

async function getNotifications() {
  if (!Notifications && !isExpoGo) {
    Notifications = await import("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
  return Notifications;
}

// Pido permisos de notificaciones
export async function ensureNotificationsPermission(): Promise<boolean> {
  const notif = await getNotifications();
  if (!notif) return true;

  const settings = await notif.getPermissionsAsync();
  if (settings.status !== "granted") {
    const req = await notif.requestPermissionsAsync();
    return req.status === "granted";
  }
  return true;
}

// Envio una notificacion local
export async function notify(title: string, body: string): Promise<void> {
  const notif = await getNotifications();
  if (!notif) {
    console.log("Notificacion simulada:", title, body);
    return;
  }

  await notif.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}
