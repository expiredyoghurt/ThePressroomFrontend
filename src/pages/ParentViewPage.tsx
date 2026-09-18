import { useEffect, useState } from "react";
import { getParentClass, ApiError } from "../api/client";
import type { ParentRosterEntry } from "../api/types";
import { useAuth } from "../auth/AuthContext";

export function ParentViewPage() {
  const { logout } = useAuth();
  const [data, setData] = useState<{ rankingsEnabled: boolean; roster: ParentRosterEntry[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getParentClass()
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load class info."));
  }, []);

  return (
    <>
      <header className="masthead">
        <span className="masthead__title">The Pressroom — Family View</span>
        <button onClick={logout}>Log out</button>
      </header>
      <div className="page">
        <h1>Your Child's Class</h1>
        <p style={{ color: "var(--ink-light)" }}>
          A read-only overview — no individual written answers are shown here.
        </p>

        {error && <div className="error-banner">{error}</div>}

        {data && (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)" }}>
                <th style={{ padding: "8px 6px" }}>Pupil</th>
                {data.rankingsEnabled && <th style={{ padding: "8px 6px" }}>Level</th>}
                {data.rankingsEnabled && <th style={{ padding: "8px 6px" }}>XP</th>}
                <th style={{ padding: "8px 6px" }}>Tasks completed</th>
                <th style={{ padding: "8px 6px" }}>Badges</th>
                <th style={{ padding: "8px 6px" }}>Retries</th>
              </tr>
            </thead>
            <tbody>
              {data.roster.map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--rule)" }}>
                  <td style={{ padding: "8px 6px" }}>{r.displayName}</td>
                  {data.rankingsEnabled && <td style={{ padding: "8px 6px" }}>{r.level}</td>}
                  {data.rankingsEnabled && <td style={{ padding: "8px 6px" }}>{r.xp}</td>}
                  <td style={{ padding: "8px 6px" }}>{r.tasksCompleted}</td>
                  <td style={{ padding: "8px 6px" }}>{r.badgesCount}</td>
                  <td style={{ padding: "8px 6px" }}>{r.retries}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
