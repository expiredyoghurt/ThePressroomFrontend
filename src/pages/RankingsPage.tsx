import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRankings, ApiError } from "../api/client";
import type { RankingEntry } from "../api/types";
import { PupilHeader } from "../components/PupilHeader";

export function RankingsPage() {
  const [data, setData] = useState<{ rankingsEnabled: boolean; roster: RankingEntry[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRankings()
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load rankings."));
  }, []);

  return (
    <>
      <PupilHeader />
      <div className="page">
        <p>
          <Link to="/">← Back to the Pressroom</Link>
        </p>
        <h1>Your Class</h1>
        {error && <div className="error-banner">{error}</div>}
        {data && !data.rankingsEnabled && (
          <p style={{ color: "var(--ink-light)" }}>Sorted by class list order.</p>
        )}
        {data && data.rankingsEnabled && (
          <p style={{ color: "var(--ink-light)" }}>Sorted by level and XP.</p>
        )}

        {data && (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)" }}>
                <th style={{ padding: "8px 6px" }}>Reporter</th>
                {data.rankingsEnabled && <th style={{ padding: "8px 6px" }}>Level</th>}
                {data.rankingsEnabled && <th style={{ padding: "8px 6px" }}>XP</th>}
                <th style={{ padding: "8px 6px" }}>Published</th>
                <th style={{ padding: "8px 6px" }}>Badges</th>
              </tr>
            </thead>
            <tbody>
              {data.roster.map((r) => (
                <tr
                  key={r.studentId}
                  style={{
                    borderBottom: "1px solid var(--rule)",
                    fontWeight: r.isYou ? 700 : 400,
                    background: r.isYou ? "#fdecea" : "transparent",
                  }}
                >
                  <td style={{ padding: "8px 6px" }}>
                    {r.firstName} {r.lastName}
                    {r.isYou ? " (you)" : ""}
                  </td>
                  {data.rankingsEnabled && <td style={{ padding: "8px 6px" }}>{r.level}</td>}
                  {data.rankingsEnabled && <td style={{ padding: "8px 6px" }}>{r.xp}</td>}
                  <td style={{ padding: "8px 6px" }}>{r.tasksCompleted}</td>
                  <td style={{ padding: "8px 6px" }}>{r.badgesCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
