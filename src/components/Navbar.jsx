import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.inverdata.jpg";
import {
  ClienteOpciones,
  CorredorOpciones,
  AdminOpciones,
} from "./NavbarOpciones";
import { LanguageToggle, useT } from "../lib/i18n";

export default function Navbar() {
  const { user, logout } = useAuth();
  const tr = useT();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }
  const isStaff = user?.rol === "admin" || user?.rol === "corredor";
  const navVariant = isStaff ? "dark" : "light";
  const NavOpciones =
    user?.rol === "admin"
      ? AdminOpciones
      : user?.rol === "corredor"
      ? CorredorOpciones
      : ClienteOpciones;

  const initials = user
    ? (user.nombre || user.name || "")
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "US";

  return (
    <header
      className={
        isStaff
          ? "relative z-30 border-b border-blue-600 bg-blue-700 text-white shadow-sm dark:border-indigo-700 dark:bg-indigo-800"
          : "relative z-30 border-b border-slate-100 bg-white text-slate-900 shadow-sm"
      }
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <NavLink to="/" className="flex shrink-0 items-center gap-2 min-w-0">
          <img src={logo} alt="Inverdata" className="h-12 w-12 rounded-xl bg-white/15 p-1" />
          <span className={`truncate font-extrabold text-lg tracking-tight ${isStaff ? "text-white" : "text-slate-900"}`}>
            Inverdata C.A
          </span>
        </NavLink>

        <button
          type="button"
          className={
            isStaff
              ? "inline-flex items-center justify-center rounded-xl border border-white/20 px-3 py-2 text-white hover:bg-white/10 md:hidden"
              : "inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-slate-800 hover:bg-slate-50 md:hidden"
          }
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {open ? (
              <path d="M18 6 6 18M6 6l12 12" />
            ) : (
              <>
                <path d="M3 12h18" />
                <path d="M3 6h18" />
                <path d="M3 18h18" />
              </>
            )}
          </svg>
        </button>

        <nav
          className={`hidden md:flex flex-1 min-w-0 items-center justify-end gap-2 overflow-x-auto ${
            open ? "block" : ""
          }`}
        >
          <NavOpciones user={user} variant={navVariant} />
          <LanguageToggle />

          <button
            type="button"
            onClick={toggleDark}
            className={
              isStaff
                ? "inline-flex items-center justify-center rounded-xl border border-white/20 px-2 py-2 text-white hover:bg-white/10"
                : "inline-flex items-center justify-center rounded-xl border border-slate-200 px-2 py-2 text-slate-700 hover:bg-slate-50"
            }
            aria-label="Cambiar modo oscuro/claro"
            title={dark ? tr("light") : tr("dark")}
          >
            <div className="relative h-5 w-5">
              <svg
                className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${
                  dark ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-90"
                }`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              <svg
                className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${
                  dark ? "opacity-0 scale-50 -rotate-90" : "opacity-100 scale-100 rotate-0"
                }`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </div>
          </button>

          {user ? (
            <>
              <button
                onClick={logout}
                className={
                  isStaff
                    ? "inline-flex items-center justify-center rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                    : "inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                }
              >
                {tr("signOut")}
              </button>
              <div
                className={
                  isStaff
                    ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white/50 bg-white/10 text-xs font-semibold"
                    : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700"
                }
              >
                {initials}
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className={
                isStaff
                  ? "inline-flex items-center justify-center rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                  : "inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
              }
            >
              {tr("signIn")}
            </Link>
          )}
        </nav>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
          isStaff ? "border-t border-white/20 bg-blue-700 dark:bg-indigo-800" : "border-t border-slate-100 bg-white"
        } ${open ? "max-h-[800px] opacity-100 pb-4 pt-2" : "max-h-0 opacity-0 pb-0 pt-0"}`}
      >
        <nav className="flex flex-col gap-2 px-4">
          <NavOpciones user={user} variant={navVariant} />
          <div className="px-1 py-1">
            <LanguageToggle />
          </div>
          <button
            type="button"
            onClick={toggleDark}
            className={
              isStaff
                ? "mt-2 flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
                : "mt-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            }
          >
            <div className="relative h-5 w-5">
              <svg
                className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${
                  dark ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-90"
                }`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              <svg
                className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${
                  dark ? "opacity-0 scale-50 -rotate-90" : "opacity-100 scale-100 rotate-0"
                }`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </div>
            {dark ? tr("light") : tr("dark")}
          </button>
          {user ? (
            <button
              onClick={logout}
              className={
                isStaff
                  ? "flex items-center justify-center rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                  : "flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              }
            >
              {tr("signOut")}
            </button>
          ) : (
            <Link
              to="/login"
              className={
                isStaff
                  ? "flex items-center justify-center rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                  : "flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
              }
            >
              {tr("signIn")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}