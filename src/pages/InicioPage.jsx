import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet } from "../api";
import { useAuth } from "../context/useAuth";
import PropertyCard from "../components/PropertyCard";
import { useT } from "../lib/i18n";

const HERO_IMG =
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1920&q=80";

const MOCK_LATEST = [
  { id: 1, titulo: "Ocean Breeze Villa", tipo_inmueble: "Villa", estado_inmueble: "alquiler_fijo", estatus: "disponible", precio: 4500, habitaciones: 3, banos: 2, area_m2: 220, sector: "Ocean Drive", ciudad: "Maracaibo", imagen_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80" },
  { id: 2, titulo: "Jakson House", tipo_inmueble: "Casa", estado_inmueble: "alquiler_fijo", estatus: "disponible", precio: 3200, habitaciones: 3, banos: 2, area_m2: 180, sector: "Baker Street", ciudad: "Maracaibo", imagen_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80" },
  { id: 3, titulo: "Lakeside Cottage", tipo_inmueble: "Casa", estado_inmueble: "alquiler_fijo", estatus: "disponible", precio: 5700, habitaciones: 3, banos: 2, area_m2: 240, sector: "Pinecrest Lane", ciudad: "Maracaibo", imagen_url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80" },
];

const PRICE_PRESETS = [
  { value: "", key: "price" },
  { value: "0-1500", key: "priceTo" },
  { value: "1500-3500", key: "priceMid" },
  { value: "3500-7000", key: "priceHigh" },
  { value: "7000-", key: "priceMore" },
];

export default function InicioPage() {
  const { user } = useAuth();
  const tr = useT();
  const navigate = useNavigate();
  const isStaff = user?.rol === "admin" || user?.rol === "corredor";

  const [latest, setLatest] = useState([]);
  const [estados, setEstados] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [q, setQ] = useState("");
  const [estadoId, setEstadoId] = useState("");
  const [tipo, setTipo] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet("/inmuebles", { limit: 6, estatus: "disponible" });
        const data = res?.data ?? res ?? [];
        setLatest(Array.isArray(data) && data.length ? data : MOCK_LATEST);
      } catch {
        setLatest(MOCK_LATEST);
      }
    })();
    apiGet("/geo/estados").then((r) => setEstados(r?.data || [])).catch(() => setEstados([]));
    apiGet("/tipos").then((r) => setTipos(r?.data || r || [])).catch(() => setTipos([]));
  }, []);

  function search(e) {
    e?.preventDefault?.();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (estadoId) params.set("estado_id", estadoId);
    if (tipo) {
      if (String(tipo).startsWith("op:")) params.set("estado_inmueble", tipo.slice(3));
      else params.set("tipo_inmueble_id", tipo);
    }
    if (price) {
      const [min, max] = price.split("-");
      if (min) params.set("min", min);
      if (max) params.set("max", max);
    }
    navigate(`/inmuebles?${params.toString()}`);
  }

  const featured = latest.slice(0, 3);

  return (
    <div className="bg-white dark:bg-slate-900">
      <section className="relative isolate min-h-[72vh] overflow-hidden">
        <img src={HERO_IMG} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-slate-950/35 to-slate-950/70" />
        <div className="relative mx-auto flex min-h-[72vh] max-w-5xl flex-col items-center justify-center px-4 pb-28 pt-16 text-center">
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            {tr("heroTitle")}
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">
            {tr("heroSub")}
          </p>

          <form
            onSubmit={search}
            className="absolute bottom-8 left-1/2 z-10 w-[min(100%-2rem,56rem)] -translate-x-1/2"
          >
            <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:flex-row sm:items-stretch">
              <label className="flex min-w-0 flex-1 items-center gap-2 border-b border-slate-100 px-4 py-3 sm:border-b-0 sm:border-r">
                <span className="text-slate-400">📍</span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={tr("cityPh")}
                  className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
              </label>
              <label className="flex min-w-[10rem] items-center gap-2 border-b border-slate-100 px-4 py-3 sm:border-b-0 sm:border-r">
                <span className="text-slate-400">⌂</span>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-700 outline-none"
                >
                  <option value="">{tr("type")}</option>
                  <option value="op:venta">{tr("sale")}</option>
                  <option value="op:alquiler_fijo">{tr("rent")}</option>
                  <option value="op:vacacional">{tr("vacation")}</option>
                  {tipos.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-[9rem] items-center gap-2 px-4 py-3">
                <select
                  value={estadoId}
                  onChange={(e) => setEstadoId(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-700 outline-none"
                >
                  <option value="">{tr("state")}</option>
                  {estados.map((e) => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-[9rem] items-center gap-2 border-t border-slate-100 px-4 py-3 sm:border-t-0 sm:border-l">
                <select
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-700 outline-none"
                >
                  {PRICE_PRESETS.map((p) => (
                    <option key={p.value || "any"} value={p.value}>{tr(p.key)}</option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="bg-slate-900 px-8 py-3 text-sm font-semibold text-white hover:bg-slate-800 sm:rounded-none"
              >
                {tr("search")}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{tr("mostViewed")}</h2>
            <p className="mt-1 text-sm text-slate-500">{tr("mostViewedSub")}</p>
          </div>
          <Link to="/inmuebles" className="text-sm font-semibold text-slate-900 underline dark:text-white">
            {tr("seeAll")}
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          {featured.map((p) => (
            <PropertyCard key={p.id || p.inmueble_id} property={p} portal />
          ))}
        </div>
      </section>

      {isStaff ? (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{tr("staff")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/inmuebles/crear" className="btn-secondary">{tr("createProperty")}</Link>
            <Link to="/transacciones" className="btn-secondary">{tr("transactions")}</Link>
            <Link to="/comisiones" className="btn-secondary">{tr("commissions")}</Link>
            <Link to="/bitacora" className="btn-secondary">{tr("log")}</Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
