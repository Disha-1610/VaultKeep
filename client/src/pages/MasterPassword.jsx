import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function MasterPassword() {
  const navigate = useNavigate();
  const { unlocked, unlock } = useAuth();

  const [hasMaster, setHasMaster] = useState(null); // null = loading / error
  const [serverError, setServerError] = useState(""); // backend unreachable
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const checkStatus = () => {
    setServerError("");
    setHasMaster(null);
    authApi
      .status()
      .then((d) => setHasMaster(d.hasMaster))
      .catch((e) => {
        // BUG-10 FIX: keep hasMaster as null so neither form renders.
        // Previously this set hasMaster=false, showing "Set Master Password"
        // even when the backend was just unreachable, leading to a 409 error.
        setServerError(e.message);
      });
  };

  useEffect(() => {
    if (unlocked) {
      navigate("/dashboard", { replace: true });
      return;
    }
    checkStatus();
  }, [unlocked, navigate]);

  const handleSetup = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    try {
      const { token } = await authApi.setup(password, confirm);
      unlock(token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { token } = await authApi.unlock(password);
      unlock(token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message); // "Incorrect password. Try again."
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center-screen">
      <div className="card auth-card">
        <h1 className="brand">🔐 VaultKeeper</h1>

        {hasMaster === null && !serverError && <p className="muted">Loading…</p>}

        {serverError && (
          <div>
            <p className="error">{serverError}</p>
            <button className="btn primary" onClick={checkStatus}>
              Retry
            </button>
          </div>
        )}

        {hasMaster === false && (
          <form onSubmit={handleSetup}>
            <h2>Set Master Password</h2>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoFocus
            />
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
            />
            {error && <p className="error">{error}</p>}
            <button className="btn primary" disabled={busy}>
              {busy ? "Saving…" : "Set Master Password"}
            </button>
          </form>
        )}

        {hasMaster === true && (
          <form onSubmit={handleUnlock}>
            <h2>Unlock Vault</h2>
            <label>Master Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter master password"
              autoFocus
            />
            {error && <p className="error">{error}</p>}
            <button className="btn primary" disabled={busy}>
              {busy ? "Unlocking…" : "Unlock Vault"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
