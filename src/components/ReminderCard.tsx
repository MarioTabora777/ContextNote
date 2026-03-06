import React from "react";
import { View, Text, StyleSheet, Switch } from "react-native";
import { Reminder } from "../context/RemindersContext";

export default function ReminderCard({
  reminder,
  onToggle,
}: {
  reminder: Reminder;
  onToggle: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{reminder.title}</Text>
        {!!reminder.note && <Text style={styles.note}>{reminder.note}</Text>}
        <Text style={styles.meta}>Radio: {reminder.radiusMeters}m</Text>
        <Text style={styles.meta}>
          Última activación: {reminder.lastTriggeredAt ? new Date(reminder.lastTriggeredAt).toLocaleString() : "—"}
        </Text>
      </View>

      <Switch value={reminder.isEnabled} onValueChange={onToggle} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1, borderColor: "#CFD8DC",
    borderRadius: 14, padding: 12,
    marginBottom: 10, flexDirection: "row", gap: 10,
    alignItems: "center",
  },
  title: { fontSize: 16, fontWeight: "800" },
  note: { marginTop: 4, color: "#37474F" },
  meta: { marginTop: 4, color: "#607D8B", fontSize: 12 },
});