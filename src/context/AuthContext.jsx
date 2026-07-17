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
        const cached = loadUser();
        const params = cached?.id ? { id: cached.id } : {};
        const res = await apiGet("/auth/me", params);
        const u = res?.data || res;
        setUser(u);
        saveUser(u);
      } catch {
        // don't clear cached user on validation failure;
        // only clear on explicit logout
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
    const token = res?.data?.token;
    if (token) localStorage.setItem("token", token);
    const u = res?.data?.user || res;
    setAndPersist(u);
    return res;
  }

  async function logout() {
    localStorage.removeItem("token");
    setAndPersist(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
