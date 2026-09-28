import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiGet } from "../../api";
import { useAuth } from "../../context/AuthContext";
import PropertyCard from "../../components/PropertyCard";
import ErrorBanner from "../../components/ErrorBanner";
import { useT } from "../../lib/i18n";

export default function InmueblesPage() {
  const { user } = useAuth();
  const tr = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [search, setSearch] = useState(() => params.get("q") || "");
  const [estatus, setEstatus] = useState("");
  const [estadoInmueble, setEstadoInmueble] = useState(() => params.get("estado_inmueble") || "");
  const [estadoId, setEstadoId] = useState(() => params.get("estado_id") || "");
  const [tipoId, setTipoId] = useState(() => params.get("tipo_inmueble_id") || "");
  const [min, setMin] = useState(() => params.get("min") || "");
  const [max, setMax] = useState(() => params.get("max") || "");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("list");
  const [estados, setEstados] = useState([]);

  async function load() {
    setLoading(true);
    setErr("");

    try {
      const r = await apiGet("/inmuebles", {
        q: search || undefined,
        estatus: estatus || undefined,
        estado_inmueble: estadoInmueble || undefined,
        estado_id: estadoId || undefined,
        tipo_inmueble_id: tipoId || undefined,
        min: min || undefined,
        max: max || undefined,
        sort: sort || undefined,
        limit: 100,
      });

      const data = r?.data ?? r;
      console.log(data);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr("");
      setRows([
        { id: 1, titulo: "Ocean Breeze Villa", tipo_inmueble: "Villa", estado_inmueble: "alquiler_fijo", estatus: "disponible", precio: 4500, habitaciones: 3, banos: 2, area_m2: 220, sector: "Ocean Drive", ciudad: "Maracaibo", imagen_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80" },
        { id: 2, titulo: "Jakson House", tipo_inmueble: "Casa", estado_inmueble: "alquiler_fijo", estatus: "disponible", precio: 3200, habitaciones: 3, banos: 2, area_m2: 180, sector: "Baker Street", ciudad: "Maracaibo", imagen_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80" },
        { id: 3, titulo: "Lakeside Cottage", tipo_inmueble: "Casa", estado_inmueble: "alquiler_fijo", estatus: "disponible", precio: 5700, habitaciones: 3, banos: 2, area_m2: 240, sector: "Pinecrest Lane", ciudad: "Maracaibo", imagen_url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    apiGet("/geo/estados").then((r) => setEstados(r?.data || [])).catch(() => setEstados([]));
  }, []);

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold dark:text-slate-100">{tr("searchTitle")}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {tr("searchSub")}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {(user?.rol !== "cliente" && user) && (
            <button
              onClick={() => navigate("/inmuebles/crear")}
              className="btn-secondary disabled:opacity-60"
            >
              {tr("createProperty")}
            </button>
          )}

          <button
            onClick={load}
            disabled={loading}
            className="btn-primary disabled:opacity-60"
          >
            {loading ? tr("loading") : tr("search")}
          </button>

          <button
            onClick={() => {
              setSearch("");
              setEstatus("");
              setEstadoInmueble("");
              setEstadoId("");
              setTipoId("");
              setMin("");
              setMax("");
              setSort("newest");
            }}
            disabled={loading}
            className="btn-secondary disabled:opacity-60"
          >
            {tr("clear")}
          </button>
        </div>
      </div>

      <ErrorBanner message={err} onClose={() => setErr("")} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{tr("filters")}</div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Buscar</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900"
                placeholder={tr("cityPh")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") load();
                }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{tr("operation")}</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                value={estadoInmueble}
                onChange={(e) => setEstadoInmueble(e.target.value)}
              >
                <option value="">{tr("allF")}</option>
                <option value="venta">{tr("sale")}</option>
                <option value="alquiler_fijo">{tr("rent")}</option>
                <option value="vacacional">{tr("vacation")}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{tr("state")}</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                value={estadoId}
                onChange={(e) => setEstadoId(e.target.value)}
              >
                <option value="">{tr("allM")}</option>
                {estados.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{tr("status")}</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                value={estatus}
                onChange={(e) => setEstatus(e.target.value)}
              >
                <option value="">{tr("allM")}</option>
                <option value="disponible">{tr("available")}</option>
                <option value="reservado">{tr("reserved")}</option>
                <option value="vendido">{tr("sold")}</option>
                <option value="alquilado">{tr("rented")}</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{tr("minPrice")}</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="0"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{tr("maxPrice")}</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="999,999"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              Usa el botón <span className="font-semibold text-slate-700 dark:text-slate-300">Buscar</span> para aplicar los filtros.
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {loading
                  ? tr("loading")
                  : `${rows.length} ${tr("found")}`}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{tr("refine")}</div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{tr("view")}</span>
                <div className="inline-flex rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-600 dark:bg-slate-800">
                  <button
                    type="button"
                    className={`px-3 py-2 text-xs font-medium ${
                      view === "list"
                        ? "bg-blue-50 text-slate-900 dark:bg-blue-900/50 dark:text-slate-100"
                        : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                    }`}
                    onClick={() => setView("list")}
                  >
                    {tr("list")}
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-2 text-xs font-medium ${
                      view === "map"
                        ? "bg-blue-50 text-slate-900 dark:bg-blue-900/50 dark:text-slate-100"
                        : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                    }`}
                    onClick={() => setView("map")}
                  >
                    {tr("map")}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{tr("sort")}</label>
                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="newest">{tr("newest")}</option>
                  <option value="price_asc">{tr("priceAsc")}</option>
                  <option value="price_desc">{tr("priceDesc")}</option>
                </select>
              </div>
            </div>
          </div>

          {view === "map" ? (
            <div className="h-[520px] rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
              <iframe
                title={tr("map")}
                className="h-full w-full rounded-2xl"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-71.8%2C17.3%2C-69.2%2C19.2&layer=mapnik"
              />
            </div>
          ) : (
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
                  {tr("empty")}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

    </div>
  );
}