import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { teacherLogin, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export function TeacherLoginPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await teacherLogin(email.trim(), password);
      refresh();
      navigate("/staff");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>🗞️ Newsroom Desk</h1>
        <p className="login-card__sub">Teacher / admin login</p>

        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label htmlFor="email">Username or email</label>
          <input id="email" type="text" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="btn btn--accent" type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Logging in…" : "Log in"}
        </button>

        <p className="login-card__switch">
          <Link to="/login">← Reporter (pupil) login</Link>
          {" · "}
          <Link to="/parent/login">Parent login →</Link>
        </p>
      </form>
    </div>
  );
}
