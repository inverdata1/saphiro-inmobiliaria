import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../api";
import { useAuth } from "../context/AuthContext";
import PropertyCard from "../components/PropertyCard";
import ErrorBanner from "../components/ErrorBanner";

function MenuCard({ to, icon, title, subtitle, className = "" }) {
  return (
    <Link
      to={to}
      className={`group block rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.012)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:border-slate-800/60 dark:bg-[#141417] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-base font-bold text-slate-900 dark:text-slate-50">{title}</div>
        <div className="shrink-0">{icon}</div>
      </div>
      <div className="mt-2 text-xs font-semibold text-slate-400 dark:text-slate-500 leading-relaxed">{subtitle}</div>
      <div className="mt-5 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">Ir →</div>
    </Link>
  );
}

const MOCK_LATEST = [
  { id: 1, titulo: "Penthouse de Lujo en Piantini", tipo_inmueble: "Penthouse", estado_inmueble: "venta", estatus: "disponible", precio: 18500000, habitaciones: 4, banos: 3, area_m2: 320, sector: "Piantini", ciudad: "Santo Domingo", imagen_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80" },
  { id: 2, titulo: "Apartamento en Bella Vista", tipo_inmueble: "Apartamento", estado_inmueble: "alquiler_fijo", estatus: "disponible", precio: 45000, habitaciones: 2, banos: 2, area_m2: 110, sector: "Bella Vista", ciudad: "Santo Domingo", imagen_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80" },
  { id: 3, titulo: "Villa de Playa en Juan Dolio", tipo_inmueble: "Villa", estado_inmueble: "vacacional", estatus: "disponible", precio: 8500, habitaciones: 3, banos: 2, area_m2: 200, sector: "Juan Dolio", ciudad: "San Pedro de Macorís", imagen_url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80" },
];

export default function DashboardPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const { user } = useAuth();
  const [latestInmuebles, setLatestInmuebles] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet("/inmuebles", { limit: 3 });
        const data = res?.data ?? [];
        setLatestInmuebles(Array.isArray(data) ? data : []);
      } catch {
        setLatestInmuebles(MOCK_LATEST);
      }
    })();
  }, []);

  const initials = user
    ? (user.nombre || user.name || "")
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "US";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Panel de Control</h1>
        <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">Administra, explora y revisa los últimos inmuebles del sistema.</p>
      </div>

      <ErrorBanner message={err} onClose={() => setErr("")} />

      {/* Asymmetric 5-Card Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Inmuebles - Wide Hero Item */}
        <MenuCard
          to="/inmuebles"
          icon={
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          }
          title="Catálogo de Inmuebles"
          subtitle="Explora, busca y filtra todas las propiedades en venta y alquiler, o registra nuevos inmuebles."
          className="md:col-span-2"
        />

        {/* Card 2: Transacciones */}
        <MenuCard
          to="/transacciones"
          icon={
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
              <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          }
          title="Transacciones"
          subtitle="Monitorea ventas, cierres y acuerdos del sistema en tiempo real."
          className="md:col-span-1"
        />

        {/* Card 3: Comisiones */}
        <MenuCard
          to="/comisiones"
          icon={
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
              <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          }
          title="Comisiones"
          subtitle="Consulta los reportes de comisiones generadas por los corredores."
          className="md:col-span-1"
        />

        {/* Card 4: Bitácora */}
        <MenuCard
          to="/bitacora"
          icon={
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl">
              <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
          }
          title="Bitácora"
          subtitle="Audita los logs y estadísticas de uso del sistema."
          className="md:col-span-1"
        />

        {/* Card 5: Tu Perfil (Custom Integrated Bento Card) */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.012)] dark:border-slate-800/60 dark:bg-[#141417] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] md:col-span-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="text-base font-bold text-slate-900 dark:text-slate-50">Tu Perfil</div>
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-650 text-xs font-bold text-white shadow-md">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{user.nombre || user.name || "-"}</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">{user.cargo || "Usuario"}</div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">Sesión no iniciada</div>
            )}
          </div>
          <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-4">
            {user?.email || "-"}
          </div>
        </div>
      </div>

      {/* Category Shortcuts */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.012)] dark:border-slate-800/60 dark:bg-[#141417] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Buscar por Categoría</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/inmuebles?q=villa" className="btn-secondary text-xs py-2 px-3">
            Villas
          </Link>
          <Link to="/inmuebles?q=apartamento" className="btn-secondary text-xs py-2 px-3">
            Apartamentos
          </Link>
          <Link to="/inmuebles?estado_inmueble=alquiler_fijo" className="btn-secondary text-xs py-2 px-3">
            Alquiler
          </Link>
          <Link to="/inmuebles?estado_inmueble=vacacional" className="btn-secondary text-xs py-2 px-3">
            Vacaciones
          </Link>
          <Link to="/inmuebles?q=airbnb" className="btn-secondary text-xs py-2 px-3">
            Airbnb
          </Link>
        </div>
      </div>

      {/* Latest Properties Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-50">Últimos Inmuebles</div>
            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500">Las propiedades más recientes del catálogo.</div>
          </div>
          <Link to="/inmuebles" className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">
            Ver todos →
          </Link>
        </div>

        {latestInmuebles.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {latestInmuebles.map((i) => (
              <PropertyCard key={i.id || i.inmueble_id} property={i} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 text-sm text-slate-400 dark:border-slate-800 dark:bg-[#141417]">
            Aún no hay inmuebles registrados.
          </div>
        )}
      </div>
    </div>
  );
}
