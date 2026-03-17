/**
 * LocationPicker.tsx
 *
 * Componente con:
 * - Buscador de direcciones con autocompletado (Google Places)
 * - Imagen estatica de Google Maps que se actualiza al seleccionar
 * - Muestra el radio del recordatorio
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Image,
  Keyboard,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

const GOOGLE_API_KEY = "AIzaSyBmitm9tOU2qWglE3QRRrQEk3c8EcLXMcI";

type Props = {
  initialCoords?: { lat: number; lng: number } | null;
  radius: number;
  onLocationSelect: (coords: { lat: number; lng: number }) => void;
};

type PlacePrediction = {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para busqueda
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const sessionToken = useRef(generateSessionToken());

  // Generar token de sesion para Google Places
  function generateSessionToken() {
    return Math.random().toString(36).substring(2, 15);
  }

  // Obtener ubicacion actual al montar
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

  // Buscar direcciones con Google Places Autocomplete (limitado a Honduras, prioriza SPS)
  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearching(true);
    try {
      // Coordenadas de San Pedro Sula para priorizar resultados cercanos
      const spsLat = 15.5049;
      const spsLng = -88.0252;

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=${GOOGLE_API_KEY}&sessiontoken=${sessionToken.current}&language=es&components=country:hn&location=${spsLat},${spsLng}&radius=50000`
      );
      const data = await response.json();

      if (data.status === "OK" && data.predictions) {
        setSuggestions(data.predictions);
        setShowSuggestions(data.predictions.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (err) {
      console.log("Error buscando direcciones:", err);
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounce para busqueda
  const handleSearchChange = (text: string) => {
    setSearchText(text);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      searchAddresses(text);
    }, 400);
  };

  // Obtener coordenadas de un place_id
  const getPlaceDetails = async (placeId: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${GOOGLE_API_KEY}&sessiontoken=${sessionToken.current}`
      );
      const data = await response.json();

      if (data.status === "OK" && data.result?.geometry?.location) {
        // Generar nuevo token para la proxima sesion
        sessionToken.current = generateSessionToken();
        return {
          lat: data.result.geometry.location.lat,
          lng: data.result.geometry.location.lng,
        };
      }
      return null;
    } catch (err) {
      console.log("Error obteniendo detalles:", err);
      return null;
    }
  };

  // Seleccionar una sugerencia
  const selectSuggestion = async (suggestion: PlacePrediction) => {
    setSearchText(suggestion.structured_formatting.main_text);
    setShowSuggestions(false);
    setSuggestions([]);
    Keyboard.dismiss();

    // Obtener coordenadas del lugar seleccionado
    const coords = await getPlaceDetails(suggestion.place_id);
    if (coords) {
      setSelectedCoords(coords);
      onLocationSelect(coords);
    }
  };

  // Usar ubicacion actual
  const useCurrentLocation = async () => {
    setLoading(true);
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      setSelectedCoords(coords);
      onLocationSelect(coords);
      setSearchText("");
      setShowSuggestions(false);
    } catch (err) {
      setError("Error obteniendo ubicacion");
    } finally {
      setLoading(false);
    }
  };

  // Generar URL de imagen estatica de Google Maps
  const getMapImageUrl = () => {
    if (!selectedCoords) return null;
    const zoom = 16;
    return `https://maps.googleapis.com/maps/api/staticmap?center=${selectedCoords.lat},${selectedCoords.lng}&zoom=${zoom}&size=600x300&scale=2&maptype=roadmap&markers=color:red%7C${selectedCoords.lat},${selectedCoords.lng}&key=${GOOGLE_API_KEY}`;
  };

  if (loading && !selectedCoords) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90D9" />
        <Text style={styles.loadingText}>Obteniendo ubicacion...</Text>
      </View>
    );
  }

  if (error && !selectedCoords) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="location-outline" size={40} color="#E53935" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const mapImageUrl = getMapImageUrl();

  return (
    <View style={styles.container}>
      {/* Buscador de direcciones */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#78909C" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar direccion en Honduras..."
          placeholderTextColor="#90A4AE"
          value={searchText}
          onChangeText={handleSearchChange}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
        />
        {searching && (
          <ActivityIndicator size="small" color="#4A90D9" style={styles.searchSpinner} />
        )}
      </View>

      {/* Lista de sugerencias */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.place_id}
                style={styles.suggestionItem}
                onPress={() => selectSuggestion(item)}
              >
                <Ionicons name="location-outline" size={18} color="#4A90D9" />
                <View style={styles.suggestionTextContainer}>
                  <Text style={styles.suggestionMainText}>
                    {item.structured_formatting.main_text}
                  </Text>
                  <Text style={styles.suggestionSecondaryText} numberOfLines={1}>
                    {item.structured_formatting.secondary_text}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Imagen del mapa de Google */}
      <View style={styles.mapContainer}>
        {mapImageUrl ? (
          <Image
            source={{ uri: mapImageUrl }}
            style={styles.mapImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={40} color="#B0BEC5" />
            <Text style={styles.mapPlaceholderText}>Selecciona una ubicacion</Text>
          </View>
        )}

        {/* Indicador de radio */}
        {selectedCoords && (
          <View style={styles.radiusIndicator}>
            <Text style={styles.radiusText}>Radio: {radius}m</Text>
          </View>
        )}
      </View>

      {/* Info de ubicacion seleccionada + boton ubicacion actual */}
      <View style={styles.bottomRow}>
        <View style={styles.infoBox}>
          <Ionicons name="location" size={16} color="#4A90D9" />
          <Text style={styles.infoText}>
            {selectedCoords
              ? `${selectedCoords.lat.toFixed(5)}, ${selectedCoords.lng.toFixed(5)}`
              : "Busca una direccion"}
          </Text>
        </View>
        <TouchableOpacity onPress={useCurrentLocation} style={styles.currentLocationBtn}>
          <Ionicons name="navigate" size={16} color="#78909C" />
          <Text style={styles.currentLocationText}>Usar actual</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#263238",
  },
  searchSpinner: {
    marginRight: 8,
  },
  suggestionsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    maxHeight: 200,
    marginBottom: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    gap: 10,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionMainText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#263238",
  },
  suggestionSecondaryText: {
    fontSize: 13,
    color: "#78909C",
    marginTop: 2,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#ECEFF1",
    position: "relative",
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mapPlaceholderText: {
    marginTop: 8,
    color: "#90A4AE",
    fontSize: 14,
  },
  radiusIndicator: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(74, 144, 217, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  radiusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
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
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  infoBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  infoText: {
    color: "#263238",
    fontSize: 12,
    fontWeight: "500",
  },
  currentLocationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  currentLocationText: {
    color: "#78909C",
    fontSize: 12,
    fontWeight: "500",
  },
});
