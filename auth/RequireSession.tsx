import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { SessionKind } from "../api/types";

const LOGIN_PATH: Record<SessionKind, string> = {
  pupil: "/login",
  teacher: "/staff/login",
  parent: "/parent/login",
};

export function RequireSession({ kind, children }: { kind: SessionKind; children: ReactNode }) {
  const { session } = useAuth();
  if (!session || session.kind !== kind) {
    return <Navigate to={LOGIN_PATH[kind]} replace />;
  }
  return <>{children}</>;
}
