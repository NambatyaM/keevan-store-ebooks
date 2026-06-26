import { createClient } from "@supabase/supabase-js";

export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase public environment variables are missing.");
  return createClient(url, key);
}

export async function login(email: string, password: string) {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function logout() {
  const supabase = createBrowserClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const supabase = createBrowserClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser() {
  const supabase = createBrowserClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  role: "creator" | "admin";
  creator_id?: string;
  display_name?: string;
  store_id?: string;
  store_slug?: string;
};
