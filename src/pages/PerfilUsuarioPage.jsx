import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiGet } from "../api";
import { useAuth } from "../context/useAuth";
import PropertyCard from "../components/PropertyCard";
import ShareModal from "../components/ShareModal";
import SocialIcon from "../utils/socialIcons.jsx";

export default function PerfilUsuarioPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [usuario, setUsuario] = useState(null);
  const [corredorInfo, setCorredorInfo] = useState(null);
  const [inmuebles, setInmuebles] = useState([]);
  const [redesSociales, setRedesSociales] = useState([]);
  const [telefonosData, setTelefonosData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        // 1. Obtener datos del usuario
        let userData = null;
        try {
          const userRes = await apiGet(`/usuarios/${id}`);
          userData = userRes?.data || userRes;
        } catch {
          // Si no está logueado o falla, construir datos base
          userData = {
            id: Number(id),
            nombre: "Corredor Inmobiliario",
            email: "contacto@inverdata.com",
            rol: "corredor",
            fecha_registro: new Date().toISOString(),
          };
        }

        // 2. Obtener datos de corredor si aplica
        let corrData = null;
        try {
          const corrRes = await apiGet(`/corredores/${id}`);
          corrData = corrRes?.data || corrRes;
        } catch {
          corrData = null;
        }

        // 3. Obtener inmuebles asociados al corredor
        let inmueblesData = [];
        try {
          const inmobRes = await apiGet(`/inmuebles/corredor/${id}`);
          inmueblesData = Array.isArray(inmobRes?.data) ? inmobRes.data : Array.isArray(inmobRes) ? inmobRes : [];
        } catch {
          inmueblesData = [];
        }

        // 4. Obtener redes sociales del corredor (público)
        let redesData = [];
        try {
          const redesRes = await apiGet(`/corredores/${id}/redes-sociales`);
          redesData = Array.isArray(redesRes?.data) ? redesRes.data : Array.isArray(redesRes) ? redesRes : [];
        } catch {
          redesData = [];
        }

        // 5. Obtener teléfonos del corredor (público)
        let telefonosRes = [];
        try {
          const telRes = await apiGet(`/corredores/${id}/telefonos`);
          telefonosRes = Array.isArray(telRes?.data) ? telRes.data : Array.isArray(telRes) ? telRes : [];
        } catch {
          telefonosRes = [];
        }

        if (isMounted) {
          setUsuario(userData);
          setCorredorInfo(corrData);
          setInmuebles(inmueblesData);
          setRedesSociales(redesData);
          setTelefonosData(telefonosRes);
        }
      } catch (error) {
        console.error("Error al cargar perfil de usuario:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Nombre completo y foto
  const nombreCompleto = useMemo(() => {
    if (!usuario) return "Usuario";
    if (usuario.apellido) return `${usuario.nombre} ${usuario.apellido}`.trim();
    return usuario.nombre || "Usuario";
  }, [usuario]);

  const initials = useMemo(() => {
    return nombreCompleto
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "US";
  }, [nombreCompleto]);

  const esCorredor = usuario?.rol === "corredor" || !!corredorInfo;
  const esMiPropioPerfil = currentUser && Number(currentUser.id) === Number(id);

  // Teléfonos del corredor (todos)
  const telefonos = useMemo(() => {
    if (Array.isArray(telefonosData) && telefonosData.length) {
      return telefonosData.map((t) => t.nro_telefono).filter(Boolean);
    }
    if (Array.isArray(corredorInfo?.telefonos)) return corredorInfo.telefonos.filter(Boolean);
    if (usuario?.telefono) return [usuario.telefono];
    return [];
  }, [telefonosData, corredorInfo, usuario]);

  // Filtrado de inmuebles
  const inmueblesFiltrados = useMemo(() => {
    return inmuebles.filter((inm) => {
      // Filtro por tipo de negocio
      const tipo = (inm.estado_inmueble || "").toLowerCase();
      if (filtroTipo === "venta" && !tipo.includes("venta")) return false;
      if (filtroTipo === "alquiler" && !tipo.includes("alquiler") && !tipo.includes("fijo")) return false;
      if (filtroTipo === "vacacional" && !tipo.includes("vacacional")) return false;

      // Filtro por búsqueda
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const titulo = (inm.titulo || "").toLowerCase();
        const ciudad = (inm.ciudad || "").toLowerCase();
        const estado = (inm.estado || "").toLowerCase();
        const tipoInm = (inm.tipo_inmueble || "").toLowerCase();
        if (!titulo.includes(q) && !ciudad.includes(q) && !estado.includes(q) && !tipoInm.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [inmuebles, filtroTipo, busqueda]);

  // Conteos
  const conteoVenta = inmuebles.filter((i) => (i.estado_inmueble || "").toLowerCase().includes("venta")).length;
  const conteoAlquiler = inmuebles.filter((i) => (i.estado_inmueble || "").toLowerCase().includes("alquiler")).length;
  const conteoVacacional = inmuebles.filter((i) => (i.estado_inmueble || "").toLowerCase().includes("vacacional")).length;

  const handleCopiarEnlace = () => setShareOpen(true);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/70 dark:bg-[#0c0c0e] py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Barra superior de navegación */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-purple-900 dark:hover:text-purple-400 transition-colors cursor-pointer group"
          >
            <span className="p-1.5 rounded-lg bg-white dark:bg-[#18181c] border border-slate-200 dark:border-slate-800 group-hover:border-purple-400 transition-all shadow-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </span>
            <span>Volver</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopiarEnlace}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18181c] text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-purple-300 dark:hover:border-purple-700 transition cursor-pointer shadow-xs"
            >
              <svg className="w-3.5 h-3.5 text-purple-850 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Compartir perfil</span>
            </button>

            {esMiPropioPerfil && (
              <Link
                to="/perfil"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs"
                style={{ backgroundColor: "#5a0e82" }}
              >
                Editar mi perfil
              </Link>
            )}
          </div>
        </div>

        {/* Tarjeta Hero Principal del Perfil */}
        <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-[#141417] border border-slate-200/80 dark:border-slate-800/80 shadow-md">
          {/* Banner de encabezado morado institucional */}
          <div className="h-28 sm:h-36 bg-gradient-to-r from-[#36074f] via-[#470A68] to-[#5a0e82] relative">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          </div>

          {/* Contenido del Perfil */}
          <div className="px-6 sm:px-10 pb-8 -mt-6 sm:-mt-8 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              
              {/* Avatar + Nombre + Título */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                
                {/* Avatar circular */}
                <div className="relative">
                  {loading ? (
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-slate-200 dark:bg-slate-700/60 animate-pulse border-4 border-white dark:border-[#141417]" />
                  ) : (
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-gradient-to-br from-[#470A68] to-[#5a0e82] text-white flex items-center justify-center text-3xl sm:text-4xl font-black shadow-xl border-4 border-white dark:border-[#141417]">
                      {usuario?.foto_perfil || usuario?.foto_url || usuario?.avatar ? (
                        <img
                          src={usuario.foto_perfil || usuario.foto_url || usuario.avatar}
                          alt={nombreCompleto}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Datos del usuario */}
                {loading ? (
                  <div className="space-y-2.5 pb-1">
                    <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700/60 rounded-lg animate-pulse" />
                    <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700/60 rounded-lg animate-pulse" />
                  </div>
                ) : (
                  <div className="space-y-1.5 pb-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {nombreCompleto}
                      </h1>
                      {corredorInfo?.licencia_nro && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          Lic. {corredorInfo.licencia_nro}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-purple-900 dark:text-purple-400">
                      {esCorredor ? "Corredor Inmobiliario Autorizado" : usuario?.rol === "admin" ? "Administrador del Sistema" : "Cliente de Saphiro Inmobiliaria"}
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Fila informativa de contacto (Teléfono y Correo) */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {loading ? (
                <>
                  {/* Skeleton Correo */}
                  <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#18181c] border border-slate-100 dark:border-slate-800/60">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700/60 animate-pulse shrink-0" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700/60 rounded animate-pulse" />
                      <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700/60 rounded animate-pulse" />
                    </div>
                  </div>

                  {/* Skeleton Teléfono */}
                  <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#18181c] border border-slate-100 dark:border-slate-800/60">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700/60 animate-pulse shrink-0" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700/60 rounded animate-pulse" />
                      <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700/60 rounded animate-pulse" />
                    </div>
                  </div>
                </>
              ) : (
                <>              
                  {/* Tarjeta Correo */}
                  <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#18181c] border border-slate-100 dark:border-slate-800/60">
                    <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-[#470A68] dark:text-purple-300">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Correo Electrónico</div>
                      <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate block">
                        {usuario?.email || "No especificado"}
                      </span>
                    </div>
                  </div>

                  {/* Tarjeta Teléfono (solo corredores) */}
                  {esCorredor && (
                    <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#18181c] border border-slate-100 dark:border-slate-800/60">
                      <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-[#470A68] dark:text-purple-300">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Teléfonos de Contacto</div>
                        {telefonos.length > 0 ? (
                          <div className="space-y-0.5">
                            {telefonos.map((t, i) => (
                              <span key={i} className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate block">
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-500 truncate block">
                            No especificado
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Redes Sociales del Corredor */}
            {loading && esCorredor ? (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80">
                <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700/60 rounded animate-pulse mb-3" />
                <div className="flex flex-wrap gap-2.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 w-24 bg-slate-200 dark:bg-slate-800/60 rounded-xl animate-pulse" />
                  ))}
                </div>
              </div>
            ) : (
              esCorredor && redesSociales.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                    Redes Sociales
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {redesSociales.map((rs) => (
                      <a
                        key={rs.id}
                        href={/^https?:\/\//i.test(rs.url) ? rs.url : `https://${rs.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`${rs.nombre}: ${rs.url}`}
                        className="inline-flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#18181c] border border-slate-100 dark:border-slate-800/60 hover:border-purple-300 dark:hover:border-purple-700 transition-colors group"
                      >
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: "#5a0e82" }}
                        >
                          <SocialIcon name={rs.name_icon} size={16} />
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {rs.nombre}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )
            )}

          </div>
        </div>

        {/* Sección de Inmuebles Asociados al Corredor */}
        <div className="space-y-6">
          
          {loading ? (
            <>
              {/* Skeleton cabecera + filtros */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="h-8 w-52 bg-slate-200 dark:bg-slate-700/60 rounded-lg animate-pulse" />
                  <div className="h-4 w-72 bg-slate-200 dark:bg-slate-700/60 rounded animate-pulse" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 w-24 bg-slate-200 dark:bg-slate-800/60 rounded-xl animate-pulse" />
                  ))}
                </div>
              </div>

              {/* Skeleton buscador */}
              <div className="h-9 w-full max-w-md bg-slate-200 dark:bg-slate-700/60 rounded-xl animate-pulse" />

              {/* Skeleton grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse rounded-2xl h-80 bg-slate-200 dark:bg-slate-800/60" />
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Cabecera de Inmuebles + Filtros y Buscador */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Inmuebles Asociados
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Explora las propiedades gestionadas por {nombreCompleto}.
                  </p>
                </div>

                {/* Filtros de Tipo */}
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: "todos", label: `Todos (${inmuebles.length})` },
                    { id: "venta", label: `Venta (${conteoVenta})` },
                    { id: "alquiler", label: `Alquiler (${conteoAlquiler})` },
                    { id: "vacacional", label: `Vacacional (${conteoVacacional})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFiltroTipo(tab.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        filtroTipo === tab.id
                          ? "bg-[#470A68] text-white shadow-xs"
                          : "bg-white dark:bg-[#18181c] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-purple-300"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buscador local */}
              {inmuebles.length > 3 && (
                <div className="relative max-w-md">
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar inmueble por título, ciudad o tipo..."
                    className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141417] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 transition"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Grid de Inmuebles */}
              {inmueblesFiltrados.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inmueblesFiltrados.map((inm) => (
                    <div key={inm.id} className="h-full">
                      <PropertyCard property={inm} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#141417] p-10 text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-[#470A68] dark:text-purple-400 flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    {inmuebles.length === 0
                      ? "Este corredor aún no tiene inmuebles asociados"
                      : "No se encontraron inmuebles con este filtro"}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                    {inmuebles.length === 0
                      ? "Las propiedades que gestione este asesor aparecerán listadas aquí automáticamente."
                      : "Intenta seleccionar otra categoría o limpiar la barra de búsqueda."}
                  </p>
                  {filtroTipo !== "todos" && (
                    <button
                      onClick={() => { setFiltroTipo("todos"); setBusqueda(""); }}
                      className="mt-2 text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline cursor-pointer"
                    >
                      Ver todos los inmuebles
                    </button>
                  )}
                </div>
              )}
            </>
          )}

        </div>

      </div>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={shareUrl}
        title="Compartir perfil"
        description={`Copia el enlace para compartir el perfil de ${nombreCompleto}:`}
      />
    </div>
  );
}
