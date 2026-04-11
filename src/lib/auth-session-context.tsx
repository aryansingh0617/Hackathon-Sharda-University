"use client";

import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react";

type SessionMode = "farmer" | "guest";

export type AuthSession = {
  name: string;
  phone?: string;
  mode: SessionMode;
  createdAt: string;
};

type SignInInput = {
  name: string;
  phone?: string;
};

type AuthSessionContextValue = {
  ready: boolean;
  session: AuthSession | null;
  signIn: (input: SignInInput) => void;
  enterGuest: () => void;
  signOut: () => void;
};

const STORAGE_KEY = "agrisentinel.auth.session.v1";

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

function readStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (parsed?.name && (parsed.mode === "farmer" || parsed.mode === "guest")) {
      return {
        name: parsed.name,
        phone: parsed.phone,
        mode: parsed.mode,
        createdAt: parsed.createdAt ?? new Date().toISOString(),
      };
    }
  } catch {}

  return null;
}

function persistSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;

  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession());

  function signIn(input: SignInInput) {
    const nextSession: AuthSession = {
      name: input.name.trim(),
      phone: input.phone?.trim() || undefined,
      mode: "farmer",
      createdAt: new Date().toISOString(),
    };
    setSession(nextSession);
    persistSession(nextSession);
  }

  function enterGuest() {
    const nextSession: AuthSession = {
      name: "Guest Demo",
      mode: "guest",
      createdAt: new Date().toISOString(),
    };
    setSession(nextSession);
    persistSession(nextSession);
  }

  function signOut() {
    setSession(null);
    persistSession(null);
  }

  return (
    <AuthSessionContext.Provider value={{ ready, session, signIn, enterGuest, signOut }}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider.");
  }
  return context;
}
