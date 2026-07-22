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
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/inmuebles?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

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
      <header className="sticky top-0 z-40 bg-blue-600 text-white shadow-md dark:bg-purple-900 border-b border-blue-500/50 dark:border-purple-800/50">
        {/* Fila superior: logo + search + acciones */}
        <div className="px-4 py-3 flex items-center justify-between gap-3 max-w-7xl mx-auto">
          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center rounded-xl border border-white/20 p-2.5 text-white/85 hover:bg-white/10 active:scale-95 shrink-0 dark:border-white/20"
            aria-label="Abrir menú"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h18" />
              <path d="M3 6h18" />
              <path d="M3 18h18" />
            </svg>
          </button>

          {/* Logo */}
          <NavLink to="/" className="flex shrink-0 items-center gap-2.5">
            <img src={logo} alt="InmoSoft" className="h-9 w-9 rounded-xl bg-white/15 p-0.5" />
            <span className="hidden sm:block text-base font-extrabold tracking-tight text-white">Inverdata C.A</span>
          </NavLink>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-4 min-w-0">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Buscar inmuebles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/15 text-white placeholder-white/60 focus:placeholder-white/80 rounded-xl px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/25 border border-transparent dark:bg-white/10 dark:focus:bg-white/20"
              />
              <div className="absolute left-3.5 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </form>

          {/* Acciones derecha */}
          <div className="flex items-center gap-2">
            {/* Dark mode */}
            <button
              type="button"
              onClick={toggleDark}
              className="relative inline-flex h-9.5 w-9.5 items-center justify-center rounded-xl text-white/85 hover:bg-white/10 transition active:scale-95"
              aria-label="Cambiar modo oscuro/claro"
            >
              <svg
                className={`absolute h-4.5 w-4.5 transition-all duration-300 ${dark ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-90"}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              <svg
                className={`absolute h-4.5 w-4.5 transition-all duration-300 ${dark ? "opacity-0 scale-50 -rotate-90" : "opacity-100 scale-100 rotate-0"}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </button>

            {user ? (
              <>
                <NotificationDropdown />
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white border border-white/25 text-xs font-extrabold cursor-default">
                  {initials}
                </div>
                <button
                  onClick={() => { logout(); navigate("/"); }}
                  className="hidden sm:inline-flex whitespace-nowrap items-center justify-center rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all"
                >
                  Salir
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex whitespace-nowrap items-center justify-center rounded-xl bg-white text-blue-600 dark:text-purple-900 hover:bg-white/95 px-4 py-2 text-xs font-bold transition active:scale-95 shadow-sm"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>

        {/* Fila inferior: navegación horizontal (desktop) */}
        <nav className="hidden md:block border-t border-white/15 bg-white/5">
          <div className="px-4 flex items-center gap-1.5 overflow-x-auto scrollbar-custom py-2 max-w-7xl mx-auto">
            <NavOpciones user={user} />
          </div>
        </nav>
      </header>

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-[#0c0c0e] border-r border-slate-100 dark:border-slate-850 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100 dark:border-slate-850">
          <NavLink to="/" className="flex items-center gap-2 min-w-0" onClick={() => setOpen(false)}>
            <img src={logo} alt="InmoSoft" className="h-8.5 w-8.5 rounded-xl bg-slate-100/50 p-0.5 shrink-0" />
            <span className="truncate font-extrabold text-sm text-slate-800 dark:text-white">Inverdata C.A</span>
          </NavLink>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-[#18181c]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Slider de navegación (móvil) */}
        <div className="md:hidden overflow-x-auto border-b border-slate-100 dark:border-slate-850 px-4 py-4 bg-slate-50/50 dark:bg-transparent">
          <div className="flex gap-2 min-w-max">
            <NavSlider user={user} onClick={() => setOpen(false)} />
          </div>
        </div>

        {/* Opciones del sidebar */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5 scrollbar-custom">
          <NavLink
            to="/perfil"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                isActive
                  ? "bg-blue-50/70 text-blue-700 dark:bg-purple-950/40 dark:text-purple-400"
                  : "text-slate-650 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-[#18181c]"
              }`
            }
          >
            <svg className="h-5 w-5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Perfil
          </NavLink>

          <NavLink
            to="/configuracion"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                isActive
                  ? "bg-blue-50/70 text-blue-700 dark:bg-purple-950/40 dark:text-purple-400"
                  : "text-slate-650 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-[#18181c]"
              }`
            }
          >
            <svg className="h-5 w-5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configuración
          </NavLink>

          <NavLink
            to="/reportes"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                isActive
                  ? "bg-blue-50/70 text-blue-700 dark:bg-purple-950/40 dark:text-purple-400"
                  : "text-slate-650 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-[#18181c]"
              }`
            }
          >
            <svg className="h-5 w-5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Reportes
          </NavLink>
        </nav>

        {/* Footer: usuario y auth */}
        <div className="border-t border-slate-100 dark:border-slate-850 px-4 py-5 space-y-3">
          {user ? (
            <>
              <div className="flex items-center gap-3 px-3 py-1.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-650 text-xs font-bold text-white shadow-md">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-slate-800 dark:text-white truncate">{user.nombre || user.name || "Usuario"}</div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 font-bold capitalize">{user.rol}</div>
                </div>
              </div>
              <button
                onClick={() => { logout(); navigate("/"); setOpen(false); }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-650 hover:bg-red-50/60 dark:text-red-400 dark:hover:bg-red-950/20 transition active:scale-98"
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 transition active:scale-98 shadow-sm"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
