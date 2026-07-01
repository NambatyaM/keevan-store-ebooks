"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/auth";
import { createSupabaseBrowserClient } from "@/lib/auth";

type AuthState = {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  refresh: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setProfile(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      if (currentSession) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile();
        } else {
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.error("Auth client unavailable:", err);
    }
  }, [fetchProfile]);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    try {
      const supabase = createSupabaseBrowserClient();

      supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
        setSession(currentSession);
        if (currentSession) {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          setUser(currentUser);
          if (currentUser) {
            await fetchProfile();
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }).catch((err) => { console.error("Failed to get session:", err); setLoading(false); });

      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
        setSession(currentSession);
        if (currentSession) {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          setUser(currentUser);
          if (currentUser) {
            fetchProfile();
          } else {
            setProfile(null);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      });
      subscription = authSubscription;
    } catch (err) {
      console.error("Auth client unavailable:", err);
      setLoading(false);
    }

    return () => subscription?.unsubscribe();
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
