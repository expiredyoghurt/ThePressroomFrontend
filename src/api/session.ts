import type { SessionKind } from "./types";

const STORAGE_KEY = "pressroom_session";

export interface StoredSession {
  kind: SessionKind;
  token: string;
  // small bits of context worth keeping around without re-fetching on every load
  role?: string;
}

export function getSession(): StoredSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function setSession(session: StoredSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}
