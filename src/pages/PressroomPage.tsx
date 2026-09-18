import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listArticles, ApiError } from "../api/client";
import type { ArticleSummary } from "../api/types";
import { PupilHeader } from "../components/PupilHeader";
import "./PressroomPage.css";

type ZoneType = "comprehension" | "vocabulary" | "reflect";

// Hotspot boxes measured directly against public/pressroom-scene.png (1672x940,
// ~16:9). Percentages, not pixels, so this stays correct at any render size.
// If the illustration is ever regenerated/re-cropped, re-measure these against
// the new file rather than assuming the layout is identical.
const HOTSPOTS: {
  key: ZoneType | "wall";
  label: string;
  box: { left: string; top: string; width: string; height: string };
}[] = [
  { key: "reflect", label: "Think & Respond", box: { left: "5.1%", top: "2.7%", width: "40.4%", height: "39.9%" } },
  { key: "wall", label: "Published Articles", box: { left: "54.1%", top: "2.7%", width: "40.4%", height: "39.9%" } },
  { key: "comprehension", label: "Comprehension", box: { left: "3.0%", top: "42.6%", width: "44.3%", height: "54.3%" } },
  { key: "vocabulary", label: "Vocabulary", box: { left: "56.2%", top: "48.9%", width: "38.6%", height: "42.0%" } },
];

export function PressroomPage() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<ArticleSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listArticles()
      .then((r) => setArticles(r.articles))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load the newsroom."));
  }, []);

  function incompleteCount(type: ZoneType): number {
    if (!articles) return 0;
    return articles.filter((a) => a.tasks[type] && !a.tasks[type]!.passed).length;
  }

  const publishedCount = articles?.filter((a) => a.published).length ?? 0;

  function badgeFor(key: ZoneType | "wall"): string | null {
    if (!articles) return null;
    if (key === "wall") return `${publishedCount} published`;
    const n = incompleteCount(key);
    return n === 0 ? "All caught up ✓" : `${n} to do`;
  }

  function goTo(key: ZoneType | "wall") {
    navigate(key === "wall" ? "/wall" : `/zone/${key}`);
  }

  return (
    <>
      <PupilHeader />
      <div className="page">
        <h1>The Pressroom</h1>
        <p style={{ color: "var(--ink-light)" }}>Pick a desk to get to work.</p>

        {error && <div className="error-banner">{error}</div>}

        <div className="pressroom-scene">
          <img
            src="/pressroom-scene.jpg"
            alt="The Pressroom — a desk, two pin-boards, and filing cabinets"
            className="pressroom-scene__img"
          />

          {HOTSPOTS.map((h) => (
            <button
              key={h.key}
              className="hotspot"
              style={h.box}
              onClick={() => goTo(h.key)}
              aria-label={h.label}
              title={h.label}
            >
              <span className="hotspot__label">{h.label}</span>
              {badgeFor(h.key) && <span className="hotspot__badge">{badgeFor(h.key)}</span>}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
