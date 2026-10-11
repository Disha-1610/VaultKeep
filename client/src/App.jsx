import { Routes, Route, Navigate } from "react-router-dom";
import MasterPassword from "./pages/MasterPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import SavedPasswords from "./components/SavedPasswords.jsx";
import AddUpdatePassword from "./components/AddUpdatePassword.jsx";
import VerifyMaster from "./components/VerifyMaster.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MasterPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<p className="muted">Choose an option from the menu.</p>} />
        <Route path="view" element={<SavedPasswords />} />
        <Route path="add" element={<AddUpdatePassword />} />
        <Route path="verify" element={<VerifyMaster />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
