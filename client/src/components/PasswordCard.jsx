import { useState } from "react";
import { passwordApi } from "../api.js";

// One saved entry. Password stays masked until Show is clicked (decrypted on demand).
export default function PasswordCard({ entry, onDelete }) {
  const [plain, setPlain] = useState(null);
  const [visible, setVisible] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchPlain = async () => {
    if (plain !== null) return plain;
    const { password } = await passwordApi.reveal(entry._id);
    setPlain(password);
    return password;
  };

  const toggleShow = async () => {
    setMsg("");
    if (visible) {
      setVisible(false);
      setPlain(null); // drop decrypted value from memory when hidden
      return;
    }
    setBusy(true);
    try {
      // BUG-08 FIX: use the returned value directly — don't rely on the
      // setPlain side-effect inside fetchPlain, which was invisible to readers.
      const value = await fetchPlain();
      setPlain(value);   // ensure state is always set from the return value
      setVisible(true);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    setMsg("");
    try {
      const value = await fetchPlain();
      if (navigator.clipboard && window.isSecureContext) {
        // Modern API — requires HTTPS or localhost
        await navigator.clipboard.writeText(value);
      } else {
        // Fallback for plain HTTP: create a hidden textarea, select it, copy
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (!ok) throw new Error("Copy failed — please copy the password manually.");
      }
      if (!visible) setPlain(null);
      setMsg("Copied!");
      setTimeout(() => setMsg(""), 1500);
    } catch (e) {
      setMsg(e.message || "Copy failed.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete the password for "${entry.source}"?`)) return;
    try {
      await passwordApi.remove(entry._id);
      onDelete(entry._id);
    } catch (e) {
      setMsg(e.message);
    }
  };

  return (
    <div className="card entry">
      <h3>{entry.source}</h3>
      <p>
        <span className="muted">Username / Email:</span> {entry.username}
      </p>
      <p className="pw-row">
        <span className="muted">Password:</span>{" "}
        <code>{visible && plain !== null ? plain : "●●●●●●"}</code>
      </p>
      <div className="btn-row">
        <button className="btn" onClick={toggleShow} disabled={busy}>
          {visible ? "Hide" : "Show"}
        </button>
        <button className="btn" onClick={handleCopy}>
          Copy
        </button>
        <button className="btn danger-btn" onClick={handleDelete}>
          Delete
        </button>
      </div>
      {msg && <p className="note">{msg}</p>}
    </div>
  );
}
