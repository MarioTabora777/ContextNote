import { useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardTypeOptions } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

// Tipos de input que maneja el componente
type InputType = "text" | "email" | "password" | "phone" | "numeric";

interface Props {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  typeInput?: InputType;
  label?: string;
}

export default function CustomInput({ placeholder, value, onChangeText, typeInput = "text", label }: Props) {
  // Estado para mostrar/ocultar contraseña
  const [isSecureText, setIsSecureText] = useState(typeInput === "password");

  // Segun el tipo de input, retorno el teclado correcto
  const getKeyboardType = (): KeyboardTypeOptions => {
    if (typeInput === "email") return "email-address";
    if (typeInput === "phone") return "phone-pad";
    if (typeInput === "numeric") return "numeric";
    return "default";
  };

  // Validaciones: si el valor no cumple, retorno el mensaje de error
  const getError = (): string | undefined => {
    if (!value) return undefined;

    if (typeInput === "email" && !value.includes("@")) {
      return "Correo inválido";
    }
    if (typeInput === "password" && value.length < 6) {
      return "Mínimo 6 caracteres";
    }
    if (typeInput === "phone" && value.length < 8) {
      return "Teléfono inválido";
    }
    return undefined;
  };

  // Icono que se muestra a la izquierda segun el tipo
  const getIcon = () => {
    if (typeInput === "email") return <MaterialIcons name="email" size={20} color="#546E7A" />;
    if (typeInput === "password") return <MaterialIcons name="lock" size={20} color="#546E7A" />;
    if (typeInput === "phone") return <MaterialIcons name="phone" size={20} color="#546E7A" />;
    return null;
  };

  const error = getError();

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Contenedor del input - si hay error, aplico estilo de borde rojo */}
      <View style={[styles.inputContainer, error && styles.inputError]}>
        {getIcon()}

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecureText}
          keyboardType={getKeyboardType()}
          autoCapitalize={typeInput === "email" ? "none" : "sentences"}
        />

        {/* Boton para ver/ocultar contraseña */}
        {typeInput === "password" && (
          <TouchableOpacity onPress={() => setIsSecureText(!isSecureText)}>
            <Ionicons name={isSecureText ? "eye-off" : "eye"} size={20} color="#546E7A" />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#B0BEC5",
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    marginTop: 6,
    fontSize: 12,
  },
});
