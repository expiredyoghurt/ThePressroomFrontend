import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { listArticles, ApiError } from "../api/client";
import type { ArticleSummary } from "../api/types";
import { PupilHeader } from "../components/PupilHeader";

const ZONE_LABELS: Record<string, string> = {
  comprehension: "Comprehension",
  vocabulary: "Vocabulary",
  reflect: "Think & Respond",
};

export function ZonePage() {
  const { type } = useParams<{ type: "comprehension" | "vocabulary" | "reflect" }>();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<ArticleSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listArticles()
      .then((r) => setArticles(r.articles))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load articles."));
  }, []);

  if (!type || !ZONE_LABELS[type]) return <p className="page">Unknown zone.</p>;

  return (
    <>
      <PupilHeader />
      <div className="page">
        <p>
          <Link to="/">← Back to the Pressroom</Link>
        </p>
        <h1>{ZONE_LABELS[type]}</h1>

        {error && <div className="error-banner">{error}</div>}
        {!articles && !error && <p>Loading…</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
          {articles?.map((a) => {
            const task = a.tasks[type];
            if (!task) return null;
            return (
              <button
                key={a.articleId}
                className="card"
                style={{
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "none",
                  borderLeft: `4px solid ${task.passed ? "var(--success)" : "var(--rule)"}`,
                }}
                onClick={() => navigate(`/task/${task.taskId}`)}
              >
                <span>
                  <strong>{a.title}</strong>
                  <br />
                  <span style={{ fontSize: 13, color: "var(--ink-light)" }}>
                    {a.section} · {a.publishDate}
                  </span>
                </span>
                <span style={{ fontSize: 13 }}>
                  {task.passed
                    ? "✅ Passed"
                    : task.attemptsCount > 0
                      ? `Try again (${task.attemptsCount} attempt${task.attemptsCount === 1 ? "" : "s"} so far)`
                      : "Not started"}
                </span>
              </button>
            );
          })}
          {articles && articles.length === 0 && <p>No articles are available yet — check back soon.</p>}
        </div>
      </div>
    </>
  );
}
