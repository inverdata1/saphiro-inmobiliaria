import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import CardPreview from "../../components/pagos/CardPreview";
import ComprobantePagoModal from "../../components/pagos/ComprobantePagoModal";
import { apiGet, apiPost } from "../../api";
import { useAuth } from "../../context/useAuth";

export default function PasarelaPagoPage() {
  const { inmuebleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const submittingRef = useRef(false);

  // Selected tab: 'credito' | 'debito'
  const [metodoPago, setMetodoPago] = useState("credito");

  // Property info
  const [inmueble, setInmueble] = useState(
    location.state?.inmueble || {
      id: inmuebleId || 101,
      titulo: "Reserva de Inmueble - Apartamento Exclusivo",
      precio: 500, // Monto de reserva
      ciudad: "Caracas",
      estado: "Distrito Capital",
      codigo: "INM-2026-04",
    }
  );

  // Moneda del inmueble: USD | EUR | BS
  const moneda = String(inmueble?.moneda || "USD").toUpperCase();
  const esBs = moneda === "BS";

  // Tasas de cambio BCV obtenidas desde el backend
  const TASA_FALLBACK_DOLAR = 54.5;
  const TASA_FALLBACK_EURO = 58.32;
  const [tasasData, setTasasData] = useState(null);

  // Tasa aplicable según la moneda del inmueble
  const tasaDia = tasasData
    ? moneda === "EUR"
      ? Number(tasasData.bcv_euro)
      : Number(tasasData.bcv_dolar)
    : null;
  const tasaCambio = esBs ? null : tasaDia ?? (moneda === "EUR" ? TASA_FALLBACK_EURO : TASA_FALLBACK_DOLAR);
  const tasaEsReal = Boolean(tasasData);

  const precio = Number(inmueble?.precio || 500);
  const montoPrincipal = precio;
  const montoBs = esBs ? precio : precio * (tasaCambio || 1);

  const fmtMonto = (n) => Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 });
  const fmtBs = (n) => Number(n).toLocaleString("es-VE", { minimumFractionDigits: 2 });
  const simbolo = moneda === "EUR" ? "" : "$";
  const sufijoMoneda = moneda === "EUR" ? "€" : moneda === "USD" ? "USD" : "";
  const montoPrincipalLabel = esBs
    ? `Bs. ${fmtBs(precio)}`
    : `${simbolo}${fmtMonto(montoPrincipal)}${sufijoMoneda ? ` ${sufijoMoneda}` : ""}`;

  // Card Form State
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

  // Fetch real property if inmuebleId is provided and state was not passed
  useEffect(() => {
    if (inmuebleId && !location.state?.inmueble) {
      apiGet(`/inmuebles/${inmuebleId}`)
        .then((res) => {
          if (res?.data) {
            setInmueble({
              ...res.data,
              precio: res.data.precio > 5000 ? 500 : res.data.precio,
            });
          }
        })
        .catch(() => {
          // Keep mock fallback
        });
    }
  }, [inmuebleId, location.state]);

  // Obtener las tasas BCV del día desde el backend
  useEffect(() => {
    apiGet("/tasas/actual")
      .then((res) => {
        if (res?.data) setTasasData(res.data);
      })
      .catch(() => {
        // Fallback
      });
  }, []);

  // Redirect if property is sold/rented
  useEffect(() => {
    if (inmueble?.estatus === "vendido" || inmueble?.estatus === "alquilado") {
      navigate("/", { replace: true });
    }
  }, [inmueble?.estatus, navigate]);

  // Detect card brand (Visa, Mastercard, Amex)
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

  // Expiry date formatter (MM/AA)
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
      errors.cvv = "CVV de 3 o 4 dígitos requerido";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!validateForm()) return;

    if (!user?.id) {
      setSubmitError("Debes iniciar sesión para completar el pago.");
      return;
    }
    if (!inmuebleId) {
      setSubmitError("No se identificó el inmueble a pagar.");
      return;
    }

    submittingRef.current = true;
    setIsProcessing(true);
    setSubmitError("");
    setProcessingStep(`Conectando con la red segura ${cardBrand === "visa" ? "Visa" : "Mastercard"}...`);

    try {
      const res = await apiPost(
        "/transacciones/pago",
        {
          inmueble_id: Number(inmuebleId),
          cliente_id: Number(user.id),
          monto: Number(montoPrincipal),
          moneda,
          metodo_pago: metodoPago,
          codigo_seguridad: formData.cvv,
          numero_tarjeta: formData.numeroTarjeta,
          marca_tarjeta: cardBrand,
        }
      );

      const data = res?.data;

      setPagoResult({
        numAprobacion: `AUTH-${String(data?.transaccion_id || "").padStart(6, "0")}`,
        referencia: String(data?.transaccion_id || ""),
        metodo: metodoPago,
        brand: cardBrand,
        ultimosDigitos: formData.numeroTarjeta.slice(-4) || "4242",
        montoPrincipal: Number(data?.monto ?? montoPrincipal),
        moneda: data?.moneda || moneda,
        montoBs,
        tasa: tasaCambio,
      });

      setComprobanteOpen(true);
      setIsProcessing(false);
      submittingRef.current = false;
    } catch (err) {
      setSubmitError(err?.message || "No se pudo completar el pago. Inténtalo de nuevo.");
      setIsProcessing(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Breadcrumb */}
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
              Pasarela Segura
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[10px] font-bold text-blue-700 dark:text-blue-300">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              SSL 256-bit
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ──────── LEFT COLUMN: Card Preview & Payment Method Selector ──────── */}
          <div className="lg:col-span-5 space-y-6">
            {/* Header / Instructions */}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Pasarela de Pago
                </h1>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Paga de forma rápida y segura con tus tarjetas <strong className="text-slate-700 dark:text-slate-200">Visa</strong> o <strong className="text-slate-700 dark:text-slate-200">Mastercard</strong> nacionales e internacionales.
              </p>
            </div>

            {/* Method Tabs (Crédito / Débito) */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-900 rounded-2xl border border-slate-300/60 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMetodoPago("credito")}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                  metodoPago === "credito"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/30"
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

            {/* Interactive Visa / Mastercard Card Preview */}
            <CardPreview
              cardNumber={formData.numeroTarjeta}
              cardHolder={formData.nombreTitular}
              cardExpiry={formData.vencimiento}
              cardType={metodoPago}
              brand={cardBrand}
              cvv={formData.cvv}
            />

            {/* Supported Networks Banner */}
            <div className="flex items-center justify-around py-3 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                <span className="text-lg font-black italic tracking-wider text-blue-700 dark:text-blue-400">
                  VISA
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  Verified
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex items-center -space-x-2">
                  <div className="w-5 h-5 rounded-full bg-[#EB001B]" />
                  <div className="w-5 h-5 rounded-full bg-[#F79E1B]" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  ID Check
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  PCI Compliant
                </span>
              </div>
            </div>

            {/* Transaction Summary Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <span>Resumen de la Transacción</span>
                {!esBs && (
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    Tasa BCV: {tasaCambio?.toFixed(2)} Bs/{moneda === "EUR" ? "€" : "$"}
                  </span>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400 truncate max-w-[220px]">
                    {inmueble?.titulo || "Concepto de Pago"}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                    {montoPrincipalLabel}
                  </span>
                </div>

                {!esBs && (
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Equivalente en Bolívares:</span>
                    <span className="font-mono font-medium">
                      Bs. {fmtBs(montoBs)}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 dark:text-white text-base">Total a Pagar:</span>
                <div className="text-right">
                  <span className="text-xl font-black text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    {esBs ? `Bs. ${fmtBs(montoBs)}` : montoPrincipalLabel}
                  </span>
                  {!esBs && (
                    <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                      ≈ Bs. {fmtBs(montoBs)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ──────── RIGHT COLUMN: Visa/Mastercard Payment Form ──────── */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl relative">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Datos de la Tarjeta</span>
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
                    Procesamiento seguro internacional con encriptación de grado bancario.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Cardholder Name */}
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
                      if (formErrors.nombreTitular) setFormErrors({ ...formErrors, nombreTitular: "" });
                    }}
                    className={`w-full rounded-xl border ${
                      formErrors.nombreTitular ? "border-red-500 ring-1 ring-red-500" : "border-slate-300 dark:border-slate-700"
                    } bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-800 dark:text-slate-200 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm uppercase`}
                  />
                  {formErrors.nombreTitular && (
                    <p className="mt-1 text-xs text-red-500 font-medium">{formErrors.nombreTitular}</p>
                  )}
                </div>

                {/* Card Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Número de Tarjeta Visa / Mastercard *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={19}
                      placeholder="4000 1234 5678 9010"
                      value={
                        formData.numeroTarjeta
                          ? formData.numeroTarjeta.replace(/(\d{4})(?=\d)/g, "$1 ")
                          : ""
                      }
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
                  {formErrors.numeroTarjeta && (
                    <p className="mt-1 text-xs text-red-500 font-medium">{formErrors.numeroTarjeta}</p>
                  )}
                </div>

                {/* Expiry and CVV */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Expiration */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Fecha de Vencimiento (MM/AA) *
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
                    {formErrors.vencimiento && (
                      <p className="mt-1 text-xs text-red-500 font-medium">{formErrors.vencimiento}</p>
                    )}
                  </div>

                  {/* CVV / CVC */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Código de Seguridad (CVV / CVC) *
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        value={formData.cvv}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                          setFormData({ ...formData, cvv: val });
                          if (formErrors.cvv) setFormErrors({ ...formErrors, cvv: "" });
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
                    {formErrors.cvv && (
                      <p className="mt-1 text-xs text-red-500 font-medium">{formErrors.cvv}</p>
                    )}
                  </div>
                </div>



                {/* Submit error banner */}
                {submitError && (
                  <div className="pt-1">
                    <div className="flex items-start gap-2.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                      <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">{submitError}</span>
                    </div>
                  </div>
                )}

                {/* Submit Action Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full relative group overflow-hidden py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-base shadow-xl shadow-blue-900/25 hover:shadow-2xl transition-all duration-300 disabled:opacity-75 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center gap-3">
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>{processingStep}</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span>
                            Pagar {montoPrincipalLabel} con {cardBrand === "visa" ? "Visa" : "Mastercard"}
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Result Voucher / Comprobante Modal */}
      <ComprobantePagoModal
        isOpen={comprobanteOpen}
        onClose={() => {
          setComprobanteOpen(false);
          navigate("/inmuebles");
        }}
        pagoData={pagoResult}
        inmueble={inmueble}
      />
    </div>
  );
}
