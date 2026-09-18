import { useEffect, useState } from "react";
import {
  getRoster,
  addPupil,
  removePupil,
  resetPupilPassword,
  importRoster,
  ApiError,
} from "../../api/client";

interface RosterRow {
  id: number;
  reporterId: string;
  firstName: string;
  lastName: string;
  indexNumber: number;
  xp: number;
  level: number;
  archived: boolean;
}

export function RosterTab({ classId }: { classId: number }) {
  const [students, setStudents] = useState<RosterRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ reporterId: "", firstName: "", lastName: "", indexNumber: "", pressPass: "" });

  const [bulkText, setBulkText] = useState("");
  const [bulkResult, setBulkResult] = useState<{ createdCount: number; skipped: { reporterId: string; reason: string }[] } | null>(null);

  const [resetTarget, setResetTarget] = useState<number | null>(null);
  const [resetValue, setResetValue] = useState("");

  function load() {
    getRoster(classId)
      .then((r) => setStudents(r.students))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load the roster."));
  }

  useEffect(load, [classId]);

  async function handleAdd() {
    setError(null);
    try {
      await addPupil({
        classId,
        reporterId: addForm.reporterId.trim(),
        firstName: addForm.firstName.trim(),
        lastName: addForm.lastName.trim(),
        indexNumber: Number(addForm.indexNumber),
        pressPass: addForm.pressPass,
      });
      setAddForm({ reporterId: "", firstName: "", lastName: "", indexNumber: "", pressPass: "" });
      setShowAdd(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't add pupil.");
    }
  }

  async function handleRemove(studentId: number) {
    if (!confirm("Remove this pupil? Their history (XP, badges) is kept, just hidden from the roster.")) return;
    try {
      await removePupil(studentId);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't remove pupil.");
    }
  }

  async function handleResetPassword() {
    if (!resetTarget || !resetValue.trim()) return;
    try {
      await resetPupilPassword(resetTarget, resetValue.trim());
      setResetTarget(null);
      setResetValue("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reset password.");
    }
  }

  // Bulk paste format: one pupil per line, comma-separated:
  // reporterId,firstName,lastName,indexNumber,pressPass
  async function handleBulkImport() {
    setError(null);
    setBulkResult(null);
    const rows = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [reporterId, firstName, lastName, indexNumber, pressPass] = line.split(",").map((s) => s.trim());
        return { reporterId, firstName, lastName, indexNumber: Number(indexNumber), pressPass };
      });
    try {
      const r = await importRoster(classId, rows);
      setBulkResult(r);
      setBulkText("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Bulk import failed.");
    }
  }

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Roster</h2>
          <button className="btn btn--sm" onClick={() => setShowAdd((s) => !s)}>
            {showAdd ? "Cancel" : "+ Add pupil"}
          </button>
        </div>

        {showAdd && (
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="field">
              <label>Reporter ID</label>
              <input value={addForm.reporterId} onChange={(e) => setAddForm({ ...addForm, reporterId: e.target.value })} />
            </div>
            <div className="field">
              <label>Index number</label>
              <input
                type="number"
                value={addForm.indexNumber}
                onChange={(e) => setAddForm({ ...addForm, indexNumber: e.target.value })}
              />
            </div>
            <div className="field">
              <label>First name</label>
              <input value={addForm.firstName} onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })} />
            </div>
            <div className="field">
              <label>Last name</label>
              <input value={addForm.lastName} onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })} />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Press-Pass</label>
              <input value={addForm.pressPass} onChange={(e) => setAddForm({ ...addForm, pressPass: e.target.value })} />
            </div>
            <button className="btn btn--accent" style={{ gridColumn: "1 / -1" }} onClick={handleAdd}>
              Add
            </button>
          </div>
        )}

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)" }}>
              <th style={{ padding: "6px" }}>#</th>
              <th style={{ padding: "6px" }}>Reporter ID</th>
              <th style={{ padding: "6px" }}>Name</th>
              <th style={{ padding: "6px" }}>Level</th>
              <th style={{ padding: "6px" }}>XP</th>
              <th style={{ padding: "6px" }}></th>
            </tr>
          </thead>
          <tbody>
            {students?.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid var(--rule)" }}>
                <td style={{ padding: "6px" }}>{s.indexNumber}</td>
                <td style={{ padding: "6px" }}>{s.reporterId}</td>
                <td style={{ padding: "6px" }}>
                  {s.firstName} {s.lastName}
                </td>
                <td style={{ padding: "6px" }}>{s.level}</td>
                <td style={{ padding: "6px" }}>{s.xp}</td>
                <td style={{ padding: "6px", display: "flex", gap: 6 }}>
                  <button className="btn btn--sm btn--outline" onClick={() => setResetTarget(s.id)}>
                    Reset password
                  </button>
                  <button className="btn btn--sm btn--outline" onClick={() => handleRemove(s.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {resetTarget && (
          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <input
              placeholder="New Press-Pass"
              value={resetValue}
              onChange={(e) => setResetValue(e.target.value)}
              style={{ padding: 8, border: "1px solid var(--rule)", borderRadius: 3 }}
            />
            <button className="btn btn--sm btn--accent" onClick={handleResetPassword}>
              Save
            </button>
            <button className="btn btn--sm btn--outline" onClick={() => setResetTarget(null)}>
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Bulk import (create-only)</h2>
        <p style={{ color: "var(--ink-light)" }}>
          One pupil per line: <code>reporterId, firstName, lastName, indexNumber, pressPass</code>. Existing
          reporterIds are skipped, never overwritten — safe to re-run.
        </p>
        <textarea
          rows={6}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder="reporter04, Amy, Tan, 4, hunter22"
          style={{ width: "100%", fontFamily: "monospace", fontSize: 13, marginBottom: 10 }}
        />
        <button className="btn btn--accent" disabled={!bulkText.trim()} onClick={handleBulkImport}>
          Import
        </button>

        {bulkResult && (
          <div style={{ marginTop: 12, fontSize: 14 }}>
            <p className="result-note result-note--good">{bulkResult.createdCount} pupil(s) added.</p>
            {bulkResult.skipped.length > 0 && (
              <ul>
                {bulkResult.skipped.map((s, i) => (
                  <li key={i}>
                    {s.reporterId}: {s.reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
