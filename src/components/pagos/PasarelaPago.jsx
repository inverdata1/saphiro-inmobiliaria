import { useState, useRef } from "react";
import ComprobantePagoModal from "./ComprobantePagoModal";
import CardPreview from "./CardPreview";

export default function PasarelaPago({
  titulo = "Selecciona tu Método de Pago",
  subtitulo = "Procesamiento y débito inmediato con encriptación SSL de grado bancario.",
  montoLabel = "",
  inmueble = null,
  onSubmit,
  onComprobanteClose,
  validacionExtra,
  resumen = null,
}) {
  const [metodoPago, setMetodoPago] = useState("tarjeta"); // 'tarjeta', 'pagomovil', 'zelle', 'binance', 'paypal'
  const [tipoTarjeta, setTipoTarjeta] = useState("credito"); // 'credito' | 'debito'

  // Card Form Data
  const [cardData, setCardData] = useState({
    numeroTarjeta: "",
    nombreTitular: "",
    vencimiento: "",
    cvv: "",
  });

  // Direct Payment Methods User Credentials & Auth
  const [pagoMovilData, setPagoMovilData] = useState({
    bancoEmisor: "Banesco",
    cedulaPagador: "",
    telefonoPagador: "",
    claveDinamica: "",
  });

  const [zelleData, setZelleData] = useState({
    nombreTitular: "",
    contacto: "",
    pinAutorizacion: "",
  });

  const [binanceData, setBinanceData] = useState({
    usuarioBinance: "",
    nicknameBinance: "",
    payPin: "",
  });

  const [paypalData, setPaypalData] = useState({
    emailPaypal: "",
    nombrePaypal: "",
  });

  const [cardBrand, setCardBrand] = useState("visa");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [comprobanteOpen, setComprobanteOpen] = useState(false);
  const [pagoResult, setPagoResult] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const submittingRef = useRef(false);

  const brandNombre =
    cardBrand === "visa" ? "Visa" : cardBrand === "mastercard" ? "Mastercard" : "Tarjeta";

  const guardarError = (campo) =>
    formErrors[campo] ? (
      <p className="mt-1 text-xs text-red-500 font-medium animate-shake">{formErrors[campo]}</p>
    ) : null;

  const inputCls = (campo) =>
    `w-full rounded-xl border ${
      formErrors[campo] ? "border-red-500 ring-1 ring-red-500" : "border-slate-300 dark:border-slate-700"
    } bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-800 dark:text-slate-200 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm`;

  const validarFormulario = () => {
    const errors = {};

    if (metodoPago === "tarjeta") {
      if (!cardData.nombreTitular.trim()) {
        errors.nombreTitular = "El nombre del titular es requerido";
      }
      if (!cardData.numeroTarjeta || cardData.numeroTarjeta.length < 15) {
        errors.numeroTarjeta = "Ingrese los 16 dígitos de su tarjeta";
      }
      if (!cardData.vencimiento || cardData.vencimiento.length < 5) {
        errors.vencimiento = "Formato MM/AA requerido";
      } else {
        const [mes] = cardData.vencimiento.split("/").map(Number);
        if (mes < 1 || mes > 12) {
          errors.vencimiento = "Mes no válido (01-12)";
        }
      }
      if (!cardData.cvv || cardData.cvv.length < 3) {
        errors.cvv = "CVV de 3 o 4 dígitos requerido";
      }
    } else if (metodoPago === "pagomovil") {
      if (!pagoMovilData.cedulaPagador.trim()) {
        errors.cedulaPagador = "Cédula o RIF del titular de la cuenta requerida";
      }
      if (!pagoMovilData.telefonoPagador.trim() || pagoMovilData.telefonoPagador.length < 10) {
        errors.telefonoPagador = "Teléfono de tu cuenta Pago Móvil requerido (ej. 04121234567)";
      }
    } else if (metodoPago === "zelle") {
      if (!zelleData.nombreTitular.trim()) {
        errors.nombreZelle = "Nombre registrado en tu cuenta Zelle requerido";
      }
      if (!zelleData.contacto.trim()) {
        errors.contactoZelle = "Correo o teléfono registrado en Zelle requerido";
      }
      if (!zelleData.pinAutorizacion.trim() || zelleData.pinAutorizacion.length < 4) {
        errors.pinZelle = "Ingresa tu PIN o clave de seguridad Zelle para autorizar";
      }
    } else if (metodoPago === "binance") {
      if (!binanceData.usuarioBinance.trim()) {
        errors.usuarioBinance = "Ingresa tu Binance Pay ID o correo de tu cuenta Binance";
      }
      if (!binanceData.payPin.trim() || binanceData.payPin.length < 6) {
        errors.payPin = "Ingresa tu Pay PIN de 6 dígitos de Binance Pay";
      }
    } else if (metodoPago === "paypal") {
      if (!paypalData.emailPaypal.trim() || !paypalData.emailPaypal.includes("@")) {
        errors.emailPaypal = "Correo de tu cuenta PayPal requerido";
      }
      if (!paypalData.nombrePaypal.trim()) {
        errors.nombrePaypal = "Nombre registrado en tu cuenta PayPal requerido";
      }
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
    setCardData((prev) => ({ ...prev, numeroTarjeta: rawVal }));
    if (formErrors.numeroTarjeta) {
      setFormErrors((prev) => ({ ...prev, numeroTarjeta: "" }));
    }
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setCardData((prev) => ({ ...prev, vencimiento: val }));
    if (formErrors.vencimiento) {
      setFormErrors((prev) => ({ ...prev, vencimiento: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (validacionExtra && !validacionExtra()) return;
    if (!validarFormulario()) return;

    submittingRef.current = true;
    setIsProcessing(true);
    setSubmitError("");

    let pasoText = "Iniciando procesamiento de cobro directo...";
    if (metodoPago === "tarjeta") {
      pasoText = `Procesando cargo con la red ${brandNombre}...`;
    } else if (metodoPago === "pagomovil") {
      pasoText = "Conectando con pasarela C2P y verificando Clave Dinámica...";
    } else if (metodoPago === "zelle") {
      pasoText = "Ejecutando cobro directo en red Zelle Express...";
    } else if (metodoPago === "binance") {
      pasoText = "Procesando débito de USDT mediante Binance Pay API...";
    } else if (metodoPago === "paypal") {
      pasoText = "Autorizando cargo mediante PayPal Express Checkout...";
    }

    setProcessingStep(pasoText);

    try {
      const detallePago = {
        metodo: metodoPago,
        tipoTarjeta,
        tarjeta: cardData,
        pagomovil: pagoMovilData,
        zelle: zelleData,
        binance: binanceData,
        paypal: paypalData,
      };

      const resultado = await onSubmit({
        metodoPago,
        cardBrand,
        formData: cardData,
        detallePago,
      });

      const refAuto = `REF-${Math.floor(10000000 + Math.random() * 90000000)}`;

      const resultConMetodo = {
        ...resultado,
        metodo: metodoPago,
        referenciaMetodo: resultado?.referencia || refAuto,
        detallesMetodo: detallePago,
      };

      setPagoResult(resultConMetodo);
      setComprobanteOpen(true);
    } catch (err) {
      setSubmitError(err?.message || "No se pudo procesar el pago de forma directa. Revisa tus datos e inténtalo de nuevo.");
    } finally {
      submittingRef.current = false;
      setIsProcessing(false);
    }
  };

  const cerrarComprobante = () => {
    setComprobanteOpen(false);
    onComprobanteClose?.();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl relative transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{titulo}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitulo}</p>
        </div>
      </div>

      {/* Payment Method Selector Tabs */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
          Selecciona cómo deseas pagar:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
          {/* Card Tab */}
          <button
            type="button"
            onClick={() => {
              setMetodoPago("tarjeta");
              setFormErrors({});
            }}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metodoPago === "tarjeta"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-950/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2" />
              <line x1="2" y1="10" x2="22" y2="10" strokeWidth="2" />
            </svg>
            <span>Tarjeta</span>
          </button>

          {/* Pago Móvil Tab */}
          <button
            type="button"
            onClick={() => {
              setMetodoPago("pagomovil");
              setFormErrors({});
            }}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metodoPago === "pagomovil"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="7" y="2" width="10" height="20" rx="2" strokeWidth="2" />
              <path d="M11 18h2" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>Pago Móvil C2P</span>
          </button>

          {/* Zelle Tab */}
          <button
            type="button"
            onClick={() => {
              setMetodoPago("zelle");
              setFormErrors({});
            }}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metodoPago === "zelle"
                ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md shadow-purple-950/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
            }`}
          >
            <span className="font-black text-sm tracking-tighter">zelle</span>
            <span>Zelle</span>
          </button>

          {/* Binance Tab */}
          <button
            type="button"
            onClick={() => {
              setMetodoPago("binance");
              setFormErrors({});
            }}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metodoPago === "binance"
                ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-md shadow-amber-950/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L6 8l2 2 4-4 4 4 2-2-6-6zm-6 8l-2 2 8 8 8-8-2-2-6 6-6-6zm0 4l-2 2 8 8 8-8-2-2-6 6-6-6z" />
            </svg>
            <span>Binance Pay</span>
          </button>

          {/* PayPal Tab */}
          <button
            type="button"
            onClick={() => {
              setMetodoPago("paypal");
              setFormErrors({});
            }}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metodoPago === "paypal"
                ? "bg-gradient-to-r from-sky-500 to-blue-700 text-white shadow-md shadow-blue-950/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
            }`}
          >
            <span className="font-black italic text-xs tracking-wider">PayPal</span>
            <span>PayPal</span>
          </button>
        </div>
      </div>

      {/* Card Preview y Selector Crédito / Débito (solo con método tarjeta) */}
      {metodoPago === "tarjeta" && (
        <>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => setTipoTarjeta("credito")}
              className={`py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                tipoTarjeta === "credito"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Tarjeta de Crédito
            </button>
            <button
              type="button"
              onClick={() => setTipoTarjeta("debito")}
              className={`py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                tipoTarjeta === "debito"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Tarjeta de Débito
            </button>
          </div>

          <CardPreview
            cardNumber={cardData.numeroTarjeta}
            cardHolder={cardData.nombreTitular}
            cardExpiry={cardData.vencimiento}
            cardType={tipoTarjeta}
            brand={cardBrand}
            cvv={cardData.cvv}
          />
        </>
      )}

      {/* ── FORM CONTENT DIRECTLY BELOW TABS ── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* TARJETA FORM FIELDS */}
        {metodoPago === "tarjeta" && (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Nombre del Titular (como figura en la tarjeta) *
              </label>
              <input
                type="text"
                placeholder="EJ. JUAN PEREZ"
                value={cardData.nombreTitular}
                onChange={(e) => {
                  setCardData({ ...cardData, nombreTitular: e.target.value.toUpperCase() });
                  if (formErrors.nombreTitular) setFormErrors((prev) => ({ ...prev, nombreTitular: "" }));
                }}
                className={inputCls("nombreTitular")}
              />
              {guardarError("nombreTitular")}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Número de Tarjeta Visa / Mastercard / AMEX *
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={19}
                  placeholder="4000 1234 5678 9010"
                  value={cardData.numeroTarjeta ? cardData.numeroTarjeta.replace(/(\d{4})(?=\d)/g, "$1 ") : ""}
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
                  value={cardData.vencimiento}
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
                    CVV *
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {tipoTarjeta === "credito" ? "4 dígitos" : "3 dígitos"}
                  </span>
                </div>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="•••"
                  value={cardData.cvv}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setCardData({ ...cardData, cvv: val });
                    if (formErrors.cvv) setFormErrors((prev) => ({ ...prev, cvv: "" }));
                  }}
                  className={`w-full font-mono text-center tracking-widest rounded-xl border ${
                    formErrors.cvv ? "border-red-500 ring-1 ring-red-500" : "border-slate-300 dark:border-slate-700"
                  } bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-800 dark:text-slate-200 font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm`}
                />
                {guardarError("cvv")}
              </div>
            </div>
          </>
        )}

        {/* PAGO MÓVIL FORM */}
        {metodoPago === "pagomovil" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Tu Banco Emisor *
                </label>
                <select
                  value={pagoMovilData.bancoEmisor}
                  onChange={(e) => setPagoMovilData({ ...pagoMovilData, bancoEmisor: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-800 dark:text-slate-200 font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm cursor-pointer"
                >
                  <option value="Banesco">Banesco</option>
                  <option value="Mercantil">Banco Mercantil</option>
                  <option value="BBVA Provincial">BBVA Provincial</option>
                  <option value="Banco de Venezuela">Banco de Venezuela (BDV)</option>
                  <option value="BNC">Banco Nacional de Crédito (BNC)</option>
                  <option value="Bancaribe">Bancaribe</option>
                  <option value="Banplus">Banplus</option>
                  <option value="Otro">Otro Banco Nacional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Cédula / RIF del Titular *
                </label>
                <input
                  type="text"
                  placeholder="V-12345678"
                  value={pagoMovilData.cedulaPagador}
                  onChange={(e) => {
                    setPagoMovilData({ ...pagoMovilData, cedulaPagador: e.target.value.toUpperCase() });
                    if (formErrors.cedulaPagador) setFormErrors((prev) => ({ ...prev, cedulaPagador: "" }));
                  }}
                  className={inputCls("cedulaPagador")}
                />
                {guardarError("cedulaPagador")}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Teléfono Afiliado a tu Pago Móvil *
              </label>
              <input
                type="tel"
                placeholder="04121234567"
                value={pagoMovilData.telefonoPagador}
                onChange={(e) => {
                  setPagoMovilData({ ...pagoMovilData, telefonoPagador: e.target.value.replace(/\D/g, "") });
                  if (formErrors.telefonoPagador) setFormErrors((prev) => ({ ...prev, telefonoPagador: "" }));
                }}
                className={inputCls("telefonoPagador")}
              />
              {guardarError("telefonoPagador")}
            </div>
          </div>
        )}

        {/* ZELLE DIRECT FORM */}
        {metodoPago === "zelle" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Nombre del Titular Registrado en tu Zelle *
              </label>
              <input
                type="text"
                placeholder="EJ. ROBERT JOHNSON"
                value={zelleData.nombreTitular}
                onChange={(e) => {
                  setZelleData({ ...zelleData, nombreTitular: e.target.value.toUpperCase() });
                  if (formErrors.nombreZelle) setFormErrors((prev) => ({ ...prev, nombreZelle: "" }));
                }}
                className={inputCls("nombreZelle")}
              />
              {guardarError("nombreZelle")}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Correo o Teléfono de tu Zelle *
                </label>
                <input
                  type="text"
                  placeholder="tucorreo@ejemplo.com"
                  value={zelleData.contacto}
                  onChange={(e) => {
                    setZelleData({ ...zelleData, contacto: e.target.value });
                    if (formErrors.contactoZelle) setFormErrors((prev) => ({ ...prev, contactoZelle: "" }));
                  }}
                  className={inputCls("contactoZelle")}
                />
                {guardarError("contactoZelle")}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  PIN de Autorización / Clave Zelle *
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="••••••"
                  value={zelleData.pinAutorizacion}
                  onChange={(e) => {
                    setZelleData({ ...zelleData, pinAutorizacion: e.target.value });
                    if (formErrors.pinZelle) setFormErrors((prev) => ({ ...prev, pinZelle: "" }));
                  }}
                  className={inputCls("pinZelle")}
                />
                {guardarError("pinZelle")}
              </div>
            </div>
          </div>
        )}

        {/* BINANCE PAY DIRECT FORM */}
        {metodoPago === "binance" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Tu Binance Pay ID o Email Registrado *
              </label>
              <input
                type="text"
                placeholder="Ej. 284719204 o correo@binance.com"
                value={binanceData.usuarioBinance}
                onChange={(e) => {
                  setBinanceData({ ...binanceData, usuarioBinance: e.target.value });
                  if (formErrors.usuarioBinance) setFormErrors((prev) => ({ ...prev, usuarioBinance: "" }));
                }}
                className={inputCls("usuarioBinance")}
              />
              {guardarError("usuarioBinance")}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Nickname de Binance (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="@mi_nickname"
                  value={binanceData.nicknameBinance}
                  onChange={(e) => setBinanceData({ ...binanceData, nicknameBinance: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-800 dark:text-slate-200 font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Tu Binance Pay PIN (6 dígitos) *
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="••••••"
                  value={binanceData.payPin}
                  onChange={(e) => {
                    setBinanceData({ ...binanceData, payPin: e.target.value.replace(/\D/g, "") });
                    if (formErrors.payPin) setFormErrors((prev) => ({ ...prev, payPin: "" }));
                  }}
                  className={`w-full font-mono text-center tracking-widest rounded-xl border ${
                    formErrors.payPin ? "border-red-500 ring-1 ring-red-500" : "border-slate-300 dark:border-slate-700"
                  } bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-800 dark:text-slate-200 font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm`}
                />
                {guardarError("payPin")}
              </div>
            </div>
          </div>
        )}

        {/* PAYPAL DIRECT FORM */}
        {metodoPago === "paypal" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Correo Electrónico de Tu Cuenta PayPal *
              </label>
              <input
                type="email"
                placeholder="tucorreo@ejemplo.com"
                value={paypalData.emailPaypal}
                onChange={(e) => {
                  setPaypalData({ ...paypalData, emailPaypal: e.target.value });
                  if (formErrors.emailPaypal) setFormErrors((prev) => ({ ...prev, emailPaypal: "" }));
                }}
                className={inputCls("emailPaypal")}
              />
              {guardarError("emailPaypal")}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Nombre Completo del Titular en PayPal *
              </label>
              <input
                type="text"
                placeholder="EJ. JUAN PEREZ"
                value={paypalData.nombrePaypal}
                onChange={(e) => {
                  setPaypalData({ ...paypalData, nombrePaypal: e.target.value.toUpperCase() });
                  if (formErrors.nombrePaypal) setFormErrors((prev) => ({ ...prev, nombrePaypal: "" }));
                }}
                className={inputCls("nombrePaypal")}
              />
              {guardarError("nombrePaypal")}
            </div>
          </div>
        )}

        {resumen}

        {/* Submit Error */}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing}
            className={`w-full relative group overflow-hidden py-4 px-6 rounded-2xl font-extrabold text-base shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-75 cursor-pointer disabled:cursor-not-allowed ${
              metodoPago === "pagomovil"
                ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-emerald-950/20"
                : metodoPago === "zelle"
                ? "bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 text-white shadow-purple-950/20"
                : metodoPago === "binance"
                ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 shadow-amber-950/20"
                : metodoPago === "paypal"
                ? "bg-gradient-to-r from-sky-600 via-blue-600 to-sky-700 text-white shadow-blue-950/20"
                : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-blue-950/20"
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-current" viewBox="0 0 24 24" fill="none">
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
                  <span>
                    Pagar {montoLabel} con{" "}
                    {metodoPago === "tarjeta"
                      ? brandNombre
                      : metodoPago === "pagomovil"
                      ? "Pago Móvil C2P"
                      : metodoPago === "zelle"
                      ? "Zelle Directo"
                      : metodoPago === "binance"
                      ? "Binance Pay"
                      : "PayPal Checkout"}
                  </span>
                </>
              )}
            </div>
          </button>
        </div>
      </form>

      {/* Comprobante Modal */}
      <ComprobantePagoModal
        isOpen={comprobanteOpen}
        onClose={cerrarComprobante}
        pagoData={pagoResult}
        inmueble={inmueble}
      />
    </div>
  );
}