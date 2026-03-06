import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
};

export default function CustomButton({ title, onPress, variant = "primary", disabled }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        variant === "primary" ? styles.primary : styles.secondary,
        disabled ? styles.disabled : null
      ]}
    >
      <Text style={[
        styles.text,
        variant === "primary" ? styles.primaryText : styles.secondaryText,
        disabled ? styles.disabledText : null
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  primary: { backgroundColor: "#4A90D9" },
  secondary: { backgroundColor: "white", borderWidth: 1, borderColor: "#4A90D9" },
  disabled: { backgroundColor: "#B0BEC5", borderWidth: 0 },
  text: { fontSize: 16, fontWeight: "600" },
  primaryText: { color: "white" },
  secondaryText: { color: "#4A90D9" },
  disabledText: { color: "#E8EEF2" },
});