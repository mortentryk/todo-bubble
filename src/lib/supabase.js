import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Null when env vars are missing (offline / local-only mode). */
export const supabase =
  url && anonKey ? createClient(url, anonKey, { auth: { persistSession: true } }) : null;

export function isSupabaseConfigured() {
  return Boolean(supabase);
}
