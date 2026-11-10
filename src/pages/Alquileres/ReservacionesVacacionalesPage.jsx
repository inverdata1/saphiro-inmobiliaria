import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../api";
import { useAuth } from "../../context/useAuth";
import { formatDate } from "../../utils/date";

export default function ReservacionesVacacionalesPage() {
  const { user } = useAuth();

  // Para corredores: pueden alternar entre reservas recibidas en sus inmuebles o hechas por ellos
  const isCorredor = user?.rol === "corredor";
  const isAdmin = user?.rol === "admin";

  const [tabTipo, setTabTipo] = useState("recibidas"); // "recibidas" | "mias"
  const [tabEstado, setTabEstado] = useState("todas"); // "todas" | "proxima" | "en_curso" | "finalizada" | "cancelada"
  const [search, setSearch] = useState("");
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Paginación (el backend devuelve pagination: total, totalPages, hasMore...)
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Modal para ver el detalle completo de la reserva
  const [selectedReserva, setSelectedReserva] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Cambiar tab reinicia la paginación
  const changeTabTipo = (id) => {
    setTabTipo(id);
    setPage(1);
  };

  const changeTabEstado = (id) => {
    setTabEstado(id);
    setPage(1);
  };

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    setError("");

    (async () => {
      try {
        const params = {
          limit: PAGE_SIZE,
          page,
        };

        if (isCorredor) {
          params.tipo = tabTipo;
        }

        if (tabEstado !== "todas") {
          params.estado = tabEstado;
        }

        const res = await apiGet("/reservas", params);
        if (cancelled) return;

        const data = res?.data ?? [];
        setReservas(Array.isArray(data) ? data : []);
        setPagination(res?.pagination ?? null);
      } catch (err) {
        if (!cancelled) {
          console.error("Error al cargar reservaciones:", err);
          setError(err.message || "Error al cargar las reservaciones");
          setReservas([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, tabTipo, tabEstado, page, isCorredor]);

  // Volver arriba al cambiar de página
  useEffect(() => {
    if (page > 1) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  // Filtrado en vivo por texto de búsqueda
  const filteredReservas = useMemo(() => {
    if (!search.trim()) return reservas;
    const term = search.toLowerCase();

    return reservas.filter((r) => {
      const matchTitulo = r.inmueble_titulo?.toLowerCase().includes(term);
      const matchCiudad = r.inmueble_ciudad?.toLowerCase().includes(term);
      const matchRegion = r.inmueble_region?.toLowerCase().includes(term);
      const matchCliente = r.cliente_nombre?.toLowerCase().includes(term);
      const matchCorredor = r.corredor_nombre?.toLowerCase().includes(term);
      const matchFactura = r.numero_factura?.toLowerCase().includes(term);

      return (
        matchTitulo ||
        matchCiudad ||
        matchRegion ||
        matchCliente ||
        matchCorredor ||
        matchFactura
      );
    });
  }, [reservas, search]);

  // Conteo de estados para badges
  const counts = useMemo(() => {
    return {
      proximas: reservas.filter((r) => r.estado_estancia === "proxima").length,
      en_curso: reservas.filter((r) => r.estado_estancia === "en_curso").length,
      finalizadas: reservas.filter((r) => r.estado_estancia === "finalizada").length,
    };
  }, [reservas]);

  // Formato de moneda
  const formatMonto = (monto, moneda = "USD") => {
    const num = Number(monto || 0);
    const m = String(moneda).toUpperCase();
    if (m === "BS") return `${num.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs.`;
    if (m === "EUR") return `${num.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`;
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD`;
  };

  // Badge del estado de estancia
  const renderEstadoBadge = (estado, estatusPago) => {
    if (estatusPago === "cancelado" || estado === "cancelada") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Cancelada
        </span>
      );
    }

    if (estado === "en_curso") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          En curso
        </span>
      );
    }

    if (estado === "proxima") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Próxima
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        Finalizada
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold mb-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Alquileres Vacacionales
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
            {isCorredor && tabTipo === "recibidas"
              ? "Reservas en mis inmuebles vacacionales"
              : "Mis reservaciones vacacionales"}
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {isCorredor && tabTipo === "recibidas"
              ? "Administra los huéspedes y estancias programadas en tus propiedades en alquiler vacacional."
              : "Consulta tus itinerarios, fechas de entrada/salida y comprobantes de tus viajes reservados."}
          </p>
        </div>

        {/* Resumen de estancias */}
        <div className="flex items-center gap-2 flex-wrap">
          {counts.en_curso > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {counts.en_curso} en curso
            </div>
          )}
          {counts.proximas > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {counts.proximas} próximas
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
            Total: {pagination?.total ?? reservas.length}
          </div>
        </div>
      </div>

      {/* Tabs para corredores: Recibidas vs Mis viajes */}
      {isCorredor && (
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => changeTabTipo("recibidas")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              tabTipo === "recibidas"
                ? "bg-white dark:bg-[#141417] text-purple-700 dark:text-purple-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Reservas recibidas (Mis inmuebles)
          </button>
          <button
            type="button"
            onClick={() => changeTabTipo("mias")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              tabTipo === "mias"
                ? "bg-white dark:bg-[#141417] text-purple-700 dark:text-purple-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Mis viajes (Como huésped)
          </button>
        </div>
      )}

      {/* Barra de Búsqueda y Filtro de Estados */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filtros de estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "todas", label: "Todas" },
            { id: "en_curso", label: "En curso" },
            { id: "finalizada", label: "Finalizadas" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => changeTabEstado(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                tabEstado === tab.id
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                  : "bg-white dark:bg-[#141417] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative min-w-[260px] sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por inmueble, ciudad, nombre..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#141417] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
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

      {/* Lista de Reservaciones */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-white dark:bg-[#141417] border border-slate-100 dark:border-slate-800/60 rounded-2xl p-5 flex flex-col sm:flex-row gap-5"
            >
              <div className="w-full sm:w-52 h-44 sm:h-36 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
              <div className="flex-1 space-y-3 py-1">
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                <div className="h-14 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredReservas.length === 0 ? (
        <div className="bg-white dark:bg-[#141417] border border-slate-100 dark:border-slate-800/60 rounded-3xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            No se encontraron reservaciones
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-400 dark:text-slate-500 max-w-md mx-auto">
            {search
              ? "No hay resultados para tu criterio de búsqueda actual."
              : isCorredor && tabTipo === "recibidas"
              ? "Aún no se han recibido reservaciones en tus inmuebles vacacionales."
              : "Todavía no tienes reservaciones vacacionales contratadas."}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              to="/inmuebles"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold transition shadow-sm"
            >
              Explorar inmuebles vacacionales
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReservas.map((reserva) => {
            const noches = Number(reserva.total_noches || 1);
            const precioTotal = Number(reserva.precio_total || reserva.monto_total || 0);
            const mascotas = Array.isArray(reserva.mascotas) ? reserva.mascotas : [];

            // Identificar si mostramos al corredor o al cliente según la vista
            const esVistaHost = isCorredor && tabTipo === "recibidas";
            const contraparteNombre = esVistaHost ? reserva.cliente_nombre : reserva.corredor_nombre;
            const contraparteEmail = esVistaHost ? reserva.cliente_email : reserva.corredor_email;
            const contraparteTelefono = esVistaHost ? null : reserva.corredor_telefono;
            const contraparteFoto = esVistaHost ? reserva.cliente_foto_url : reserva.corredor_foto_url;
            const contrapartePerfilUuid = esVistaHost ? reserva.cliente_uuid : reserva.corredor_usuario_uuid;

            return (
              <div
                key={reserva.reserva_id}
                className="group bg-white dark:bg-[#141417] border border-slate-100 dark:border-slate-800/70 rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)] hover:shadow-md transition-all duration-200 flex flex-col md:flex-row gap-5 items-start md:items-center"
              >
                {/* Imagen del Inmueble */}
                <div className="relative w-full md:w-52 h-44 md:h-36 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <img
                    src={
                      reserva.inmueble_imagen_url ||
                      "https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&w=800&q=80"
                    }
                    alt={reserva.inmueble_titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    {renderEstadoBadge(reserva.estado_estancia, reserva.estatus_pago)}
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[11px] font-extrabold text-white">
                    {noches} {noches === 1 ? "noche" : "noches"}
                  </div>
                </div>

                {/* Contenido Central */}
                <div className="flex-1 min-w-0 space-y-2.5 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <Link
                        to={`/inmuebles/${reserva.inmueble_uuid || reserva.inmueble_id}`}
                        className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1"
                      >
                        {reserva.inmueble_titulo}
                      </Link>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                        <svg className="w-3.5 h-3.5 text-purple-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>
                          {reserva.inmueble_ciudad || "Ciudad"}, {reserva.inmueble_region || "Estado"}
                        </span>
                      </p>
                    </div>

                    {reserva.numero_factura && (
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800 w-fit shrink-0">
                        Recibo: {reserva.numero_factura}
                      </span>
                    )}
                  </div>

                  {/* Bloque de Fechas de la Estancia */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 rounded-xl p-2.5 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Entrada
                      </span>
                      <strong className="text-slate-800 dark:text-slate-200 font-extrabold text-xs">
                        {formatDate(reserva.fecha_entrada)}
                      </strong>
                      {reserva.hora_checkin && (
                        <span className="text-[10px] text-slate-400 block">
                          Desde las {reserva.hora_checkin.slice(0, 5)}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Salida
                      </span>
                      <strong className="text-slate-800 dark:text-slate-200 font-extrabold text-xs">
                        {formatDate(reserva.fecha_salida)}
                      </strong>
                      {reserva.hora_checkout && (
                        <span className="text-[10px] text-slate-400 block">
                          Hasta las {reserva.hora_checkout.slice(0, 5)}
                        </span>
                      )}
                    </div>

                    <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Huéspedes
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-extrabold text-xs">
                        {reserva.num_huespedes} {Number(reserva.num_huespedes) === 1 ? "persona" : "personas"}
                      </span>
                      {mascotas.length > 0 && (
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 block font-semibold truncate">
                          🐾 {mascotas.map((m) => `${m.cantidad} ${m.nombre}`).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contraparte (Huésped o Anfitrión) */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[10px] flex items-center justify-center shrink-0 overflow-hidden">
                        {contraparteFoto ? (
                          <img src={contraparteFoto} alt={contraparteNombre} className="w-full h-full object-cover" />
                        ) : (
                          contraparteNombre?.charAt(0) || "U"
                        )}
                      </div>
                      <div className="truncate">
                        <span className="text-slate-400 dark:text-slate-500 font-medium mr-1">
                          {esVistaHost ? "Huésped:" : "Anfitrión:"}
                        </span>
                        <strong className="text-slate-800 dark:text-slate-200 font-bold">
                          {contraparteNombre}
                        </strong>
                        {contraparteTelefono && (
                          <span className="text-slate-400 ml-2 hidden sm:inline">
                            • 📞 {contraparteTelefono}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Monto y Acciones */}
                <div className="w-full md:w-44 shrink-0 flex md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block">
                      Total Pagado
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight">
                      {formatMonto(precioTotal, reserva.moneda)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedReserva(reserva)}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition cursor-pointer"
                    >
                      Ver detalle
                    </button>
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

      {/* Controles de Paginación */}
      {!loading && !error && pagination && reservas.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Página {pagination.page} de {pagination.totalPages} · {pagination.total}{" "}
            {pagination.total === 1 ? "reservación" : "reservaciones"}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#141417] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </button>

            <button
              type="button"
              disabled={!pagination.hasMore}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Siguiente
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Modal de Detalle Completo de Reserva */}
      {selectedReserva && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedReserva(null)}
        >
          <div
            className="bg-white dark:bg-[#141417] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                  Comprobante de Reserva Vacacional
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-50 mt-0.5">
                  {selectedReserva.inmueble_titulo}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  {selectedReserva.inmueble_ciudad}, {selectedReserva.inmueble_region} • {selectedReserva.inmueble_direccion}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReserva(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Estado y Folio */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Estado de la estancia
                </span>
                {renderEstadoBadge(selectedReserva.estado_estancia, selectedReserva.estatus_pago)}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Número de Factura
                </span>
                <strong className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {selectedReserva.numero_factura || `RES-${selectedReserva.reserva_id}`}
                </strong>
              </div>
            </div>

            {/* Fechas e Itinerario */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
              <div>
                <span className="text-[11px] font-bold uppercase text-purple-700 dark:text-purple-300 block">
                  Fecha de Entrada
                </span>
                <strong className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {formatDate(selectedReserva.fecha_entrada)}
                </strong>
                {selectedReserva.hora_checkin && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                    Desde las {selectedReserva.hora_checkin.slice(0, 5)}
                  </span>
                )}
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-purple-700 dark:text-purple-300 block">
                  Fecha de Salida
                </span>
                <strong className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {formatDate(selectedReserva.fecha_salida)}
                </strong>
                {selectedReserva.hora_checkout && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                    Hasta las {selectedReserva.hora_checkout.slice(0, 5)}
                  </span>
                )}
              </div>
            </div>

            {/* Datos de Huéspedes y Mascotas */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Capacidad y Huéspedes
                </span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                  {selectedReserva.num_huespedes} personas
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Capacidad máx: {selectedReserva.capacidad_personas || 1}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Mascotas registradas
                </span>
                {Array.isArray(selectedReserva.mascotas) && selectedReserva.mascotas.length > 0 ? (
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {selectedReserva.mascotas.map((m) => `${m.cantidad} ${m.nombre}`).join(", ")}
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs">Sin mascotas</span>
                )}
              </div>
            </div>

            {/* Desglose Económico */}
            <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Desglose del Costo
              </h4>
              <div className="space-y-1.5 text-xs">
                {Array.isArray(selectedReserva.detalles) && selectedReserva.detalles.length > 0 ? (
                  selectedReserva.detalles.map((d, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-300">
                      <span>{d.concepto}</span>
                      <span className="font-bold">{formatMonto(d.monto, selectedReserva.moneda)}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-300">
                      <span>
                        {selectedReserva.total_noches} noche(s) × {formatMonto(selectedReserva.precio_por_noche, selectedReserva.moneda)}
                      </span>
                      <span className="font-bold">
                        {formatMonto(
                          Number(selectedReserva.total_noches || 1) * Number(selectedReserva.precio_por_noche || 0),
                          selectedReserva.moneda
                        )}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-sm font-black text-slate-900 dark:text-slate-50">
                  <span>Total Pagado</span>
                  <span className="text-purple-600 dark:text-purple-400">
                    {formatMonto(selectedReserva.precio_total || selectedReserva.monto_total, selectedReserva.moneda)}
                  </span>
                </div>
              </div>
            </div>

            {/* Anfitrión y Contacto */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center overflow-hidden">
                  {selectedReserva.corredor_foto_url ? (
                    <img src={selectedReserva.corredor_foto_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    selectedReserva.corredor_nombre?.charAt(0) || "A"
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Anfitrión</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-bold text-xs">
                    {selectedReserva.corredor_nombre}
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                    {selectedReserva.corredor_email}
                  </span>
                </div>
              </div>

              {selectedReserva.corredor_usuario_uuid && (
                <Link
                  to={`/perfil/${selectedReserva.corredor_usuario_uuid}`}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition"
                >
                  Ver Perfil
                </Link>
              )}
            </div>

            {/* Botones de acción modal */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link
                to={`/inmuebles/${selectedReserva.inmueble_uuid || selectedReserva.inmueble_id}`}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Ver Inmueble
              </Link>
              <button
                type="button"
                onClick={() => setSelectedReserva(null)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
