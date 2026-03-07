import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, ImageBackground } from "react-native";
import CustomInput from "../../components/CusstomInput";
import CustomButton from "../../components/CustomButton";
import { useAuth } from "../../context/AuthContext";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const validate = () => {
    if (!email.includes("@")) {
      Alert.alert("Validación", "Correo inválido");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Validación", "La contraseña debe tener al menos 6 caracteres");
      return false;
    }
    return true;
  };

  const onLogin = async () => {
    if (!validate()) return;
    const ok = await login(email.trim());
    if (!ok) Alert.alert("Error", "Credenciales inválidas");
  };

  return (
    <ImageBackground 
      source={ require( '../../Images/world-map-detailed.jpg') } 
      style={styles.Imagecontainer}
      resizeMode="cover"
    >
    {<View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>

      <CustomInput
        label="Correo"
        placeholder="correo@ejemplo.com"
        value={email}
        onChangeText={setEmail}
        typeInput="email"
      />

      <CustomInput
        label="Contraseña"
        placeholder="••••••"
        value={password}
        onChangeText={setPassword}
        typeInput="password"
      />

      <CustomButton title="Entrar" onPress={onLogin} />
      <View style={{ height: 10 }} />
      <CustomButton
        title="Crear cuenta"
        variant="secondary"
        onPress={() => navigation.navigate("Register")}
      />
    </View>}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  
  Imagecontainer: {flex:1, width:'100%',height:'100%'},
  container: { flex: 1, marginTop:200,marginBottom:250 ,padding: 18, justifyContent: "center", backgroundColor:'#ffffffcf' },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20, textAlign: "center" },
});
