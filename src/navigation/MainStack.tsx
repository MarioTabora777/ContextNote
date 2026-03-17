import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabs from "../navigation/Tabs";
import AddReminderScreen from "../screens/main/AddReminderScreen";
import ReminderChecker from "../components/ReminderChecker";
import { Reminder } from "../context/RemindersContext";

export type MainStackParamList = {
  Tabs: undefined;
  AddReminder: { reminder?: Reminder } | undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainStack() {
  return (
    <>
      <ReminderChecker />
      <Stack.Navigator
        id="MainStack"
        screenOptions={{ headerTitleAlign: "center" }}
      >
        <Stack.Screen
          name="Tabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddReminder"
          component={AddReminderScreen}
          options={({ route }) => ({
            title: route.params?.reminder ? "Editar" : "Nuevo",
          })}
        />
      </Stack.Navigator>
    </>
  );
}