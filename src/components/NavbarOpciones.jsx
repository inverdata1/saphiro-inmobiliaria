import { NavLink } from "react-router-dom";

const linkBase = "whitespace-nowrap px-3 py-2 rounded-xl text-sm font-medium transition";
const linkActive = "bg-white/20 text-white shadow-sm";
const linkIdle = "text-white hover:bg-white/10";

const sliderBase = "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition";
const sliderActive = "bg-blue-600 text-white border-blue-600 shadow-sm";
const sliderIdle = "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700";

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

export function SliderItem({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onClick}
      className={({ isActive }) =>
        `${sliderBase} ${isActive ? sliderActive : sliderIdle}`
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

export function ClienteSlider({ user, onClick }) {
  return (
    <>
      <SliderItem to="/" label="Dashboard" onClick={onClick} />
      <SliderItem to="/inmuebles" label="Inmuebles" onClick={onClick} />
      {user ? <SliderItem to="/guardados" label="Guardados" onClick={onClick} /> : null}
    </>
  );
}

export function CorredorSlider({ user, onClick }) {
  return (
    <>
      <SliderItem to="/" label="Dashboard" onClick={onClick} />
      <SliderItem to="/inmuebles" label="Inmuebles" onClick={onClick} />
      {user ? <SliderItem to="/guardados" label="Guardados" onClick={onClick} /> : null}
    </>
  );
}

export function AdminSlider({ onClick }) {
  return (
    <>
      <SliderItem to="/" label="Dashboard" onClick={onClick} />
      <SliderItem to="/inmuebles" label="Inmuebles" onClick={onClick} />
      <SliderItem to="/transacciones" label="Transacciones" onClick={onClick} />
      <SliderItem to="/corredores" label="Corredores" onClick={onClick} />
      <SliderItem to="/administradores" label="Administradores" onClick={onClick} />
      <SliderItem to="/comisiones" label="Comisiones" onClick={onClick} />
      <SliderItem to="/bitacora" label="Bitacora" onClick={onClick} />
    </>
  );
}
