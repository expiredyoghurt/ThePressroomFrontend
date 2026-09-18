import { useEffect, useState } from "react";
import { getClasses, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { BreakingNewsTab } from "./teacherTabs/BreakingNewsTab";
import { RosterTab } from "./teacherTabs/RosterTab";
import { ReviewQueueTab } from "./teacherTabs/ReviewQueueTab";
import { GoatCurationTab } from "./teacherTabs/GoatCurationTab";
import { SettingsTab } from "./teacherTabs/SettingsTab";
import "./TeacherDashboardPage.css";

type Tab = "breaking-news" | "roster" | "review" | "goat" | "settings";

const TABS: { key: Tab; label: string }[] = [
  { key: "breaking-news", label: "📰 Breaking News" },
  { key: "roster", label: "👥 Roster" },
  { key: "review", label: "🔍 Review Queue" },
  { key: "goat", label: "🐐 GOAT List" },
  { key: "settings", label: "⚙️ Class Settings" },
];

export function TeacherDashboardPage() {
  const { logout } = useAuth();
  const [classes, setClasses] = useState<{ id: number; name: string }[] | null>(null);
  const [classId, setClassId] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("breaking-news");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getClasses()
      .then((r) => {
        setClasses(r.classes);
        if (r.classes.length > 0) setClassId(r.classes[0].id);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load classes."));
  }, []);

  return (
    <>
      <header className="masthead">
        <span className="masthead__title">Newsroom Desk</span>
        <nav>
          {classes && classes.length > 0 && (
            <select
              value={classId ?? ""}
              onChange={(e) => setClassId(Number(e.target.value))}
              style={{ padding: "4px 8px", borderRadius: 3 }}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <button onClick={logout}>Log out</button>
        </nav>
      </header>

      <div className="page">
        {error && <div className="error-banner">{error}</div>}
        {classes && classes.length === 0 && (
          <p>No classes assigned to your account yet — ask your school admin to set one up.</p>
        )}

        {classId !== null && (
          <>
            <div className="tab-bar">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  className={`tab-btn ${tab === t.key ? "tab-btn--active" : ""}`}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="tab-content">
              {tab === "breaking-news" && <BreakingNewsTab classId={classId} />}
              {tab === "roster" && <RosterTab classId={classId} />}
              {tab === "review" && <ReviewQueueTab classId={classId} />}
              {tab === "goat" && <GoatCurationTab classId={classId} />}
              {tab === "settings" && <SettingsTab classId={classId} />}
            </div>
          </>
        )}
      </div>
    </>
  );
}
