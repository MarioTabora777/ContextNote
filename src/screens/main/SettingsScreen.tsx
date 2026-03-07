/**
 * SettingsScreen.tsx
 *
 * Pantalla de ajustes de la aplicación.
 * Incluye:
 * - Información del perfil del usuario
 * - Estadísticas rápidas
 * - Preferencias (notificaciones, ubicación)
 * - Opciones de datos (exportar, limpiar, eliminar)
 * - Información de la app
 * - Cerrar sesión
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useReminders } from "../../context/RemindersContext";

// ============ COMPONENTE AUXILIAR ============

type SettingItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;  // Para switches u otros controles
  danger?: boolean;  // Estilo rojo para acciones destructivas
};

/**
 * Item de configuración reutilizable
 * Puede tener un onPress o un elemento a la derecha (como Switch)
 */
function SettingItem({
  icon,
  iconColor = "#4A90D9",
  title,
  subtitle,
  onPress,
  rightElement,
  danger,
}: SettingItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress && !rightElement}
    >
      {/* Icono */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: danger ? "#FFEBEE" : "#E3F2FD" },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={danger ? "#E53935" : iconColor}
        />
      </View>

      {/* Texto */}
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && { color: "#E53935" }]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>

      {/* Elemento derecho (switch o chevron) */}
      {rightElement || (
        onPress && <Ionicons name="chevron-forward" size={20} color="#B0BEC5" />
      )}
    </TouchableOpacity>
  );
}

// ============ COMPONENTE PRINCIPAL ============

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { reminders, getStats } = useReminders();
  const stats = getStats();

  // Estados para los switches (solo visuales por ahora)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  // Limpiar historial de activaciones
  const handleClearHistory = () => {
    Alert.alert(
      "Limpiar historial",
      "Esto eliminara el historial de activaciones de todos tus recordatorios. Los recordatorios no se eliminaran.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpiar",
          style: "destructive",
          onPress: async () => {
            // TODO: Implementar lógica para limpiar historial
            Alert.alert("Listo", "Historial limpiado.");
          },
        },
      ]
    );
  };

  // Eliminar todos los recordatorios
  const handleDeleteAll = () => {
    Alert.alert(
      "Eliminar todo",
      "Esto eliminara TODOS tus recordatorios. Esta accion no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar todo",
          style: "destructive",
          onPress: async () => {
            // TODO: Implementar lógica para eliminar todo
            Alert.alert("Listo", "Todos los recordatorios han sido eliminados.");
          },
        },
      ]
    );
  };

  // Exportar datos
  const handleExportData = () => {
    Alert.alert(
      "Exportar datos",
      "Tus datos han sido preparados para exportar.",
      [{ text: "OK" }]
    );
  };

  // Cerrar sesión con confirmación
  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesion",
      "¿Seguro que deseas cerrar sesion?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Cerrar sesion", onPress: logout },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Tarjeta de perfil */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color="#FFFFFF" />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {user?.name || user?.email?.split("@")[0] || "Usuario"}
          </Text>
          <Text style={styles.profileEmail}>{user?.email || "—"}</Text>
        </View>
      </View>

      {/* Estadísticas rápidas */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.active}</Text>
          <Text style={styles.statLabel}>Activos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completados</Text>
        </View>
      </View>

      {/* Sección: Preferencias */}
      <Text style={styles.sectionTitle}>Preferencias</Text>
      <View style={styles.section}>
        <SettingItem
          icon="notifications"
          title="Notificaciones"
          subtitle="Recibir alertas de recordatorios"
          rightElement={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
          }
        />
        <SettingItem
          icon="location"
          title="Ubicacion"
          subtitle="Permitir acceso a tu ubicacion"
          rightElement={
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
            />
          }
        />
      </View>

      {/* Sección: Datos */}
      <Text style={styles.sectionTitle}>Datos</Text>
      <View style={styles.section}>
        <SettingItem
          icon="download-outline"
          title="Exportar datos"
          subtitle="Descargar tus recordatorios"
          onPress={handleExportData}
        />
        <SettingItem
          icon="refresh-outline"
          title="Limpiar historial"
          subtitle="Eliminar registro de activaciones"
          onPress={handleClearHistory}
        />
        <SettingItem
          icon="trash-outline"
          iconColor="#E53935"
          title="Eliminar todos los recordatorios"
          onPress={handleDeleteAll}
          danger
        />
      </View>

      {/* Sección: Información */}
      <Text style={styles.sectionTitle}>Informacion</Text>
      <View style={styles.section}>
        <SettingItem
          icon="information-circle-outline"
          title="Acerca de"
          subtitle="ContextNote v1.0.0"
        />
        <SettingItem
          icon="help-circle-outline"
          title="Ayuda"
          subtitle="Preguntas frecuentes"
        />
      </View>

      {/* Botón cerrar sesión */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#E53935" />
        <Text style={styles.logoutText}>Cerrar sesion</Text>
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footer}>
        ContextNote - Recordatorios Inteligentes{"\n"}
        Proyecto Ceutec 2026
      </Text>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ============ ESTILOS ============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A90D9",
    margin: 18,
    padding: 18,
    borderRadius: 16,
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  profileEmail: {
    fontSize: 13,
    color: "#E3F2FD",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#263238",
  },
  statLabel: {
    fontSize: 11,
    color: "#90A4AE",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#78909C",
    marginLeft: 18,
    marginBottom: 8,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 18,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#263238",
  },
  settingSubtitle: {
    fontSize: 12,
    color: "#90A4AE",
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 18,
    marginTop: 8,
    paddingVertical: 14,
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#E53935",
  },
  footer: {
    textAlign: "center",
    color: "#B0BEC5",
    fontSize: 11,
    marginTop: 24,
    lineHeight: 18,
  },
});
