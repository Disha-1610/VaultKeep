import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { saveToken, clearToken, getToken, setSessionExpiredHandler } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [unlocked, setUnlocked] = useState(() => !!getToken());

  const unlock = useCallback((token) => {
    saveToken(token);
    setUnlocked(true);
  }, []);

  const lock = useCallback(() => {
    clearToken();
    setUnlocked(false);
  }, []);

  // If the server says the session expired, lock the vault automatically
  useEffect(() => {
    setSessionExpiredHandler(lock);
  }, [lock]);

  return <AuthContext.Provider value={{ unlocked, unlock, lock }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
