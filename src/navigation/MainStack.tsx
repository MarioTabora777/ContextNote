import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabs from "../navigation/Tabs";
import AddReminderScreen from "../screens/main/AddReminderScreen";

export type MainStackParamList = {
  Tabs: undefined;
  AddReminder: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainStack() {
  return (
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
        options={{ title: "Nuevo" }}
      />
    </Stack.Navigator>
  );
}