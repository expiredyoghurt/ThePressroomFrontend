import { useEffect, useState } from "react";
import { getClasses, updateClassSettings, ApiError } from "../../api/client";

export function SettingsTab({ classId }: { classId: number }) {
  const [rankingsEnabled, setRankingsEnabled] = useState(false);
  const [threshold, setThreshold] = useState<string>(""); // "" = inherit school default
  const [gradeLevel, setGradeLevel] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getClasses()
      .then((r) => {
        const cls = r.classes.find((c) => c.id === classId);
        if (cls) {
          setRankingsEnabled(cls.rankingsEnabled);
          setThreshold(cls.similarityThreshold != null ? String(cls.similarityThreshold) : "");
          setGradeLevel(cls.gradeLevel ?? "");
        }
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load settings."));
  }, [classId]);

  async function handleSave() {
    setError(null);
    setSaved(false);
    try {
      await updateClassSettings(classId, {
        rankingsEnabled,
        similarityThreshold: threshold.trim() === "" ? null : Number(threshold),
        gradeLevel: gradeLevel.trim() === "" ? null : gradeLevel.trim(),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save settings.");
    }
  }

  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <h2>Class Settings</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="field" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <input
          type="checkbox"
          id="rankingsEnabled"
          checked={rankingsEnabled}
          onChange={(e) => setRankingsEnabled(e.target.checked)}
          style={{ width: "auto" }}
        />
        <label htmlFor="rankingsEnabled" style={{ margin: 0 }}>
          Show ranked leaderboard (level/XP) to pupils and parents
        </label>
      </div>
      <p style={{ fontSize: 13, color: "var(--ink-light)", marginTop: -6 }}>
        When off, the class list is sorted by register order instead, and level/XP are hidden — everything else
        (tasks completed, badges, retries) still shows either way.
      </p>

      <div className="field" style={{ marginTop: 16 }}>
        <label>Reflect-answer similarity threshold (0.5–0.99, blank = use school default)</label>
        <input
          type="number"
          min={0.5}
          max={0.99}
          step={0.01}
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          placeholder="e.g. 0.85"
        />
      </div>
      <p style={{ fontSize: 13, color: "var(--ink-light)", marginTop: -6 }}>
        A retry that's more similar than this to a sample answer gets a "try rephrasing" prompt before it's
        allowed through.
      </p>

      <div className="field" style={{ marginTop: 16 }}>
        <label>Level (e.g. "P5") — groups classes for the GOAT list's "My level" view</label>
        <input
          type="text"
          value={gradeLevel}
          onChange={(e) => setGradeLevel(e.target.value)}
          placeholder="e.g. P5"
        />
      </div>
      <p style={{ fontSize: 13, color: "var(--ink-light)", marginTop: -6 }}>
        Classes with the same level (exact match) are grouped together when a pupil switches their GOAT list to
        "My level". Leave blank if this class doesn't share a level with any other class.
      </p>

      <button className="btn btn--accent" onClick={handleSave} style={{ marginTop: 12 }}>
        Save
      </button>
      {saved && <p className="result-note result-note--good">Saved.</p>}
    </div>
  );
}
