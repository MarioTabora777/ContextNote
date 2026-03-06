import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/main/HomeScreen";
import RemindersScreen from "../screens/main/ReminderScreen";
import SettingsScreen from "../screens/main/SettingsScreen";

export type MainTabParamList = {
  Home: undefined;
  Reminders: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={{ headerTitleAlign: "center" }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Inicio" }}
      />
      <Tab.Screen
        name="Reminders"
        component={RemindersScreen}
        options={{ title: "Recordatorios" }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Ajustes" }}
      />
    </Tab.Navigator>
  );
}