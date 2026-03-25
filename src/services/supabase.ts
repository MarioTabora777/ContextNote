/**
 * supabase.ts
 *
 * Cliente de Supabase para la app.
 * Usa autenticación nativa de Supabase (supabase.auth).
 */

import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ============ CONFIGURACION ============
const SUPABASE_URL = "https://nrfbkdokqlwqlbzbniqj.supabase.co";
const SUPABASE_ANON_KEY = "sb_secret_5rqvR-OWTPZzcugFbJnFcw_k62w5PmV";

// ============ CLIENTE ============
// Configuramos AsyncStorage para persistir la sesión en React Native
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
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
