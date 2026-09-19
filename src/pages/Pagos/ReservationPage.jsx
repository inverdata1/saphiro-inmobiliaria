import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import PasarelaPago from "../../components/pagos/PasarelaPago";
import { apiGet, apiPost } from "../../api";
import { formatPrice } from "../../utils/price";
import { useAuth } from "../../context/useAuth";
import { v4 as uuid } from "uuid";

const DatePickerCalendarModal = lazy(() => import("../../components/pickers/DatePickerCalendarModal"));

const TASA_FALLBACK_DOLAR = 54.5;
const TASA_FALLBACK_EURO = 58.32;

function toYMD(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ReservationPage() {
  const { inmuebleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [inmueble, setInmueble] = useState(location.state?.inmueble || null);
  const [loading, setLoading] = useState(!inmueble);
  const [loadError, setLoadError] = useState("");

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [huespedes, setHuespedes] = useState(1);
  const [mascotasSel, setMascotasSel] = useState([]);
  const [mascotaSeleccion, setMascotaSeleccion] = useState("");

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState(null);
  const [reservas, setReservas] = useState([]);

  const [formErrors, setFormErrors] = useState({});
  const [tasasData, setTasasData] = useState(null);

  const idemKeyRef = useRef(uuid());

  useEffect(() => {
    if (inmuebleId && !inmueble) {
      apiGet(`/inmuebles/${inmuebleId}`)
        .then((res) => {
          if (res?.data) setInmueble(res.data);
          else throw new Error("Inmueble no encontrado");
        })
        .catch((e) => setLoadError(e.message || "No se pudo cargar el inmueble"))
        .finally(() => setLoading(false));
    }
  }, [inmuebleId, inmueble]);

  useEffect(() => {
    if (inmuebleId && inmueble && inmueble.mascotas === undefined) {
      apiGet(`/inmuebles/${inmuebleId}`)
        .then((res) => {
          if (res?.data) setInmueble((prev) => ({ ...prev, ...res.data }));
        })
        .catch(() => {});
    }
  }, [inmuebleId, inmueble]);

  useEffect(() => {
    apiGet("/tasas/actual")
      .then((res) => {
        if (res?.data) setTasasData(res.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!inmuebleId) return;
    (async () => {
      try {
        const r = await apiGet(`/inmuebles/${inmuebleId}/reservas`);
        setReservas(Array.isArray(r?.data) ? r.data : []);
      } catch (e) {
        console.error("Error al cargar reservas:", e);
        setReservas([]);
      }
    })();
  }, [inmuebleId]);

  const av = inmueble?.alquiler_vacacional || null;
  const mascotasPermitidas = inmueble?.mascotas || [];
  const moneda = String(inmueble?.moneda || "USD").toUpperCase();
  const esBs = moneda === "BS";
  const esVacacional = inmueble?.estado_inmueble === "vacacional";
  const precioNoche = Number(av?.precio_por_noche || 0);
  const montoInicial = Number(inmueble?.precio) || 0;
  const nochesMin = Number(av?.noches_minimas || 1);
  const huespedesMax = Number(av?.capacidad_personas || 1);

  const costos = useMemo(
    () =>
      (inmueble?.costos_adicionales || av?.costos_adicionales || [])
        .map((c) => ({ ...c, monto: Number(c.monto || 0) }))
        .filter((c) => c.monto > 0),
    [inmueble, av]
  );
  const costoTotal = costos.reduce((a, c) => a + c.monto, 0);

  const hoy = toYMD(new Date());
  const maxFecha = toYMD(new Date(new Date().getFullYear() + 2, new Date().getMonth(), new Date().getDate()));
  const checkInMin = hoy;
  const checkOutMin = checkIn ? toYMD(new Date(new Date(checkIn).getTime() + 86400000)) : toYMD(new Date(new Date(hoy).getTime() + 86400000));

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  const formatHora = (t) => {
    if (!t) return "";
    return t.length >= 5 ? t.slice(0, 5) : t;
  };

  const openCalendar = (target) => {
    setCalendarTarget(target);
    setCalendarOpen(true);
  };

  const handleCalendarSelect = (dateStr) => {
    if (calendarTarget === "checkIn") {
      handleCheckInChange(dateStr);
    } else {
      setCheckOut(dateStr);
      if (formErrors.checkOut) {
        setFormErrors((prev) => ({ ...prev, checkOut: "" }));
      }
    }
  };

  const noches = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const ms = new Date(checkOut) - new Date(checkIn);
    return Math.round(ms / 86400000);
  }, [checkIn, checkOut]);

  const total = montoInicial + noches * (precioNoche + costoTotal);

  const tasaDia = tasasData
    ? moneda === "EUR"
      ? Number(tasasData.bcv_euro)
      : Number(tasasData.bcv_dolar)
    : null;
  const tasaCambio = esBs ? null : tasaDia ?? (moneda === "EUR" ? TASA_FALLBACK_EURO : TASA_FALLBACK_DOLAR);
  const totalBs = esBs ? total : total * (tasaCambio || 1);

  const fmtMonto = (n) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2 });
  const fmtBs = (n) => Number(n || 0).toLocaleString("es-VE", { minimumFractionDigits: 2 });
  const simbolo = moneda === "EUR" ? "" : "$";
  const sufijoMoneda = moneda === "EUR" ? " €" : moneda === "USD" ? " USD" : "";
  const totalLabel = esBs ? `Bs. ${fmtBs(total)}` : `${simbolo}${fmtMonto(total)}${sufijoMoneda}`;

  const handleCheckInChange = (val) => {
    setCheckIn(val);
    if (checkOut && val && new Date(checkOut) <= new Date(val)) {
      setCheckOut(toYMD(new Date(new Date(val).getTime() + 86400000)));
    }
  };

  const guardarError = (field) =>
    formErrors[field] ? (
      <p className="mt-1 text-xs text-red-500 font-medium">{formErrors[field]}</p>
    ) : null;

  const validateFechas = () => {
    const errors = {};
    if (!checkIn) {
      errors.checkIn = "Selecciona la fecha de entrada";
    } else if (checkIn < hoy) {
      errors.checkIn = "La entrada no puede ser anterior a hoy";
    } else if (checkIn > maxFecha) {
      errors.checkIn = "La entrada supera el máximo de 2 años";
    }
    if (!checkOut) {
      errors.checkOut = "Selecciona la fecha de salida";
    } else if (checkOut <= checkIn) {
      errors.checkOut = "La salida debe ser posterior a la entrada";
    }
    if (!errors.checkIn && !errors.checkOut && noches < nochesMin) {
      errors.noches = `Estadía mínima de ${nochesMin} noche${nochesMin > 1 ? "s" : ""}`;
    }
    setFormErrors((prev) => ({ ...prev, ...errors }));
    return !errors.checkIn && !errors.checkOut && !errors.noches;
  };

  const submitPago = async ({ metodoPago, cardBrand, formData, detallePago }) => {
    if (!user?.id) {
      throw new Error("Debes iniciar sesión para reservar.");
    }

    const res = await apiPost(
      "/transacciones/reserva",
      {
        inmueble_id: Number(inmuebleId),
        cliente_id: Number(user.id),
        fecha_entrada: checkIn,
        fecha_salida: checkOut,
        moneda,
        num_huespedes: huespedes,
        estatus_pago: "pagado",
        metodo_pago: metodoPago,
        detalle_pago: detallePago || {},
        mascotas: mascotasSel.map((id) => ({ mascota_id: id })),
      },
      idemKeyRef.current
    );

    const reserva = res?.data?.reserva;
    const transaccion = res?.data?.transaccion;

    // El total lo calcula el servidor; se usa su valor real en el comprobante
    const totalServidor = Number(reserva?.precio_total ?? transaccion?.monto_total ?? total);

    return {
      numAprobacion: `AUTH-${String(transaccion?.id || reserva?.id || Math.floor(100000 + Math.random() * 900000)).padStart(6, "0")}`,
      referencia: String(reserva?.id || transaccion?.id || Math.floor(10000000 + Math.random() * 90000000)),
      metodo: metodoPago,
      brand: cardBrand,
      ultimosDigitos: formData?.numeroTarjeta ? formData.numeroTarjeta.slice(-4) : "N/A",
      montoPrincipal: totalServidor,
      moneda,
      montoBs: esBs ? totalServidor : totalServidor * tasaCambio,
      tasa: tasaCambio,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors animate-pulse">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-5">
            <div className="h-56 bg-slate-200 rounded-2xl dark:bg-slate-800" />
            <div className="h-40 bg-slate-200 rounded-2xl dark:bg-slate-800" />
            <div className="h-52 bg-slate-200 rounded-2xl dark:bg-slate-800" />
          </div>
          <div className="lg:col-span-7 h-[560px] bg-slate-200 rounded-3xl dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (loadError || !inmueble) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-xl mx-auto card p-8 text-center">
          <p className="font-bold text-slate-800 dark:text-slate-200">{loadError || "No se encontró el inmueble"}</p>
          <Link to="/inmuebles" className="mt-4 inline-block font-bold text-blue-600 dark:text-blue-400">
            Volver a inmuebles
          </Link>
        </div>
      </div>
    );
  }

  if (!esVacacional || !av) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-xl mx-auto card p-8 text-center">
          <p className="font-bold text-slate-800 dark:text-slate-200">Este inmueble no admite reservas vacacionales</p>
          <Link to={`/inmuebles/${inmueble.id}`} className="mt-4 inline-block font-bold text-blue-600 dark:text-blue-400">
            Ver detalle del inmueble
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Reserva · Alquiler vacacional
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="card overflow-hidden">
              <div className="h-48 w-full overflow-hidden">
                <img
                  src={inmueble.imagen_url || inmueble.imagen}
                  alt={inmueble.titulo}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight line-clamp-2">
                      {inmueble.titulo}
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {inmueble.ciudad || "Sector"}, {inmueble.estado || ""}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider shrink-0">
                    Vacacional
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {huespedesMax} {huespedesMax === 1 ? "huésped máximo" : "huéspedes máximo"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2" />
                      <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
                      <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
                      <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
                    </svg>
                    Mín. {nochesMin} noche{nochesMin > 1 ? "s" : ""}
                  </span>
                  {av.hora_checkin && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        <polyline points="12 6 12 12 16 14" strokeWidth="2" />
                      </svg>
                      Hora de entrada: {formatHora(av.hora_checkin)}
                    </span>
                  )}
                  {av.hora_checkout && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        <polyline points="12 6 12 12 16 14" strokeWidth="2" />
                      </svg>
                      Hora de salida: {formatHora(av.hora_checkout)}
                    </span>
                  )}
                </div>

                <div className="pt-1 flex items-end justify-between border-t border-slate-100 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Tarifa</span>
                  <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                    {formatPrice(montoInicial, moneda, av)}
                  </span>
                </div>
              </div>
            </div>

            <div className="card p-4 sm:p-5 space-y-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Configura tu reserva
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Fecha de entrada
                  </label>
                  <button
                    type="button"
                    onClick={() => openCalendar("checkIn")}
                    className={`w-full text-left rounded-xl border ${
                      formErrors.checkIn ? "border-red-500 ring-1 ring-red-500" : "border-slate-300 dark:border-slate-700"
                    } bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-800 dark:text-slate-200 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm cursor-pointer hover:border-slate-400 dark:hover:border-slate-600`}
                  >
                    {checkIn ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2" />
                          <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
                          <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
                          <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
                        </svg>
                        {formatDisplayDate(checkIn)}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">Seleccionar fecha</span>
                    )}
                  </button>
                  {guardarError("checkIn")}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Fecha de salida
                  </label>
                  <button
                    type="button"
                    onClick={() => openCalendar("checkOut")}
                    className={`w-full text-left rounded-xl border ${
                      formErrors.checkOut ? "border-red-500 ring-1 ring-red-500" : "border-slate-300 dark:border-slate-700"
                    } bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-800 dark:text-slate-200 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm cursor-pointer hover:border-slate-400 dark:hover:border-slate-600`}
                  >
                    {checkOut ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2" />
                          <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
                          <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
                          <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
                        </svg>
                        {formatDisplayDate(checkOut)}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">Seleccionar fecha</span>
                    )}
                  </button>
                  {guardarError("checkOut")}
                </div>
              </div>
              {formErrors.noches && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 px-3 py-2 text-xs text-red-600 dark:text-red-400 font-semibold">
                  {formErrors.noches}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Huéspedes
                </label>
                <div className="flex items-center justify-between rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setHuespedes((h) => Math.max(1, h - 1))}
                    disabled={huespedes <= 1}
                    className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-lg leading-none flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Menos huéspedes"
                  >
                    −
                  </button>
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white">{huespedes}</span>
                  <button
                    type="button"
                    onClick={() => setHuespedes((h) => Math.min(huespedesMax, h + 1))}
                    disabled={huespedes >= huespedesMax}
                    className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-lg leading-none flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Más huéspedes"
                  >
                    +
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  Capacidad máxima: {huespedesMax} persona{huespedesMax > 1 ? "s" : ""}
                </p>
              </div>

              {mascotasPermitidas.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Mascotas permitidas
                  </label>
                  <select
                    value={mascotaSeleccion}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMascotaSeleccion("");
                      if (val) {
                        setMascotasSel((prev) =>
                          prev.includes(Number(val)) ? prev : [...prev, Number(val)]
                        );
                      }
                    }}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-800 dark:text-slate-200 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm cursor-pointer"
                  >
                    <option value="">Agregar mascota…</option>
                    {mascotasPermitidas
                      .filter((m) => !mascotasSel.includes(m.mascota_id))
                      .map((m) => (
                        <option key={m.mascota_id} value={m.mascota_id}>{m.nombre}</option>
                      ))}
                  </select>

                  {mascotasSel.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {mascotasSel.filter((id) => mascotasPermitidas.some((m) => String(m.mascota_id) === String(id))).map((mascotaId) => {
                        const mascota = mascotasPermitidas.find((m) => String(m.mascota_id) === String(mascotaId));
                        const nombre = mascota?.nombre;
                        if (!nombre) return null;
                        return (
                          <span
                            key={mascotaId}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200"
                          >
                            {nombre}
                            <button
                              type="button"
                              onClick={() => setMascotasSel((prev) => prev.filter((id) => id !== mascotaId))}
                              className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                              aria-label={`Quitar ${nombre}`}
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="card p-4 sm:p-5 space-y-3">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Resumen del costo
              </h2>

              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Monto inicial</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {esBs ? `Bs. ${fmtBs(montoInicial)}` : `${simbolo}${fmtMonto(montoInicial)}${sufijoMoneda}`}
                </span>
              </div>

              {noches === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Selecciona las fechas para calcular el total de tu estadía.
                </p>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      {noches} noche{noches > 1 ? "s" : ""} × {precioNoche.toLocaleString("en-US")}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {esBs ? `Bs. ${fmtBs(noches * precioNoche)}` : `${simbolo}${fmtMonto(noches * precioNoche)}${sufijoMoneda}`}
                    </span>
                  </div>
                  {costos.map((c) => (
                    <div key={c.costo_adicional_id} className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        {c.costo_adicional_nombre} × {noches} {noches > 1 ? "noches" : "noche"}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {esBs ? `Bs. ${fmtBs(noches * c.monto)}` : `${simbolo}${fmtMonto(noches * c.monto)}${sufijoMoneda}`}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-3 flex items-baseline justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Total</span>
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400">{totalLabel}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-7">
            <PasarelaPago
              titulo="Pago de Reserva"
              subtitulo="Acepta tarjetas de crédito y débito, pago movil, Paypal, Binance y Zelle"
              montoLabel={totalLabel}
              inmueble={inmueble}
              validacionExtra={validateFechas}
              onSubmit={submitPago}
              onComprobanteClose={() => navigate("/inmuebles")}
              resumen={
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 space-y-1.5 text-sm">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{checkIn ? `Desde ${formatDisplayDate(checkIn)}` : "Fechas por seleccionar"}</span>
                    <span>{checkOut ? `Hasta ${formatDisplayDate(checkOut)}` : "—"}</span>
                  </div>
                  {noches > 0 && (
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{noches} noche{noches > 1 ? "s" : ""} · {huespedes} huésped{huespedes > 1 ? "es" : ""}</span>
                      <span className="text-slate-700 dark:text-slate-200 font-semibold">{totalLabel}</span>
                    </div>
                  )}
                  {!esBs && (
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Equivalente:</span>
                      <span className="font-mono font-medium">Bs. {fmtBs(totalBs)}</span>
                    </div>
                  )}
                  {!esBs && (
                    <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
                      <span>Tasa BCV</span>
                      <span className="font-mono">{(tasaCambio || 0).toFixed(2)} Bs/{moneda === "EUR" ? "€" : "$"}</span>
                    </div>
                  )}
                </div>
              }
            />
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <DatePickerCalendarModal
          open={calendarOpen}
          onClose={() => {
            setCalendarOpen(false);
            setCalendarTarget(null);
          }}
          onSelect={handleCalendarSelect}
          selectedDate={calendarTarget === "checkIn" ? checkIn : checkOut}
          minDate={calendarTarget === "checkIn" ? checkInMin : checkOutMin}
          maxDate={maxFecha}
          reservas={reservas}
          title={calendarTarget === "checkIn" ? "Fecha de entrada" : "Fecha de salida"}
          subtitle={calendarTarget === "checkIn" ? "Selecciona cuándo llegas" : "Selecciona cuándo te vas"}
        />
      </Suspense>
    </div>
  );
}