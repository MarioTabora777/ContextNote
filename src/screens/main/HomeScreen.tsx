import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../../assets/icon.png")}
        style={styles.logo}
      />
      <Text style={styles.title}>ContextNote</Text>
      <Text style={styles.subtitle}>
        Recordatorios inteligentes basados en tu ubicación.
      </Text>
      <Text style={styles.description}>
        Crea recordatorios que se activan cuando llegas a un lugar específico.
        Nunca más olvides algo importante.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    borderRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#4A90D9",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    color: "#37474F",
    textAlign: "center",
  },
  description: {
    marginTop: 20,
    fontSize: 14,
    color: "#607D8B",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
