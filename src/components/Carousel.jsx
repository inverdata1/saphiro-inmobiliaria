import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

// Ancho fijo de cada tarjeta dentro del carrusel. Un ancho fijo (en vez de %) hace
// predecible el scroll-snap y evita que las tarjetas se deformen según el viewport.
export const CAROUSEL_SLIDE = "w-[240px] shrink-0 snap-start sm:w-[280px] lg:w-[320px]";

export default function Carousel({
  title,
  subtitle,
  seeAllTo,
  seeAllLabel = "Ver todas",
  loading = false,
  items = [],
  renderItem,
  getKey = (item, i) => item?.id ?? item?.inmueble_id ?? i,
  skeletonCount = 4,
  prevLabel = "Anterior",
  nextLabel = "Siguiente",
}) {
  const scrollerRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(max <= 4 || el.scrollLeft >= max - 4);
  }, []);

  useEffect(() => {
    updateEdges();
  }, [items, loading, updateEdges]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateEdges]);

  function scrollByPage(dir) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.9), behavior: "smooth" });
  }

  // No renderizar secciones sin resultados (sí mientras carga, para mostrar el skeleton).
  if (!loading && items.length === 0) return null;

  const arrowBtn =
    "flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {seeAllTo ? (
            <Link
              to={seeAllTo}
              className="hidden text-sm font-semibold text-slate-900 underline underline-offset-4 dark:text-white sm:inline"
            >
              {seeAllLabel}
            </Link>
          ) : null}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              disabled={loading || atStart}
              aria-label={prevLabel}
              className={arrowBtn}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              disabled={loading || atEnd}
              aria-label={nextLabel}
              className={arrowBtn}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollerRef}
        onScroll={updateEdges}
        className="mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {loading
          ? Array.from({ length: skeletonCount }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className={`${CAROUSEL_SLIDE} h-80 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800`}
              />
            ))
          : items.map((item, i) => (
              <div key={getKey(item, i)} className={CAROUSEL_SLIDE}>
                {renderItem(item, i)}
              </div>
            ))}
      </div>
    </section>
  );
}
