import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiGet, apiPost, apiPut, apiDelete } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { formatDate } from "../../utils/date";
const fmtPrice = (n, moneda) => {
  const num = Number(n || 0);
  const m = (moneda || "USD").toUpperCase();
  const formatted = num.toLocaleString("en-US");
  if (m === "EUR") return `${formatted}€`;
  if (m === "BS") return `${formatted} Bs.`;
  return `$${formatted}`;
};
const fmtNum = (v) => {
  const n = Number(v);
  return Number.isNaN(n)
    ? v
    : Number.isInteger(n)
      ? n.toString()
      : n.toFixed(2);
};
const PLACEHOLDER_IMGS = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
];
const ESTADO_COLORS = {
  venta: "bg-emerald-500",
  alquiler_fijo: "bg-blue-500",
  vacacional: "bg-amber-500",
};
const ESTATUS_BADGE = {
  disponible:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  reservado:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  vendido: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  alquilado: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

/* ─── star rating component ─── */
function Stars({ rating, size = "w-4 h-4" }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`${size} ${
            i <= rating
              ? "text-amber-400"
              : "text-slate-300 dark:text-slate-600"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

/* ─── skeleton loader ─── */
function DetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 animate-pulse">
      {" "}
      <div className="h-5 sm:h-6 w-32 sm:w-40 bg-slate-200 rounded-lg dark:bg-slate-700 mb-4 sm:mb-6" />{" "}
      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
        {" "}
        <div className="h-56 sm:h-72 lg:h-[420px] bg-slate-200 rounded-2xl dark:bg-slate-700" />{" "}
        <div className="space-y-4">
          {" "}
          <div className="h-7 sm:h-8 w-3/4 bg-slate-200 rounded-lg dark:bg-slate-700" />{" "}
          <div className="h-5 sm:h-6 w-1/2 bg-slate-200 rounded-lg dark:bg-slate-700" />{" "}
          <div className="h-10 sm:h-12 w-1/3 bg-slate-200 rounded-lg dark:bg-slate-700" />{" "}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {" "}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 sm:h-20 bg-slate-200 rounded-xl dark:bg-slate-700"
              />
            ))}{" "}
          </div>{" "}
          <div className="h-20 sm:h-24 bg-slate-200 rounded-xl dark:bg-slate-700" />{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}

/* ══════════════════ MAIN COMPONENT ══════════════════ */
export default function InmuebleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  /* Demo fallback data
   */
  const MOCK_INMUEBLE = {
    id: id || 1,
    titulo: "Penthouse de Lujo en Piantini",
    descripcion:
      "Espectacular penthouse con vista panorámica de 360° en una de las zonas más exclusivas de Santo Domingo. Cuenta con amplios espacios sociales, cocina gourmet con isla central, acabados de mármol importado, sistema de domótica completo y terraza privada con jacuzzi. Edificio con lobby de doble altura, gimnasio, piscina infinity y seguridad 24/7.",
    tipo_inmueble: "Penthouse",
    estado_inmueble: "venta",
    estatus: "disponible",
    precio: 18500000,
    area_m2: 320,
    ciudad: "Santo Domingo",
    estado: "Santo Domingo",
    corredor_nombre: "Laura Méndez",
    corredor_id: 3,
    direccion_exacta: "Av. Abraham Lincoln esq. Gustavo Mejía Ricart",
    created_at: "2026-05-15T10:30:00Z",
    updated_at: "2026-06-20T14:00:00Z",
    latitud: 18.4738,
    longitud: -69.9399,
    google_maps_url: "https://maps.google.com/?q=18.4738,-69.9399",
  };
  const [inmueble, setInmueble] = useState(null);
  const [inmuebleCaracteristicas, setInmuebleCaracteristicas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [miResena, setMiResena] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editandoResena, setEditandoResena] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [resenas, setResenas] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onMove = (e) => {
      if (!menuRef.current) return;
      const rect = menuRef.current.getBoundingClientRect();
      const margin = 120;
      if (
        e.clientX < rect.left - margin ||
        e.clientX > rect.right + margin ||
        e.clientY < rect.top - margin ||
        e.clientY > rect.bottom + margin
      ) {
        setMenuOpen(false);
      }
    };
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [menuOpen]);
  const goToImg = (i) => {
    if (i === activeImg) return;
    setImgLoaded(false);
    setActiveImg(i);
  };
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await apiGet(`/inmuebles/${id}`);
        setInmueble(r?.data ?? r);
      } catch (e) {
        console.error("Error al cargar inmueble:", e);
        setInmueble(MOCK_INMUEBLE);
      } finally {
        setLoading(false);
      }
    })();
    (async () => {
      try {
        const rc = await apiGet(`/caracteristicas/inmueble/${id}`);
        setInmuebleCaracteristicas(Array.isArray(rc?.data) ? rc.data : []);
      } catch (e) {
        console.error("Error al cargar características:", e);
      }
    })();
  }, [id]);
  /* ─── fetch todas las reseñas ─── */
  const fetchResenas = useCallback(async () => {
    try {
      const r = await apiGet(`/resenas/inmueble/${id}`);
      setResenas(Array.isArray(r?.data) ? r.data : []);
    } catch {
      setResenas([]);
    }
  }, [id]);
  /* ─── fetch mi reseña ─── */
  const fetchMiResena = useCallback(async () => {
    if (!user?.id) { setMiResena(null); return; }
    try {
      const r = await apiGet(`/resenas/inmueble/${id}/usuario/${user.id}`);
      setMiResena(r?.data ?? null);
    } catch {
      setMiResena(null);
    }
  }, [id, user?.id]);
  useEffect(() => { fetchResenas(); fetchMiResena(); }, [fetchResenas, fetchMiResena]);
  /* ─── guardado ─── */
  const [isGuardado, setIsGuardado] = useState(false);
  useEffect(() => {
    if (!user?.id) { setIsGuardado(false); return; }
    (async () => {
      try {
        const r = await apiGet(`/guardados/${user.id}/${id}`);
        setIsGuardado(r?.data === true);
      } catch { setIsGuardado(false); }
    })();
  }, [id, user?.id]);
  const handleToggleGuardado = async () => {
    if (!user?.id) return;
    try {
      if (isGuardado) {
        await apiDelete(`/guardados/${user.id}/${id}`);
        setIsGuardado(false);
      } else {
        await apiPost("/guardados", { usuario_id: user.id, inmueble_id: Number(id) });
        setIsGuardado(true);
      }
    } catch (e) { console.error("Error al guardar/eliminar:", e); }
  };
  /* Build images array
   */
  const images = useMemo(() => {
    if (!inmueble) return PLACEHOLDER_IMGS;
    if (inmueble.imagenes && Array.isArray(inmueble.imagenes))
      return inmueble.imagenes.map((img) => img.url || img);
    if (inmueble.imagen_url) return [inmueble.imagen_url];
    return PLACEHOLDER_IMGS;
  }, [inmueble]);
  /* Location breadcrumb
   */
  const locationParts = useMemo(() => {
    if (!inmueble) return "";
    return [inmueble.ciudad, inmueble.estado].filter(Boolean).join(" · ");
  }, [inmueble]);
  /* Average rating
   */
  /* ─── loading ───
   */
  if (loading) return <DetailSkeleton />;
  if (!inmueble) return null;

  /* ─── event handlers ─── */
  const handlePrevImage = () => {
    setImgLoaded(false);
    setActiveImg((p) => (p === 0 ? images.length - 1 : p - 1));
  };
  const handleNextImage = () => {
    setImgLoaded(false);
    setActiveImg((p) => (p === images.length - 1 ? 0 : p + 1));
  };
  const handleOpenShare = () => setShareOpen(true);
  const handleCloseShare = () => setShareOpen(false);
  const handleCopyLink = () => { navigator.clipboard.writeText(shareUrl); };
  const handleOpenReview = () => setReviewOpen(true);
  const handleCloseReview = () => {
    setReviewOpen(false);
    setEditandoResena(null);
    setReviewRating(5);
    setReviewText("");
  };

  const handleToggleMenu = () => {
    setMenuOpen((p) => (p === miResena?.id ? null : miResena?.id));
  };
  const handleEditReview = () => {
    setMenuOpen(null);
    setEditandoResena(miResena);
    setReviewRating(miResena?.estrellas || 5);
    setReviewText(miResena?.comentario || "");
    setReviewOpen(true);
  };
  const handleDeleteReview = async () => {
    setMenuOpen(null);
    if (!confirm("¿Eliminar tu reseña?")) return;
    try {
      await apiDelete(`/resenas/${miResena.id}`);
      setMiResena(null);
      fetchResenas();
    } catch (e) {
      console.error("Error al eliminar reseña:", e);
    }
  };
  const handleSubmitReview = async () => {
    if (!reviewText.trim()) return;
    setReviewSaving(true);
    setReviewError("");
    try {
      if (editandoResena) {
        await apiPut(`/resenas/${editandoResena.id}`, {
          estrellas: reviewRating,
          comentario: reviewText.trim(),
        });
      } else {
        await apiPost("/resenas", {
          inmueble_id: Number(id),
          usuario_id: user?.id,
          estrellas: reviewRating,
          comentario: reviewText.trim(),
        });
      }
      setReviewOpen(false);
      setEditandoResena(null);
      setReviewRating(5);
      setReviewText("");
      fetchMiResena();
      fetchResenas();
    } catch (e) {
      setReviewError(
        e?.response?.data?.error ||
          e?.message ||
          "Error al publicar la reseña"
      );
    } finally {
      setReviewSaving(false);
    }
  };

  const estadoLabel =
    inmueble.estado_inmueble === "alquiler_fijo"
      ? "Alquiler Fijo"
      : inmueble.estado_inmueble === "vacacional"
        ? "Vacacional"
        : "Venta";
  return (
    <div className="min-h-screen pb-10 sm:pb-16">
      {/* ── breadcrumb ──
       */}{" "}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 pb-2">
        {" "}
        <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {" "}
          <Link
            to="/inmuebles"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium whitespace-nowrap"
          >
            {" "}
            ← Inmuebles{" "}
          </Link>{" "}
          <span>/</span>{" "}
          <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
            {" "}
            {inmueble.titulo || "Detalle"}{" "}
          </span>{" "}
        </nav>{" "}
      </div>
      {/* ══════════════ TOP SECTION ══════════════
       */}{" "}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 mt-2 sm:mt-4">
        {" "}
        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] lg:gap-8">
          {/* ── Image Gallery ──
           */}{" "}
          <div className="space-y-3">
            {" "}
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 aspect-[4/3] sm:aspect-[16/10] shadow-lg group">
              {/* Main image
               */}{" "}
              <img
                key={activeImg}
                src={images[activeImg]}
                alt={inmueble.titulo}
                className={`w-full h-full object-cover transition-all duration-700 ${imgLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"}`}
                onLoad={() => setImgLoaded(true)}
              />
              {/* Gradient overlay
               */}{" "}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Estado badge
               */}{" "}
              <div
                className={`absolute top-3 left-3 sm:top-4 sm:left-4 ${ESTADO_COLORS[inmueble.estado_inmueble] || "bg-slate-700"} px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold text-white shadow-lg uppercase tracking-wider`}
              >
                {" "}
                {estadoLabel}{" "}
              </div>
              {/* Estatus badge
               */}{" "}
              <div
                className={`absolute top-3 right-3 sm:top-4 sm:right-4 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold shadow-lg capitalize ${ESTATUS_BADGE[inmueble.estatus] || "bg-slate-100 text-slate-700"}`}
              >
                {" "}
                {inmueble.estatus || "Disponible"}{" "}
              </div>
              {/* Nav arrows
               */}
              {images.length > 1 && (
                <>
                  {" "}
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/80 dark:bg-slate-900/80 flex items-center justify-center shadow-lg opacity-70 sm:opacity-0 group-hover:opacity-100 transition-all active:scale-95 sm:hover:scale-110 hover:bg-white dark:hover:bg-slate-900"
                    aria-label="Anterior"
                  >
                    {" "}
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700 dark:text-slate-200"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      {" "}
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19l-7-7 7-7"
                      />{" "}
                    </svg>{" "}
                  </button>{" "}
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/80 dark:bg-slate-900/80 flex items-center justify-center shadow-lg opacity-70 sm:opacity-0 group-hover:opacity-100 transition-all active:scale-95 sm:hover:scale-110 hover:bg-white dark:hover:bg-slate-900"
                    aria-label="Siguiente"
                  >
                    {" "}
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700 dark:text-slate-200"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      {" "}
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />{" "}
                    </svg>{" "}
                  </button>{" "}
                </>
              )}
              {/* Dots
               */}
              {images.length > 1 && (
                <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
                  {" "}
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goToImg(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${i === activeImg ? "w-8 bg-white shadow-lg" : "w-2 bg-white/50 hover:bg-white/80"}`}
                      aria-label={`Imagen ${i + 1}`}
                    />
                  ))}{" "}
                </div>
              )}{" "}
            </div>
            {/* Thumbnail strip
             */}
            {images.length > 1 && (
              <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
                {" "}
                {images.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => goToImg(i)}
                    className={`flex-shrink-0 h-12 w-18 sm:h-16 sm:w-24 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all duration-200 ${i === activeImg ? "border-blue-500 shadow-md scale-105" : "border-transparent opacity-60 hover:opacity-100"}`}
                  >
                    {" "}
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                    />{" "}
                  </button>
                ))}{" "}
              </div>
            )}{" "}
          </div>
          {/* ── Info Panel ──
           */}{" "}
          <div className="flex flex-col gap-5">
            {/* Title + Location
             */}{" "}
            <div>
              {" "}
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {" "}
                {inmueble.titulo || "Sin título"}{" "}
              </h1>{" "}
              {locationParts && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  {" "}
                  <svg
                    className="h-4 w-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    {" "}
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />{" "}
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />{" "}
                  </svg>{" "}
                  {locationParts}{" "}
                </p>
              )}
              {inmueble.tipo_inmueble && (
                <span className="mt-2 inline-block rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {" "}
                  {inmueble.tipo_inmueble}{" "}
                </span>
              )}{" "}
            </div>
            {/* Price
             */}{" "}
            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 sm:p-5 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:to-slate-800">
              {" "}
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {" "}
                Precio{" "}
              </div>{" "}
              <div className="mt-1 text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                {" "}
                {fmtPrice(inmueble.precio, inmueble.moneda)}{" "}
              </div>{" "}
              {inmueble.estado_inmueble !== "venta" && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  /mes
                </span>
              )}{" "}
            </div>
            {/* Agent card
             */}
            {inmueble.corredor_nombre && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                {" "}
                <div className="flex items-center gap-3">
                  {" "}
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-md">
                    {" "}
                    {inmueble.corredor_nombre
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}{" "}
                  </div>{" "}
                  <div className="min-w-0">
                    {" "}
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {" "}
                      {inmueble.corredor_nombre}{" "}
                    </div>{" "}
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {" "}
                      Corredor asignado{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>
            )}
            {/* Actions
             */}{" "}
            <div className="flex flex-wrap gap-2">
              {" "}
              {(user !== null && user.rol !== "admin") && (
                <button
                  onClick={handleToggleGuardado}
                  className={`btn-secondary flex items-center gap-1.5 sm:gap-2 text-xs flex-1 justify-center ${isGuardado ? "text-red-500" : ""}`}
                >
                  <svg
                    className="h-4 w-4"
                    fill={isGuardado ? "currentColor" : "none"}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  {isGuardado ? "Guardado" : "Guardar"}
                </button>
              )}
              <button
                onClick={handleOpenShare}
                className="btn-secondary flex items-center gap-1.5 sm:gap-2 text-xs flex-1 justify-center"
              >
                {" "}
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {" "}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />{" "}
                </svg>{" "}
                Compartir{" "}
              </button>{" "}
            </div>

            {(user?.rol !== "admin" && user?.id !== inmueble.corredor_id && user !== null ) && (
              
              <button className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all">
                Realizar pago
              </button>
            
            )}

          </div>{" "}
        </div>{" "}
      </div>
      {/* ══════════════ MIDDLE SECTION ══════════════*/}
      {" "}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 mt-6 sm:mt-10">
        {" "}
        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] lg:gap-8">
          {/* Left column
           */}{" "}
          <div className="space-y-5 sm:space-y-8">
            {" "}
            {inmueble.descripcion ? (
              <section className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                {" "}
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {" "}
                  <svg
                    className="h-5 w-5 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    {" "}
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />{" "}
                  </svg>{" "}
                  Descripción{" "}
                </h2>{" "}
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">
                  {" "}
                  {inmueble.descripcion}{" "}
                </p>{" "}
              </section>
            ) : null}
            {/* Detalles table */}
            <section className="rounded-xl sm:rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.012)] dark:border-slate-800/60 dark:bg-[#141417] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Detalles del inmueble
              </h2>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Cluster 1: Clasificación */}
                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-550 font-extrabold">Clasificación</h3>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-slate-450 dark:text-slate-500 font-semibold">Categoría</span>
                      <span className="text-sm font-bold text-slate-850 dark:text-slate-200">{inmueble.tipo_inmueble || "-"}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-slate-450 dark:text-slate-500 font-semibold">Tipo de Negocio</span>
                      <span className="text-sm font-bold text-slate-850 dark:text-slate-200">{estadoLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Cluster 2: Ubicación */}
                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-550 font-extrabold">Ubicación</h3>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-slate-450 dark:text-slate-500 font-semibold">Ciudad</span>
                      <span className="text-sm font-bold text-slate-850 dark:text-slate-200">{inmueble.ciudad || "-"}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-slate-450 dark:text-slate-500 font-semibold">Estado / Provincia</span>
                      <span className="text-sm font-bold text-slate-850 dark:text-slate-200">{inmueble.estado || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Cluster 3: Especificaciones Clave */}
                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-550 font-extrabold">Dimensión & Estatus</h3>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-slate-450 dark:text-slate-500 font-semibold">Área Construida</span>
                      <span className="text-sm font-bold text-slate-850 dark:text-slate-200">{inmueble.area_m2 ? `${inmueble.area_m2} m²` : "-"}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-slate-450 dark:text-slate-500 font-semibold">Estatus del Inmueble</span>
                      <span className="text-sm font-bold text-slate-850 dark:text-slate-200 capitalize">{inmueble.estatus || "Disponible"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* Amenities / Features
             */}{" "}
            <section className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              {" "}
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {" "}
                <svg
                  className="h-5 w-5 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {" "}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />{" "}
                </svg>{" "}
                Características{" "}
              </h2>{" "}
              {inmuebleCaracteristicas.length > 0 ? (
                <div className="mt-3 sm:mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {" "}
                  {inmuebleCaracteristicas.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-slate-100 bg-slate-50 px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300"
                    >
                      {" "}
                      <svg
                        className="h-4 w-4 text-emerald-500 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        {" "}
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />{" "}
                      </svg>{" "}
                      <span>
                        {c.nombre}
                        {c.valor ? `: ${fmtNum(c.valor)}` : ""}
                        {c.unidad_medicion ? ` ${c.unidad_medicion}` : ""}
                      </span>{" "}
                    </div>
                  ))}{" "}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">
                  Sin características registradas
                </p>
              )}{" "}
            </section>{" "}
          </div>
          {/* Right column - Map + Extras
           */}{" "}
          <div className="space-y-6">
            {/* Map
             */}{" "}
            <section className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              {" "}
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                {" "}
                <svg
                  className="h-5 w-5 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {" "}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />{" "}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />{" "}
                </svg>{" "}
                Ubicación{" "}
              </h2>{" "}
              <div className="h-48 sm:h-64 rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700">
                {" "}
                {inmueble.latitud && inmueble.longitud ? (
                  <iframe
                    title="Ubicación del inmueble"
                    className="h-full w-full rounded-xl"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(inmueble.longitud) - 0.01}%2C${Number(inmueble.latitud) - 0.01}%2C${Number(inmueble.longitud) + 0.01}%2C${Number(inmueble.latitud) + 0.01}&layer=mapnik&marker=${inmueble.latitud}%2C${inmueble.longitud}`}
                  />
                ) : (
                  <iframe
                    title="Mapa general"
                    className="h-full w-full rounded-xl"
                    src="https://www.openstreetmap.org/export/embed.html?bbox=-71.2%2C18.2%2C-69.5%2C19.1&layer=mapnik"
                  />
                )}{" "}
              </div>{" "}
              {(inmueble.direccion_exacta || inmueble.punto_referencia) && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {" "}
                  📍 {inmueble.direccion_exacta}{inmueble.punto_referencia ? `. ${inmueble.punto_referencia}` : ""}{" "}
                </p>
              )}
              {inmueble.google_maps_url && (
                <a
                  href={inmueble.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {" "}
                  Ver en Google Maps →{" "}
                </a>
              )}{" "}
            </section>{" "}
          </div>{" "}
        </div>{" "}
      </div>
      {/* ══════════════ REVIEWS SECTION ══════════════ */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 mt-8 sm:mt-12">
        <section className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 md:p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <svg
                  className="h-6 w-6 text-amber-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Reseñas y opiniones
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Lo que opinan los visitantes sobre esta propiedad
              </p>
            </div>

            {!miResena && user?.id !== inmueble.corredor_id && (
              <button
                onClick={handleOpenReview}
                className="btn-primary text-sm self-start"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Escribir reseña
              </button>
            )}
          </div>

          {/* Average rating */}
          <div className="mt-4 sm:mt-6 flex justify-center rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-5 sm:p-6 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800/30">
            <div className="text-center">
              <div className="text-5xl sm:text-6xl font-extrabold text-amber-600 dark:text-amber-400">
                {inmueble.promedio_estrellas}
              </div>
              <div className="mt-2">
                <Stars rating={inmueble.promedio_estrellas} size="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
            </div>
          </div>

          {/* Mi reseña */}
          {miResena && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Tu reseña
              </h3>
              <article className="relative rounded-lg sm:rounded-xl border border-blue-200 bg-blue-50/50 p-3 sm:p-5 dark:border-blue-800/40 dark:bg-blue-900/20">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
                    {(miResena.usuario_nombre || user?.nombre || "A")
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">
                        {miResena.usuario_nombre || user?.nombre || "Tú"}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          {miResena.fecha_publicacion
                            ? formatDate(miResena.fecha_publicacion)
                            : ""}
                        </div>
                        {/* Kebab menu */}
                        <div
                          ref={menuRef}
                          className="relative"
                        >
                          <button
                            onClick={handleToggleMenu}
                            className="h-7 w-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 dark:hover:text-slate-300 dark:hover:bg-slate-700/50"
                          >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M3 9.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                            </svg>
                          </button>
                          {menuOpen === miResena.id && (
                            <div className="absolute right-0 top-full mt-1 z-50 w-36 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800">
                              <button
                                onClick={handleEditReview}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Editar
                              </button>
                              <button
                                onClick={handleDeleteReview}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Stars rating={miResena.estrellas || 0} size="w-3.5 h-3.5" />
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {miResena.comentario}
                    </p>
                  </div>
                </div>
              </article>
            </div>
          )}

          {/* Todas las reseñas */}
          {resenas.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {resenas.length} {resenas.length === 1 ? "opinión" : "opiniones"}
              </h3>
              <div className="space-y-3">
                {resenas
                  .filter((r) => r.usuario_id !== user?.id)
                  .map((resena) => (
                    <article
                      key={resena.id}
                      className="rounded-lg sm:rounded-xl border border-slate-100 bg-slate-50/50 p-3 sm:p-4 dark:border-slate-700 dark:bg-slate-800/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-400 to-slate-500 text-[10px] font-bold text-white shadow-sm">
                          {(resena.usuario_nombre || "A")
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                            <div className="font-semibold text-slate-900 dark:text-white text-sm">
                              {resena.usuario_nombre}
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-500">
                              {resena.fecha_publicacion
                                ? formatDate(resena.fecha_publicacion)
                                : ""}
                            </div>
                          </div>
                          <Stars rating={resena.estrellas || 0} size="w-3.5 h-3.5" />
                          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            {resena.comentario}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
            </div>
          )}
        </section>
      </div>
      {/* ── Review Modal ── */}
      {reviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <div
            className="w-full max-w-md mx-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800 max-h-[85vh] overflow-y-auto scrollbar-custom"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editandoResena ? "Editar reseña" : "Escribir reseña"}
              </h3>
              <button
                onClick={handleCloseReview}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Star rating */}
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Puntuación
                </p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <svg
                        className={`h-8 w-8 ${
                          star <= reviewRating
                            ? "text-amber-400"
                            : "text-slate-300 dark:text-slate-600"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Review text */}
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tu opinión
                </p>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Comparte tu experiencia con esta propiedad..."
                  rows={4}
                  maxLength={500}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder-slate-500 resize-none"
                />
                <div className="mt-1 text-right text-xs text-slate-400 dark:text-slate-500">
                  {reviewText.length}/500
                </div>
              </div>

              {reviewError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  {reviewError}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={handleCloseReview}
                  className="btn-secondary text-sm"
                >
                  Cerrar
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={reviewSaving}
                  className="btn-primary text-sm"
                >
                  {reviewSaving
                    ? "Publicando…"
                    : editandoResena
                      ? "Guardar cambios"
                      : "Publicar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Share Modal ──
       */}
      {shareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          {" "}
          <div
            className="w-full max-w-md mx-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800 max-h-[85vh] overflow-y-auto scrollbar-custom"
          >
            {" "}
            <div className="flex items-center justify-between mb-4">
              {" "}
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Compartir propiedad
              </h3>{" "}
              <button
                onClick={handleCloseShare}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700"
              >
                {" "}
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {" "}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />{" "}
                </svg>{" "}
              </button>{" "}
            </div>{" "}
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              {" "}
              Copia el enlace para compartir esta propiedad:{" "}
            </p>{" "}
            <div className="flex gap-2">
              {" "}
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                onFocus={(e) => e.target.select()}
              />{" "}
              <button
                onClick={handleCopyLink}
                className="btn-primary text-sm whitespace-nowrap"
              >
                {" "}
                Copiar{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}{" "}
    </div>
  );
}
