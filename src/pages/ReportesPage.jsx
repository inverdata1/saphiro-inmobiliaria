import { useState, useEffect, useMemo } from "react";
import { apiDownload } from "../api";
import SaphiroDatePicker from "../components/pickers/SaphiroDatePicker";
import { toYmd } from "../utils/date";

const REPORT_TYPES = [
  {
    id: "ventas",
    label: "Ventas",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    value: "ventas"
  },
  {
    id: "alquileres",
    label: "Alquileres",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
    value:"alquileres"
  },
  {
    id: "disponibilidad",
    label: "Disponibilidad de propiedades",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0v-4a2 2 0 012-2h2a2 2 0 012 2v4" />
      </svg>
    ),
    value:"disponibilidad-propiedades"
  },
  {
    id: "ingresos",
    label: "Ingresos y comisiones",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    value:"ingresos"
  },
  {
    id: "clientes",
    label: "Clientes y prospectos",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    value:"clientes"
  }
];

export default function ReportesPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const [selectedType, setSelectedType] = useState("ventas");
  const [desde, setDesde] = useState(() => new Date(2026, 8, 1));
  const [hasta, setHasta] = useState(() => new Date(2026, 8, 30));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const activeTypeObj = useMemo(
    () => REPORT_TYPES.find((t) => t.id === selectedType) || REPORT_TYPES[0],
    [selectedType]
  );

  // El servidor genera el reporte y el cliente lo recibe como PDF descargable.
  async function handleGenerarReporte(e) {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiDownload(`/reportes/${activeTypeObj.value}`, {
        desde: desde ? toYmd(desde) : undefined,
        hasta: hasta ? toYmd(hasta) : undefined,
        format: "pdf",
      });
    } catch (err) {
      setError(err?.message || "No se pudo generar el reporte.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Título de la página (Figma: Reportes) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
            Reportes
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Genera informes detallados de ventas, alquileres, visitas, disponibilidad y comisiones.
          </p>
        </div>
      </div>

      {/* Contenedor Principal Filtros (Boceto Figma: Tipo de reporte + Fechas + Botón) */}
      <div className="bg-white dark:bg-[#141417] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] space-y-6">
        {/* Label: Tipo de reporte */}
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
            Tipo de reporte
          </label>
          {/* Fila de Pills (Figma: Ventas, Alquileres, Disponibilidad, Ingresos, Clientes, Visitas, Rendimiento) */}
          <div className="flex flex-wrap gap-2.5">
            {REPORT_TYPES.map((t) => {
              const isActive = selectedType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-200 cursor-pointer select-none ${
                    isActive
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-500 dark:border-emerald-600 shadow-sm"
                      : "bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <span className={isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}>
                    {t.icon}
                  </span>
                  <span>{t.label}</span>
                  {isActive && (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px]">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fila de Fechas y Botón Generar Reporte */}
        <form onSubmit={handleGenerarReporte} className="flex flex-wrap items-end gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              Desde
            </label>
            <div className="relative">
              <SaphiroDatePicker
                selected={desde}
                onChange={(d) => setDesde(d)}
                selectsStart
                startDate={desde}
                endDate={hasta}
                placeholderText="dd/mm/aaaa"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              Hasta
            </label>
            <div className="relative">
              <SaphiroDatePicker
                selected={hasta}
                onChange={(d) => setHasta(d)}
                selectsEnd
                startDate={desde}
                endDate={hasta}
                minDate={desde || undefined}
                placeholderText="dd/mm/aaaa"
              />
            </div>
          </div>

          {/* Botón Generar reporte (Boceto Figma: color verde turquesa #008075 con icono) */}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#008075] hover:bg-[#006960] active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>{loading ? "Generando..." : "Generar reporte"}</span>
          </button>
        </form>

        {error && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-xs sm:text-sm font-semibold text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
