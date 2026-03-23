import { NavigationContainer } from "@react-navigation/native";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../store/hooks";
import AuthNavigator from "./AuthNavigator";
import MainStack from "./MainStack";

export default function RootNavigator() {
  const { user, isLoading } = useAuth();

  // Mientras cargo la sesion, muestro un spinner
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Si hay usuario logueado muestro MainStack, si no muestro AuthNavigator
  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
