import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import CardPreview from "../../components/pagos/CardPreview";
import ComprobantePagoModal from "../../components/pagos/ComprobantePagoModal";
import { apiGet, apiPost } from "../../api";
import { formatPrice } from "../../utils/price";
import { useAuth } from "../../context/AuthContext";
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

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState(null);
  const [reservas, setReservas] = useState([]);

  const [metodoPago, setMetodoPago] = useState("credito");
  const [formData, setFormData] = useState({
    numeroTarjeta: "",
    nombreTitular: "",
    vencimiento: "",
    cvv: "",
  });
  const [cardBrand, setCardBrand] = useState("visa");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [comprobanteOpen, setComprobanteOpen] = useState(false);
  const [pagoResult, setPagoResult] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [tasasData, setTasasData] = useState(null);

  const idemKeyRef = useRef(uuid());
  const submittingRef = useRef(false);

  useEffect(() => {
    if (inmuebleId && !location.state?.inmueble) {
      apiGet(`/inmuebles/${inmuebleId}`)
        .then((res) => {
          if (res?.data) setInmueble(res.data);
          else throw new Error("Inmueble no encontrado");
        })
        .catch((e) => setLoadError(e.message || "No se pudo cargar el inmueble"))
        .finally(() => setLoading(false));
    }
  }, [inmuebleId, location.state]);

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

  const validateForm = () => {
    const errors = {};
    if (!formData.nombreTitular.trim()) {
      errors.nombreTitular = "El nombre del titular es requerido";
    }
    if (!formData.numeroTarjeta || formData.numeroTarjeta.length < 15) {
      errors.numeroTarjeta = "Ingrese los 16 dígitos de su tarjeta";
    }
    if (!formData.vencimiento || formData.vencimiento.length < 5) {
      errors.vencimiento = "Formato MM/AA requerido";
    } else {
      const [mes] = formData.vencimiento.split("/").map(Number);
      if (mes < 1 || mes > 12) {
        errors.vencimiento = "Mes no válido (01-12)";
      }
    }
    if (!formData.cvv || formData.cvv.length < 3) {
      errors.cvv = "CVV de 3 dígitos requerido";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCardNumberChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, "").slice(0, 16);
    let brand = "visa";
    if (rawVal.startsWith("4")) {
      brand = "visa";
    } else if (/^(5[1-5]|2[2-7])/.test(rawVal)) {
      brand = "mastercard";
    } else if (/^(34|37)/.test(rawVal)) {
      brand = "amex";
    } else if (rawVal.length > 0) {
      brand = "visa";
    }

    setCardBrand(brand);
    setFormData((prev) => ({ ...prev, numeroTarjeta: rawVal }));
    if (formErrors.numeroTarjeta) {
      setFormErrors((prev) => ({ ...prev, numeroTarjeta: "" }));
    }
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setFormData((prev) => ({ ...prev, vencimiento: val }));
    if (formErrors.vencimiento) {
      setFormErrors((prev) => ({ ...prev, vencimiento: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!validateFechas() || !validateForm()) return;
    if (!user?.id) {
      setSubmitError("Debes iniciar sesión para reservar.");
      return;
    }

    submittingRef.current = true;
    setIsProcessing(true);
    setSubmitError("");
    setProcessingStep(`Conectando con la red segura ${cardBrand === "visa" ? "Visa" : "Mastercard"}...`);

    try {
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
        },
        idemKeyRef.current
      );

      const reserva = res?.data?.reserva;
      const transaccion = res?.data?.transaccion;

      // El total lo calcula el servidor; se usa su valor real en el comprobante
      const totalServidor = Number(reserva?.precio_total ?? transaccion?.monto_total ?? total);

      setPagoResult({
        numAprobacion: `AUTH-${String(transaccion?.id || reserva?.id || "").padStart(6, "0")}`,
        referencia: String(reserva?.id || transaccion?.id || ""),
        metodo: metodoPago,
        brand: cardBrand,
        ultimosDigitos: formData.numeroTarjeta.slice(-4) || "4242",
        montoPrincipal: totalServidor,
        moneda,
        montoBs: esBs ? totalServidor : totalServidor * tasaCambio,
        tasa: tasaCambio,
      });

      setComprobanteOpen(true);
    } catch (err) {
      setSubmitError(err.message || "No se pudo completar la reserva.");
    } finally {
      submittingRef.current = false;
      setIsProcessing(false);
    }
  };

  const inputCls = (field) =>
    `w-full rounded-xl border ${
      formErrors[field] ? "border-red-500 ring-1 ring-red-500" : "border-slate-300 dark:border-slate-700"
    } bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-800 dark:text-slate-200 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm`;

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
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[10px] font-bold text-blue-700 dark:text-blue-300">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Pasarela Segura
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

          {/* Right Column: Visa / Mastercard Payment Gateway */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl relative">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Pago de Reserva</span>
                    <div className="flex items-center gap-1.5 ml-2">
                      <span className={`text-xs font-black italic px-2 py-0.5 rounded transition-all ${cardBrand === "visa" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 ring-1 ring-blue-500" : "opacity-40"}`}>
                        VISA
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded transition-all ${cardBrand === "mastercard" ? "bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-300 ring-1 ring-amber-500" : "opacity-40"}`}>
                        Mastercard
                      </span>
                    </div>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Acepta tarjetas de crédito y débito Visa / Mastercard nacionales e internacionales.
                  </p>
                </div>
              </div>

              {/* Method Selector */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-900 rounded-2xl border border-slate-300/60 dark:border-slate-800 mb-6">
                <button
                  type="button"
                  onClick={() => setMetodoPago("credito")}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                    metodoPago === "credito"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-950/30"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Tarjeta de Crédito
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoPago("debito")}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                    metodoPago === "debito"
                      ? "bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white shadow-md"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2" />
                    <line x1="2" y1="10" x2="22" y2="10" strokeWidth="2" />
                  </svg>
                  Tarjeta de Débito
                </button>
              </div>

              {/* Card Preview */}
              <CardPreview
                cardNumber={formData.numeroTarjeta}
                cardHolder={formData.nombreTitular}
                cardExpiry={formData.vencimiento}
                cardType={metodoPago}
                brand={cardBrand}
                cvv={formData.cvv}
              />

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Nombre del Titular (como figura en la tarjeta) *
                  </label>
                  <input
                    type="text"
                    placeholder="EJ. JUAN PEREZ"
                    value={formData.nombreTitular}
                    onChange={(e) => {
                      setFormData({ ...formData, nombreTitular: e.target.value.toUpperCase() });
                      if (formErrors.nombreTitular) setFormErrors((prev) => ({ ...prev, nombreTitular: "" }));
                    }}
                    className={inputCls("nombreTitular")}
                  />
                  {guardarError("nombreTitular")}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Número de Tarjeta Visa / Mastercard *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={19}
                      placeholder="4000 1234 5678 9010"
                      value={formData.numeroTarjeta ? formData.numeroTarjeta.replace(/(\d{4})(?=\d)/g, "$1 ") : ""}
                      onChange={handleCardNumberChange}
                      className={`w-full font-mono rounded-xl border ${
                        formErrors.numeroTarjeta ? "border-red-500 ring-1 ring-red-500" : "border-slate-300 dark:border-slate-700"
                      } bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-800 dark:text-slate-200 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm tracking-wider`}
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                      {cardBrand === "visa" && (
                        <span className="text-sm font-black italic tracking-wider text-blue-600 dark:text-blue-400">
                          VISA
                        </span>
                      )}
                      {cardBrand === "mastercard" && (
                        <div className="flex items-center -space-x-1.5">
                          <div className="w-4 h-4 rounded-full bg-[#EB001B]" />
                          <div className="w-4 h-4 rounded-full bg-[#F79E1B]" />
                        </div>
                      )}
                      {cardBrand === "amex" && (
                        <span className="text-xs font-black text-cyan-600 dark:text-cyan-400">
                          AMEX
                        </span>
                      )}
                    </div>
                  </div>
                  {guardarError("numeroTarjeta")}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Vencimiento (MM/AA) *
                    </label>
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="MM/AA"
                      value={formData.vencimiento}
                      onChange={handleExpiryChange}
                      className={`w-full font-mono rounded-xl border ${
                        formErrors.vencimiento ? "border-red-500 ring-1 ring-red-500" : "border-slate-300 dark:border-slate-700"
                      } bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-800 dark:text-slate-200 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm tracking-wider`}
                    />
                    {guardarError("vencimiento")}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Código de Seguridad (CVV) *
                      </label>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        3 dígitos al reverso
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        value={formData.cvv}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                          setFormData({ ...formData, cvv: val });
                          if (formErrors.cvv) setFormErrors((prev) => ({ ...prev, cvv: "" }));
                        }}
                        className={`w-full font-mono text-center tracking-widest rounded-xl border ${
                          formErrors.cvv ? "border-red-500 ring-1 ring-red-500" : "border-slate-300 dark:border-slate-700"
                        } bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-800 dark:text-slate-200 font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="3" y="11" width="18" height="11" rx="2" strokeWidth="2" />
                          <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" />
                        </svg>
                      </div>
                    </div>
                    {guardarError("cvv")}
                  </div>
                </div>



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

                <div className="pt-1">
                  {submitError && (
                    <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
                        <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
                      </svg>
                      <span>{submitError}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full relative group overflow-hidden py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-base shadow-xl shadow-blue-950/20 hover:shadow-2xl transition-all duration-300 disabled:opacity-75 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center gap-3">
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span>{processingStep}</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span>Pagar {totalLabel} con {cardBrand === "visa" ? "Visa" : "Mastercard"}</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>

                <div className="pt-1 text-center">
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    🔒 Transacción protegida por Visa Secure y Mastercard Identity Check.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <ComprobantePagoModal
        isOpen={comprobanteOpen}
        onClose={() => {
          setComprobanteOpen(false);
          navigate("/inmuebles");
        }}
        pagoData={pagoResult}
        inmueble={inmueble}
      />

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