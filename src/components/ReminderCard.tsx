/**
 * ReminderCard.tsx
 *
 * Componente reutilizable que muestra un recordatorio en formato tarjeta.
 * Incluye:
 * - Badge de tipo (ubicación/fecha/ambos)
 * - Badge de prioridad (alta/media/baja con colores)
 * - Información del recordatorio
 * - Switch para activar/desactivar
 * - Botón para marcar como completado
 * - Botón para eliminar
 */

import React from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Reminder } from "../context/RemindersContext";

// Colores por prioridad
const PRIORITY_COLORS = {
  high: "#E53935",
  medium: "#FB8C00",
  low: "#43A047",
};

const PRIORITY_LABELS = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

// Iconos por tipo de recordatorio
const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  location: "location",
  datetime: "time",
  both: "layers",
};

type Props = {
  reminder: Reminder;
  onToggle: () => void;           // Activar/desactivar
  onDelete?: () => void;          // Eliminar (opcional)
  onToggleCompleted?: () => void; // Marcar completado (opcional)
};

export default function ReminderCard({
  reminder,
  onToggle,
  onDelete,
  onToggleCompleted,
}: Props) {
  // Formatea fecha para mostrar
  const formatDate = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return null;
    const d = new Date(`${dateStr}T${timeStr || "00:00"}`);
    return d.toLocaleDateString("es-HN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: timeStr ? "2-digit" : undefined,
      minute: timeStr ? "2-digit" : undefined,
    });
  };

  // Confirmar antes de eliminar
  const confirmDelete = () => {
    Alert.alert(
      "Eliminar recordatorio",
      `¿Seguro que deseas eliminar "${reminder.title}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: onDelete },
      ]
    );
  };

  return (
    <View
      style={[
        styles.card,
        reminder.isCompleted && styles.cardCompleted,
        { borderLeftColor: PRIORITY_COLORS[reminder.priority || "medium"] },
      ]}
    >
      {/* Header: tipo + prioridad + botón eliminar */}
      <View style={styles.header}>
        {/* Badge de tipo */}
        <View style={styles.typeTag}>
          <Ionicons
            name={TYPE_ICONS[reminder.reminderType || "location"]}
            size={14}
            color="#546E7A"
          />
          <Text style={styles.typeText}>
            {reminder.reminderType === "location"
              ? "Ubicacion"
              : reminder.reminderType === "datetime"
              ? "Fecha"
              : "Ambos"}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {/* Badge de prioridad */}
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: PRIORITY_COLORS[reminder.priority || "medium"] },
            ]}
          >
            <Text style={styles.priorityText}>
              {PRIORITY_LABELS[reminder.priority || "medium"]}
            </Text>
          </View>

          {/* Botón eliminar */}
          {onDelete && (
            <TouchableOpacity onPress={confirmDelete} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color="#E53935" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Contenido principal */}
      <View style={styles.content}>
        <View style={{ flex: 1 }}>
          {/* Título (tachado si está completado) */}
          <Text
            style={[styles.title, reminder.isCompleted && styles.titleCompleted]}
          >
            {reminder.title}
          </Text>

          {/* Nota opcional */}
          {!!reminder.note && <Text style={styles.note}>{reminder.note}</Text>}

          {/* Info de ubicación (si tiene) */}
          {reminder.radiusMeters && (
            <View style={styles.metaRow}>
              <Ionicons name="radio-button-on" size={12} color="#78909C" />
              <Text style={styles.meta}>Radio: {reminder.radiusMeters}m</Text>
            </View>
          )}

          {/* Info de fecha (si tiene) */}
          {reminder.scheduledDate && (
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={12} color="#78909C" />
              <Text style={styles.meta}>
                {formatDate(reminder.scheduledDate, reminder.scheduledTime)}
              </Text>
            </View>
          )}

          {/* Última activación */}
          <View style={styles.metaRow}>
            <Ionicons name="notifications-outline" size={12} color="#78909C" />
            <Text style={styles.meta}>
              Ultima activacion:{" "}
              {reminder.lastTriggeredAt
                ? new Date(reminder.lastTriggeredAt).toLocaleString("es-HN")
                : "—"}
            </Text>
          </View>

          {/* Contador del historial */}
          {reminder.triggerHistory && reminder.triggerHistory.length > 0 && (
            <View style={styles.metaRow}>
              <Ionicons name="analytics-outline" size={12} color="#4A90D9" />
              <Text style={[styles.meta, { color: "#4A90D9" }]}>
                Activado {reminder.triggerHistory.length} vez(es)
              </Text>
            </View>
          )}
        </View>

        {/* Controles: switch + checkbox completado */}
        <View style={styles.controls}>
          <Switch value={reminder.isEnabled} onValueChange={onToggle} />
          {onToggleCompleted && (
            <TouchableOpacity
              onPress={onToggleCompleted}
              style={styles.completeBtn}
            >
              <Ionicons
                name={reminder.isCompleted ? "checkmark-circle" : "checkmark-circle-outline"}
                size={24}
                color={reminder.isCompleted ? "#43A047" : "#B0BEC5"}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ============ ESTILOS ============

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardCompleted: {
    backgroundColor: "#F5F5F5",
    opacity: 0.8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  typeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECEFF1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    color: "#546E7A",
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  deleteBtn: {
    padding: 4,
  },
  content: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#263238",
  },
  titleCompleted: {
    textDecorationLine: "line-through",
    color: "#90A4AE",
  },
  note: {
    marginTop: 4,
    color: "#546E7A",
    fontSize: 13,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  meta: {
    color: "#78909C",
    fontSize: 12,
  },
  controls: {
    alignItems: "center",
    gap: 8,
  },
  completeBtn: {
    padding: 4,
  },
});
