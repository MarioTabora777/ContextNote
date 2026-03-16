/**
 * Tabs.tsx
 *
 * Navegación principal con pestañas inferiores.
 * Incluye 4 tabs:
 * - Inicio (Dashboard)
 * - Recordatorios (lista y gestión)
 * - Historial (activaciones)
 * - Ajustes (configuración)
 */

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import HomeScreen from "../screens/main/HomeScreen";
import RemindersScreen from "../screens/main/ReminderScreen";
import HistoryScreen from "../screens/main/HistoryScreen";
import SettingsScreen from "../screens/main/SettingsScreen";

// Tipos para TypeScript (rutas disponibles)
export type MainTabParamList = {
  Home: undefined;
  Reminders: undefined;
  History: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={{
        headerTitleAlign: "center",
        // Colores de los tabs
        tabBarActiveTintColor: "#4A90D9",
        tabBarInactiveTintColor: "#90A4AE",
        // Estilos de la barra de tabs
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E0E0E0",
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        // Estilos del header
        headerStyle: {
          backgroundColor: "#4A90D9",
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontWeight: "700",
        },
      }}
    >
      {/* Tab: Inicio (Dashboard) */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Inicio",
          headerShown: false,  // HomeScreen tiene su propio header
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      {/* Tab: Recordatorios */}
      <Tab.Screen
        name="Reminders"
        component={RemindersScreen}
        options={{
          title: "Recordatorios",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
        }}
      />

      {/* Tab: Historial */}
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: "Historial",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />

      {/* Tab: Ajustes */}
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
