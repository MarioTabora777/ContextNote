/**
 * supabase.ts - Configuración del cliente Supabase
 *
 * SUPABASE: Es un Backend-as-a-Service (BaaS) similar a Firebase.
 * Proporciona: Base de datos PostgreSQL, Autenticación, Storage, etc.
 *
 * ARQUITECTURA:
 * - Usamos supabase.auth para autenticación (login/registro)
 * - Usamos supabase.from("tabla") para operaciones CRUD
 * - AsyncStorage persiste la sesión del usuario en el dispositivo
 *
 * SEGURIDAD:
 * - ANON_KEY es pública (solo permite operaciones permitidas por RLS)
 * - RLS (Row Level Security) en Supabase protege los datos por usuario
 * - Las contraseñas se hashean automáticamente con bcrypt
 */

import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ============ CONFIGURACION ============
const SUPABASE_URL = "https://nrfbkdokqlwqlbzbniqj.supabase.co";
const SUPABASE_ANON_KEY = "sb_secret_5rqvR-OWTPZzcugFbJnFcw_k62w5PmV";

// ============ CLIENTE ============
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,        // Persistir sesión en dispositivo móvil
    autoRefreshToken: true,       // Renovar JWT automáticamente
    persistSession: true,         // Mantener sesión entre reinicios
    detectSessionInUrl: false,    // Desactivado porque no es web
  },
});

export type DbReminder = {
  id: string;
  user_id: string;
  title: string;
  note: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_meters: number | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  priority: "high" | "medium" | "low";
  reminder_type: "location" | "datetime" | "both";
  is_enabled: boolean;
  is_completed: boolean;
  created_at: string;
  last_triggered_at: string | null;
  trigger_history: Array<{ triggeredAt: string; type: "location" | "datetime" }>;
};
