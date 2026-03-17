/**
 * AddReminderScreen.tsx
 *
 * Formulario para crear o editar un recordatorio.
 * Permite elegir:
 * - Tipo: por ubicación, por fecha/hora, o ambos
 * - Prioridad: alta, media, baja
 * - Ubicación actual (con GPS)
 * - Fecha y hora (con DateTimePicker)
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomInput from "../../components/CusstomInput";
import CustomButton from "../../components/CustomButton";
import LocationPicker from "../../components/LocationPicker";
import {
  useReminders,
  ReminderPriority,
  ReminderType,
  Reminder,
} from "../../context/RemindersContext";
import { scheduleNotification, ensureNotificationsPermission, cancelNotification } from "../../utils/notifications";

// Opciones de prioridad con sus colores
const PRIORITY_OPTIONS: { value: ReminderPriority; label: string; color: string }[] = [
  { value: "high", label: "Alta", color: "#E53935" },
  { value: "medium", label: "Media", color: "#FB8C00" },
  { value: "low", label: "Baja", color: "#43A047" },
];

// Opciones de tipo de recordatorio
const TYPE_OPTIONS: { value: ReminderType; label: string; icon: string }[] = [
  { value: "location", label: "Por Ubicacion", icon: "location" },
  { value: "datetime", label: "Por Fecha/Hora", icon: "time" },
  { value: "both", label: "Ambos", icon: "layers" },
];

export default function AddReminderScreen({ navigation, route }: any) {
  const { addReminder, updateReminder } = useReminders();

  // Obtener recordatorio existente si estamos en modo edición
  const existingReminder: Reminder | undefined = route.params?.reminder;
  const isEditing = !!existingReminder;

  // ============ ESTADOS DEL FORMULARIO ============
  const [title, setTitle] = useState(existingReminder?.title || "");
  const [note, setNote] = useState(existingReminder?.note || "");
  const [radius, setRadius] = useState(String(existingReminder?.radiusMeters || 300));
  const [priority, setPriority] = useState<ReminderPriority>(existingReminder?.priority || "medium");
  const [reminderType, setReminderType] = useState<ReminderType>(existingReminder?.reminderType || "location");

  // Estados para ubicación GPS
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    existingReminder?.latitude && existingReminder?.longitude
      ? { lat: existingReminder.latitude, lng: existingReminder.longitude }
      : null
  );

  // Estados para fecha y hora
  const [date, setDate] = useState(() => {
    if (existingReminder?.scheduledDate) {
      return new Date(`${existingReminder.scheduledDate}T00:00`);
    }
    return new Date();
  });
  const [time, setTime] = useState(() => {
    if (existingReminder?.scheduledTime) {
      const [hours, minutes] = existingReminder.scheduledTime.split(":");
      const t = new Date();
      t.setHours(parseInt(hours), parseInt(minutes));
      return t;
    }
    return new Date();
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // ============ GUARDAR RECORDATORIO ============
  const onSave = async () => {
    // Validar título
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

    // Preparar fecha/hora en formato string (solo si aplica)
    // Usamos formato local para evitar problemas de zona horaria
    const scheduledDate =
      reminderType !== "location"
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
        : undefined;
    const scheduledTime =
      reminderType !== "location"
        ? time.toTimeString().slice(0, 5)
        : undefined;

    if (isEditing && existingReminder) {
      // MODO EDICIÓN: actualizar recordatorio existente
      await updateReminder(existingReminder.id, {
        title: title.trim(),
        note: note.trim() || undefined,
        latitude: reminderType !== "datetime" ? coords?.lat : undefined,
        longitude: reminderType !== "datetime" ? coords?.lng : undefined,
        radiusMeters: reminderType !== "datetime" ? Number(radius) : undefined,
        scheduledDate,
        scheduledTime,
        priority,
        reminderType,
      });

      // Reprogramar notificación si tiene fecha/hora
      if (scheduledDate && scheduledTime && reminderType !== "location") {
        await cancelNotification(existingReminder.id);
        const hasPermission = await ensureNotificationsPermission();
        if (hasPermission) {
          await scheduleNotification(
            existingReminder.id,
            "ContextNote - Recordatorio",
            title.trim(),
            scheduledDate,
            scheduledTime
          );
        }
      } else {
        // Si ya no tiene fecha, cancelar notificación existente
        await cancelNotification(existingReminder.id);
      }
    } else {
      // MODO CREAR: nuevo recordatorio
      const reminderId = await addReminder({
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

      // Si tiene fecha/hora, programar notificación
      if (scheduledDate && scheduledTime && reminderType !== "location") {
        const hasPermission = await ensureNotificationsPermission();
        if (hasPermission) {
          await scheduleNotification(
            reminderId,
            "ContextNote - Recordatorio",
            title.trim(),
            scheduledDate,
            scheduledTime
          );
        }
      }
    }

    navigation.goBack();
  };

  // ============ FORMATEADORES ============
  const formatDate = (d: Date) =>
    d.toLocaleDateString("es-HN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatTime = (t: Date) =>
    t.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" });

  // ============ RENDER ============
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>
        {isEditing ? "Editar recordatorio" : "Nuevo recordatorio"}
      </Text>

      {/* Selector de tipo de recordatorio */}
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

      {/* Campos de texto */}
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

      {/* Selector de prioridad */}
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

      {/* Sección de ubicación (solo si el tipo lo requiere) */}
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
          <LocationPicker
            initialCoords={coords}
            radius={Number(radius) || 300}
            onLocationSelect={(newCoords) => setCoords(newCoords)}
          />
        </View>
      )}

      {/* Sección de fecha/hora (solo si el tipo lo requiere) */}
      {reminderType !== "location" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fecha y Hora</Text>

          {/* Botón para seleccionar fecha */}
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonLabel}>Fecha:</Text>
            <Text style={styles.dateButtonValue}>{formatDate(date)}</Text>
          </TouchableOpacity>

          {/* Botón para seleccionar hora */}
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.dateButtonLabel}>Hora:</Text>
            <Text style={styles.dateButtonValue}>{formatTime(time)}</Text>
          </TouchableOpacity>

          {/* DateTimePicker nativo (se muestra al tocar los botones) */}
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={new Date()}  // No permitir fechas pasadas
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

      {/* Botones de acción */}
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

// ============ ESTILOS ============

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
