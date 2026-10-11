import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { lock } = useAuth();
  const navigate = useNavigate();

  const handleLock = () => {
    lock();
    navigate("/", { replace: true });
  };

  const linkClass = ({ isActive }) => "menu-item" + (isActive ? " active" : "");

  return (
    <div className="dashboard">
      <aside className="sidebar">
        {/* BUG-13 FIX: only one <h1> allowed per page (HTML/SEO spec).
            The sidebar brand is presentational — use <p> with the same classes. */}
        <p className="brand small">🔐 VaultKeeper</p>
        <nav>
          <NavLink to="/dashboard/view" className={linkClass}>
            View Passwords
          </NavLink>
          <NavLink to="/dashboard/add" className={linkClass}>
            Add / Update Password
          </NavLink>
          <NavLink to="/dashboard/verify" className={linkClass}>
            Verify Master Password
          </NavLink>
          <button className="menu-item danger" onClick={handleLock}>
            Lock Vault (Exit)
          </button>
        </nav>
      </aside>
      <main className="content">
        <h1>Dashboard</h1>
        <Outlet />
      </main>
    </div>
  );
}
