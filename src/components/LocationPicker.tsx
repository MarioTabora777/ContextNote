/**
 * LocationPicker.tsx
 *
 * Componente que muestra un mapa para seleccionar ubicación.
 * Permite:
 * - Ver ubicación actual
 * - Tocar para seleccionar otra ubicación
 * - Ver el radio del recordatorio
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, Circle, MapPressEvent } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  initialCoords?: { lat: number; lng: number } | null;
  radius: number;
  onLocationSelect: (coords: { lat: number; lng: number }) => void;
};

export default function LocationPicker({
  initialCoords,
  radius,
  onLocationSelect,
}: Props) {
  const [selectedCoords, setSelectedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(initialCoords || null);

  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener ubicación actual al montar
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Permiso de ubicacion denegado");
          setLoading(false);
          return;
        }

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        setCurrentLocation(coords);

        // Si no hay coordenadas iniciales, usar la actual
        if (!selectedCoords) {
          setSelectedCoords(coords);
          onLocationSelect(coords);
        }

        setLoading(false);
      } catch (err) {
        setError("Error obteniendo ubicacion");
        setLoading(false);
      }
    })();
  }, []);

  // Manejar tap en el mapa
  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const coords = { lat: latitude, lng: longitude };
    setSelectedCoords(coords);
    onLocationSelect(coords);
  };

  // Centrar en ubicación actual
  const centerOnCurrentLocation = () => {
    if (currentLocation) {
      setSelectedCoords(currentLocation);
      onLocationSelect(currentLocation);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90D9" />
        <Text style={styles.loadingText}>Obteniendo ubicacion...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="location-outline" size={40} color="#E53935" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const region = selectedCoords
    ? {
        latitude: selectedCoords.lat,
        longitude: selectedCoords.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Marcador de ubicación seleccionada */}
        {selectedCoords && (
          <>
            <Marker
              coordinate={{
                latitude: selectedCoords.lat,
                longitude: selectedCoords.lng,
              }}
              pinColor="#4A90D9"
            />
            {/* Círculo que muestra el radio */}
            <Circle
              center={{
                latitude: selectedCoords.lat,
                longitude: selectedCoords.lng,
              }}
              radius={radius}
              fillColor="rgba(74, 144, 217, 0.2)"
              strokeColor="rgba(74, 144, 217, 0.5)"
              strokeWidth={2}
            />
          </>
        )}
      </MapView>

      {/* Botón para centrar en ubicación actual */}
      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={centerOnCurrentLocation}
      >
        <Ionicons name="locate" size={24} color="#4A90D9" />
      </TouchableOpacity>

      {/* Info de ubicación seleccionada */}
      <View style={styles.infoBox}>
        <Ionicons name="location" size={16} color="#4A90D9" />
        <Text style={styles.infoText}>
          {selectedCoords
            ? `${selectedCoords.lat.toFixed(5)}, ${selectedCoords.lng.toFixed(5)}`
            : "Toca el mapa para seleccionar"}
        </Text>
      </View>

      <Text style={styles.hint}>
        Toca en el mapa para seleccionar una ubicacion
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 250,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 10,
    color: "#78909C",
  },
  errorContainer: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
  },
  errorText: {
    marginTop: 10,
    color: "#E53935",
  },
  myLocationButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  infoBox: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    color: "#263238",
    fontSize: 13,
    fontWeight: "500",
  },
  hint: {
    textAlign: "center",
    color: "#78909C",
    fontSize: 12,
    marginTop: 8,
  },
});
