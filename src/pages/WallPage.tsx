import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWall, ApiError } from "../api/client";
import type { WallBadge } from "../api/types";
import { PupilHeader } from "../components/PupilHeader";
import { ThumbnailImage } from "../components/ThumbnailImage";
import "./WallPage.css";

export function WallPage() {
  const [badges, setBadges] = useState<WallBadge[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getWall()
      .then((r) => setBadges(r.badges))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your wall."));
  }, []);

  return (
    <>
      <PupilHeader />
      <div className="page">
        <p>
          <Link to="/">← Back to the Pressroom</Link>
        </p>
        <h1>Published Articles</h1>
        <p style={{ color: "var(--ink-light)" }}>Every article you've fully completed — comprehension, vocabulary and think & respond.</p>

        {error && <div className="error-banner">{error}</div>}
        {badges && badges.length === 0 && <p>Nothing published yet — finish all 3 tasks on an article to see it here.</p>}

        <div className="wall-grid">
          {badges?.map((b) => (
            <div key={b.articleId} className="wall-card">
              <div className="wall-card__ribbon">PUBLISHED</div>
              <ThumbnailImage articleId={b.articleId} alt={b.title} />
              <div className="wall-card__title">{b.title}</div>
              <div className="wall-card__date">{new Date(b.awardedAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
