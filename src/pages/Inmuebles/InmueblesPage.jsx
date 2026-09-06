import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiGet } from "../../api";
import { useAuth } from "../../context/AuthContext";
import PropertyCard from "../../components/PropertyCard";
import ErrorBanner from "../../components/ErrorBanner";

export default function InmueblesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [estatus, setEstatus] = useState("disponible,reservado");
  const [estadoInmueble, setEstadoInmueble] = useState(() => searchParams.get("estado_inmueble") || "");
  const [estadoId, setEstadoId] = useState("");
  const [ciudadId, setCiudadId] = useState("");
  const [tipoInmuebleId, setTipoInmuebleId] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [sort, setSort] = useState("newest");

  const [estados, setEstados] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [tiposInmueble, setTiposInmueble] = useState([]);

  //Cargar inmuebles
  async function load() {
    setLoading(true);
    setErr("");

    const q = searchParams.get("q") || "";

    try {
      const r = await apiGet("/inmuebles", {
        q: q || undefined,
        estatus: estatus || undefined,
        estado_inmueble: estadoInmueble || undefined,
        ciudad_id: ciudadId || undefined,
        estado_id: estadoId || undefined,
        tipo_inmueble_id: tipoInmuebleId || undefined,
        min: min || undefined,
        max: max || undefined,
        sort: sort || undefined,
        limit: 100,
      });

      const data = r?.data ?? r;
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  //Scripts de inicio de la pagina
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const est = searchParams.get("estado_inmueble") || "";
    setEstadoInmueble(est);
    
    setLoading(true);
    setErr("");
    apiGet("/inmuebles", {
      q: q || undefined,
      estado_inmueble: est || undefined,
      estatus: estatus || undefined,
      limit: 100,
    })
      .then((r) => {
        const data = r?.data ?? r;
        setRows(Array.isArray(data) ? data : []);
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [searchParams]);

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
          {(user?.rol === "corredor" && user) && (
            <Link
              to="/inmuebles/crear"
              className="btn-primary shrink-0"
            >
              + Crear inmueble
            </Link>
          )}

          <button
            onClick={load}
            disabled={loading}
            className="btn-primary disabled:opacity-60"
          >
            {loading ? "Cargando…" : "Aplicar filtros"}
          </button>

          <button
            onClick={() => {
              setEstatus("");
              setEstadoInmueble("");
              setEstadoId("");
              setCiudadId("");
              setTipoInmuebleId("");
              setMin("");
              setMax("");
              setSort("newest");
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
              Usa el botón <span className="font-semibold text-slate-700 dark:text-slate-300">Aplicar filtros</span> para actualizar la búsqueda.
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {loading
                  ? "Cargando inmuebles…"
                  : `${rows.length} propiedad${rows.length === 1 ? "" : "es"} encontrados`}
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
        </section>
      </div>

    </div>
  );
}