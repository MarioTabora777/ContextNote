import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import CustomInput from "../../components/CusstomInput";
import CustomButton from "../../components/CustomButton";
import { useAuth } from "../../store/hooks";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Validacion antes de registrar
  const validate = () => {
    if (!name.trim()) {
      Alert.alert("Validación", "El nombre es obligatorio");
      return false;
    }
    if (!email.includes("@")) {
      Alert.alert("Validación", "Correo inválido");
      return false;
    }
    if (phone.length < 8) {
      Alert.alert("Validación", "Teléfono inválido");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Validación", "La contraseña debe tener al menos 6 caracteres");
      return false;
    }
    return true;
  };

  const onRegister = async () => {
    if (!validate()) return;

    const ok = await register(email.trim(), password, name.trim());
    if (ok) {
      Alert.alert("Exito", "Cuenta creada correctamente");
    } else {
      Alert.alert("Error", "No se pudo crear la cuenta");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>

      <CustomInput
        label="Nombre"
        placeholder="Tu nombre completo"
        value={name}
        onChangeText={setName}
        typeInput="text"
      />

      <CustomInput
        label="Correo"
        placeholder="correo@ejemplo.com"
        value={email}
        onChangeText={setEmail}
        typeInput="email"
      />

      <CustomInput
        label="Teléfono"
        placeholder="99999999"
        value={phone}
        onChangeText={setPhone}
        typeInput="phone"
      />

      <CustomInput
        label="Contraseña"
        placeholder="Mínimo 6 caracteres"
        value={password}
        onChangeText={setPassword}
        typeInput="password"
      />

      <CustomButton title="Registrarse" onPress={onRegister} />
      <View style={{ height: 10 }} />
      <CustomButton
        title="Ya tengo cuenta"
        variant="secondary"
        onPress={() => navigation.goBack()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20, textAlign: "center" },
});
