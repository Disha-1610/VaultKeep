import { useState } from "react";
import { passwordApi } from "../api.js";

export default function AddUpdatePassword() {
  const [form, setForm] = useState({ source: "", username: "", password: "" });
  const [status, setStatus] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", text: "" });
    if (!form.source.trim() || !form.username.trim() || !form.password) {
      return setStatus({ type: "error", text: "All fields are required." });
    }
    setBusy(true);
    try {
      // Server updates the existing entry if the source already exists
      const { updated } = await passwordApi.save(form);
      setStatus({
        type: "success",
        text: updated
          ? `Existing entry for "${form.source.trim()}" updated.`
          : `New entry for "${form.source.trim()}" saved.`,
      });
      setForm({ source: "", username: "", password: "" });
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <h3>Add / Update Password</h3>
      <form onSubmit={handleSubmit} className="card form-card">
        <label>Source (website or app)</label>
        <input name="source" value={form.source} onChange={handleChange} placeholder="e.g. GitHub" />
        <label>Username / Email</label>
        <input name="username" value={form.username} onChange={handleChange} placeholder="e.g. me@mail.com" />
        <label>Password</label>
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Site password"
        />
        {status.text && <p className={status.type === "error" ? "error" : "success"}>{status.text}</p>}
        <button className="btn primary" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      </form>
    </section>
  );
}
