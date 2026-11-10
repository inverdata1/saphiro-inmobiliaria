import { NavLink } from "react-router-dom";

const linkBase = "whitespace-nowrap px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95";
const linkActive = "bg-white/15 text-white shadow-sm border border-white/10";
const linkIdle = "text-white/80 hover:bg-white/10 hover:text-white";
const linkActiveLight = "bg-slate-900 text-white shadow-sm";
const linkIdleLight = "text-slate-600 hover:bg-slate-100";

/* Variante compacta para la fila superior de la navbar */
const linkBaseNav = "whitespace-nowrap px-3 py-2 rounded-lg text-sm font-bold transition-colors duration-150";
const linkActiveNav = "bg-slate-900 text-white shadow-sm";
const linkIdleNav = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";

export function Item({ to, label, variant = "dark" }) {
  const base = variant === "nav" ? linkBaseNav : linkBase;
  const active =
    variant === "nav" ? linkActiveNav : variant === "light" ? linkActiveLight : linkActive;
  const idle =
    variant === "nav" ? linkIdleNav : variant === "light" ? linkIdleLight : linkIdle;
  return (
    <NavLink
      to={to}
      end={to === "/" || to === "/dashboard"}
      className={({ isActive }) =>
        `${base} ${isActive ? active : idle}`
      }
    >
      {label}
    </NavLink>
  );
}

export function ClienteOpciones({ user, variant = "dark" }) {
  return (
    <>
      <Item to="/" label="Inicio" variant={variant} />
      <Item to="/inmuebles" label="Inmuebles" variant={variant} />
      {user ? <Item to="/guardados" label="Guardados" variant={variant} /> : null}
    </>
  );
}

export function CorredorOpciones({ user, variant = "dark" }) {
  return (
    <>
      <Item to="/" label="Inicio" variant={variant} />
      <Item to="/inmuebles" label="Inmuebles" variant={variant} />
      {user ? <Item to="/mis-inmuebles" label="Mis inmuebles" variant={variant} /> : null}
      {user ? <Item to="/guardados" label="Guardados" variant={variant} /> : null}
    </>
  );
}

export function AdminOpciones({ user, variant = "dark" }) {
  return (
    <>
      <Item to="/" label="Inicio" variant={variant} />
      <Item to="/inmuebles" label="Inmuebles" variant={variant} />
      <Item to="/transacciones" label="Transacciones" variant={variant} />
      <Item to="/corredores" label="Corredores" variant={variant} />
      <Item to="/administradores" label="Administradores" variant={variant} />
      <Item to="/comisiones" label="Comisiones" variant={variant} />
      <Item to="/bitacora" label="Bitacora" variant={variant} />
    </>
  );
}
