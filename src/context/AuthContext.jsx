import { createContext, useContext, useEffect, useState } from "react";
import { apiGet, apiPost } from "../api";

const AuthContext = createContext(null);

function loadUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveUser(u) {
  if (u) localStorage.setItem("user", JSON.stringify(u));
  else localStorage.removeItem("user");
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet("/auth/me");
        const u = res?.data || res;
        setUser(u);
        saveUser(u);
      } catch {
        setUser(null);
        saveUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function setAndPersist(u) {
    setUser(u);
    saveUser(u);
  }

  async function login(email, password) {
    const res = await apiPost("/auth/login", { email, password });
    const u = res?.data?.user || res;
    setAndPersist(u);
    return res;
  }

  async function logout() {
    await apiPost("/auth/logout").catch(() => {});
    setAndPersist(null);
  }

  function updateUser(partialData) {
    setUser((prev) => {
      const updated = { ...prev, ...partialData };
      saveUser(updated);
      return updated;
    });
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
