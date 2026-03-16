/**
 * HistoryScreen.tsx
 *
 * Pantalla de historial de activaciones.
 * Muestra todas las veces que se activó cada recordatorio,
 * agrupadas por día para fácil visualización.
 *
 * Usa SectionList para agrupar por fecha.
 */

import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useReminders } from "../../context/RemindersContext";

// Tipo para cada item del historial
type HistoryItem = {
  reminderId: string;
  reminderTitle: string;
  triggeredAt: string;
  type: "location" | "datetime";
};

// Tipo para las secciones (agrupadas por día)
type Section = {
  title: string;
  data: HistoryItem[];
};

export default function HistoryScreen() {
  const { reminders } = useReminders();

  // ============ PROCESAR HISTORIAL ============
  // Extraemos todas las activaciones de todos los recordatorios
  // y las agrupamos por día
  const sections = useMemo(() => {
    const allHistory: HistoryItem[] = [];

    // Recorrer cada recordatorio y extraer su historial
    reminders.forEach((r) => {
      if (r.triggerHistory && r.triggerHistory.length > 0) {
        r.triggerHistory.forEach((h) => {
          allHistory.push({
            reminderId: r.id,
            reminderTitle: r.title,
            triggeredAt: h.triggeredAt,
            type: h.type,
          });
        });
      }
    });

    // Ordenar por fecha (más reciente primero)
    allHistory.sort(
      (a, b) =>
        new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
    );

    // Agrupar por día
    const groups: Record<string, HistoryItem[]> = {};

    allHistory.forEach((item) => {
      // Formatear fecha como título de sección
      const date = new Date(item.triggeredAt).toLocaleDateString("es-HN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });

    // Convertir a formato de SectionList
    return Object.entries(groups).map(([title, data]) => ({
      title,
      data,
    }));
  }, [reminders]);

  // Total de activaciones
  const totalActivations = sections.reduce(
    (acc, section) => acc + section.data.length,
    0
  );

  // ============ RENDER ITEM ============
  const renderItem = ({ item }: { item: HistoryItem }) => {
    const time = new Date(item.triggeredAt).toLocaleTimeString("es-HN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <View style={styles.historyItem}>
        {/* Icono según tipo de activación */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor:
                item.type === "location" ? "#E3F2FD" : "#FFF3E0",
            },
          ]}
        >
          <Ionicons
            name={item.type === "location" ? "location" : "time"}
            size={18}
            color={item.type === "location" ? "#4A90D9" : "#FB8C00"}
          />
        </View>

        {/* Título y hora */}
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.reminderTitle}
          </Text>
          <Text style={styles.itemTime}>{time}</Text>
        </View>

        {/* Badge de tipo */}
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>
            {item.type === "location" ? "Ubicacion" : "Fecha"}
          </Text>
        </View>
      </View>
    );
  };

  // ============ RENDER HEADER DE SECCIÓN ============
  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>{section.data.length}</Text>
    </View>
  );

  // ============ ESTADO VACÍO ============
  if (sections.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="analytics-outline" size={64} color="#B0BEC5" />
        <Text style={styles.emptyTitle}>Sin historial</Text>
        <Text style={styles.emptyText}>
          Cuando tus recordatorios se activen, aparecera aqui un registro de
          cada activacion.
        </Text>
      </View>
    );
  }

  // ============ RENDER PRINCIPAL ============
  return (
    <View style={styles.container}>
      {/* Tarjeta de resumen */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalActivations}</Text>
          <Text style={styles.summaryLabel}>Total activaciones</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{sections.length}</Text>
          <Text style={styles.summaryLabel}>Dias con actividad</Text>
        </View>
      </View>

      {/* Lista agrupada por día */}
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.reminderId}-${item.triggeredAt}-${index}`}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

// ============ ESTILOS ============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    padding: 18,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#546E7A",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#90A4AE",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#4A90D9",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#78909C",
    marginTop: 4,
  },
  divider: {
    width: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#546E7A",
    textTransform: "capitalize",
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4A90D9",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#263238",
  },
  itemTime: {
    fontSize: 12,
    color: "#90A4AE",
    marginTop: 2,
  },
  typeBadge: {
    backgroundColor: "#ECEFF1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#546E7A",
  },
});
