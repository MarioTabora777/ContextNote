/**
 * geo.ts - Utilidades de geolocalización
 *
 * Contiene la fórmula de Haversine para calcular distancias
 * entre dos puntos geográficos sobre la superficie terrestre.
 *
 * HAVERSINE: Es la fórmula estándar para calcular distancias
 * en una esfera (la Tierra). Considera la curvatura terrestre,
 * a diferencia de una simple distancia euclidiana.
 *
 * Uso: Se usa en ReminderChecker.tsx para el GEOFENCING,
 * comparando la ubicación del usuario con la del recordatorio.
 */

export function distanceMeters(
  lat1: number, lon1: number,  // Punto 1: ubicación del usuario
  lat2: number, lon2: number   // Punto 2: ubicación del recordatorio
): number {
  // Radio de la Tierra en metros
  const R = 6371000;

  // Convertir diferencias de grados a radianes
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  // Fórmula de Haversine: calcula la distancia del arco
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  // Retorna distancia en metros
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}