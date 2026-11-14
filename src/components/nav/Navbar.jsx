import { useState, useEffect } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import useProfilePhotoSync from "../../hooks/useProfilePhotoSync";
import { Item } from "./NavbarOpciones";
import NotificationDropdown from "../NotificationDropdown";
import { SidebarOpciones } from "./SidebarOpciones";
import { useT } from "../../lib/i18n";

export default function Navbar() {
  const { user, logout } = useAuth();
  const tr = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useProfilePhotoSync();

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
      <header className="sticky top-0 z-40 bg-white text-slate-900 shadow-sm border-b border-slate-100">
        {/* Fila superior: logo + acciones */}
        <div className="px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4 max-w-7xl mx-auto">
          <div className="flex items-center min-w-0">
            {/* Hamburger (oculto en desktop para invitados: en lg+ ya están Inicio e Inmuebles) */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={`inline-flex items-center justify-center rounded-xl border border-slate-200 p-2 sm:p-2.5 text-slate-800 hover:bg-slate-50 active:scale-95 shrink-0 cursor-pointer ${user ? "" : "lg:hidden"}`}
              aria-label="Abrir menú"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h18" />
                <path d="M3 6h18" />
                <path d="M3 18h18" />
              </svg>
            </button>

            {/* Logo */}
            <NavLink
              to="/"
              className={`flex shrink-0 items-center gap-2.5 ${user ? "ml-3 sm:ml-6 lg:ml-8" : "ml-3 sm:ml-6"}`}
            >
              <img
                src="/inverdata-logo.png"
                alt=""
                className="h-9 w-9 rounded-xl bg-slate-100 object-contain p-0.5"
              />
              <span className="hidden sm:block text-base font-extrabold tracking-tight text-slate-900">
                Saphiro Inmobiliaria
              </span>
            </NavLink>
          </div>

          {/* Acciones derecha */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={toggleDark}
              className="relative inline-flex h-9 w-9 sm:h-9.5 sm:w-9.5 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition active:scale-95 cursor-pointer"
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
                {location.pathname !== "/notificaciones" && <NotificationDropdown />}
                <Link
                  to="/perfil"
                  title="Ver mi perfil"
                  className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-extrabold overflow-hidden hover:ring-2 hover:ring-slate-300 hover:scale-105 transition-all cursor-pointer"
                >
                  {user.foto_perfil || user.avatar ? (
                    <img
                      src={user.foto_perfil || user.avatar}
                      alt={user.nombre || "Perfil"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </Link>
                <button
                  onClick={() => { logout(); navigate("/"); }}
                  className="hidden sm:inline-flex whitespace-nowrap items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Salir
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex whitespace-nowrap items-center justify-center rounded-full bg-slate-900 hover:bg-slate-800 px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white transition active:scale-95 shadow-sm"
              >
                {tr("signIn")}
              </Link>
            )}
          </div>
        </div>


        <div className="hidden lg:block border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2 pl-3 sm:pl-5 lg:pl-80 flex flex-wrap items-center gap-1">
            {/* Opciones de navegación (desktop) */}
            <div className="flex flex-wrap items-center gap-1">
              {(user?.rol === "admin"
                ? [
                    ["/", "Inicio"],
                    ["/inmuebles", "Inmuebles"],
                    ["/inmuebles/crear", "Cargar inmueble"],
                    ["/transacciones", "Transacciones"],
                    ["/planes", "Planes"],
                    ["/reservaciones", "Reservas"],
                    ["/corredores", "Corredores"],
                    ["/administradores", "Administradores"],
                    ["/comisiones", "Comisiones"],
                    ["/bitacora", "Bitácora"],
                  ]
                : user?.rol === "corredor"
                  ? [
                      ["/", "Inicio"],
                      ["/inmuebles", "Inmuebles"],
                      ["/mis-inmuebles", "Mis inmuebles"],
                      ["/inmuebles/crear", "Cargar inmueble"],
                      ["/mi-plan", "Mi plan"],
                      ["/precios", "Planes"],
                      ["/rentas-contratadas", "Contratos"],
                      ["/reservaciones", "Reservas"],
                      ["/guardados", "Guardados"],
                    ]
                  : [
                      ["/", "Inicio"],
                      ["/inmuebles", "Inmuebles"],
                      ["/precios", "Planes"],
                      ...(user ? [["/guardados", "Guardados"]] : []),
                    ]
              ).map(([to, label]) => (
                <Item key={to} to={to} label={label} variant="nav" />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[85vw] max-w-72 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-[#0c0c0e] border-r border-slate-100 dark:border-slate-850 ${open ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center px-5 py-2 border-b border-slate-100 dark:border-slate-850">
          <NavLink
            to="/"
            onClick={() => setOpen(false)}
            className="flex items-center"
          >
            <img
              src="/inverdata-logo.png"
              alt="Inverdata"
              className="h-14 sm:h-20 lg:h-24 w-auto object-contain rounded-xl border border-slate-200 p-1 sm:p-1.5 bg-white"
            />
          </NavLink>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-[#18181c] cursor-pointer"
            aria-label="Cerrar menú"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Opciones del sidebar */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5 scrollbar-custom">
          <SidebarOpciones user={user} onClick={() => setOpen(false)} />
        </nav>

        {/* Footer: usuario y auth */}
        <div className="border-t border-slate-100 dark:border-slate-850 px-4 py-5 space-y-3">
          {user ? (
            <>
              <Link
                to="/perfil"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#18181c] transition-colors group cursor-pointer"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#470A68] to-[#5a0e82] text-xs font-bold text-white shadow-md overflow-hidden">
                  {user.foto_perfil || user.avatar ? (
                    <img
                      src={user.foto_perfil || user.avatar}
                      alt={user.nombre || "Perfil"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-extrabold text-slate-800 dark:text-white truncate group-hover:text-purple-900 dark:group-hover:text-purple-400 transition-colors">
                    {user.nombre || user.name || "Usuario"}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 font-bold capitalize">
                    {user.rol} · <span className="text-purple-700 dark:text-purple-400">Ver perfil</span>
                  </div>
                </div>
              </Link>
              <button
                onClick={() => { logout(); navigate("/"); setOpen(false); }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-650 hover:bg-red-50/60 dark:text-red-400 dark:hover:bg-red-950/20 transition active:scale-98 cursor-pointer"
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
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition active:scale-98 shadow-sm" style={{ backgroundColor: "#5a0e82" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = "#470A68"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "#5a0e82"}
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
