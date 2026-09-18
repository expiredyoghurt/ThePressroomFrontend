import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { pupilLogin, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export function PupilLoginPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [reporterId, setReporterId] = useState("");
  const [pressPass, setPressPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await pupilLogin(reporterId.trim(), pressPass);
      refresh();
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>📰 The Pressroom</h1>
        <p className="login-card__sub">Reporter login</p>

        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label htmlFor="reporterId">Reporter ID</label>
          <input
            id="reporterId"
            value={reporterId}
            onChange={(e) => setReporterId(e.target.value)}
            placeholder="e.g. reporter01"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="pressPass">Press-Pass</label>
          <input
            id="pressPass"
            type="password"
            value={pressPass}
            onChange={(e) => setPressPass(e.target.value)}
            required
          />
        </div>

        <button className="btn btn--accent" type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Logging in…" : "Log in"}
        </button>

        <p className="login-card__switch">
          <Link to="/staff/login">Teacher / Admin login →</Link>
        </p>
      </form>
    </div>
  );
}
