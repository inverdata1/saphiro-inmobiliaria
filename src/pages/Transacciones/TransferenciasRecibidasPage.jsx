import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "../../context/useAuth";
import { apiGet } from "../../api";
import { formatDate } from "../../utils/date";
import { fmtImporte, fmtTotal } from "../../utils/money";
import SaphiroDatePicker from "../../components/pickers/SaphiroDatePicker";
import ErrorBanner from "../../components/error/ErrorBanner";
import ComprobanteTransaccionModal from "../../components/pagos/ComprobanteTransaccionModal";

const METODOS_PAGO = [
  "Tarjeta de Débito",
  "Tarjeta de Crédito",
  "Zelle",
  "Binance",
  "PayPal",
];

const TIPO_LABEL = {
  compra: "Compra",
  venta: "Venta",
  alquiler: "Alquiler",
};

const ESTADO_LABEL = {
  pagado: "Aprobada",
  pendiente: "En Verificación",
  cancelado: "Cancelada",
};

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80";

function fechaKey(fechaStr) {
  return fechaStr ? String(fechaStr).slice(0, 10) : "";
}

function toYmd(date) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function mapTransferencia(row) {
  const num = (v) => Number(v || 0);
  const moneda = (row.moneda || "USD").toUpperCase();
  const bruto = num(row.monto_total);
  const comision = num(row.monto_comision);
  const neto = bruto - comision;
  return {
    id: row.numero_factura || `TRF-${row.transferencia_id}`,
    referenciaBancaria: row.numero_factura || `#${row.transferencia_id}`,
    transaccionId: row.transaccion_id,
    inmueble: row.inmueble_titulo || `Inmueble #${row.inmueble_id}`,
    inmuebleUbicacion: row.estado_inmueble || "-",
    inmuebleImagen: row.inmueble_imagen_url || PLACEHOLDER_IMG,
    clienteNombre: row.cliente_nombre || "Cliente",
    clienteEmail: row.cliente_email,
    clienteTelefono: "-",
    concepto: row.estado_inmueble || TIPO_LABEL[row.tipo_operacion] || row.tipo_operacion || "-",
    fecha: row.fecha_pago || row.fecha_transaccion,
    moneda,
    // Moneda en un solo campo. Los pares {campo}Usd/{campo}Bs se formatiaban en cada
    // lugar con el mismo ternario, y ademas no cubrian EUR: con moneda EUR entraban por
    // la rama USD, que lee un 0, y mostraba "$0.00".
    montoBruto: bruto,
    comision,
    montoNeto: neto,
    porcentajeAplicado: num(row.porcentaje_aplicado),
    metodo: "-",
    bancoEmisor: "-",
    bancoReceptor: "-",
    estado: ESTADO_LABEL[row.estatus_pago] || "En Verificación",
    // Lineas de transacciones_detalles. El backend manda [] (nunca null) cuando no hay.
    detalles: Array.isArray(row.detalles) ? row.detalles : [],
  };
}

export default function TransferenciasRecibidasPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [desde, setDesde] = useState(null);
  const [hasta, setHasta] = useState(null);
  const [metodo, setMetodo] = useState("");
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [transferencias, setTransferencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingErr, setLoadingErr] = useState("");
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 8;

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setLoadingErr("");
    try {
      const r = await apiGet(`/transacciones/corredor/${user.id}`, { limit: 200 });
      setTransferencias((r.data || []).map(mapTransferencia));
    } catch (e) {
      setLoadingErr(e.message);
      setTransferencias([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Filtrado dinámico
  const transferenciasFiltradas = useMemo(() => {
    const desdeYmd = toYmd(desde);
    const hastaYmd = toYmd(hasta);
    return transferencias.filter((t) => {
      const matchSearch =
        !search ||
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.inmueble.toLowerCase().includes(search.toLowerCase()) ||
        t.referenciaBancaria.toLowerCase().includes(search.toLowerCase()) ||
        t.clienteNombre.toLowerCase().includes(search.toLowerCase()) ||
        t.concepto.toLowerCase().includes(search.toLowerCase());

      const trfFecha = fechaKey(t.fecha);
      const matchFecha =
        (!desdeYmd || trfFecha >= desdeYmd) && (!hastaYmd || trfFecha <= hastaYmd);

      const matchMetodo =
        !metodo || t.metodo.toLowerCase() === metodo.toLowerCase();

      return matchSearch && matchFecha && matchMetodo;
    });
  }, [search, desde, hasta, metodo, transferencias]);

  useEffect(() => {
    setPage(1);
  }, [search, desde, hasta, metodo]);

  const transferenciasPaginadas = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return transferenciasFiltradas.slice(start, start + PAGE_SIZE);
  }, [transferenciasFiltradas, page]);

  const totalPaginas = Math.max(1, Math.ceil(transferenciasFiltradas.length / PAGE_SIZE));

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
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Encabezado Principal (Directo sin KPIs superiores por solicitud) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              Transferencias Recibidas
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Consulta y verifica los pagos y transferencias abonadas por los clientes de tus inmuebles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSearch("");
                setDesde(null);
                setHasta(null);
                setMetodo("");
              }}
              className="inline-flex items-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#18181c] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Buscador y Controles de Filtro */}
        <div className="bg-white dark:bg-[#151518] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
            {/* Campo de búsqueda */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar por referencia bancaria, cliente o nombre de inmueble..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#1d1d22] border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-400 transition"
              />
              <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filtros de fecha y método — método a la izquierda, fechas a la derecha */}
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Método de pago</label>
                <div className="flex flex-wrap gap-1.5">
                  {METODOS_PAGO.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMetodo(metodo === m ? "" : m)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
                        metodo === m
                          ? "bg-[#470A68] text-white border-[#470A68]"
                          : "bg-slate-50 dark:bg-[#1d1d22] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-800 dark:hover:text-purple-300"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ml-auto flex flex-wrap items-end gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Desde</label>
                  <SaphiroDatePicker
                    selected={desde}
                    onChange={(d) => setDesde(d)}
                    selectsStart
                    startDate={desde}
                    endDate={hasta}
                    placeholderText="dd/mm/aaaa"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Hasta</label>
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
            </div>
        </div>

        <ErrorBanner message={loadingErr} onClose={() => setLoadingErr("")} />

        {/* Lista de Transferencias Recibidas (Propuesta 1) */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white dark:bg-[#151518] rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
              <p className="font-bold text-slate-700 dark:text-slate-200 animate-pulse">Cargando transferencias...</p>
            </div>
          ) : transferenciasFiltradas.length === 0 ? (
            <div className="bg-white dark:bg-[#151518] rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
              <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-200">No se encontraron transferencias</p>
              <p className="text-xs text-slate-400">Intenta ajustar el término de búsqueda o cambiar los filtros.</p>
            </div>
          ) : (
            transferenciasPaginadas.map((trf) => (
              <div
                key={trf.id}
                onClick={() => setSelectedTransfer(trf)}
                className="group bg-white dark:bg-[#151518] hover:bg-purple-50/50 dark:hover:bg-purple-950/20 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 hover:border-purple-300 dark:hover:border-purple-800 shadow-sm transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Lado Izquierdo: Info Inmueble y Cliente */}
                <div className="flex items-center gap-4">
                  <img
                    src={trf.inmuebleImagen}
                    alt={trf.inmueble}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Cliente: <strong className="text-slate-900 dark:text-white">{trf.clienteNombre}</strong>
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-base mt-0.5 group-hover:text-purple-800 dark:group-hover:text-purple-300 transition-colors">
                      {trf.inmueble}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                      <span>Numero de referencia: <strong className="font-mono text-slate-800 dark:text-slate-200">{trf.referenciaBancaria}</strong></span>
                      <span>•</span>
                      <span>{trf.concepto}</span>
                      <span>•</span>
                      <span>{formatDate(trf.fecha)}</span>
                    </div>
                  </div>
                </div>

                {/* Lado Derecho: Desglose Financiero (Bruto -> Neto) y Estado */}
                <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800/80">
                  <div className="text-left md:text-right">
                    <div className="text-xs text-slate-400">
                      Monto abonado: <span className="line-through font-mono">{fmtTotal(trf.moneda, trf.montoBruto)}</span>
                    </div>
                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {fmtImporte(trf.moneda, trf.montoNeto)}{" "}
                      <span className="text-xs font-bold text-slate-400">{trf.moneda} NETO</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                        trf.estado === "Aprobada"
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${trf.estado === "Aprobada" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                      {trf.estado}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {!loading && transferenciasPaginadas.length > 0 && totalPaginas > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-700 sm:flex-row">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, transferenciasFiltradas.length)} de {transferenciasFiltradas.length}
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
        variant="liquidacion"
        data={selectedTransfer}
        onClose={() => setSelectedTransfer(null)}
      />
    </div>
  );
}
