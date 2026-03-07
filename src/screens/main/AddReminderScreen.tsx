import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import CustomInput from "../../components/CusstomInput";
import CustomButton from "../../components/CustomButton";
import {
  useReminders,
  ReminderPriority,
  ReminderType,
} from "../../context/RemindersContext";
import DateTimePicker from "@react-native-community/datetimepicker";

const PRIORITY_OPTIONS: { value: ReminderPriority; label: string; color: string }[] = [
  { value: "high", label: "Alta", color: "#E53935" },
  { value: "medium", label: "Media", color: "#FB8C00" },
  { value: "low", label: "Baja", color: "#43A047" },
];

const TYPE_OPTIONS: { value: ReminderType; label: string; icon: string }[] = [
  { value: "location", label: "Por Ubicacion", icon: "location" },
  { value: "datetime", label: "Por Fecha/Hora", icon: "time" },
  { value: "both", label: "Ambos", icon: "layers" },
];

export default function AddReminderScreen({ navigation }: any) {
  const { addReminder } = useReminders();

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [radius, setRadius] = useState("300");
  const [priority, setPriority] = useState<ReminderPriority>("medium");
  const [reminderType, setReminderType] = useState<ReminderType>("location");

  // Ubicación
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState("Solicitando permiso...");

  // Fecha y hora
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (reminderType === "datetime") return;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationStatus("Permiso denegado");
          return;
        }
        setLocationStatus("Obteniendo ubicacion...");
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("Ubicacion obtenida");
      } catch (error) {
        setLocationStatus("Error al obtener ubicacion");
        console.log("Error ubicación:", error);
      }
    })();
  }, [reminderType]);

  const onSave = async () => {
    if (!title.trim()) return Alert.alert("Validacion", "Escribe un titulo.");

    // Validar ubicación si es necesaria
    if (reminderType !== "datetime") {
      if (!coords)
        return Alert.alert(
          "Ubicacion",
          "No se pudo obtener ubicacion. Verifica que el GPS este activo."
        );
      const r = Number(radius);
      if (Number.isNaN(r) || r < 50)
        return Alert.alert("Validacion", "Radio minimo recomendado: 50m");
    }

    // Formatear fecha/hora si es necesaria
    const scheduledDate =
      reminderType !== "location"
        ? date.toISOString().split("T")[0]
        : undefined;
    const scheduledTime =
      reminderType !== "location"
        ? time.toTimeString().slice(0, 5)
        : undefined;

    await addReminder({
      title: title.trim(),
      note: note.trim() || undefined,
      latitude: reminderType !== "datetime" ? coords?.lat : undefined,
      longitude: reminderType !== "datetime" ? coords?.lng : undefined,
      radiusMeters: reminderType !== "datetime" ? Number(radius) : undefined,
      scheduledDate,
      scheduledTime,
      priority,
      reminderType,
      isEnabled: true,
      lastTriggeredAt: undefined,
    });

    navigation.goBack();
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString("es-HN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatTime = (t: Date) =>
    t.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Nuevo recordatorio</Text>

      {/* Tipo de recordatorio */}
      <Text style={styles.label}>Tipo de recordatorio</Text>
      <View style={styles.typeRow}>
        {TYPE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.typeButton,
              reminderType === opt.value && styles.typeButtonActive,
            ]}
            onPress={() => setReminderType(opt.value)}
          >
            <Text
              style={[
                styles.typeButtonText,
                reminderType === opt.value && styles.typeButtonTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Campos básicos */}
      <CustomInput
        label="Titulo"
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

      {/* Prioridad */}
      <Text style={styles.label}>Prioridad</Text>
      <View style={styles.priorityRow}>
        {PRIORITY_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.priorityButton,
              { borderColor: opt.color },
              priority === opt.value && { backgroundColor: opt.color },
            ]}
            onPress={() => setPriority(opt.value)}
          >
            <Text
              style={[
                styles.priorityText,
                { color: priority === opt.value ? "#FFF" : opt.color },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sección de ubicación */}
      {reminderType !== "datetime" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicacion</Text>
          <CustomInput
            label="Radio en metros"
            value={radius}
            onChangeText={setRadius}
            placeholder="300"
            typeInput="numeric"
          />
          <Text style={styles.coords}>
            {coords
              ? `Lat: ${coords.lat.toFixed(5)}, Lng: ${coords.lng.toFixed(5)}`
              : locationStatus}
          </Text>
        </View>
      )}

      {/* Sección de fecha/hora */}
      {reminderType !== "location" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fecha y Hora</Text>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonLabel}>Fecha:</Text>
            <Text style={styles.dateButtonValue}>{formatDate(date)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.dateButtonLabel}>Hora:</Text>
            <Text style={styles.dateButtonValue}>{formatTime(time)}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={new Date()}
              onChange={(_, selectedDate) => {
                setShowDatePicker(Platform.OS === "ios");
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, selectedTime) => {
                setShowTimePicker(Platform.OS === "ios");
                if (selectedTime) setTime(selectedTime);
              }}
            />
          )}
        </View>
      )}

      {/* Botones */}
      <View style={styles.buttons}>
        <CustomButton title="Guardar" onPress={onSave} />
        <View style={{ height: 10 }} />
        <CustomButton
          title="Cancelar"
          variant="secondary"
          onPress={() => navigation.goBack()}
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: "#F5F7FA" },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 16, color: "#263238" },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#546E7A",
    marginTop: 12,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#ECEFF1",
    alignItems: "center",
  },
  typeButtonActive: {
    backgroundColor: "#4A90D9",
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#546E7A",
  },
  typeButtonTextActive: {
    color: "#FFFFFF",
  },
  priorityRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
  },
  priorityText: {
    fontSize: 13,
    fontWeight: "700",
  },
  section: {
    marginTop: 16,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#37474F",
    marginBottom: 10,
  },
  coords: { marginTop: 6, color: "#78909C", fontSize: 13 },
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ECEFF1",
  },
  dateButtonLabel: {
    fontSize: 14,
    color: "#546E7A",
  },
  dateButtonValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A90D9",
  },
  buttons: {
    marginTop: 24,
  },
});
