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
      <article className={`group relative flex flex-col h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 ${className}`}>
        <div className={`relative w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 ${tall ? "aspect-[4/3] max-h-[28rem]" : "aspect-[16/10] max-h-72"}`}>
          {!imgLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700" />
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
            className={`absolute inset-0 h-full w-full object-cover pointer-events-none group-hover:scale-105 transition-all duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            style={{ imageRendering: "-webkit-optimize-contrast" }}
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute left-3 top-3 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white">
            {property.estado_inmueble || property.type || "Venta"}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-4 h-[60px]">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">{title}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{location}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{price}</div>
              <div className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">{property.estatus || property.status || "Disponible"}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-400">
            {property.habitaciones ? (
              <span className="rounded-full border border-slate-200 px-2 py-1 dark:border-slate-600">🛏 {property.habitaciones} hab</span>
            ) : null}
            {property.banos ? (
              <span className="rounded-full border border-slate-200 px-2 py-1 dark:border-slate-600">🛁 {property.banos} baños</span>
            ) : null}
            {property.area_m2 ? (
              <span className="rounded-full border border-slate-200 px-2 py-1 dark:border-slate-600">📐 {property.area_m2} m²</span>
            ) : null}
            {Array.isArray(property.caracteristicas) && property.caracteristicas.map((c, i) => (
              <span key={i} className="rounded-full border border-slate-200 px-2 py-1 dark:border-slate-600">
                {c.valor != null ? `${c.nombre}: ${c.valor}${c.unidad_medicion ? ` ${c.unidad_medicion}` : ""}` : c.nombre}
              </span>
            ))}
          </div>
        </div>
      </article>
    </Link>
  );
}
