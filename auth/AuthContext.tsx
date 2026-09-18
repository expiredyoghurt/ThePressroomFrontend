import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { getSession, clearSession, type StoredSession } from "../api/session";

interface AuthContextValue {
  session: StoredSession | null;
  refresh: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<StoredSession | null>(getSession());

  const refresh = useCallback(() => setSessionState(getSession()), []);
  const logout = useCallback(() => {
    clearSession();
    setSessionState(null);
  }, []);

  return <AuthContext.Provider value={{ session, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
