import { useState } from "react";
import { authApi } from "../api.js";

export default function VerifyMaster() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", text: "" });
    try {
      await authApi.verify(password);
      setStatus({ type: "success", text: "Master password verified ✔" });
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    }
    setPassword("");
  };

  return (
    <section>
      <h3>Verify Master Password</h3>
      <form onSubmit={handleSubmit} className="card form-card">
        <label>Master Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter master password"
        />
        {status.text && <p className={status.type === "error" ? "error" : "success"}>{status.text}</p>}
        <button className="btn primary">Verify</button>
      </form>
    </section>
  );
}
