/**
 * ReminderScreen.tsx
 *
 * Pantalla principal de recordatorios.
 * Permite:
 * - Ver todos los recordatorios
 * - Filtrar por estado (activos, completados) o tipo (ubicación, fecha)
 * - Verificar manualmente ubicación actual
 * - Verificar recordatorios por fecha/hora
 * - Crear, eliminar y completar recordatorios
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useReminders } from "../../context/RemindersContext";
import CustomButton from "../../components/CustomButton";
import ReminderCard from "../../components/ReminderCard";
import { distanceMeters } from "../../utils/geo";
import { ensureNotificationsPermission, notify } from "../../utils/notifications";

// Tipos de filtro disponibles
type FilterType = "all" | "active" | "completed" | "location" | "datetime";

export default function RemindersScreen({ navigation }: any) {
  const {
    reminders,
    toggleReminder,
    toggleCompleted,
    deleteReminder,
    markTriggered,
  } = useReminders();

  const [hasLocation, setHasLocation] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  // Verificar permiso de ubicación al montar
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocation(status === "granted");
    })();
  }, []);

  // ============ VERIFICACIÓN MANUAL POR UBICACIÓN ============
  // Simula la detección de geofencing: verifica si el usuario está
  // dentro del radio de algún recordatorio por ubicación
  const checkLocationNow = async () => {
    if (!hasLocation)
      return Alert.alert("Permiso", "Habilita permisos de ubicacion.");

    const notifOk = await ensureNotificationsPermission();
    if (!notifOk)
      return Alert.alert("Permiso", "Habilita permisos de notificaciones.");

    // Obtener ubicación actual
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = pos.coords;

    // Filtrar recordatorios que coincidan (dentro del radio)
    const hits = reminders.filter((r) => {
      if (!r.isEnabled || r.isCompleted) return false;
      if (r.reminderType === "datetime") return false;  // Solo ubicación
      if (!r.latitude || !r.longitude || !r.radiusMeters) return false;

      // Calcular distancia entre ubicación actual y la del recordatorio
      const d = distanceMeters(latitude, longitude, r.latitude, r.longitude);
      return d <= r.radiusMeters;
    });

    if (hits.length === 0) {
      return Alert.alert(
        "Sin coincidencias",
        "No hay recordatorios cerca de tu ubicacion actual."
      );
    }

    // Notificar cada recordatorio que coincidió
    for (const r of hits) {
      await notify("ContextNote", `Recordatorio: ${r.title}`);
      await markTriggered(r.id, "location");
    }

    Alert.alert("Listo", `Se activaron ${hits.length} recordatorio(s).`);
  };

  // ============ VERIFICACIÓN MANUAL POR FECHA/HORA ============
  // Verifica si hay recordatorios cuya fecha/hora ya pasó
  const checkDateTimeNow = async () => {
    const notifOk = await ensureNotificationsPermission();
    if (!notifOk)
      return Alert.alert("Permiso", "Habilita permisos de notificaciones.");

    const now = new Date();

    // Filtrar recordatorios por fecha que ya deberían activarse
    const hits = reminders.filter((r) => {
      if (!r.isEnabled || r.isCompleted) return false;
      if (r.reminderType === "location") return false;  // Solo fecha
      if (!r.scheduledDate) return false;

      const scheduled = new Date(
        `${r.scheduledDate}T${r.scheduledTime || "00:00"}`
      );
      return scheduled <= now;  // Fecha/hora ya pasó
    });

    if (hits.length === 0) {
      return Alert.alert(
        "Sin coincidencias",
        "No hay recordatorios programados para ahora."
      );
    }

    // Notificar cada recordatorio
    for (const r of hits) {
      await notify("ContextNote", `Recordatorio: ${r.title}`);
      await markTriggered(r.id, "datetime");
    }

    Alert.alert("Listo", `Se activaron ${hits.length} recordatorio(s).`);
  };

  // ============ FILTRADO ============
  const filteredReminders = reminders.filter((r) => {
    switch (filter) {
      case "active":
        return r.isEnabled && !r.isCompleted;
      case "completed":
        return r.isCompleted;
      case "location":
        return r.reminderType === "location" || r.reminderType === "both";
      case "datetime":
        return r.reminderType === "datetime" || r.reminderType === "both";
      default:
        return true;
    }
  });

  // Componente de botón de filtro
  const FilterButton = ({
    type,
    label,
    icon,
  }: {
    type: FilterType;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }) => (
    <TouchableOpacity
      style={[styles.filterBtn, filter === type && styles.filterBtnActive]}
      onPress={() => setFilter(type)}
    >
      <Ionicons
        name={icon}
        size={14}
        color={filter === type ? "#FFFFFF" : "#546E7A"}
      />
      <Text
        style={[
          styles.filterText,
          filter === type && styles.filterTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  // ============ RENDER ============
  return (
    <View style={styles.container}>
      {/* Botones de acción principales */}
      <View style={styles.actionRow}>
        {/* Botón crear nuevo */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("AddReminder")}
        >
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Nuevo</Text>
        </TouchableOpacity>

        {/* Botón verificar por ubicación */}
        <TouchableOpacity
          style={styles.checkButton}
          onPress={checkLocationNow}
        >
          <Ionicons name="location" size={20} color="#4A90D9" />
        </TouchableOpacity>

        {/* Botón verificar por fecha */}
        <TouchableOpacity
          style={styles.checkButton}
          onPress={checkDateTimeNow}
        >
          <Ionicons name="time" size={20} color="#4A90D9" />
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        *Toca los iconos de ubicacion o reloj para verificar manualmente tus
        recordatorios.
      </Text>

      {/* Filtros */}
      <View style={styles.filterRow}>
        <FilterButton type="all" label="Todos" icon="list" />
        <FilterButton type="active" label="Activos" icon="checkmark-circle" />
        <FilterButton type="completed" label="Hechos" icon="flag" />
        <FilterButton type="location" label="Lugar" icon="location" />
        <FilterButton type="datetime" label="Fecha" icon="calendar" />
      </View>

      {/* Lista de recordatorios */}
      <FlatList
        data={filteredReminders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ReminderCard
            reminder={item}
            onToggle={() => toggleReminder(item.id)}
            onDelete={() => deleteReminder(item.id)}
            onToggleCompleted={() => toggleCompleted(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="document-text-outline"
              size={48}
              color="#B0BEC5"
            />
            <Text style={styles.emptyText}>
              {filter === "all"
                ? "No hay recordatorios aun.\nToca 'Nuevo' para crear uno."
                : "No hay recordatorios en esta categoria."}
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ============ ESTILOS ============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
    backgroundColor: "#F5F7FA",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  addButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4A90D9",
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  checkButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  hint: {
    color: "#78909C",
    fontSize: 12,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#ECEFF1",
  },
  filterBtnActive: {
    backgroundColor: "#4A90D9",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#546E7A",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 30,
  },
  emptyText: {
    marginTop: 12,
    textAlign: "center",
    color: "#78909C",
    lineHeight: 20,
  },
});
