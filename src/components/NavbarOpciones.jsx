import { NavLink } from "react-router-dom";
import { useT } from "../lib/i18n";

const linkBase = "px-3 py-2 rounded-xl text-sm font-medium transition";
const linkActive = "bg-white/20 text-white shadow-sm";
const linkIdle = "text-white hover:bg-white/10";

export function Item({ to, label, variant = "dark" }) {
  const active =
    variant === "light" ? "bg-slate-900 text-white shadow-sm" : linkActive;
  const idle =
    variant === "light" ? "text-slate-600 hover:bg-slate-100" : linkIdle;
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `${linkBase} ${isActive ? active : idle}`
      }
    >
      {label}
    </NavLink>
  );
}

export function ClienteOpciones({ user, variant = "dark" }) {
  const tr = useT();
  return (
    <>
      <Item to="/" label={tr("home")} variant={variant} />
      <Item to="/inmuebles" label={tr("properties")} variant={variant} />
      {user ? <Item to="/guardados" label={tr("saved")} variant={variant} /> : null}
    </>
  );
}

export function CorredorOpciones({ user, variant = "dark" }) {
  const tr = useT();
  return (
    <>
      <Item to="/" label={tr("dashboard")} variant={variant} />
      <Item to="/inmuebles" label={tr("properties")} variant={variant} />
      {user ? <Item to="/guardados" label={tr("saved")} variant={variant} /> : null}
    </>
  );
}

export function AdminOpciones({ variant = "dark" }) {
  const tr = useT();
  return (
    <>
      <Item to="/" label={tr("dashboard")} variant={variant} />
      <Item to="/inmuebles" label={tr("properties")} variant={variant} />
      <Item to="/transacciones" label={tr("transactions")} variant={variant} />
      <Item to="/corredores" label={tr("brokers")} variant={variant} />
      <Item to="/administradores" label={tr("admins")} variant={variant} />
      <Item to="/comisiones" label={tr("commissions")} variant={variant} />
      <Item to="/bitacora" label={tr("log")} variant={variant} />
    </>
  );
}
