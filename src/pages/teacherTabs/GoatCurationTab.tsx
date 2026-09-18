import { useEffect, useState } from "react";
import {
  getReviewQueue,
  getGoatPicksForClass,
  addGoatPick,
  updateGoatPickNote,
  removeGoatPick,
  ApiError,
} from "../../api/client";
import type { ReviewQueueEntry, AdminGoatPick } from "../../api/types";

export function GoatCurationTab({ classId }: { classId: number }) {
  const [queue, setQueue] = useState<ReviewQueueEntry[] | null>(null);
  const [picks, setPicks] = useState<AdminGoatPick[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});
  const [busyAttemptId, setBusyAttemptId] = useState<number | null>(null);

  function load() {
    setError(null);
    Promise.all([getReviewQueue(classId), getGoatPicksForClass(classId)])
      .then(([q, g]) => {
        setQueue(q.queue);
        setPicks(g.picks);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load Think & Respond submissions."));
  }

  useEffect(load, [classId]);

  const pickByAttempt = new Map((picks ?? []).map((p) => [p.attemptId, p]));

  async function handleFeature(attemptId: number) {
    setError(null);
    setBusyAttemptId(attemptId);
    try {
      await addGoatPick(attemptId, noteInputs[attemptId]?.trim() || undefined);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't add to the GOAT list.");
    } finally {
      setBusyAttemptId(null);
    }
  }

  async function handleUpdateNote(attemptId: number, goatPickId: number) {
    setError(null);
    setBusyAttemptId(attemptId);
    try {
      await updateGoatPickNote(goatPickId, noteInputs[attemptId]?.trim() ?? "");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update the note.");
    } finally {
      setBusyAttemptId(null);
    }
  }

  async function handleRemove(attemptId: number, goatPickId: number) {
    setError(null);
    setBusyAttemptId(attemptId);
    try {
      await removeGoatPick(goatPickId);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't remove from the GOAT list.");
    } finally {
      setBusyAttemptId(null);
    }
  }

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}
      <p style={{ color: "var(--ink-light)" }}>
        Feature the best Think &amp; Respond opinions here — pupils see featured names on their GOAT list, with the
        question, their response, and your note in a pop-up when they tap it. This is entirely manual: nothing is
        auto-selected by score.
      </p>

      {queue && queue.length === 0 && <p>No Think &amp; Respond submissions for this class yet.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {queue?.map((entry) => {
          const existingPick = pickByAttempt.get(entry.attemptId);
          const isFeatured = !!existingPick;
          const busy = busyAttemptId === entry.attemptId;
          const noteValue = noteInputs[entry.attemptId] ?? existingPick?.note ?? "";

          return (
            <div
              key={entry.attemptId}
              className="card"
              style={{ borderLeft: isFeatured ? "4px solid var(--accent, #b02a2a)" : "4px solid var(--rule)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>
                  {entry.studentName} — {entry.articleTitle}
                </strong>
                <span style={{ fontSize: 12, color: "var(--ink-light)" }}>
                  Attempt {entry.attemptNumber} · {new Date(entry.submittedAt).toLocaleString()}
                </span>
              </div>
              <p style={{ marginTop: 8 }}>
                <em>View:</em> {entry.answers.short}
              </p>
              <p>
                <em>Reasons:</em> {entry.answers.long}
              </p>

              {isFeatured && <p className="result-note result-note--good">🐐 On the GOAT list</p>}

              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                <input
                  placeholder="Teacher's note (shown to pupils)"
                  style={{ flex: 1, padding: 6, border: "1px solid var(--rule)", borderRadius: 3 }}
                  value={noteValue}
                  onChange={(e) => setNoteInputs({ ...noteInputs, [entry.attemptId]: e.target.value })}
                />
                {!isFeatured && (
                  <button
                    className="btn btn--sm btn--accent"
                    disabled={busy}
                    onClick={() => handleFeature(entry.attemptId)}
                  >
                    🐐 Feature
                  </button>
                )}
                {isFeatured && (
                  <>
                    <button
                      className="btn btn--sm"
                      disabled={busy}
                      onClick={() => handleUpdateNote(entry.attemptId, existingPick.id)}
                    >
                      Save note
                    </button>
                    <button
                      className="btn btn--sm"
                      disabled={busy}
                      onClick={() => handleRemove(entry.attemptId, existingPick.id)}
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
