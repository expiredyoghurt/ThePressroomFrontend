import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { parentLogin, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export function ParentLoginPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [classId, setClassId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const idNum = Number(classId);
    if (!idNum) {
      setError("Class ID should be the number your child's teacher gave you.");
      return;
    }
    setLoading(true);
    try {
      await parentLogin(idNum, password);
      refresh();
      navigate("/parent");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>👋 Family View</h1>
        <p className="login-card__sub">Enter the class code and password your child's teacher gave you</p>

        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label htmlFor="classId">Class ID</label>
          <input id="classId" value={classId} onChange={(e) => setClassId(e.target.value)} required />
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
          {loading ? "Logging in…" : "View class"}
        </button>

        <p className="login-card__switch">
          <Link to="/staff/login">Teacher / Admin login →</Link>
        </p>
      </form>
    </div>
  );
}
