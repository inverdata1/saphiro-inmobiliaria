import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiGet } from "../../api";
import { useAuth } from "../../context/useAuth";
import PropertyCard from "../../components/PropertyCard";
import ErrorBanner from "../../components/error/ErrorBanner";

export default function InmueblesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const PAGE_SIZE = 12;

  const [estatus, setEstatus] = useState("disponible,reservado");
  const [q, setQ] = useState(() => searchParams.get("q") || "");
  const [estadoInmueble, setEstadoInmueble] = useState(() => searchParams.get("estado_inmueble") || "");
  const [estadoId, setEstadoId] = useState(() => searchParams.get("estado_id") || "");
  const [ciudadId, setCiudadId] = useState("");
  const [tipoInmuebleId, setTipoInmuebleId] = useState(() => searchParams.get("tipo_inmueble_id") || "");
  const [min, setMin] = useState(() => searchParams.get("min") || "");
  const [max, setMax] = useState(() => searchParams.get("max") || "");
  const [moneda, setMoneda] = useState(() => searchParams.get("moneda") || "");
  const [sort, setSort] = useState("newest");

  const [estados, setEstados] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [tiposInmueble, setTiposInmueble] = useState([]);

  const debounceRef = useRef(null);
  //Último `q` realmente consultado, para no recargar si el texto no cambió
  const qAplicadaRef = useRef((searchParams.get("q") || "").trim());

  //Cargar inmuebles
  async function load(p = 1, overrides = {}) {
    setLoading(true);
    setErr("");
    window.scrollTo({ top: 0, behavior: "smooth" });

    const vals = {
      estatus,
      q,
      estadoInmueble,
      estadoId,
      ciudadId,
      tipoInmuebleId,
      min,
      max,
      moneda,
      sort,
      ...overrides,
    };

    const qEnviada = (vals.q || "").trim();
    qAplicadaRef.current = qEnviada;

    try {
      const r = await apiGet("/inmuebles", {
        q: qEnviada || undefined,
        estatus: vals.estatus || undefined,
        estado_inmueble: vals.estadoInmueble || undefined,
        ciudad_id: vals.ciudadId || undefined,
        estado_id: vals.estadoId || undefined,
        tipo_inmueble_id: vals.tipoInmuebleId || undefined,
        min: vals.min || undefined,
        max: vals.max || undefined,
        moneda: vals.moneda || undefined,
        sort: vals.sort || undefined,
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      });

      const data = r?.data ?? r;
      setRows(Array.isArray(data) ? data : []);
      const pag = r?.pagination;
      setTotal(pag?.total != null ? pag.total : (Array.isArray(data) ? data.length : rows.length));
      setTotalPages(pag?.totalPages ?? 1);
      setPage(pag?.page ?? p);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

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

  //Scripts de inicio de la pagina: sincroniza TODOS los filtros con la URL
  // (la barra de búsqueda del inicio navega con q, estado_id, estado_inmueble,
  // tipo_inmueble_id, min y max).
  useEffect(() => {
    const filtrosUrl = {
      q: searchParams.get("q") || "",
      estadoId: searchParams.get("estado_id") || "",
      estadoInmueble: searchParams.get("estado_inmueble") || "",
      tipoInmuebleId: searchParams.get("tipo_inmueble_id") || "",
      min: searchParams.get("min") || "",
      max: searchParams.get("max") || "",
      moneda: searchParams.get("moneda") || "",
    };
    setQ(filtrosUrl.q);
    setEstadoId(filtrosUrl.estadoId);
    setEstadoInmueble(filtrosUrl.estadoInmueble);
    setTipoInmuebleId(filtrosUrl.tipoInmuebleId);
    setMin(filtrosUrl.min);
    setMax(filtrosUrl.max);
    setMoneda(filtrosUrl.moneda);
    load(1, filtrosUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  //Búsqueda por texto con debounce: escribe y filtra solo
  useEffect(() => {
    const valor = q.trim();
    if (valor === qAplicadaRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(1), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    apiGet("/tipos")
      .then((r) => setTiposInmueble(r?.data ?? r ?? []))
      .catch(() => setTiposInmueble([]));
  }, []);

  useEffect(() => {
    apiGet("/geo/estados")
      .then((r) => setEstados(r?.data ?? r ?? []))
      .catch(() => setEstados([]));
  }, []);

  useEffect(() => {
    if (!estadoId) { setCiudades([]); setCiudadId(""); return; }
    setCiudadId("");
    apiGet("/geo/ciudades", { estado_id: estadoId })
      .then((r) => setCiudades(r?.data ?? r ?? []))
      .catch(() => setCiudades([]));
  }, [estadoId]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold dark:text-slate-100">Buscar inmuebles</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Explora las propiedades disponibles.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {(user && (user.rol === "corredor" || user.rol === "admin")) && (
            <Link
              to="/inmuebles/crear"
              className="btn-primary shrink-0"
            >
              + Crear inmueble
            </Link>
          )}

          <button
            onClick={() => load(1)}
            disabled={loading}
            className="btn-primary disabled:opacity-60"
          >
            {loading ? "Cargando…" : "Aplicar filtros"}
          </button>

          <button
            onClick={() => {
              const limpio = {
                q: "",
                estadoInmueble: "",
                estadoId: "",
                ciudadId: "",
                tipoInmuebleId: "",
                min: "",
                max: "",
                moneda: "",
                sort: "newest",
              };
              setEstatus("disponible,reservado");
              setQ(limpio.q);
              setEstadoInmueble(limpio.estadoInmueble);
              setEstadoId(limpio.estadoId);
              setCiudadId(limpio.ciudadId);
              setTipoInmuebleId(limpio.tipoInmuebleId);
              setMin(limpio.min);
              setMax(limpio.max);
              setMoneda(limpio.moneda);
              setSort(limpio.sort);
              load(1, limpio);
            }}
            disabled={loading}
            className="btn-secondary disabled:opacity-60"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Filtros</div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Buscar</label>
              <div className="relative mt-1">
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Título o descripción…"
                  aria-label="Buscar inmuebles por título o descripción"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-[#470A68] focus:outline-none focus:ring-2 focus:ring-[#470A68]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
                />
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {q && (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    aria-label="Limpiar búsqueda"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Estado</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                value={estadoId}
                onChange={(e) => setEstadoId(e.target.value)}
              >
                <option value="">Todos</option>
                {estados.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ciudad</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-50"
                value={ciudadId}
                onChange={(e) => setCiudadId(e.target.value)}
                disabled={!estadoId}
              >
                <option value="">{estadoId ? "Todas" : "Selecciona un estado"}</option>
                {ciudades.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Categoría</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                value={tipoInmuebleId}
                onChange={(e) => setTipoInmuebleId(e.target.value)}
              >
                <option value="">Todas</option>
                {tiposInmueble.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Estatus</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                value={estatus}
                onChange={(e) => setEstatus(e.target.value)}
              >
                <option value="disponible,reservado">Todos</option>
                <option value="disponible">Disponible</option>
                <option value="reservado">Reservado</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tipo</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                value={estadoInmueble}
                onChange={(e) => setEstadoInmueble(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="venta">Venta</option>
                <option value="alquiler_fijo">Alquiler fijo</option>
                <option value="vacacional">Vacacional</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Moneda</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                value={moneda}
                onChange={(e) => setMoneda(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="BS">BS</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Precio mínimo</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="0"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Precio máximo</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="999,999"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              La búsqueda por texto se aplica sola. Usa el botón <span className="font-semibold text-slate-700 dark:text-slate-300">Aplicar filtros</span> para actualizar el resto.
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {loading
                  ? "Cargando inmuebles…"
                  : `${total} propiedad${total === 1 ? "" : "es"} encontrados`}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Refina tu búsqueda con los filtros.</div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ordenar</label>
                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="newest">Más recientes</option>
                  <option value="price_asc">Precio: menor a mayor</option>
                  <option value="price_desc">Precio: mayor a menor</option>
                </select>
              </div>
            </div>
          </div>

          {err && <ErrorBanner message={err} onClose={() => setErr("")} />}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-60 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-700" />
              ))
            ) : rows.length ? (
              rows.map((p) => (
                <PropertyCard key={p.id ?? p._id ?? p.titulo} property={p} />
              ))
            ) : (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                No se encontraron inmuebles. Intenta cambiar los filtros o limpia la búsqueda.
              </div>
            )}
          </div>

          {!loading && rows.length > 0 && totalPages > 1 && (
            <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-700 sm:flex-row">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => load(page - 1)}
                  disabled={page <= 1 || loading}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Anterior
                </button>
                {renderPaginas(page, totalPages).map((item) =>
                  item.type === "sep" ? (
                    <span key={item.key} className="px-1 text-sm text-slate-400">
                      …
                    </span>
                  ) : (
                    <button
                      key={item.key}
                      onClick={() => load(item.n)}
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
                  onClick={() => load(page + 1)}
                  disabled={page >= totalPages || loading}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

    </div>
  );
}