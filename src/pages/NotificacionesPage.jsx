import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiGet, apiPatch, apiDelete } from "../api";

const TIPO_ICONO = {
  Transaccion: "money",
  Inmueble: "home",
  Sistema: "info",
  Corredor: "user",
  Comision: "alert",
};

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
  Transaccion: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Inmueble: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Sistema: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  Corredor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Comision: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
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
  const { user } = useAuth();
  const usuarioId = user?.id;

  const [notificaciones, setNotificaciones] = useState([]);
  const [leidasSnapshot, setLeidasSnapshot] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [expandedId, setExpandedId] = useState(null);
  const [marcadas, setMarcadas] = useState(new Set());

  async function load() {
    if (!usuarioId) return;
    setLoading(true);
    setErr("");
    try {
      const r = await apiGet(`/notificaciones/${usuarioId}`);
      const data = Array.isArray(r?.data) ? r.data : [];
      setNotificaciones(data);
      setLeidasSnapshot(new Set(data.filter((n) => n.leida).map((n) => n.id)));
      setMarcadas(new Set());
    } catch (e) {
      setErr(e.message || "Error cargando notificaciones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [usuarioId]);

  useEffect(() => {
    load();
  }, [filtro]);

  const noLeidas = notificaciones.filter((n) => !leidasSnapshot.has(n.id) && !marcadas.has(n.id)).length;

  const filtradas = notificaciones.filter((n) => {
    if (filtro === "todas") return true;
    return !leidasSnapshot.has(n.id);
  });

  async function toggleExpand(n) {
    setExpandedId((prev) => (prev === n.id ? null : n.id));
    if (!n.leida) {
      setNotificaciones((prev) => prev.map((x) => (x.id === n.id ? { ...x, leida: true } : x)));
      setMarcadas((prev) => new Set(prev).add(n.id));
      apiPatch(`/notificaciones/${n.id}/read`).catch((e) => setErr(e.message));
    }
  }

  async function marcarTodasLeidas() {
    if (!usuarioId) return;
    try {
      await apiPatch(`/notificaciones/${usuarioId}/read-all`);
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      setLeidasSnapshot(new Set(notificaciones.map((n) => n.id)));
    } catch (e) {
      setErr(e.message);
    }
  }

  async function eliminarNotificacion(id) {
    try {
      await apiDelete(`/notificaciones/${id}`);
      setNotificaciones((prev) => prev.filter((n) => n.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function eliminarTodas() {
    if (!usuarioId) return;
    try {
      await apiDelete(`/notificaciones/user/${usuarioId}`);
      setNotificaciones([]);
      setLeidasSnapshot(new Set());
      setMarcadas(new Set());
      setExpandedId(null);
    } catch (e) {
      setErr(e.message);
    }
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

      {err && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {err}
        </div>
      )}

      <div className="card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
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
          <div className="flex items-center gap-2">
            {noLeidas > 0 && (
              <button onClick={marcarTodasLeidas} className="btn-secondary text-xs">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Marcar todas como leidas
              </button>
            )}
            {notificaciones.length > 0 && (
              <button onClick={eliminarTodas} className="btn-secondary text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar todas
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium border transition cursor-pointer ${
                filtro === f.key
                  ? "bg-purple-600 text-white border-purple-600 shadow-sm"
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
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">Cargando...</div>
          ) : filtradas.length === 0 ? (
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
            filtradas.map((n) => {
              const tipo = n.tipo_notificacion || "Sistema";
              const icono = TIPO_ICONO[tipo] || "info";
              return (
                <div
                  key={n.id}
                  onClick={() => toggleExpand(n)}
                  className={`group flex gap-3 sm:gap-4 px-4 py-4 transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 ${
                    !n.leida ? "bg-purple-50/40 dark:bg-purple-900/10" : ""
                  }`}
                >
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${TIPO_COLORS[tipo] || TIPO_COLORS.Sistema}`}>
                    {ICON_MAP[icono] || ICON_MAP.info}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm leading-snug ${!n.leida ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                            {n.titulo}
                          </p>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${TIPO_COLORS[tipo] || TIPO_COLORS.Sistema}`}>
                            {tipo}
                          </span>
                          {!n.leida && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-purple-500" />
                          )}
                        </div>
                        <p className={`mt-0.5 text-xs leading-relaxed ${expandedId === n.id ? "text-slate-600 dark:text-slate-300" : "text-slate-500 dark:text-slate-400 line-clamp-2"}`}>
                          {n.descripcion}
                        </p>
                        {expandedId === n.id && (
                          <div className="mt-3 flex items-center gap-3">
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                              {formatFecha(n.fecha_hora)} a las {formatHora(n.fecha_hora)}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); eliminarNotificacion(n.id); }}
                              className="text-[11px] font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                      <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {formatFecha(n.fecha_hora)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
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
