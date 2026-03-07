import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useReminders, Reminder } from "../../context/RemindersContext";
import { Ionicons } from "@expo/vector-icons";

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

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MiniReminderCard({ reminder }: { reminder: Reminder }) {
  const typeIcon =
    reminder.reminderType === "location"
      ? "location"
      : reminder.reminderType === "datetime"
      ? "time"
      : "layers";

  const formatDate = (date?: string, time?: string) => {
    if (!date) return null;
    const d = new Date(`${date}T${time || "00:00"}`);
    return d.toLocaleDateString("es-HN", {
      day: "numeric",
      month: "short",
      hour: time ? "2-digit" : undefined,
      minute: time ? "2-digit" : undefined,
    });
  };

  return (
    <View
      style={[
        styles.miniCard,
        { borderLeftColor: PRIORITY_COLORS[reminder.priority] },
      ]}
    >
      <View style={styles.miniCardHeader}>
        <Ionicons name={typeIcon} size={16} color="#546E7A" />
        <Text style={styles.miniCardTitle} numberOfLines={1}>
          {reminder.title}
        </Text>
      </View>
      {reminder.scheduledDate && (
        <Text style={styles.miniCardDate}>
          {formatDate(reminder.scheduledDate, reminder.scheduledTime)}
        </Text>
      )}
      {reminder.triggerHistory && reminder.triggerHistory.length > 0 && (
        <Text style={styles.miniCardMeta}>
          Activado {reminder.triggerHistory.length} vez(es)
        </Text>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const { reminders, getStats, getTopTriggered, getUpcoming } = useReminders();
  const stats = getStats();
  const topTriggered = getTopTriggered(3);
  const upcoming = getUpcoming(3);

  const recentReminders = [...reminders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 3);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>ContextNote</Text>
        <Text style={styles.subtitle}>Tu asistente de recordatorios inteligentes</Text>
      </View>

      {/* Stats Grid */}
      <Text style={styles.sectionTitle}>Resumen</Text>
      <View style={styles.statsGrid}>
        <StatCard
          label="Total"
          value={stats.total}
          color="#4A90D9"
          icon="documents"
        />
        <StatCard
          label="Activos"
          value={stats.active}
          color="#43A047"
          icon="checkmark-circle"
        />
        <StatCard
          label="Completados"
          value={stats.completed}
          color="#7E57C2"
          icon="flag"
        />
      </View>

      {/* Priority Distribution */}
      <Text style={styles.sectionTitle}>Por Prioridad</Text>
      <View style={styles.priorityRow}>
        {(["high", "medium", "low"] as const).map((p) => (
          <View key={p} style={styles.priorityItem}>
            <View
              style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[p] }]}
            />
            <Text style={styles.priorityLabel}>{PRIORITY_LABELS[p]}</Text>
            <Text style={styles.priorityCount}>{stats.byPriority[p]}</Text>
          </View>
        ))}
      </View>

      {/* Upcoming Reminders */}
      {upcoming.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Proximos por Fecha</Text>
          {upcoming.map((r) => (
            <MiniReminderCard key={r.id} reminder={r} />
          ))}
        </>
      )}

      {/* Top Triggered */}
      {topTriggered.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Mas Activados</Text>
          {topTriggered.map((r) => (
            <MiniReminderCard key={r.id} reminder={r} />
          ))}
        </>
      )}

      {/* Recent */}
      {recentReminders.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Recientes</Text>
          {recentReminders.map((r) => (
            <MiniReminderCard key={r.id} reminder={r} />
          ))}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={48} color="#B0BEC5" />
          <Text style={styles.emptyText}>
            No tienes recordatorios aun.{"\n"}Ve a la pestana "Recordatorios" para crear uno.
          </Text>
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    backgroundColor: "#4A90D9",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 14,
    color: "#E3F2FD",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#37474F",
    marginTop: 20,
    marginBottom: 10,
    marginHorizontal: 18,
  },
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#263238",
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    color: "#607D8B",
    marginTop: 2,
  },
  priorityRow: {
    flexDirection: "row",
    marginHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  priorityItem: {
    alignItems: "center",
    gap: 4,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  priorityLabel: {
    fontSize: 12,
    color: "#607D8B",
  },
  priorityCount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#263238",
  },
  miniCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 18,
    marginBottom: 8,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  miniCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  miniCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#263238",
    flex: 1,
  },
  miniCardDate: {
    fontSize: 12,
    color: "#4A90D9",
    marginTop: 4,
  },
  miniCardMeta: {
    fontSize: 11,
    color: "#90A4AE",
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 30,
  },
  emptyText: {
    marginTop: 12,
    textAlign: "center",
    color: "#78909C",
    lineHeight: 20,
  },
});
