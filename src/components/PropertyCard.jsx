import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function PropertyCard({ property, className = "", tall = false }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const price = useMemo(() => {
    if (!property) return "";
    const num = Number(property.precio ?? property.price ?? 0);
    const moneda = (property.moneda || "USD").toUpperCase();
    const formatted = num.toLocaleString("en-US");
    if (moneda === "EUR") return `${formatted}€`;
    if (moneda === "BS") return `${formatted} Bs.`;
    return `$${formatted}`;
  }, [property]);

  const title = property.titulo || property.title || "Sin título";
  const location = [property.ciudad, property.sector]
    .filter(Boolean)
    .join(" · ");

  const propertyId = property.id ?? property._id;

  const imageUrl = useMemo(() => {
    const raw = property.imagen_url || property.image;
    if (!raw) return "https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&w=1200&q=80";
    if (raw.includes("/imagenes/file/")) {
      const id = raw.split("/").pop();
      return `/imagenes/optimized/${id}?w=800&q=80`;
    }
    return raw;
  }, [property.imagen_url, property.image]);

  return (
    <Link
      to={propertyId ? `/inmuebles/${propertyId}` : "#"}
      className="block no-underline h-full"
    >
      <article className={`group relative flex flex-col h-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:border-slate-800/60 dark:bg-[#141417] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] ${className}`}>
        {/* Image Container */}
        <div className={`relative w-full overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 ${tall ? "aspect-[4/3] max-h-[28rem]" : "aspect-[16/10] max-h-72"}`}>
          {!imgLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900" />
          )}
          <img
            src={imageUrl}
            srcSet={
              imageUrl.includes("unsplash")
                ? "https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&w=600&q=80 600w, https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&w=1200&q=80 1200w"
                : undefined
            }
            sizes="(max-width: 640px) 100vw, 50vw"
            alt={title}
            draggable="false"
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            className={`absolute inset-0 h-full w-full object-cover pointer-events-none group-hover:scale-103 transition-all duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            style={{ imageRendering: "-webkit-optimize-contrast" }}
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
          
          {/* Tag */}
          <div className="absolute left-4 top-4 rounded-full bg-black/60 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold text-white uppercase tracking-wider">
            {property.estado_inmueble || property.type || "Venta"}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 flex-col justify-between p-5 gap-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 line-clamp-2 tracking-tight leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                  {title}
                </h3>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 truncate flex items-center gap-1">
                  <svg className="h-3 w-3 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {location}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-base font-extrabold text-slate-900 dark:text-slate-50 tracking-tight" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {price}
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-50/70 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  {property.estatus || property.status || "Disponible"}
                </span>
              </div>
            </div>
          </div>

          {/* Features badge list */}
          <div className="flex flex-wrap gap-1.5 text-xs text-slate-600 dark:text-slate-450 border-t border-slate-100 dark:border-slate-800/60 pt-3">
            {property.habitaciones ? (
              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50/50 px-2 py-1 dark:border-slate-800/60 dark:bg-slate-900/40">
                <svg className="h-3.5 w-3.5 text-blue-500 dark:text-blue-450" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10V19M21 10V19M3 14H21M3 10H21M6 6H18V10H6V6Z" />
                </svg>
                <span>{property.habitaciones} hab</span>
              </span>
            ) : null}
            {property.banos ? (
              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50/50 px-2 py-1 dark:border-slate-800/60 dark:bg-slate-900/40">
                <svg className="h-3.5 w-3.5 text-blue-500 dark:text-blue-450" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4V16C4 17.1046 4.89543 18 6 18H18C19.1046 18 20 17.1046 20 16V4M2 8H22" />
                </svg>
                <span>{property.banos} baños</span>
              </span>
            ) : null}
            {property.area_m2 ? (
              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50/50 px-2 py-1 dark:border-slate-800/60 dark:bg-slate-900/40">
                <svg className="h-3.5 w-3.5 text-blue-500 dark:text-blue-450" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 19L20 3M8 15l2 2M11 12l2 2M14 9l2 2M17 6l2 2" />
                </svg>
                <span>{property.area_m2} m²</span>
              </span>
            ) : null}
            {Array.isArray(property.caracteristicas) && property.caracteristicas.slice(0, 2).map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50/50 px-2 py-1 dark:border-slate-800/60 dark:bg-slate-900/40">
                {c.valor != null ? `${c.nombre}: ${c.valor}${c.unidad_medicion ? ` ${c.unidad_medicion}` : ""}` : c.nombre}
              </span>
            ))}
          </div>
        </div>
      </article>
    </Link>
  );
}
