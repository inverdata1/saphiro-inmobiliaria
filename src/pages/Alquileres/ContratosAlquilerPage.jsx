import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../api";
import { useAuth } from "../../context/useAuth";
import { formatDate } from "../../utils/date";

export default function ContratosAlquilerPage() {
  const { user } = useAuth();

  // Para corredores: pueden alternar entre contratos recibidos en sus inmuebles o sus rentas como arrendatario
  const isCorredor = user?.rol === "corredor";

  const [tabTipo, setTabTipo] = useState("rentas"); // "alquiladas" | "rentas"
  const [search, setSearch] = useState("");
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    setError("");

    (async () => {
      try {
        // "alquiladas": contratos sobre los inmuebles del corredor autenticado.
        // "rentas": contratos activos donde el usuario es el cliente (un corredor también puede alquilar).
        const endpoint =
          tabTipo === "alquiladas"
            ? `/contratos/corredor/${user.id}`
            : `/contratos/cliente/${user.id}`;

        const res = await apiGet(endpoint, { limit: 200 });
        if (cancelled) return;

        const data = res?.data ?? [];
        setContratos(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          console.error("Error al cargar contratos:", err);
          setError(err.message || "Error al cargar los contratos");
          setContratos([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, tabTipo]);

  // Vista actual: ¿mostramos al inquilino (la contraparte del corredor) o al propietario?
  const esVistaAnfitrion = tabTipo === "alquiladas";

  // Filtrado en vivo por texto de búsqueda
  const filteredContratos = useMemo(() => {
    if (!search.trim()) return contratos;
    const term = search.toLowerCase();

    return contratos.filter((c) => {
      const matchTitulo = c.inmueble_titulo?.toLowerCase().includes(term);
      const matchCiudad = c.inmueble_ciudad?.toLowerCase().includes(term);
      const matchRegion = c.inmueble_region?.toLowerCase().includes(term);
      const contraparte = esVistaAnfitrion ? c.cliente_nombre : c.corredor_nombre;
      const matchContraparte = contraparte?.toLowerCase().includes(term);

      return matchTitulo || matchCiudad || matchRegion || matchContraparte;
    });
  }, [contratos, search, esVistaAnfitrion]);

  // Conteo de estados para badges
  const counts = useMemo(() => {
    return {
      vigentes: contratos.filter((c) => c.active).length,
      finalizados: contratos.filter((c) => !c.active).length,
    };
  }, [contratos]);

  // Formato de moneda
  const formatMonto = (monto, moneda = "USD") => {
    const num = Number(monto || 0);
    const m = String(moneda).toUpperCase();
    if (m === "BS") return `${num.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs.`;
    if (m === "EUR") return `${num.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`;
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD`;
  };

  // Badge del estado del contrato
  const renderEstadoBadge = (active) => {
    const texto = esVistaAnfitrion ? (active ? "Alquilado" : "Finalizado") : active ? "Vigente" : "Finalizado";

    if (active) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {texto}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        {texto}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold mb-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0v-4a2 2 0 012-2h2a2 2 0 012 2v4" />
            </svg>
            Contratos de Alquiler
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
            {esVistaAnfitrion ? "Inmuebles alquilados" : "Rentas contratadas"}
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {esVistaAnfitrion
              ? "Gestiona los inmuebles que se encuentran rentados a clientes e inquilinos actualmente."
              : "Revisa los contratos de alquiler vigentes donde participas como arrendatario o inquilino."}
          </p>
        </div>

        {/* Resumen de contratos */}
        <div className="flex items-center gap-2 flex-wrap">
          {counts.vigentes > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {counts.vigentes} {esVistaAnfitrion ? "en alquiler" : "vigentes"}
            </div>
          )}
          {counts.finalizados > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
              {counts.finalizados} finalizados
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
            Total: {contratos.length}
          </div>
        </div>
      </div>

      {/* Tabs para corredores: Inmuebles alquilados vs Mis rentas */}
      {isCorredor && (
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setTabTipo("alquiladas")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              tabTipo === "alquiladas"
                ? "bg-white dark:bg-[#141417] text-purple-700 dark:text-purple-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Mis inmuebles alquilados
          </button>
          <button
            type="button"
            onClick={() => setTabTipo("rentas")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              tabTipo === "rentas"
                ? "bg-white dark:bg-[#141417] text-purple-700 dark:text-purple-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Mis rentas (Como arrendatario)
          </button>
        </div>
      )}

      {/* Barra de Búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={esVistaAnfitrion ? "Buscar por inmueble, cliente..." : "Buscar por inmueble, propietario..."}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#141417] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm font-medium transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Manejo de Error */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm font-semibold flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Lista de Contratos de Alquiler */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-[#141417] border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4 flex gap-4">
              <div className="w-32 h-24 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredContratos.length === 0 ? (
        <div className="bg-white dark:bg-[#141417] border border-slate-100 dark:border-slate-800/60 rounded-2xl p-12 text-center">
          <svg className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0v-4a2 2 0 012-2h2a2 2 0 012 2v4" />
          </svg>
          <h3 className="mt-4 text-base font-bold text-slate-800 dark:text-slate-200">
            {esVistaAnfitrion ? "No se encontraron inmuebles alquilados" : "No se encontraron rentas contratadas"}
          </h3>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {search
              ? "Intenta modificar el término de búsqueda."
              : esVistaAnfitrion
              ? "No hay propiedades en estado de alquiler actualmente."
              : "Aún no posees contrataciones registradas en tu cuenta."}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              to="/inmuebles"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold transition shadow-sm"
            >
              Explorar inmuebles
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContratos.map((c) => {
            // Contraparte: el cliente (vista corredor) o el propietario/corredor (vista arrendatario)
            const contraparteNombre = esVistaAnfitrion ? c.cliente_nombre : c.corredor_nombre;
            const contraparteEmail = esVistaAnfitrion ? c.cliente_email : c.corredor_email;
            const contraparteFoto = esVistaAnfitrion ? c.cliente_foto_url : c.corredor_foto_url;
            const contrapartePerfilUuid = esVistaAnfitrion ? c.cliente_uuid : c.corredor_usuario_uuid;
            const monturaMensual = Number(c.precio_mensualidad || 0);

            return (
              <div
                key={c.contrato_id}
                className="group bg-white dark:bg-[#141417] border border-slate-100 dark:border-slate-800/70 rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)] hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center"
              >
                {/* Box de Imagen */}
                <div className="relative w-full sm:w-44 h-36 sm:h-28 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <img
                    src={
                      c.inmueble_imagen_url ||
                      "https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&w=800&q=80"
                    }
                    alt={c.inmueble_titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">{renderEstadoBadge(c.active)}</div>
                </div>

                {/* Información del Inmueble y Contraparte */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {c.inmueble_titulo}
                  </h3>

                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-purple-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>
                      {c.inmueble_region || "Sector"}, {c.inmueble_ciudad || "Ciudad"}
                    </span>
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        Fecha del alquiler: <strong className="text-slate-900 dark:text-slate-100">{formatDate(c.fecha_inicio)}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[9px] flex items-center justify-center shrink-0 overflow-hidden">
                        {contraparteFoto ? (
                          <img src={contraparteFoto} alt={contraparteNombre} className="w-full h-full object-cover" />
                        ) : (
                          contraparteNombre?.charAt(0) || "U"
                        )}
                      </div>
                      <span className="truncate">
                        {esVistaAnfitrion ? "Cliente" : "Propietario"}:{" "}
                        <strong className="text-slate-900 dark:text-slate-100">{contraparteNombre}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Monto y Acciones */}
                <div className="w-full sm:w-auto shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block">
                      {esVistaAnfitrion ? "Renta mensual" : "Monto mensual"}
                    </span>
                    <span className="text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight">
                      {formatMonto(monturaMensual, c.moneda)}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">
                      {c.cuotas_pagadas > 0 ? `${c.cuotas_pagadas} cuotas pagadas` : "Sin cuotas registradas"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/mensualidades/${c.contrato_uuid || c.contrato_id}`}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#470A68] dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition cursor-pointer"
                    >
                      Mensualidades
                    </Link>
                    {contrapartePerfilUuid && (
                      <Link
                        to={`/perfil/${contrapartePerfilUuid}`}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-white transition cursor-pointer"
                      >
                        Contactar
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
