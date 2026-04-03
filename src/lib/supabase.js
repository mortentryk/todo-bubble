import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Null when env vars are missing (offline / local-only mode). */
export const supabase =
  url && key ? createClient(url, key, { auth: { persistSession: true } }) : null;

export function isSupabaseConfigured() {
  return Boolean(supabase);
}
