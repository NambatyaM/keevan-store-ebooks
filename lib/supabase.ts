import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function hasSupabasePublicEnv() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function hasSupabaseAdminEnv() {
  return Boolean(supabaseUrl && serviceRoleKey);
}

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase public environment variables are missing.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabaseAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin environment variables are missing.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });
}

export function getOptionalSupabaseAdminClient() {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  return getSupabaseAdminClient();
}
