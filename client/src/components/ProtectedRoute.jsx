import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Dashboard is reachable only after the vault is unlocked.
export default function ProtectedRoute({ children }) {
  const { unlocked } = useAuth();
  return unlocked ? children : <Navigate to="/" replace />;
}
