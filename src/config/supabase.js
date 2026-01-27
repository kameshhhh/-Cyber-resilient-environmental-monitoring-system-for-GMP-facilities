import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Configuration
 * Medicine Storage Condition Monitoring Dashboard
 */

const supabaseUrl = "https://ckwrklqafnauufcokmrd.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrd3JrbHFhZm5hdXVmY29rbXJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MDIwMzAsImV4cCI6MjA4MzE3ODAzMH0.Ie8GW2zu-pr-RY2UM4jw1gba6aSkeFBrh8eEUvB_jMY";

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database table names
export const TABLES = {
  ROOMS: "rooms",
  SENSOR_READINGS: "sensor_readings",
  ALERTS: "alerts",
  AUDIT_TRAIL: "audit_trail",
  MEDICINES: "medicines",
};

export default supabase;
