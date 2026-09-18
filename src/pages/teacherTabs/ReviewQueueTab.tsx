import { useEffect, useState } from "react";
import { getReviewQueue, submitReview, ApiError } from "../../api/client";
import type { ReviewQueueEntry } from "../../api/types";

export function ReviewQueueTab({ classId }: { classId: number }) {
  const [queue, setQueue] = useState<ReviewQueueEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bonusInputs, setBonusInputs] = useState<Record<number, string>>({});
  const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  function load() {
    getReviewQueue(classId)
      .then((r) => setQueue(r.queue))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load the review queue."));
  }

  useEffect(load, [classId]);

  async function handleSave(attemptId: number) {
    setError(null);
    const bonus = bonusInputs[attemptId] ? Number(bonusInputs[attemptId]) : undefined;
    try {
      await submitReview(attemptId, bonus, noteInputs[attemptId]);
      setSavedIds((prev) => new Set(prev).add(attemptId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save review.");
    }
  }

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}
      <p style={{ color: "var(--ink-light)" }}>
        Flagged submissions (possible close paraphrase of a sample answer) appear first.
      </p>

      {queue && queue.length === 0 && <p>Nothing to review right now.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {queue?.map((entry) => (
          <div
            key={entry.attemptId}
            className="card"
            style={{ borderLeft: entry.similarityFlagged ? "4px solid var(--warn)" : "4px solid var(--rule)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>
                {entry.studentName} — {entry.articleTitle}
              </strong>
              <span style={{ fontSize: 12, color: "var(--ink-light)" }}>
                Attempt {entry.attemptNumber} · {new Date(entry.submittedAt).toLocaleString()}
              </span>
            </div>
            {entry.similarityFlagged && (
              <p style={{ color: "var(--warn)", fontSize: 13, fontWeight: 600 }}>
                ⚠️ Flagged as possibly close to a sample answer (similarity {(entry.similarityScore ?? 0).toFixed(2)})
              </p>
            )}
            <p style={{ marginTop: 8 }}>
              <em>View:</em> {entry.answers.short}
            </p>
            <p>
              <em>Reasons:</em> {entry.answers.long}
            </p>

            {entry.alreadyReviewed || savedIds.has(entry.attemptId) ? (
              <p className="result-note result-note--good">✓ Reviewed</p>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                <input
                  type="number"
                  placeholder="Bonus XP (0-10)"
                  min={0}
                  max={10}
                  style={{ width: 130, padding: 6, border: "1px solid var(--rule)", borderRadius: 3 }}
                  value={bonusInputs[entry.attemptId] ?? ""}
                  onChange={(e) => setBonusInputs({ ...bonusInputs, [entry.attemptId]: e.target.value })}
                />
                <input
                  placeholder="Note (optional)"
                  style={{ flex: 1, padding: 6, border: "1px solid var(--rule)", borderRadius: 3 }}
                  value={noteInputs[entry.attemptId] ?? ""}
                  onChange={(e) => setNoteInputs({ ...noteInputs, [entry.attemptId]: e.target.value })}
                />
                <button className="btn btn--sm btn--accent" onClick={() => handleSave(entry.attemptId)}>
                  Save
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
