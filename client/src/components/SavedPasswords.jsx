import { useEffect, useState, useCallback } from "react";
import { passwordApi } from "../api.js";
import PasswordCard from "./PasswordCard.jsx";

export default function SavedPasswords() {
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // BUG-15 FIX: extract fetch logic into a stable callback so the Retry
  // button can trigger it without the user navigating away and back.
  const loadEntries = useCallback(() => {
    setLoading(true);
    setError("");
    passwordApi
      .list()
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleDelete = (id) => setEntries((prev) => prev.filter((e) => e._id !== id));

  const query = search.trim().toLowerCase();
  const filtered = query ? entries.filter((e) => e.source.toLowerCase().includes(query)) : entries;

  return (
    <section>
      <h3>Saved Passwords</h3>
      <input
        className="search"
        type="text"
        placeholder="Search by Source…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p className="muted">Loading…</p>}

      {error && (
        <div>
          <p className="error">{error}</p>
          <button className="btn" onClick={loadEntries}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <p className="muted">No passwords saved yet. Use "Add / Update Password".</p>
      )}

      {!loading && entries.length > 0 && filtered.length === 0 && (
        <p className="muted">No password saved for that source.</p>
      )}

      <div className="grid">
        {filtered.map((entry) => (
          <PasswordCard key={entry._id} entry={entry} onDelete={handleDelete} />
        ))}
      </div>
    </section>
  );
}
