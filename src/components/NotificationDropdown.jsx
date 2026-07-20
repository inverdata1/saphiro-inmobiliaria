import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    tipo: "transaccion",
    titulo: "Nueva transaccion registrada",
    mensaje: 'Se registro la venta del apartamento en "Las Mercedes" por $120.000.',
    fecha: "2026-07-20T10:30:00",
    leida: false,
    icono: "money",
  },
  {
    id: 2,
    tipo: "inmueble",
    titulo: "Inmueble actualizado",
    mensaje: 'El inmueble "Torre Bizancio" fue modificado por el corredor Juan Perez.',
    fecha: "2026-07-20T09:15:00",
    leida: false,
    icono: "home",
  },
  {
    id: 3,
    tipo: "sistema",
    titulo: "Bienvenido a Inverdata",
    mensaje: "Tu cuenta fue activada correctamente. Ya puedes acceder a todas las funcionalidades.",
    fecha: "2026-07-19T16:00:00",
    leida: true,
    icono: "info",
  },
  {
    id: 4,
    tipo: "corredor",
    titulo: "Nuevo corredor registrado",
    mensaje: 'Maria Lopez se unio como corredora inmobiliaria.',
    fecha: "2026-07-19T14:22:00",
    leida: true,
    icono: "user",
  },
  {
    id: 5,
    tipo: "comision",
    titulo: "Comision pendiente",
    mensaje: "Tienes una comision de $3.500 por la transaccion #1042 sin procesar.",
    fecha: "2026-07-18T11:00:00",
    leida: true,
    icono: "alert",
  },
];

const ICON_MAP = {
  money: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  home: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  user: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  alert: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
};

const TIPO_COLORS = {
  transaccion: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  inmueble: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  sistema: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  corredor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  comision: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

function timeAgo(fecha) {
  const diff = Date.now() - new Date(fecha).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState(MOCK_NOTIFICATIONS);
  const ref = useRef(null);

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function handleKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function marcarLeidas() {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex items-center justify-center rounded-full border border-white/20 p-2 text-white hover:bg-white/10 transition-colors"
        aria-label="Notificaciones"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-blue-700">
            {noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800 z-50 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Notificaciones</h3>
            {noLeidas > 0 && (
              <button
                onClick={marcarLeidas}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Marcar todas como leidas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
            {notificaciones.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <svg className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No tienes notificaciones</p>
              </div>
            ) : (
              notificaciones.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer ${
                    !n.leida ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                  }`}
                >
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TIPO_COLORS[n.tipo] || TIPO_COLORS.sistema}`}>
                    {ICON_MAP[n.icono] || ICON_MAP.info}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${!n.leida ? "font-semibold text-slate-900 dark:text-white" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                        {n.titulo}
                      </p>
                      <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">{timeAgo(n.fecha)}</span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">{n.mensaje}</p>
                  </div>
                  {!n.leida && (
                    <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  )}
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-700">
            <Link
              to="/notificaciones"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Ver todas las notificaciones
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
