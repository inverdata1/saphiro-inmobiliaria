import { useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.inverdata.jpg";
import {
  ClienteOpciones,
  CorredorOpciones,
  AdminOpciones,
  ClienteSlider,
  CorredorSlider,
  AdminSlider,
} from "./NavbarOpciones";
import NotificationDropdown from "./NotificationDropdown";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  const NavOpciones =
    user?.rol === "admin"
      ? AdminOpciones
      : user?.rol === "corredor"
      ? CorredorOpciones
      : ClienteOpciones;

  const NavSlider =
    user?.rol === "admin"
      ? AdminSlider
      : user?.rol === "corredor"
      ? CorredorSlider
      : ClienteSlider;

  const initials = user
    ? (user.nombre || user.name || "")
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "US";

  return (
    <>
      <header className="relative border-b border-blue-600 bg-blue-700 text-white shadow-sm dark:border-indigo-700 dark:bg-indigo-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center rounded-xl border border-white/20 px-3 py-2 text-white hover:bg-white/10"
            aria-label="Abrir menú"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h18" />
              <path d="M3 6h18" />
              <path d="M3 18h18" />
            </svg>
          </button>

          <NavLink to="/" className="flex shrink-0 items-center gap-2 min-w-0">
            <img src={logo} alt="InmoSoft" className="h-12 w-12 rounded-xl bg-white/15 p-1" />
          </NavLink>

          <nav className="hidden md:flex flex-1 min-w-0 flex-wrap items-center justify-end gap-1 md:gap-2">
            <NavOpciones user={user} />

            {user ? (
              <>
                <button
                  onClick={() => { logout(); navigate("/"); }}
                  className="inline-flex whitespace-nowrap items-center justify-center rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Cerrar sesión
                </button>
                <NotificationDropdown />
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white/50 bg-white/10 text-xs font-semibold">
                  {initials}
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex whitespace-nowrap items-center justify-center rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Iniciar sesión
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out dark:bg-slate-900 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-800">
          <NavLink to="/" className="flex items-center gap-2 min-w-0" onClick={() => setOpen(false)}>
            <img src={logo} alt="InmoSoft" className="h-9 w-9 rounded-xl bg-white/15 p-0.5 shrink-0" />
            <span className="truncate font-extrabold text-sm text-slate-800 dark:text-white">Inverdata C.A</span>
          </NavLink>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleDark}
              className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800 transition"
              aria-label="Cambiar modo oscuro/claro"
            >
              <svg
                className={`absolute h-4 w-4 transition-all duration-300 ${dark ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-90"}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              <svg
                className={`absolute h-4 w-4 transition-all duration-300 ${dark ? "opacity-0 scale-50 -rotate-90" : "opacity-100 scale-100 rotate-0"}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Slider de navegación */}
        <div className="md:hidden overflow-x-auto border-b border-slate-100 dark:border-slate-800 px-3 py-3">
          <div className="flex gap-2 min-w-max">
            <NavSlider user={user} onClick={() => setOpen(false)} />
          </div>
        </div>

        {/* Opciones exclusivas del sidebar */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <NavLink
            to="/perfil"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`
            }
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Perfil
          </NavLink>

          <NavLink
            to="/configuracion"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`
            }
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configuración
          </NavLink>

          <NavLink
            to="/reportes"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`
            }
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Reportes
          </NavLink>

        </nav>

        {/* Footer: usuario y auth */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-4 space-y-2">
          {user ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user.nombre || user.name || "Usuario"}</div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 capitalize">{user.rol}</div>
                </div>
              </div>
              <button
                onClick={() => { logout(); navigate("/"); setOpen(false); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition"
              >
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
