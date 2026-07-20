import { useState } from "react";
import { Link } from "react-router-dom";

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    tipo: "transaccion",
    titulo: "Nueva transaccion registrada",
    mensaje: 'Se registro la venta del apartamento en "Las Mercedes" por $120.000. El corredor Juan Perez gestoro la operacion exitosamente.',
    fecha: "2026-07-20T10:30:00",
    leida: false,
    icono: "money",
  },
  {
    id: 2,
    tipo: "inmueble",
    titulo: "Inmueble actualizado",
    mensaje: 'El inmueble "Torre Bizancio" fue modificado por el corredor Juan Perez. Se actualizaron los precios y fotos.',
    fecha: "2026-07-20T09:15:00",
    leida: false,
    icono: "home",
  },
  {
    id: 3,
    tipo: "sistema",
    titulo: "Bienvenido a Inverdata",
    mensaje: "Tu cuenta fue activada correctamente. Ya puedes acceder a todas las funcionalidades de la plataforma.",
    fecha: "2026-07-19T16:00:00",
    leida: true,
    icono: "info",
  },
  {
    id: 4,
    tipo: "corredor",
    titulo: "Nuevo corredor registrado",
    mensaje: 'Maria Lopez se unio como corredora inmobiliaria. Ya esta disponible para gestionar propiedades.',
    fecha: "2026-07-19T14:22:00",
    leida: true,
    icono: "user",
  },
  {
    id: 5,
    tipo: "comision",
    titulo: "Comision pendiente de aprobacion",
    mensaje: "Tienes una comision de $3.500 por la transaccion #1042 sin procesar. Aprobar o rechazar antes del 25 de julio.",
    fecha: "2026-07-18T11:00:00",
    leida: true,
    icono: "alert",
  },
  {
    id: 6,
    tipo: "transaccion",
    titulo: "Transaccion completada",
    mensaje: 'La transaccion #1038 por el local en "Centro Comercial Abasto" fue finalizada con exito.',
    fecha: "2026-07-17T09:45:00",
    leida: true,
    icono: "money",
  },
  {
    id: 7,
    tipo: "inmueble",
    titulo: "Nuevo inmueble publicado",
    mensaje: 'Se publico la casa en "Urb. El Paraiso" con 3 habitaciones y 2 banos. Precio: $85.000.',
    fecha: "2026-07-16T15:30:00",
    leida: true,
    icono: "home",
  },
  {
    id: 8,
    tipo: "sistema",
    titulo: "Mantenimiento programado",
    mensaje: "El sistema estara en mantenimiento el sabado 26 de julio de 2:00 AM a 4:00 AM (hora local).",
    fecha: "2026-07-15T08:00:00",
    leida: true,
    icono: "info",
  },
  {
    id: 9,
    tipo: "comision",
    titulo: "Comision procesada",
    mensaje: "La comision de $2.800 correspondiente a la transaccion #1035 fue procesada y esta en camino a tu cuenta.",
    fecha: "2026-07-14T12:10:00",
    leida: true,
    icono: "money",
  },
  {
    id: 10,
    tipo: "corredor",
    titulo: "Corredor desactivado",
    mensaje: 'Pedro Ramirez fue removido del sistema como corredor inmobiliario.',
    fecha: "2026-07-13T10:00:00",
    leida: true,
    icono: "user",
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

const TIPO_LABELS = {
  transaccion: "Transaccion",
  inmueble: "Inmueble",
  sistema: "Sistema",
  corredor: "Corredor",
  comision: "Comision",
};

const FILTROS = [
  { key: "todas", label: "Todas" },
  { key: "no_leidas", label: "No leidas" },
];

function formatFecha(fecha) {
  const d = new Date(fecha);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 1) return "Ahora mismo";
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? "s" : ""}`;
  if (diffHrs < 24) return `Hace ${diffHrs} hora${diffHrs > 1 ? "s" : ""}`;
  if (diffDays < 7) return `Hace ${diffDays} dia${diffDays > 1 ? "s" : ""}`;

  return d.toLocaleDateString("es-VE", { day: "numeric", month: "short", year: "numeric" });
}

function formatHora(fecha) {
  return new Date(fecha).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
}

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState(MOCK_NOTIFICATIONS);
  const [filtro, setFiltro] = useState("todas");
  const [expandedId, setExpandedId] = useState(null);

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  const filtradas = notificaciones.filter((n) => {
    if (filtro === "todas") return true;
    return !n.leida;
  });

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id));
    if (!notificaciones.find((n) => n.id === id)?.leida) {
      setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    }
  }

  function marcarTodasLeidas() {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  }

  function eliminarNotificacion(id) {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">
          Notificaciones
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Mantente al dia con la actividad de tu plataforma.
        </p>
      </div>

      <div className="card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </span>
            <div>
              <span className="text-sm font-semibold text-slate-800 dark:text-white">
                {noLeidas} sin leer
              </span>
              <span className="text-sm text-slate-400 dark:text-slate-500 ml-1">
                de {notificaciones.length} total
              </span>
            </div>
          </div>
          {noLeidas > 0 && (
            <button onClick={marcarTodasLeidas} className="btn-secondary text-xs">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Marcar todas como leidas
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium border transition ${
                filtro === f.key
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600"
              }`}
            >
              {f.label}
              {f.key === "no_leidas" && noLeidas > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {noLeidas}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {filtradas.length === 0 ? (
            <div className="py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                No hay notificaciones en esta categoria
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Cuando haya actividad, aparecera aqui.
              </p>
            </div>
          ) : (
            filtradas.map((n) => (
              <div
                key={n.id}
                onClick={() => toggleExpand(n.id)}
                className={`group flex gap-3 sm:gap-4 px-4 py-4 transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 ${
                  !n.leida ? "bg-blue-50/40 dark:bg-blue-900/10" : ""
                }`}
              >
                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${TIPO_COLORS[n.tipo] || TIPO_COLORS.sistema}`}>
                  {ICON_MAP[n.icono] || ICON_MAP.info}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm leading-snug ${!n.leida ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                          {n.titulo}
                        </p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${TIPO_COLORS[n.tipo] || TIPO_COLORS.sistema}`}>
                          {TIPO_LABELS[n.tipo]}
                        </span>
                        {!n.leida && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className={`mt-0.5 text-xs leading-relaxed ${expandedId === n.id ? "text-slate-600 dark:text-slate-300" : "text-slate-500 dark:text-slate-400 line-clamp-2"}`}>
                        {n.mensaje}
                      </p>
                      {expandedId === n.id && (
                        <div className="mt-3 flex items-center gap-3">
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            {formatFecha(n.fecha)} a las {formatHora(n.fecha)}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); eliminarNotificacion(n.id); }}
                            className="text-[11px] font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {formatFecha(n.fecha)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link to="/" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
          &larr; Volver al dashboard
        </Link>
      </div>
    </main>
  );
}
