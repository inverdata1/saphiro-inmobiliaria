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
  // Cada mascota seleccionada guarda su cantidad: el array es la única fuente de verdad
  // (ids sueltos + un mapa aparte de cantidades se desincronizan solos).
  const [mascotasSel, setMascotasSel] = useState([]); // [{ mascota_id, cantidad }]
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

  // Tope de mascotas del inmueble (alquiler_vacacional.cantidad_mascotas_permitidas).
  // El backend trata 0 como "no se aceptan mascotas"; si viniera 0 pero el inmueble igual
  // listara tipos, no_topamos nada en vez de bloquear la selección por completo.
  const maxMascotas = Number(av?.cantidad_mascotas_permitidas || 0);
  const totalMascotas = mascotasSel.reduce((a, m) => a + (Number(m.cantidad) || 0), 0);
  const quedanMascotas = maxMascotas > 0 ? Math.max(0, maxMascotas - totalMascotas) : Infinity;

  const agregarMascota = (id) => {
    const mid = Number(id);
    if (!mid) return;
    // Sin esto se puede exceder el tope: llenar una mascota al máximo y luego agregar otra
    // dejaría el total por encima del permitido (el input solo se autolimita por mascota).
    if (maxMascotas > 0 && quedanMascotas < 1) return;
    setMascotasSel((prev) =>
      prev.some((m) => m.mascota_id === mid) ? prev : [...prev, { mascota_id: mid, cantidad: 1 }]
    );
  };

  const topeAlcanzado = maxMascotas > 0 && quedanMascotas < 1;

  const quitarMascota = (mid) =>
    setMascotasSel((prev) => prev.filter((m) => m.mascota_id !== mid));

  // Igual que el de Huéspedes: no hay campo de texto, se elige con −/+. El máximo es lo que
  // la mascota ya ocupa + lo que queda libre del inmueble, para que el total no se pase.
  const cambiarCantidad = (mid, delta) => {
    setMascotasSel((prev) =>
      prev.map((m) => {
        if (m.mascota_id !== mid) return m;
        const tope = Math.max(1, m.cantidad + quedanMascotas);
        return { ...m, cantidad: Math.max(1, Math.min(tope, m.cantidad + delta)) };
      })
    );
    if (formErrors.mascotas) setFormErrors((prev) => ({ ...prev, mascotas: "" }));
  };

  const nombreMascota = (mid) =>
    mascotasPermitidas.find((m) => Number(m.mascota_id) === Number(mid))?.nombre || `Mascota ${mid}`;

  // Gastos adicionales que el huésped marcó. Arranca vacío: nada se cobra hasta que
  // se tilde. El servidor valida que los ids existan en el inmueble y recalcula el
  // total solo con los marcados, así que esta lista y su suma son la fuente de verdad.
  const [costosSel, setCostosSel] = useState([]); // [costo_adicional_id]

  const costos = useMemo(
    () =>
      (inmueble?.costos_adicionales || av?.costos_adicionales || [])
        .map((c) => ({ ...c, monto: Number(c.monto || 0) }))
        .filter((c) => c.monto > 0),
    [inmueble, av]
  );
  const costosActivos = costos.filter((c) => costosSel.includes(Number(c.costo_adicional_id)));
  const costoTotal = costosActivos.reduce((a, c) => a + c.monto, 0);

  const toggleCosto = (id) =>
    setCostosSel((prev) => {
      const mid = Number(id);
      return prev.includes(mid) ? prev.filter((x) => x !== mid) : [...prev, mid];
    });

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

  // Mascotas: cada una al menos 1, y la suma dentro del tope del inmueble. El input ya
  // autolimita mientras se escribe, pero maxMascotas puede cargar tarde (el inmueble se
  // pide por API), así que hay que revalidar en el envío.
  const validateMascotas = () => {
    const errors = {};
    if (mascotasSel.some((m) => !Number.isInteger(m.cantidad) || m.cantidad < 1)) {
      errors.mascotas = "La cantidad de cada mascota debe ser un número entero mayor a 0";
    } else if (maxMascotas > 0 && totalMascotas > maxMascotas) {
      errors.mascotas = `Este inmueble permite máximo ${maxMascotas} mascota${
        maxMascotas > 1 ? "s" : ""
      } en total y llevas ${totalMascotas}`;
    }
    setFormErrors((prev) => ({ ...prev, ...errors }));
    return !errors.mascotas;
  };

  const validarReserva = () => validateFechas() && validateMascotas();

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
        mascotas: mascotasSel.map((m) => ({ mascota_id: m.mascota_id, cantidad: m.cantidad })),
        // Lista explícita (puede ir vacía): el backend no cobra lo que no venga acá.
        costos_adicionales: costosSel.map((id) => ({ costo_adicional_id: id })),
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
          <Link to={`/inmuebles/${inmueble.uuid || inmueble.id}`} className="mt-4 inline-block font-bold text-blue-600 dark:text-blue-400">
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
                    {formatPrice(inmueble)}
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
                  <div className="flex items-baseline justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Mascotas permitidas
                    </label>
                    {maxMascotas > 0 && (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {totalMascotas} de {maxMascotas} mascota{maxMascotas > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <select
                    value={mascotaSeleccion}
                    disabled={topeAlcanzado}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMascotaSeleccion("");
                      if (val) agregarMascota(val);
                    }}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-800 dark:text-slate-200 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {topeAlcanzado ? "Tope de mascotas alcanzado" : "Agregar mascota…"}
                    </option>
                    {mascotasPermitidas
                      .filter((m) => !mascotasSel.some((s) => s.mascota_id === Number(m.mascota_id)))
                      .map((m) => (
                        <option key={m.mascota_id} value={m.mascota_id}>{m.nombre}</option>
                      ))}
                  </select>

                  {mascotasSel.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {mascotasSel.map(({ mascota_id: id, cantidad }) => {
                        const nombre = nombreMascota(id);
                        // Máximo que admite esta mascota: lo que ya lleva + lo que queda libre.
                        const tope = Math.max(1, cantidad + quedanMascotas);
                        return (
                          <div
                            key={id}
                            className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                          >
                            <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 0c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1 min-w-0 truncate">
                              {nombre}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => cambiarCantidad(id, -1)}
                                disabled={cantidad <= 1}
                                className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-lg leading-none flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                aria-label={`Menos ${nombre}`}
                              >
                                −
                              </button>
                              <span
                                className="w-8 text-center text-base font-extrabold text-slate-900 dark:text-white tabular-nums"
                                aria-label={`Cantidad de ${nombre}`}
                              >
                                {cantidad}
                              </span>
                              <button
                                type="button"
                                onClick={() => cambiarCantidad(id, 1)}
                                disabled={cantidad >= tope}
                                className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-lg leading-none flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                aria-label={`Más ${nombre}`}
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => quitarMascota(id)}
                              className="shrink-0 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                              aria-label={`Quitar ${nombre}`}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {guardarError("mascotas")}
                </div>
              )}

              {costos.length > 0 && (
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Gastos adicionales
                    </label>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {costosActivos.length} de {costos.length} seleccionado
                      {costosActivos.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {costos.map((c) => {
                      const marcado = costosSel.includes(Number(c.costo_adicional_id));
                      return (
                        <label
                          key={c.costo_adicional_id}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                            marcado
                              ? "border-purple-300 bg-purple-50/70 dark:border-purple-700 dark:bg-purple-900/20"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={marcado}
                            onChange={() => toggleCosto(c.costo_adicional_id)}
                            className="h-4 w-4 shrink-0 rounded border-slate-300 text-purple-700 focus:ring-purple-600 dark:border-slate-600 dark:bg-slate-900"
                          />
                          <span
                            className={`text-sm font-medium flex-1 min-w-0 truncate ${
                              marcado
                                ? "text-slate-900 dark:text-white"
                                : "text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {c.costo_adicional_nombre}
                          </span>
                          <span
                            className={`shrink-0 text-xs font-semibold tabular-nums ${
                              marcado
                                ? "text-purple-800 dark:text-purple-300"
                                : "text-slate-400 dark:text-slate-500"
                            }`}
                          >
                            {esBs ? `Bs. ${fmtBs(c.monto)}` : `${simbolo}${fmtMonto(c.monto)}${sufijoMoneda}`}
                            /noche
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                    Solo se cobran los que marques. Los demás no se incluyen en el total.
                  </p>
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
                  {costosActivos.map((c) => (
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
              validacionExtra={validarReserva}
              onSubmit={submitPago}
              onComprobanteClose={() => navigate("/reservaciones")}
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