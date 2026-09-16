import { createContext, useEffect, useRef, useState } from "react";
import { apiGet, apiPost, refreshSession, SessionExpiredError } from "../api";

export const AuthContext = createContext(null);

const AUTO_REFRESH_INTERVAL = 14 * 60 * 1000;

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
  const timerRef = useRef(null);

  function stopAutoRefresh() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    timerRef.current = setInterval(() => {
      refreshSession().catch((err) => {
        if (err instanceof SessionExpiredError) {
          setUser(null);
          saveUser(null);
          stopAutoRefresh();
        }
      });
    }, AUTO_REFRESH_INTERVAL);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGet("/auth/me");
        if (cancelled) return;
        const u = res?.data || res;
        setUser(u);
        saveUser(u);
        startAutoRefresh();
      } catch (err) {
        if (cancelled) return;
        if (err instanceof SessionExpiredError) {
          setUser(null);
          saveUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      stopAutoRefresh();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setAndPersist(u) {
    setUser(u);
    saveUser(u);
  }

  async function login(email, password) {
    const res = await apiPost("/auth/login", { email, password });
    const u = res?.data?.user || res;
    setAndPersist(u);
    startAutoRefresh();
    return res;
  }

  async function logout() {
    stopAutoRefresh();
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
