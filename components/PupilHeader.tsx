import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function PupilHeader({ xp, level }: { xp?: number; level?: number }) {
  const { logout } = useAuth();
  return (
    <header className="masthead">
      <Link to="/" className="masthead__title">
        The Pressroom
      </Link>
      <nav>
        {xp !== undefined && (
          <span className="masthead__meta">
            Level {level} · {xp} XP
          </span>
        )}
        <Link to="/rankings">Rankings</Link>
        <Link to="/goat">GOAT list</Link>
        <Link to="/wall">Published wall</Link>
        <button onClick={logout}>Log out</button>
      </nav>
    </header>
  );
}
