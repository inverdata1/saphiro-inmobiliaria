import { NavLink } from "react-router-dom";

const linkBase = "whitespace-nowrap px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95";
const linkActive = "bg-white/15 text-white shadow-sm border border-white/10";
const linkIdle = "text-white/80 hover:bg-white/10 hover:text-white";

const sliderBase = "whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-200 active:scale-95";
const sliderActive = "bg-blue-600 text-white border-blue-600 shadow-md dark:bg-purple-600 dark:border-purple-600";
const sliderIdle = "bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100 dark:bg-[#18181c] dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800";

export function Item({ to, label }) {
  return (
    <NavLink
      to={to}
      end={to === "/" || to === "/dashboard"}
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
      end={to === "/" || to === "/dashboard"}
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
      <Item to="/" label="Inicio" />
      {user ? <Item to="/dashboard" label="Dashboard" /> : null}
      <Item to="/inmuebles" label="Inmuebles" />
      {user ? <Item to="/guardados" label="Guardados" /> : null}
    </>
  );
}

export function CorredorOpciones({ user }) {
  return (
    <>
      <Item to="/" label="Inicio" />
      {user ? <Item to="/dashboard" label="Dashboard" /> : null}
      <Item to="/inmuebles" label="Inmuebles" />
      {user ? <Item to="/guardados" label="Guardados" /> : null}
    </>
  );
}

export function AdminOpciones({ user }) {
  return (
    <>
      <Item to="/" label="Inicio" />
      {user ? <Item to="/dashboard" label="Dashboard" /> : null}
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
      <SliderItem to="/" label="Inicio" onClick={onClick} />
      {user ? <SliderItem to="/dashboard" label="Dashboard" onClick={onClick} /> : null}
      <SliderItem to="/inmuebles" label="Inmuebles" onClick={onClick} />
      {user ? <SliderItem to="/guardados" label="Guardados" onClick={onClick} /> : null}
    </>
  );
}

export function CorredorSlider({ user, onClick }) {
  return (
    <>
      <SliderItem to="/" label="Inicio" onClick={onClick} />
      {user ? <SliderItem to="/dashboard" label="Dashboard" onClick={onClick} /> : null}
      <SliderItem to="/inmuebles" label="Inmuebles" onClick={onClick} />
      {user ? <SliderItem to="/guardados" label="Guardados" onClick={onClick} /> : null}
    </>
  );
}

export function AdminSlider({ user, onClick }) {
  return (
    <>
      <SliderItem to="/" label="Inicio" onClick={onClick} />
      {user ? <SliderItem to="/dashboard" label="Dashboard" onClick={onClick} /> : null}
      <SliderItem to="/inmuebles" label="Inmuebles" onClick={onClick} />
      <SliderItem to="/transacciones" label="Transacciones" onClick={onClick} />
      <SliderItem to="/corredores" label="Corredores" onClick={onClick} />
      <SliderItem to="/administradores" label="Administradores" onClick={onClick} />
      <SliderItem to="/comisiones" label="Comisiones" onClick={onClick} />
      <SliderItem to="/bitacora" label="Bitacora" onClick={onClick} />
    </>
  );
}
