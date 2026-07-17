import { NavLink } from "react-router-dom";

const linkBase = "px-3 py-2 rounded-xl text-sm font-medium transition";
const linkActive = "bg-white/20 text-white shadow-sm";
const linkIdle = "text-white hover:bg-white/10";

export function Item({ to, label }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `${linkBase} ${isActive ? linkActive : linkIdle}`
      }
    >
      {label}
    </NavLink>
  );
}

export function ClienteOpciones({ user }) {
  return (
    <>
      <Item to="/" label="Dashboard" />
      <Item to="/inmuebles" label="Inmuebles" />
      {user ? <Item to="/guardados" label="Guardados" /> : null}
    </>
  );
}

export function CorredorOpciones({ user }) {
  return (
    <>
      <Item to="/" label="Dashboard" />
      <Item to="/inmuebles" label="Inmuebles" />
      {user ? <Item to="/guardados" label="Guardados" /> : null}
    </>
  );
}

export function AdminOpciones() {
  return (
    <>
      <Item to="/" label="Dashboard" />
      <Item to="/inmuebles" label="Inmuebles" />
      <Item to="/transacciones" label="Transacciones" />
      <Item to="/corredores" label="Corredores" />
      <Item to="/administradores" label="Administradores" />
      <Item to="/comisiones" label="Comisiones" />
      <Item to="/bitacora" label="Bitacora" />
    </>
  );
}
