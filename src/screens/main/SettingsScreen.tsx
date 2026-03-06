import React from "react";
import { View, Text } from "react-native";
import { useAuth } from "../../context/AuthContext";
import CustomButton from "../../components/CustomButton";

export default function SettingsScreen() {
  const { logout } = useAuth();

  return (
    <View style={{ flex: 1, padding: 18 }}>
      <Text style={{ fontSize: 18, fontWeight: "800" }}>Ajustes</Text>
      <View style={{ marginTop: 20 }}>
        <CustomButton title="Cerrar sesión" onPress={logout} />
      </View>
    </View>
  );
}