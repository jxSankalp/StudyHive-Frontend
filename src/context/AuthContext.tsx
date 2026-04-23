import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";

interface Profile {
  _id: string;
  email: string;
  username: string;
  photo?: string;
}

interface AuthContextType {
  user: Profile | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

/** Try to get profile from backend. Returns null on any failure. */
async function fetchProfile(session: Session): Promise<Profile | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Build a profile directly from Supabase session data.
 * Used as fallback when the backend is unavailable or the profile row doesn't exist.
 */
function profileFromSession(session: Session): Profile {
  const u = session.user;
  return {
    _id: u.id,
    email: u.email ?? "",
    username:
      u.user_metadata?.username ??
      u.email?.split("@")[0] ??
      "User",
    photo: u.user_metadata?.photo,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrateUser = async (s: Session | null) => {
    if (!s) {
      setUser(null);
      setSession(null);
      setLoading(false);
      return;
    }

    setSession(s);

    // Try backend first, fall back to session data
    const profile = (await fetchProfile(s)) ?? profileFromSession(s);
    setUser(profile);
    setLoading(false);
  };

  const checkAuth = async () => {
    const { data } = await supabase.auth.getSession();
    await hydrateUser(data.session);
  };

  useEffect(() => {
    checkAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        hydrateUser(s);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    if (data.session) {
      setSession(data.session);
      const profile =
        (await fetchProfile(data.session)) ?? profileFromSession(data.session);
      setUser(profile);
    }
  };

  const register = async (
    email: string,
    username: string,
    password: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Store username in Supabase metadata so fallback profile has it
        data: { username },
      },
    });
    if (error) throw error;

    if (data.session) {
      setSession(data.session);

      // Upsert profile row on backend (best-effort)
      try {
        await fetch(`${BACKEND_URL}/api/auth/profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({ username, email }),
        });
      } catch {
        // Backend not available — profile will be auto-created on next /me call
      }

      const profile =
        (await fetchProfile(data.session)) ?? profileFromSession(data.session);
      setUser(profile);
    }
    // If email confirmation required, session is null → user must confirm first
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
