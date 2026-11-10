import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
    isActive
      ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400"
      : "text-slate-400 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-[#18181c]"
  }`;

function SideLink({ to, onClick, icon, end = false, className = "", children }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) => `${linkClass({ isActive })} ${className}`}
    >
      <svg className="h-5 w-5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        {icon}
      </svg>
      {children}
    </NavLink>
  );
}

const ICONS = {
  inicio: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-10.5z" />
    </>
  ),
  inmuebles: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V5a2 2 0 012-2h6a2 2 0 012 2v16M15 21V9h2a2 2 0 012 2v10M9 7h2M9 11h2M9 15h2" />
    </>
  ),
  config: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </>
  ),
  recibos: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  ),
  reportes: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  ),
  guardados: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  ),
  misInmuebles: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2zm6 0v4a3 3 0 106 0V7" />
  ),
  transferencias: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  ),
  transacciones: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  ),
  corredores: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  ),
  administradores: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  ),
  comisiones: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  bitacora: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  ),
  rentasContratadas: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  inmueblesAlquilados: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0v-4a2 2 0 012-2h2a2 2 0 012 2v4" />
  ),
  reservasVacacionales: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  ),
};

export function ClienteSidebar({ onClick }) {
  return (
    <>
      <SideLink to="/" onClick={onClick} icon={ICONS.inicio} end className="lg:hidden">Inicio</SideLink>
      <SideLink to="/inmuebles" onClick={onClick} icon={ICONS.inmuebles} className="lg:hidden">Inmuebles</SideLink>
      <SideLink to="/rentas-contratadas" onClick={onClick} icon={ICONS.rentasContratadas}>Contratos de alquiler</SideLink>
      <SideLink to="/reservaciones" onClick={onClick} icon={ICONS.reservasVacacionales}>Reservas vacacionales</SideLink>
      <SideLink to="/guardados" onClick={onClick} icon={ICONS.guardados}>Guardados</SideLink>
      <SideLink to="/mis-recibos" onClick={onClick} icon={ICONS.recibos}>Mis recibos</SideLink>
      <SideLink to="/configuracion" onClick={onClick} icon={ICONS.config}>Configuración</SideLink>
    </>
  );
}

export function CorredorSidebar({ onClick }) {
  return (
    <>
      <SideLink to="/" onClick={onClick} icon={ICONS.inicio} end className="lg:hidden">Inicio</SideLink>
      <SideLink to="/inmuebles" onClick={onClick} icon={ICONS.inmuebles} className="lg:hidden">Inmuebles</SideLink>
      <SideLink to="/mis-inmuebles" onClick={onClick} icon={ICONS.misInmuebles}>Mis inmuebles</SideLink>
      <SideLink to="/rentas-contratadas" onClick={onClick} icon={ICONS.inmueblesAlquilados}>Contratos de alquiler</SideLink>
      <SideLink to="/reservaciones" onClick={onClick} icon={ICONS.reservasVacacionales}>Reservas vacacionales</SideLink>
      <SideLink to="/guardados" onClick={onClick} icon={ICONS.guardados}>Guardados</SideLink>
      <SideLink to="/recibos" onClick={onClick} icon={ICONS.recibos}>Mis recibos</SideLink>
      <SideLink to="/mis-transferencias" onClick={onClick} icon={ICONS.transferencias}>Transferencias recibidas</SideLink>
      <SideLink to="/reportes" onClick={onClick} icon={ICONS.reportes}>Reportes</SideLink>
      <SideLink to="/configuracion" onClick={onClick} icon={ICONS.config}>Configuración</SideLink>
    </>
  );
}

export function AdminSidebar({ onClick }) {
  return (
    <>
      <SideLink to="/" onClick={onClick} icon={ICONS.inicio} end className="lg:hidden">Inicio</SideLink>
      <SideLink to="/inmuebles" onClick={onClick} icon={ICONS.inmuebles} className="lg:hidden">Inmuebles</SideLink>
      <SideLink to="/transacciones" onClick={onClick} icon={ICONS.transacciones}>Transacciones</SideLink>
      <SideLink to="/reservaciones" onClick={onClick} icon={ICONS.reservasVacacionales}>Reservas vacacionales</SideLink>
      <SideLink to="/corredores" onClick={onClick} icon={ICONS.corredores}>Corredores</SideLink>
      <SideLink to="/administradores" onClick={onClick} icon={ICONS.administradores}>Administradores</SideLink>
      <SideLink to="/comisiones" onClick={onClick} icon={ICONS.comisiones}>Comisiones</SideLink>
      <SideLink to="/bitacora" onClick={onClick} icon={ICONS.bitacora}>Bitácora</SideLink>
      <SideLink to="/configuracion" onClick={onClick} icon={ICONS.config}>Configuración</SideLink>
    </>
  );
}

export function PublicoSidebar({ onClick }) {
  return (
    <>
      <SideLink to="/" onClick={onClick} icon={ICONS.inicio} end className="lg:hidden">Inicio</SideLink>
      <SideLink to="/inmuebles" onClick={onClick} icon={ICONS.inmuebles} className="lg:hidden">Inmuebles</SideLink>
      <SideLink to="/configuracion" onClick={onClick} icon={ICONS.config}>Configuración</SideLink>
    </>
  );
}

export function SidebarOpciones({ user, onClick }) {
  if (!user) return <PublicoSidebar onClick={onClick} />;
  if (user.rol === "admin") return <AdminSidebar onClick={onClick} />;
  if (user.rol === "corredor") return <CorredorSidebar onClick={onClick} />;
  return <ClienteSidebar onClick={onClick} />;
}
