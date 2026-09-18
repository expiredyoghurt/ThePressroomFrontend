import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getGoatList, getGoatPickDetail, ApiError } from "../api/client";
import type { GoatScope, GoatListEntry, GoatPickDetail } from "../api/types";
import { PupilHeader } from "../components/PupilHeader";
import { Modal } from "../components/Modal";

const SCOPES: { value: GoatScope; label: string }[] = [
  { value: "class", label: "My class" },
  { value: "level", label: "My level" },
  { value: "school", label: "Whole school" },
];

export function GoatListPage() {
  const [scope, setScope] = useState<GoatScope>("class");
  const [picks, setPicks] = useState<GoatListEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<GoatPickDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    setPicks(null);
    setError(null);
    getGoatList(scope)
      .then((r) => setPicks(r.picks))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load the GOAT list."));
  }, [scope]);

  useEffect(() => {
    if (selectedId === null) return;
    setDetail(null);
    setDetailError(null);
    getGoatPickDetail(selectedId)
      .then(setDetail)
      .catch((err) => setDetailError(err instanceof ApiError ? err.message : "Couldn't load that response."));
  }, [selectedId]);

  return (
    <>
      <PupilHeader />
      <div className="page">
        <p>
          <Link to="/">← Back to the Pressroom</Link>
        </p>
        <h1>🐐 GOAT List</h1>
        <p style={{ color: "var(--ink-light)" }}>
          The best Think &amp; Respond answers, picked by your teachers.
        </p>

        <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
          {SCOPES.map((s) => (
            <button
              key={s.value}
              onClick={() => setScope(s.value)}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: "1px solid var(--rule)",
                background: scope === s.value ? "var(--ink)" : "transparent",
                color: scope === s.value ? "var(--paper)" : "var(--ink)",
                cursor: "pointer",
                fontWeight: scope === s.value ? 700 : 400,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {error && <div className="error-banner">{error}</div>}

        {picks && picks.length === 0 && (
          <p style={{ color: "var(--ink-light)" }}>No GOAT picks here yet — check back after your teacher features one.</p>
        )}

        {picks && picks.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {picks.map((p) => (
              <li key={p.id} style={{ borderBottom: "1px solid var(--rule)" }}>
                <button
                  onClick={() => setSelectedId(p.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 6px",
                    background: p.isYou ? "#fdecea" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontFamily: "inherit",
                    color: "var(--ink)",
                  }}
                >
                  <strong>
                    {p.firstName} {p.lastName}
                    {p.isYou ? " (you)" : ""}
                  </strong>
                  {scope !== "class" && <span style={{ color: "var(--ink-light)" }}> · {p.className}</span>}
                  <span style={{ color: "var(--ink-light)" }}> — {p.articleTitle}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {selectedId !== null && (
          <Modal title="🐐 GOAT Response" onClose={() => setSelectedId(null)}>
            {detailError && <div className="error-banner">{detailError}</div>}
            {!detail && !detailError && <p>Loading…</p>}
            {detail && (
              <div>
                <p style={{ color: "var(--ink-light)", marginTop: 0 }}>
                  {detail.firstName} {detail.lastName} · {detail.className} · {detail.articleTitle}
                </p>
                <p>
                  <strong>Question:</strong> {detail.question}
                </p>
                <p>
                  <strong>Response:</strong> {detail.answer.short}
                </p>
                <p>{detail.answer.long}</p>
                {detail.note && (
                  <p
                    style={{
                      background: "#fff8e6",
                      border: "1px solid var(--rule)",
                      borderRadius: 4,
                      padding: "8px 12px",
                    }}
                  >
                    <strong>Teacher's note ({detail.addedByName}):</strong> {detail.note}
                  </p>
                )}
              </div>
            )}
          </Modal>
        )}
      </div>
    </>
  );
}
