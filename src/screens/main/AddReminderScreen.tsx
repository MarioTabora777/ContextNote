import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import * as Location from "expo-location";
import CustomInput from "../../components/CusstomInput";
import CustomButton from "../../components/CustomButton";
import { useReminders } from "../../context/RemindersContext";

export default function AddReminderScreen({ navigation }: any) {
  const { addReminder } = useReminders();

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [radius, setRadius] = useState("300");

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState("Solicitando permiso...");

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setLocationStatus("Permiso denegado");
          return;
        }

        setLocationStatus("Obteniendo ubicación...");

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });

        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("Ubicación obtenida");
      } catch (error) {
        setLocationStatus("Error al obtener ubicación");
        console.log("Error ubicación:", error);
      }
    })();
  }, []);

  const onSave = async () => {
    if (!title.trim()) return Alert.alert("Validación", "Escribe un título.");
    if (!coords) return Alert.alert("Ubicación", "No se pudo obtener ubicación. Verifica que el GPS esté activo.");

    const r = Number(radius);
    if (Number.isNaN(r) || r < 50) return Alert.alert("Validación", "Radio mínimo recomendado: 50m");

    await addReminder({
      title: title.trim(),
      note: note.trim(),
      latitude: coords.lat,
      longitude: coords.lng,
      radiusMeters: r,
      isEnabled: true,
      lastTriggeredAt: undefined,
    });

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nuevo recordatorio</Text>

      <CustomInput
        label="Título"
        value={title}
        onChangeText={setTitle}
        placeholder="Ej: Comprar leche"
        typeInput="text"
      />
      <CustomInput
        label="Nota (opcional)"
        value={note}
        onChangeText={setNote}
        placeholder="Detalles..."
        typeInput="text"
      />
      <CustomInput
        label="Radio en metros"
        value={radius}
        onChangeText={setRadius}
        placeholder="300"
        typeInput="numeric"
      />

      <Text style={styles.coords}>
        {coords
          ? `Ubicación: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
          : locationStatus}
      </Text>

      <CustomButton title="Guardar" onPress={onSave} />
      <View style={{ height: 10 }} />
      <CustomButton title="Cancelar" variant="secondary" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18 },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 14 },
  coords: { marginTop: 6, marginBottom: 16, color: "#546E7A" },
});
