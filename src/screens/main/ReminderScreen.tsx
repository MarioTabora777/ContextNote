import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Alert } from "react-native";
import * as Location from "expo-location";
import { useReminders } from "../../context/RemindersContext";
import CustomButton from "../../components/CustomButton";
import ReminderCard from "../../components/ReminderCard";
import { distanceMeters } from "../../utils/geo";
import { ensureNotificationsPermission, notify } from "../../utils/notifications";

export default function RemindersScreen({ navigation }: any) {
  const { reminders, toggleReminder, markTriggered } = useReminders();
  const [hasLocation, setHasLocation] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocation(status === "granted");
    })();
  }, []);

  const checkLocationNow = async () => {
    if (!hasLocation) return Alert.alert("Permiso", "Habilita permisos de ubicación.");

    const notifOk = await ensureNotificationsPermission();
    if (!notifOk) return Alert.alert("Permiso", "Habilita permisos de notificaciones.");

    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = pos.coords;

    // Buscar recordatorios activados dentro del radio
    const hits = reminders.filter(r => {
      if (!r.isEnabled) return false;
      const d = distanceMeters(latitude, longitude, r.latitude, r.longitude);
      return d <= r.radiusMeters;
    });

    if (hits.length === 0) {
      return Alert.alert("Sin coincidencias", "No hay recordatorios cerca de tu ubicación actual.");
    }

    // Notificar todos (para demo). Puedes limitar a 1.
    for (const r of hits) {
      await notify("ContextNote", `Recordatorio: ${r.title}`);
      await markTriggered(r.id);
    }

    Alert.alert("Listo", `Se activaron ${hits.length} recordatorio(s).`);
  };

  return (
    <View style={styles.container}>
      <View style={{ gap: 10 }}>
        <CustomButton title="Agregar recordatorio" onPress={() => navigation.navigate("AddReminder")} />
        <CustomButton title="Verificar ubicación (demo)" variant="secondary" onPress={checkLocationNow} />
      </View>

      <Text style={styles.hint}>
        *Para la demostración: crea un recordatorio usando tu ubicación actual y un radio (ej. 300m),
        luego toca “Verificar ubicación”.
      </Text>

      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <ReminderCard
            reminder={item}
            onToggle={() => toggleReminder(item.id)}
          />
        )}
        ListEmptyComponent={<Text style={{ marginTop: 16 }}>No hay recordatorios aún.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18 },
  hint: { marginTop: 12, color: "#546E7A" },
});