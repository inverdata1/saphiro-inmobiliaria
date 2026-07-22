import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet } from "../api";
import PropertyCard from "../components/PropertyCard";
import ErrorBanner from "../components/ErrorBanner";
// Carousel Component
function PropertyCarousel({ title, subtitle, properties, loading }) {
  const containerRef = useRef(null);
  const scroll = (direction) => {
    if (containerRef.current) {
      const scrollAmount = containerRef.current.offsetWidth * 0.75;
      containerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };
  return (
    <div className="relative my-10 px-1">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll("right")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Siguiente"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      {loading ? (
        <div className="flex gap-6 overflow-hidden py-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-80 w-[290px] sm:w-[350px] flex-shrink-0 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-850"
            />
          ))}
        </div>
      ) : properties.length ? (
        <div
          ref={containerRef}
          className="flex gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory py-2 px-1"
          style={{ scrollbarWidth: "none" }}
        >
          {properties.map((p) => (
            <div
              key={p.id || p._id || p.titulo}
              className="w-[290px] sm:w-[350px] flex-shrink-0 snap-start"
            >
              <PropertyCard property={p} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          No hay propiedades disponibles en esta categoría.
        </div>
      )}
    </div>
  );
}
export default function InicioPage() {
  const navigate = useNavigate();
  const gridSectionRef = useRef(null);
  // States
  const [inmuebles, setInmuebles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tipos, setTipos] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  // Grid filter states
  const [gridFilters, setGridFilters] = useState({
    transaccion: "",
    tipoId: "",
    ciudadId: "",
    search: "",
    minPrecio: "",
    maxPrecio: "",
    ordenar: "newest",
  });
  useEffect(() => {
    window.scrollTo(0, 0);
    loadAll();
  }, []);
  async function loadAll() {
    setLoading(true);
    setErr("");
    try {
      // 1. Fetch properties
      const res = await apiGet("/inmuebles", { limit: 100 });
      const data = res?.data ?? res ?? [];
      setInmuebles(Array.isArray(data) ? data : []);

    } catch (e) {
      setErr("Ocurrió un error al cargar la información de inmuebles.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }
  // Filter properties in-memory for carousels
  const featuredInmuebles = inmuebles
    .filter((p) => p.estatus === "disponible")
    .sort((a, b) => Number(b.precio || 0) - Number(a.precio || 0))
    .slice(0, 8);
  const ventaInmuebles = inmuebles
    .filter((p) => p.estado_inmueble?.toLowerCase() === "venta" || p.estado_inmueble?.toLowerCase() === "en venta");
  const alquilerInmuebles = inmuebles
    .filter((p) => {
      const st = p.estado_inmueble?.toLowerCase() || "";
      return st.includes("alquiler") || st.includes("vacacional");
    });
  // Filtered properties for the grid section
  const filteredGridInmuebles = inmuebles.filter((p) => {
    // 1. Transaction filter (venta, alquiler_fijo, vacacional)
    if (gridFilters.transaccion) {
      const type = p.estado_inmueble?.toLowerCase() || "";
      if (gridFilters.transaccion === "venta" && !type.includes("venta")) return false;
      if (gridFilters.transaccion === "alquiler" && !type.includes("alquiler") && !type.includes("vacacional")) return false;
    }
    // 2. Category/Tipo filter
    if (gridFilters.tipoId) {
      if (Number(p.tipo_inmueble_id) !== Number(gridFilters.tipoId)) return false;
    }
    // 3. Ciudad filter
    if (gridFilters.ciudadId) {
      if (Number(p.ciudad_id) !== Number(gridFilters.ciudadId)) return false;
    }
    // 4. Search text (matches title, description, or location/sector)
    if (gridFilters.search) {
      const q = gridFilters.search.toLowerCase();
      const matchTitle = (p.titulo || "").toLowerCase().includes(q);
      const matchDesc = (p.descripcion || "").toLowerCase().includes(q);
      const matchSector = (p.sector || "").toLowerCase().includes(q);
      const matchCiudad = (p.ciudad || "").toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchSector && !matchCiudad) return false;
    }
    // 5. Min price
    if (gridFilters.minPrecio) {
      if (Number(p.precio || 0) < Number(gridFilters.minPrecio)) return false;
    }
    // 6. Max price
    if (gridFilters.maxPrecio) {
      if (Number(p.precio || 0) > Number(gridFilters.maxPrecio)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (gridFilters.ordenar === "price_asc") {
      return Number(a.precio || 0) - Number(b.precio || 0);
    }
    if (gridFilters.ordenar === "price_desc") {
      return Number(b.precio || 0) - Number(a.precio || 0);
    }
    // Default: newest (assuming larger id is newer)
    return (b.id || 0) - (a.id || 0);
  });
  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-16">
      {/* HERO SECTION */}
      <section className="relative h-[500px] flex items-center justify-center bg-slate-950 text-white overflow-hidden">
        {/* Background photo */}
        <div className="absolute inset-0 z-0">
          <img
            src="/BackgroundImage.avif"
            alt="Luxury Home"
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
        </div>
        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20 backdrop-blur-md mb-4">
            Encuentra tu lugar ideal
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Descubre el espacio de <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">tus sueños</span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-350 max-w-2xl mx-auto dark:text-slate-350 text-slate-200">
            Casas exclusivas, apartamentos modernos y villas paradisíacas con la seguridad, respaldo y profesionalismo que te mereces.
          </p>
        </div>
      </section>
      {/* ERROR BANNER */}
      {err && <div className="max-w-7xl mx-auto px-4 mt-6"><ErrorBanner message={err} onClose={() => setErr("")} /></div>}
      {/* MAIN CAROUSELS CONTENT */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        {/* CAROUSEL 1: DESTACADOS */}
        <PropertyCarousel
          title={
            <span className="flex items-center gap-2">
              <svg className="h-6 w-6 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Propiedades Destacadas
            </span>
          }
          subtitle="Una selección exclusiva de nuestros inmuebles premium disponibles"
          properties={featuredInmuebles}
          loading={loading}
        />
        {/* CAROUSEL 2: EN VENTA */}
        <PropertyCarousel
          title={
            <span className="flex items-center gap-2">
              <svg className="h-6 w-6 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6z" />
              </svg>
              Propiedades en Venta
            </span>
          }
          subtitle="Encuentra tu próximo hogar permanente o tu siguiente gran inversión"
          properties={ventaInmuebles}
          loading={loading}
        />
        {/* CAROUSEL 3: EN ALQUILER */}
        <PropertyCarousel
          title={
            <span className="flex items-center gap-2">
              <svg className="h-6 w-6 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m-5 4a3 3 0 100-6 3 3 0 000 6zm-7 8a6 6 0 0112 0H3z" />
              </svg>
              Propiedades en Alquiler
            </span>
          }
          subtitle="Opciones de alquiler residencial y propiedades vacacionales ideales"
          properties={alquilerInmuebles}
          loading={loading}
        />
      </section>
      {/* GRID (CUADRICULA) SECTION */}
      <section
        ref={gridSectionRef}
        id="explorar"
        className="max-w-7xl mx-auto px-4 py-10 border-t border-slate-200 dark:border-slate-800"
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              Explorar Catálogo Completo
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Clear Filters Button */}
            {(gridFilters.transaccion ||
              gridFilters.tipoId ||
              gridFilters.ciudadId ||
              gridFilters.search ||
              gridFilters.minPrecio ||
              gridFilters.maxPrecio) && (
                <button
                  onClick={() =>
                    setGridFilters({
                      transaccion: "",
                      tipoId: "",
                      ciudadId: "",
                      search: "",
                      minPrecio: "",
                      maxPrecio: "",
                      ordenar: "newest",
                    })
                  }
                  className="text-xs font-semibold text-red-500 hover:text-red-600 transition underline mr-2"
                >
                  Limpiar filtros
                </button>
              )}
          </div>
        </div>
        {/* Cuadrícula real */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : filteredGridInmuebles.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredGridInmuebles.map((p) => (
              <div key={p.id || p._id || p.titulo} className="h-full">
                <PropertyCard property={p} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-350 dark:text-slate-650 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-350">
              No se encontraron propiedades
            </h3>
            <p className="text-sm mt-1">
              Intenta cambiar los filtros seleccionados o limpiar la búsqueda para ver más inmuebles.
            </p>
            <button
              onClick={() =>
                setGridFilters({
                  transaccion: "",
                  tipoId: "",
                  ciudadId: "",
                  search: "",
                  minPrecio: "",
                  maxPrecio: "",
                  ordenar: "newest",
                })
              }
              className="btn-primary mt-4 py-1.5 text-xs"
            >
              Restablecer todo
            </button>
          </div>
        )}
      </section>
    </div>
  );
}