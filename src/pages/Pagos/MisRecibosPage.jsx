import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "../../context/useAuth";
import { apiGet } from "../../api";
import { formatDate } from "../../utils/date";
import { fmtImporte } from "../../utils/money";
import ErrorBanner from "../../components/error/ErrorBanner";
import ComprobanteTransaccionModal from "../../components/pagos/ComprobanteTransaccionModal";

const TIPO_LABEL = {
  compra: "Compra",
  venta: "Venta",
  alquiler: "Alquiler",
};

const ESTADO_LABEL = {
  pagado: "Verificado",
  pendiente: "Pendiente",
  cancelado: "Cancelado",
};

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80";

function mapRecibo(row) {
  const num = (v) => Number(v || 0);
  const moneda = (row.moneda || "USD").toUpperCase();
  const montoTotal = num(row.monto_total);
  return {
    id: row.numero_factura || `REC-${row.transaccion_id}`,
    referencia: row.numero_factura || `#${row.transaccion_id}`,
    inmueble: row.inmueble_titulo || `Inmueble #${row.inmueble_id}`,
    inmuebleUbicacion: row.estado_inmueble || "-",
    inmuebleImagen: row.inmueble_imagen_url || PLACEHOLDER_IMG,
    tipo: row.estado_inmueble || TIPO_LABEL[row.tipo_operacion] || row.tipo_operacion || "-",
    fecha: row.fecha_transaccion,
    moneda,
    montoTotal,
    bancoEmisor: "-",
    referenciaBancaria: row.numero_factura || `#${row.transaccion_id}`,
    estado: ESTADO_LABEL[row.estatus_pago] || "Pendiente",
    concepto: TIPO_LABEL[row.tipo_operacion] || row.tipo_operacion || "-",
    iva: 0,
    corredorId: row.corredor_id,
    // Lineas de transacciones_detalles. El backend manda [] (nunca null) cuando no
    // hay, pero se protege igual contra respuestas viejas cacheadas.
    detalles: Array.isArray(row.detalles) ? row.detalles : [],
  };
}

export default function MisRecibosPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedRecibo, setSelectedRecibo] = useState(null);
  const [recibos, setRecibos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingErr, setLoadingErr] = useState("");
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 8;

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setLoadingErr("");
    try {
      const r = await apiGet(`/transacciones/cliente/${user.id}`, { limit: 200 });
      setRecibos((r.data || []).map(mapRecibo));
    } catch (e) {
      setLoadingErr(e.message);
      setRecibos([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Filtrado dinámico
  const recibosFiltrados = useMemo(() => {
    return recibos.filter((r) => {
      const matchSearch =
        !search ||
        r.inmueble.toLowerCase().includes(search.toLowerCase()) ||
        r.referencia.toLowerCase().includes(search.toLowerCase()) ||
        r.concepto.toLowerCase().includes(search.toLowerCase());

      return matchSearch;
    });
  }, [search, recibos]);

  useEffect(() => {
    setPage(1);
  }, [search, recibos]);

  const recibosPaginados = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return recibosFiltrados.slice(start, start + PAGE_SIZE);
  }, [recibosFiltrados, page]);

  const totalPaginas = Math.max(1, Math.ceil(recibosFiltrados.length / PAGE_SIZE));

  const goToPage = (n) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPage(n);
  };

  function renderPaginas(actual, totalP) {
    const candidatas = new Set([1, totalP, actual - 2, actual - 1, actual, actual + 1, actual + 2]);
    const nums = [...candidatas].filter((n) => n >= 1 && n <= totalP).sort((a, b) => a - b);
    const items = [];
    let prev = 0;
    for (const n of nums) {
      if (prev && n - prev > 1) items.push({ type: "sep", key: `sep-${prev}` });
      items.push({ type: "page", n, key: `p-${n}` });
      prev = n;
    }
    return items;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 text-slate-800 dark:text-slate-100 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Encabezado Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              Mis Recibos
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Historial y comprobantes digitales de tus pagos realizados en la plataforma.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#18181c] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-60"
            >
              <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? "Cargando..." : "Refrescar"}
            </button>
          </div>
        </div>

        {/* Buscador y Controles de Filtro */}
        <div className="bg-white dark:bg-[#151518] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Buscador */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar por inmueble, referencia o concepto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#1d1d22] border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-400 transition"
              />
              <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

        </div>

        <ErrorBanner message={loadingErr} onClose={() => setLoadingErr("")} />

        {/* Lista Principal de Recibos (Propuesta 1) */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white dark:bg-[#151518] rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
              <p className="font-bold text-slate-700 dark:text-slate-200 animate-pulse">Cargando recibos...</p>
            </div>
          ) : recibosFiltrados.length === 0 ? (
            <div className="bg-white dark:bg-[#151518] rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
              <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-200">No se encontraron recibos</p>
              <p className="text-xs text-slate-400">Intenta cambiar los filtros de búsqueda.</p>
            </div>
          ) : (
            recibosPaginados.map((recibo) => (
              <div
                key={recibo.id}
                onClick={() => setSelectedRecibo(recibo)}
                className="group bg-white dark:bg-[#151518] hover:bg-purple-50/50 dark:hover:bg-purple-950/20 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 hover:border-purple-300 dark:hover:border-purple-800 shadow-sm transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Lado Izquierdo: Info Principal */}
                <div className="flex items-center gap-4">
                  {/* Foto o Icono */}
                  <img
                    src={recibo.inmuebleImagen}
                    alt={recibo.inmueble}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {recibo.tipo}
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-base mt-0.5 group-hover:text-purple-800 dark:group-hover:text-purple-300 transition-colors">
                      {recibo.inmueble}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span>Ref: <strong className="font-mono text-slate-700 dark:text-slate-300">{recibo.referenciaBancaria}</strong></span>
                      <span>•</span>
                      <span>{formatDate(recibo.fecha)}</span>
                    </div>
                  </div>
                </div>

                {/* Lado Derecho: Estado, Monto y Botón Ver */}
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800/80">
                  <div className="text-left sm:text-right">
                    <div className="text-lg font-black text-slate-900 dark:text-white">
                      {fmtImporte(recibo.moneda, recibo.montoTotal)}{" "}
                      <span className="text-xs font-normal text-slate-400">{recibo.moneda}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                        recibo.estado === "Verificado"
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${recibo.estado === "Verificado" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                      {recibo.estado}
                    </span>

                    <button
                      type="button"
                      className="hidden sm:inline-flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-[#470A68] group-hover:text-white transition"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {!loading && recibosPaginados.length > 0 && totalPaginas > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-700 sm:flex-row">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, recibosFiltrados.length)} de {recibosFiltrados.length}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1 || loading}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Anterior
              </button>
              {renderPaginas(page, totalPaginas).map((item) =>
                item.type === "sep" ? (
                  <span key={item.key} className="px-1 text-sm text-slate-400">
                    …
                  </span>
                ) : (
                  <button
                    key={item.key}
                    onClick={() => goToPage(item.n)}
                    disabled={loading || item.n === page}
                    className={`min-w-[2.25rem] rounded-xl px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${
                      item.n === page
                        ? "bg-[#470A68] text-white shadow-sm dark:bg-[#5a0e82]"
                        : "border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    {item.n}
                  </button>
                )
              )}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPaginas || loading}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      <ComprobanteTransaccionModal
        variant="recibo"
        data={selectedRecibo}
        usuario={user}
        onClose={() => setSelectedRecibo(null)}
      />
    </div>
  );
}
