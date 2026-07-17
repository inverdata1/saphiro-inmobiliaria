import { useEffect, useState, useRef } from "react";
import { apiGet } from "../api";

function fmtPrice(n, moneda) {
  const num = Number(n || 0);
  const m = (moneda || "USD").toUpperCase();
  const formatted = num.toLocaleString("en-US");
  if (m === "EUR") return `${formatted}€`;
  if (m === "BS") return `${formatted} Bs.`;
  return `$${formatted}`;
}

export default function InmuebleZonaPicker({ value, onChange, selectedItem }) {
  const [estadoId, setEstadoId] = useState("");
  const [ciudadId, setCiudadId] = useState("");

  const [estados, setEstados] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [inmuebles, setInmuebles] = useState([]);
  const [loading, setLoading] = useState(false);

  const [err, setErr] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const debounceRef = useRef(null);
  const loadedRef = useRef(false);

  async function fetchInmuebles(ciudad, q, { initial = false } = {}) {
    if (initial && !loadedRef.current) setLoading(true);
    try {
      const params = { ciudad_id: ciudad };
      if (q) params.q = q;
      const r = await apiGet("/inmuebles/disponibles", params);
      setInmuebles(r.data || []);
      loadedRef.current = true;
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const r = await apiGet("/geo/estados");
        setEstados(r.data || []);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  useEffect(() => {
    if (!estadoId) return;
    setCiudadId(""); onChange?.(null);
    setCiudades([]); setInmuebles([]);

    (async () => {
      try {
        const r = await apiGet("/geo/ciudades", { estado_id: estadoId });
        setCiudades(r.data || []);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [estadoId]);

  useEffect(() => {
    if (!ciudadId) return;
    onChange?.(null);
    fetchInmuebles(ciudadId, "", { initial: true });
  }, [ciudadId]);

  useEffect(() => {
    if (!showModal || !ciudadId) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchInmuebles(ciudadId, search);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, showModal]);

  function handleSelect(inmueble) {
    onChange?.(inmueble.id, inmueble);
    setShowModal(false);
    setSearch("");
  }

  function handleClear() {
    onChange?.(null);
  }

  function getImageUrl(i) {
    const raw = i.imagen_url;
    if (!raw) return "https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&w=600&q=80";
    if (raw.includes("/imagenes/file/")) {
      const id = raw.split("/").pop();
      return `/imagenes/optimized/${id}?w=400&q=80`;
    }
    return raw;
  }

  const effectiveSelected = selectedItem;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="flex gap-2">
        <select className="border rounded-xl px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 text-sm flex-1 sm:flex-none" value={estadoId} onChange={(e) => setEstadoId(e.target.value)}>
          <option value="">Estado</option>
          {estados.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
        </select>

        <select className={`border rounded-xl px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 text-sm transition-opacity flex-1 sm:flex-none ${!estadoId ? "opacity-40" : ""}`} value={ciudadId} onChange={(e) => setCiudadId(e.target.value)} disabled={!estadoId}>
          <option value="">Ciudad</option>
          {ciudades.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
        </select>
      </div>

      <div className={`flex items-center gap-1 flex-1 transition-opacity ${!ciudadId ? "opacity-40" : ""}`}>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          disabled={!ciudadId}
          className="flex-1 text-left border rounded-xl px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 text-sm truncate"
        >
          {effectiveSelected
            ? `#${effectiveSelected.id} — ${effectiveSelected.titulo} — ${fmtPrice(effectiveSelected.precio, effectiveSelected.moneda)}`
            : value ? `#${value}` : "Inmueble"}
        </button>
        {effectiveSelected ? (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg bg-red-50 p-2 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 shrink-0"
            title="Limpiar selección"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center sm:grid sm:place-items-center bg-black/40 sm:p-4" onClick={() => { setShowModal(false); setSearch(""); }}>
          <div className="w-full sm:max-w-3xl max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-lg dark:bg-slate-800 dark:border dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-4 sm:p-6 pb-0">
              <div>
                <div className="text-lg font-extrabold dark:text-slate-100">Seleccionar inmueble</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{inmuebles.length} resultado(s)</div>
              </div>
              <button
                type="button"
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                onClick={() => { setShowModal(false); setSearch(""); }}
              >
                ✕
              </button>
            </div>

            <div className="px-4 sm:px-6 pt-4">
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900"
                placeholder="Buscar por nombre o ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-4">
              {loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-52 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-700" />
                  ))}
                </div>
              ) : inmuebles.length === 0 ? (
                <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-10">No se encontraron inmuebles</div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {inmuebles.map((i) => (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => handleSelect(i)}
                      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-800 text-left ${
                        value == i.id
                          ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <div className="relative w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 aspect-[16/10] max-h-40">
                        <img
                          src={getImageUrl(i)}
                          alt={i.titulo || ""}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover pointer-events-none group-hover:scale-105 transition-all duration-500"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
                        <div className="absolute left-2 top-2 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-semibold text-white">
                          {i.estado_inmueble || "Venta"}
                        </div>
                        {value == i.id ? (
                          <div className="absolute right-2 top-2 rounded-full bg-blue-500 p-1">
                            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-1 flex-col gap-1.5 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">{i.titulo || "Sin título"}</h3>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{i.ciudad || "—"}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {fmtPrice(i.precio, i.moneda)}
                            </div>
                            <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">{i.estatus || "Disponible"}</div>
                          </div>
                        </div>

                        <div className="mt-auto flex flex-wrap gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                          {i.area_m2 ? (
                            <span className="rounded-full border border-slate-200 px-2 py-0.5 dark:border-slate-600">📐 {i.area_m2} m²</span>
                          ) : null}
                          {i.corredor_id ? (
                            <span className="rounded-full border border-slate-200 px-2 py-0.5 dark:border-slate-600">👤 Corredor</span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {err ? <div className="text-xs text-red-600 dark:text-red-400">{err}</div> : null}
    </div>
  );
}
