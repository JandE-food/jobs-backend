"use client";

import {
  createContext,
  useEffect,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  apiUrl,
  clearStoredSession,
  getStoredSession,
  readJsonResponse,
  setStoredSession,
  type SessionUser,
  type StoredSession,
} from "../../api";

type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  role: "professional" | "recruiter" | "admin";
  availableRoles: Array<"professional" | "recruiter" | "admin">;
  hasSwitchPin: boolean;
};

type KindredContextValue = {
  user: AuthUser | null;
  hydrated: boolean;
  token: string | null;
  signIn: (input: StoredSession) => void;
  signOut: () => Promise<void>;
  switchRole: (
    role: "professional" | "recruiter",
    pin?: string,
  ) => Promise<
    | { ok: true; user: AuthUser }
    | {
        ok: false;
        message: string;
      }
  >;
  refreshSession: () => Promise<void>;
};

const KindredContext = createContext<KindredContextValue | null>(null);

export function KindredProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return getStoredSession();
  });
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!session?.token) {
      return;
    }

    void fetch(`${apiUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Session expired");
        }

        const payload = await readJsonResponse<{ user?: SessionUser }>(response);

        if (!payload.user) {
          throw new Error("Missing user");
        }

        const nextSession = {
          token: session.token,
          user: payload.user,
        };

        setSession(nextSession);
        setStoredSession(nextSession);
      })
      .catch(() => {
        setSession(null);
        clearStoredSession();
      });
  }, [hydrated, session?.token]);

  const value = useMemo<KindredContextValue>(
    () => ({
      user: session?.user ?? null,
      hydrated,
      token: session?.token ?? null,
      signIn(input) {
        setSession(input);
        setStoredSession(input);
      },
      async signOut() {
        const activeToken = getStoredSession()?.token;
        setSession(null);
        clearStoredSession();

        if (typeof window !== "undefined") {
          try {
            window.sessionStorage.removeItem("bejeli-guest-prompt-dismissed");
          } catch {
            // Ignore session storage limitations during logout cleanup.
          }
        }

        if (activeToken) {
          void fetch(`${apiUrl}/auth/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${activeToken}`,
            },
          }).catch(() => undefined);
        }
      },
      async switchRole(role, pin) {
        const currentSession = getStoredSession();

        if (!currentSession?.token) {
          return {
            ok: false,
            message: "Sign in to switch account view.",
          };
        }

        const response = await fetch(`${apiUrl}/auth/switch-role`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${currentSession.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role,
            pin,
          }),
        });
        const payload = await readJsonResponse<{
          user?: SessionUser;
          message?: string;
        }>(response);

        if (!response.ok || !payload.user) {
          return {
            ok: false,
            message: payload.message ?? "Unable to switch account view.",
          };
        }

        const nextSession = {
          token: currentSession.token,
          user: payload.user,
        };

        setSession(nextSession);
        setStoredSession(nextSession);

        return {
          ok: true,
          user: payload.user,
        };
      },
      async refreshSession() {
        const currentSession = getStoredSession();

        if (!currentSession?.token) {
          setSession(null);
          return;
        }

        const response = await fetch(`${apiUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${currentSession.token}`,
          },
        });

        if (!response.ok) {
          setSession(null);
          clearStoredSession();
          return;
        }

        const payload = await readJsonResponse<{ user?: SessionUser }>(response);

        if (!payload.user) {
          setSession(null);
          clearStoredSession();
          return;
        }

        const nextSession = {
          token: currentSession.token,
          user: payload.user,
        };

        setSession(nextSession);
        setStoredSession(nextSession);
      },
    }),
    [hydrated, session],
  );

  return (
    <KindredContext.Provider value={value}>{children}</KindredContext.Provider>
  );
}

export function useKindredAuth() {
  const context = useContext(KindredContext);

  if (!context) {
    throw new Error("useKindredAuth must be used within KindredProvider");
  }

  return context;
}
