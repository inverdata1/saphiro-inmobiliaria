import { NavLink } from "react-router-dom";

const linkBase = "whitespace-nowrap px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95";
const linkActive = "bg-white/15 text-white shadow-sm border border-white/10";
const linkIdle = "text-white/80 hover:bg-white/10 hover:text-white";
const linkActiveLight = "bg-slate-900 text-white shadow-sm";
const linkIdleLight = "text-slate-600 hover:bg-slate-100";

const sliderBase = "whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-200 active:scale-95";
const sliderActive = "bg-[#5a0e82] text-white border-[#5a0e82] shadow-md hover:bg-[#470A68]";
const sliderIdle = "bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100 dark:bg-[#18181c] dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800";

export function Item({ to, label, variant = "dark" }) {
  const active = variant === "light" ? linkActiveLight : linkActive;
  const idle = variant === "light" ? linkIdleLight : linkIdle;
  return (
    <NavLink
      to={to}
      end={to === "/" || to === "/dashboard"}
      className={({ isActive }) =>
        `${linkBase} ${isActive ? active : idle}`
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
      {user ? <Item to="/dashboard" label="Dashboard" variant={variant} /> : null}
      <Item to="/inmuebles" label="Inmuebles" variant={variant} />
      <Item to="/transacciones" label="Transacciones" variant={variant} />
      <Item to="/corredores" label="Corredores" variant={variant} />
      <Item to="/administradores" label="Administradores" variant={variant} />
      <Item to="/comisiones" label="Comisiones" variant={variant} />
      <Item to="/bitacora" label="Bitacora" variant={variant} />
    </>
  );
}

export function ClienteSlider({ user, onClick }) {
  return (
    <>
      <SliderItem to="/" label="Inicio" onClick={onClick} />
      <SliderItem to="/inmuebles" label="Inmuebles" onClick={onClick} />
      {user ? <SliderItem to="/guardados" label="Guardados" onClick={onClick} /> : null}
    </>
  );
}

export function CorredorSlider({ user, onClick }) {
  return (
    <>
      <SliderItem to="/" label="Inicio" onClick={onClick} />
      <SliderItem to="/inmuebles" label="Inmuebles" onClick={onClick} />
      {user ? <SliderItem to="/mis-inmuebles" label="Mis inmuebles" onClick={onClick} /> : null}
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
