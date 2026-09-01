"use client";

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  role: "professional" | "recruiter" | "admin";
};

type AuthSession = {
  token: string;
  user: AuthUser;
};

type AuthContextValue = {
  hydrated: boolean;
  user: AuthUser | null;
  token: string | null;
  signIn: (input: AuthSession) => Promise<void>;
  signOut: () => Promise<void>;
};

const STORAGE_KEY = "bussin-auth";
const AuthContext = createContext<AuthContextValue | null>(null);

export function BussInAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active || !raw) {
          return;
        }

        try {
          setSession(JSON.parse(raw) as AuthSession);
        } catch {
          AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
        }
      })
      .finally(() => {
        if (active) {
          setHydrated(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      hydrated,
      user: session?.user ?? null,
      token: session?.token ?? null,
      async signIn(input) {
        setSession(input);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(input));
      },
      async signOut() {
        setSession(null);
        await AsyncStorage.removeItem(STORAGE_KEY);
      },
    }),
    [hydrated, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useBussInAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useBussInAuth must be used within BussInAuthProvider");
  }

  return context;
}
