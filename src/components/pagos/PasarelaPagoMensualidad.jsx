import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import CardPreview from "./CardPreview";
import { apiGet } from "../../api";

// Bancos de Venezuela para Pago Móvil C2P
const BANCOS_VENEZUELA = [
  { codigo: "0134", nombre: "Banesco Banco Universal" },
  { codigo: "0102", nombre: "Banco de Venezuela" },
  { codigo: "0105", nombre: "Banco Mercantil" },
  { codigo: "0108", nombre: "BBVA Banco Provincial" },
  { codigo: "0191", nombre: "Banco Nacional de Crédito (BNC)" },
  { codigo: "0114", nombre: "Bancaribe" },
  { codigo: "0172", nombre: "Bancamiga Banco Universal" },
  { codigo: "0104", nombre: "Banco Venezolano de Crédito" },
  { codigo: "0115", nombre: "Banco Exterior" },
  { codigo: "0128", nombre: "Banco Caroní" },
];

export default function PasarelaPagoMensualidad({
  contrato,
  cuotaInicial = null,
  cuotasDisponibles = [],
  onPagoExitoso,
  onCerrar,
  esModal = false,
}) {
  // Cuota activa seleccionada
  const [cuotaActiva, setCuotaActiva] = useState(
    cuotaInicial ||
      contrato?.mensualidades?.find((m) => m.estado?.toLowerCase() === "pendiente") ||
      contrato?.mensualidades?.[0] || {
        id: 10,
        numero: 10,
        mes: "Octubre 2024",
        vencimiento: "01 oct 2024",
        importe: contrato?.precioMensual || 24000,
        estado: "Pendiente",
      }
  );

  // Método de pago
  const [metodoPago, setMetodoPago] = useState("tarjeta"); // 'tarjeta' | 'pagomovil' | 'zelle' | 'binance' | 'paypal'
  const [tipoTarjeta, setTipoTarjeta] = useState("credito"); // 'credito' | 'debito'
  const [cardBrand, setCardBrand] = useState("visa");

  // Datos formularios
  const [cardData, setCardData] = useState({
    numeroTarjeta: "",
    nombreTitular: "",
    vencimiento: "",
    cvv: "",
  });

  const [pagoMovilData, setPagoMovilData] = useState({
    bancoEmisor: "0134",
    tipoDocumento: "V",
    cedulaPagador: "",
    telefonoPrefijo: "0414",
    telefonoNumero: "",
    claveDinamica: "",
  });

  const [zelleData, setZelleData] = useState({
    nombreTitular: "",
    contacto: "",
    referenciaZelle: "",
  });

  const [binanceData, setBinanceData] = useState({
    binanceId: "",
    payPin: "",
  });

  const [paypalData, setPaypalData] = useState({
    emailPaypal: "",
    nombrePaypal: "",
  });

  // Tasas de cambio BCV
  const TASA_FALLBACK_DOLAR = 54.5;
  const TASA_FALLBACK_EURO = 58.32;
  const [tasasData, setTasasData] = useState(null);

  useEffect(() => {
    apiGet("/tasas/actual")
      .then((res) => {
        if (res?.data) setTasasData(res.data);
      })
      .catch(() => {});
  }, []);

  const moneda = String(contrato?.moneda || "USD").toUpperCase();
  const esBs = moneda === "BS";
  const tasaDia = tasasData
    ? moneda === "EUR"
      ? Number(tasasData.bcv_euro)
      : Number(tasasData.bcv_dolar)
    : null;
  const tasaCambio = esBs ? 1 : tasaDia ?? (moneda === "EUR" ? TASA_FALLBACK_EURO : TASA_FALLBACK_DOLAR);

  const importe = Number(cuotaActiva?.importe || contrato?.precioMensual || 0);
  const montoBs = esBs ? importe : importe * tasaCambio;

  // Estados de validación y procesamiento
  const [formErrors, setFormErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0); // 1, 2, 3
  const [processingText, setProcessingText] = useState("");
  const [reciboEmitido, setReciboEmitido] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const isSubmittingRef = useRef(false);

  // Lista de cuotas pendientes para selector rápido
  const todasLasCuotas = contrato?.mensualidades || cuotasDisponibles || [];
  const cuotasPendientes = todasLasCuotas.filter((c) => c.estado?.toLowerCase() === "pendiente");

  // Manejo de número de tarjeta
  const handleCardNumberChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, "").slice(0, 16);
    let brand = "visa";
    if (rawVal.startsWith("4")) brand = "visa";
    else if (/^(5[1-5]|2[2-7])/.test(rawVal)) brand = "mastercard";
    else if (/^(34|37)/.test(rawVal)) brand = "amex";

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

  const validarFormulario = () => {
    const errors = {};

    if (metodoPago === "tarjeta") {
      if (!cardData.nombreTitular.trim()) {
        errors.nombreTitular = "El nombre del titular es requerido";
      }
      if (!cardData.numeroTarjeta || cardData.numeroTarjeta.length < 15) {
        errors.numeroTarjeta = "Ingresa los 16 dígitos de tu tarjeta";
      }
      if (!cardData.vencimiento || cardData.vencimiento.length < 5) {
        errors.vencimiento = "Formato MM/AA requerido";
      } else {
        const [mes] = cardData.vencimiento.split("/").map(Number);
        if (mes < 1 || mes > 12) errors.vencimiento = "Mes no válido (01-12)";
      }
      if (!cardData.cvv || cardData.cvv.length < 3) {
        errors.cvv = "CVV de 3 o 4 dígitos requerido";
      }
    } else if (metodoPago === "pagomovil") {
      if (!pagoMovilData.cedulaPagador.trim() || pagoMovilData.cedulaPagador.length < 6) {
        errors.cedulaPagador = "Cédula o RIF inválido";
      }
      if (!pagoMovilData.telefonoNumero.trim() || pagoMovilData.telefonoNumero.length < 7) {
        errors.telefonoNumero = "Número de teléfono incompleto (7 dígitos)";
      }
      if (!pagoMovilData.claveDinamica.trim() || pagoMovilData.claveDinamica.length < 4) {
        errors.claveDinamica = "Ingresa tu Clave Dinámica C2P / Token SMS";
      }
    } else if (metodoPago === "zelle") {
      if (!zelleData.nombreTitular.trim()) {
        errors.nombreTitular = "Nombre del titular Zelle requerido";
      }
      if (!zelleData.contacto.trim() || (!zelleData.contacto.includes("@") && zelleData.contacto.length < 7)) {
        errors.contacto = "Correo o teléfono registrado en Zelle requerido";
      }
      if (!zelleData.referenciaZelle.trim()) {
        errors.referenciaZelle = "Ingresa la referencia o identificador del pago Zelle";
      }
    } else if (metodoPago === "binance") {
      if (!binanceData.binanceId.trim()) {
        errors.binanceId = "Binance Pay ID o correo requerido";
      }
      if (!binanceData.payPin.trim() || binanceData.payPin.length < 6) {
        errors.payPin = "Ingresa tu PIN de 6 dígitos de Binance Pay";
      }
    } else if (metodoPago === "paypal") {
      if (!paypalData.emailPaypal.trim() || !paypalData.emailPaypal.includes("@")) {
        errors.emailPaypal = "Correo electrónico de PayPal requerido";
      }
      if (!paypalData.nombrePaypal.trim()) {
        errors.nombrePaypal = "Nombre del titular de la cuenta requerido";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Procesamiento interactivo visual de pago
  const handleProcesarPago = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    if (!validarFormulario()) return;

    isSubmittingRef.current = true;
    setIsProcessing(true);
    setProcessingStep(1);
    setProcessingText("Validando datos del contrato y cuota mensual...");

    try {
      // Simulación de paso 1
      await new Promise((r) => setTimeout(r, 700));
      setProcessingStep(2);
      if (metodoPago === "tarjeta") {
        setProcessingText(`Conectando con la red ${cardBrand.toUpperCase()} y autorizando débito...`);
      } else if (metodoPago === "pagomovil") {
        setProcessingText("Conectando con red interbancaria C2P y verificando Clave Dinámica...");
      } else if (metodoPago === "zelle") {
        setProcessingText("Verificando confirmación en red Zelle Express...");
      } else if (metodoPago === "binance") {
        setProcessingText("Procesando débito de USDT mediante Binance Pay API...");
      } else {
        setProcessingText("Autorizando transacción con PayPal Express...");
      }

      // Simulación de paso 2
      await new Promise((r) => setTimeout(r, 900));
      setProcessingStep(3);
      setProcessingText("Pago aprobado con éxito. Generando recibo oficial de mensualidad...");

      await new Promise((r) => setTimeout(r, 600));

      // Generación de recibo oficial
      const numFactura = `FAC-${new Date().getFullYear()}-${String(cuotaActiva.numero || 1).padStart(3, "0")}${Math.floor(10 + Math.random() * 90)}`;
      const numAprobacion = `AUTH-MENS-${Math.floor(100000 + Math.random() * 900000)}`;
      const fechaHoy = new Date().toLocaleString("es-VE", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      let metodoNombre = "Tarjeta de Crédito";
      if (metodoPago === "tarjeta") {
        metodoNombre = `${tipoTarjeta === "debito" ? "Tarjeta de Débito" : "Tarjeta de Crédito"} (${cardBrand.toUpperCase()} •••• ${cardData.numeroTarjeta.slice(-4) || "8821"})`;
      } else if (metodoPago === "pagomovil") {
        const bancoObj = BANCOS_VENEZUELA.find((b) => b.codigo === pagoMovilData.bancoEmisor);
        metodoNombre = `Pago Móvil C2P (${bancoObj ? bancoObj.nombre.split(" ")[0] : "Banesco"} - Tlf: ${pagoMovilData.telefonoPrefijo}•••${pagoMovilData.telefonoNumero.slice(-4) || "1234"})`;
      } else if (metodoPago === "zelle") {
        metodoNombre = `Zelle Express (${zelleData.contacto || "titular@correo.com"})`;
      } else if (metodoPago === "binance") {
        metodoNombre = `Binance Pay USDT (ID: ${binanceData.binanceId || "82910291"})`;
      } else if (metodoPago === "paypal") {
        metodoNombre = `PayPal Express (${paypalData.emailPaypal || "cliente@paypal.com"})`;
      }

      const resultado = {
        cuotaId: cuotaActiva.id,
        cuotaNumero: cuotaActiva.numero,
        cuotaMes: cuotaActiva.mes,
        monto: importe,
        montoBs,
        moneda,
        tasaCambio,
        factura: numFactura,
        aprobacion: numAprobacion,
        fechaPago: fechaHoy,
        metodo: metodoNombre,
        metodoKey: metodoPago,
        contratoTitulo: contrato?.titulo || "Inmueble de Alquiler",
        contratoCodigo: contrato?.codigo || "R-001",
        propietario: contrato?.propietario || "Arrendador Asignado",
        cliente: contrato?.cliente || "Inquilino Arrendatario",
      };

      setReciboEmitido(resultado);
      onPagoExitoso?.(resultado);
    } catch {
      // Error handling
    } finally {
      setIsProcessing(false);
      isSubmittingRef.current = false;
    }
  };

  const copiarEnlaceRecibo = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const inputCls = (campo) =>
    `w-full rounded-xl border ${
      formErrors[campo] ? "border-red-500 ring-2 ring-red-500/20" : "border-slate-300 dark:border-slate-700"
    } bg-slate-50 dark:bg-slate-800/90 px-4 py-2.5 text-slate-800 dark:text-slate-100 font-medium text-xs sm:text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all outline-none`;

  const errorText = (campo) =>
    formErrors[campo] ? (
      <p className="mt-1 text-[11px] text-red-500 font-medium flex items-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {formErrors[campo]}
      </p>
    ) : null;

  // ─────────────────────────────────────────────────────────────
  // VISTA: RECIBO OFICIAL DE PAGO EMITIDO CON ÉXITO
  // ─────────────────────────────────────────────────────────────
  if (reciboEmitido) {
    return (
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl mx-auto shadow-2xl relative overflow-hidden animate-fade-in text-slate-900 dark:text-white">
        {/* Banda superior de color decorativa */}
        <div className="absolute top-0 inset-x-0 h-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-[#470A68]" />

        {/* Icono de éxito y encabezado */}
        <div className="text-center pt-2 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/20 animate-bounce-once">
            <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 uppercase tracking-wider mb-2">
            Pago Procesado Exitosamente
          </span>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Recibo Digital de Mensualidad
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tu mensualidad ha sido acreditada al contrato de arriendo de forma inmediata.
          </p>
        </div>

        {/* Resumen del Recibo */}
        <div className="py-5 space-y-4">
          {/* Monto Destacado */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#18181c] rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Cuota Cancelada
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Cuota #{reciboEmitido.cuotaNumero} • {reciboEmitido.cuotaMes}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                {reciboEmitido.contratoTitulo}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 block">
                ${reciboEmitido.monto.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              {!esBs && (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block font-mono">
                  ≈ Bs. {reciboEmitido.montoBs.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </div>

          {/* Detalles de la Transacción */}
          <div className="space-y-2 text-xs bg-slate-50/60 dark:bg-[#16161a] p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/70">
            <div className="flex justify-between py-1 border-b border-slate-200/40 dark:border-slate-800/40">
              <span className="text-slate-500 dark:text-slate-400">N° Factura:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{reciboEmitido.factura}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/40 dark:border-slate-800/40">
              <span className="text-slate-500 dark:text-slate-400">Código de Aprobación:</span>
              <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{reciboEmitido.aprobacion}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/40 dark:border-slate-800/40">
              <span className="text-slate-500 dark:text-slate-400">Fecha y hora de pago:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{reciboEmitido.fechaPago}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/40 dark:border-slate-800/40">
              <span className="text-slate-500 dark:text-slate-400">Método utilizado:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[240px] text-right">{reciboEmitido.metodo}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/40 dark:border-slate-800/40">
              <span className="text-slate-500 dark:text-slate-400">Arrendador / Propietario:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{reciboEmitido.propietario}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 dark:text-slate-400">Inquilino / Pagador:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{reciboEmitido.cliente}</span>
            </div>
          </div>

          {/* QR de Validación Inmobiliaria */}
          <div className="flex items-center justify-between p-3.5 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl border border-purple-200/60 dark:border-purple-800/40">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Validado por Saphiro Inmobiliaria</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Sello Digital #VERIF-{reciboEmitido.cuotaId}992
              </p>
            </div>
            <div className="p-1 bg-white rounded-lg shadow-sm shrink-0">
              <QRCodeSVG
                value={`https://saphiroinmobiliaria.com/recibo/${reciboEmitido.factura}`}
                size={54}
                level="M"
              />
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={copiarEnlaceRecibo}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copiado ? "¡Enlace copiado!" : "Copiar enlace"}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-white transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir Recibo
          </button>

          <button
            type="button"
            onClick={() => {
              setReciboEmitido(null);
              onCerrar?.();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#470A68] hover:bg-[#5a0e82] text-white text-xs font-extrabold transition active:scale-95 cursor-pointer shadow-md shadow-purple-950/20"
          >
            Continuar a Mensualidades
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // VISTA: PASARELA PRINCIPAL DE PAGO DE MENSUALIDAD
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      className={`bg-white dark:bg-[#121215] border border-slate-200 dark:border-slate-800 rounded-3xl ${
        esModal ? "p-4 sm:p-6 shadow-2xl" : "p-5 sm:p-7 shadow-xl"
      } text-slate-900 dark:text-white transition-all relative`}
    >
      {/* Encabezado con selector de Cuota */}
      <div className="pb-5 mb-5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Pasarela de Pago de Mensualidad
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Cancela tu canon de arrendamiento mensual de forma segura con acreditación en línea.
            </p>
          </div>

          {onCerrar && (
            <button
              type="button"
              onClick={onCerrar}
              className="self-end sm:self-auto p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title="Cerrar pasarela"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Selector de Cuota a Pagar */}
        {cuotasPendientes.length > 1 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Selecciona la cuota a pagar:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {cuotasPendientes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCuotaActiva(c)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    cuotaActiva.id === c.id
                      ? "bg-[#470A68] text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  Cuota {c.numero} ({c.mes})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tarjeta de Resumen de la Cuota y Montos */}
      <div className="bg-gradient-to-br from-slate-50 to-purple-50/40 dark:from-slate-800/40 dark:to-purple-950/20 rounded-2xl p-4 sm:p-5 border border-purple-100 dark:border-purple-900/30 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Info Cuota */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 dark:bg-purple-950 text-[#470A68] dark:text-purple-300">
                Cuota #{cuotaActiva.numero}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Vence: <strong className="text-slate-800 dark:text-slate-200">{cuotaActiva.vencimiento}</strong>
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {cuotaActiva.mes} • {contrato?.titulo || "Alquiler Fijo"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inquilino: <span className="font-semibold text-slate-700 dark:text-slate-300">{contrato?.cliente || "Cliente"}</span> | Propietario: <span className="font-semibold text-slate-700 dark:text-slate-300">{contrato?.propietario || "Arrendador"}</span>
            </p>
          </div>

          {/* Montos y Tasa BCV */}
          <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-purple-200/40 dark:border-purple-800/40">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Mensualidad
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block leading-tight">
              ${importe.toLocaleString("en-US", { minimumFractionDigits: 2 })} {moneda}
            </span>
            {!esBs && (
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block font-mono mt-0.5">
                ≈ Bs. {montoBs.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-normal ml-1">
                  (BCV: {tasaCambio.toFixed(2)})
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs de Selección de Métodos de Pago */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
          Elige tu medio de pago:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
          {/* Tarjeta */}
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

          {/* Pago Móvil C2P */}
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="7" y="2" width="10" height="20" rx="2" strokeWidth="2" />
              <path d="M11 18h2" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>Pago Móvil C2P</span>
          </button>

          {/* Zelle */}
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

          {/* Binance Pay */}
          <button
            type="button"
            onClick={() => {
              setMetodoPago("binance");
              setFormErrors({});
            }}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metodoPago === "binance"
                ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-md shadow-amber-950/20 font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L6 8l2 2 4-4 4 4 2-2-6-6zm-6 8l-2 2 8 8 8-8-2-2-6 6-6-6zm0 4l-2 2 8 8 8-8-2-2-6 6-6-6z" />
            </svg>
            <span>Binance Pay</span>
          </button>

          {/* PayPal */}
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

      {/* FORMULARIOS DE MÉTODO DE PAGO */}
      <form onSubmit={handleProcesarPago} className="space-y-4">
        {/* ── 1. MÉTODO: TARJETA DE CRÉDITO O DÉBITO ── */}
        {metodoPago === "tarjeta" && (
          <div className="space-y-4 animate-fade-in">
            {/* Selector Crédito / Débito */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
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

            {/* Vista previa 3D de la Tarjeta */}
            <CardPreview
              cardNumber={cardData.numeroTarjeta}
              cardHolder={cardData.nombreTitular}
              cardExpiry={cardData.vencimiento}
              cardType={tipoTarjeta}
              brand={cardBrand}
              cvv={cardData.cvv}
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Nombre del Titular (como figura en la tarjeta) *
              </label>
              <input
                type="text"
                placeholder="EJ. JUAN CARLOS PEREZ"
                value={cardData.nombreTitular}
                onChange={(e) => {
                  setCardData({ ...cardData, nombreTitular: e.target.value.toUpperCase() });
                  if (formErrors.nombreTitular) setFormErrors((p) => ({ ...p, nombreTitular: "" }));
                }}
                className={inputCls("nombreTitular")}
              />
              {errorText("nombreTitular")}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Número de Tarjeta (16 dígitos) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={19}
                  placeholder="4000 1234 5678 9010"
                  value={cardData.numeroTarjeta ? cardData.numeroTarjeta.replace(/(\d{4})(?=\d)/g, "$1 ") : ""}
                  onChange={handleCardNumberChange}
                  className={`${inputCls("numeroTarjeta")} font-mono tracking-wider`}
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                  {cardBrand === "visa" && (
                    <span className="text-sm font-black italic text-blue-600 dark:text-blue-400">VISA</span>
                  )}
                  {cardBrand === "mastercard" && (
                    <div className="flex items-center -space-x-1.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B]" />
                      <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B]" />
                    </div>
                  )}
                  {cardBrand === "amex" && (
                    <span className="text-xs font-black text-cyan-600">AMEX</span>
                  )}
                </div>
              </div>
              {errorText("numeroTarjeta")}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Expiración (MM/AA) *
                </label>
                <input
                  type="text"
                  maxLength={5}
                  placeholder="MM/AA"
                  value={cardData.vencimiento}
                  onChange={handleExpiryChange}
                  className={`${inputCls("vencimiento")} font-mono text-center`}
                />
                {errorText("vencimiento")}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  CVV / CVC (3-4 dígitos) *
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="•••"
                  value={cardData.cvv}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setCardData((p) => ({ ...p, cvv: val }));
                    if (formErrors.cvv) setFormErrors((p) => ({ ...p, cvv: "" }));
                  }}
                  className={`${inputCls("cvv")} font-mono text-center tracking-widest`}
                />
                {errorText("cvv")}
              </div>
            </div>
          </div>
        )}

        {/* ── 2. MÉTODO: PAGO MÓVIL C2P (VENEZUELA) ── */}
        {metodoPago === "pagomovil" && (
          <div className="space-y-4 animate-fade-in">
            {/* Banner explicativo C2P */}
            <div className="flex items-start gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-200">
              <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <strong className="font-extrabold block">Débito Inmediato C2P (Comercio a Persona)</strong>
                El monto se debitará directamente de tu cuenta bancaria en Bolívares usando la Clave Dinámica generada en tu App Bancaria.
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Banco Emisor de tu Cuenta *
              </label>
              <select
                value={pagoMovilData.bancoEmisor}
                onChange={(e) => setPagoMovilData({ ...pagoMovilData, bancoEmisor: e.target.value })}
                className={inputCls("bancoEmisor")}
              >
                {BANCOS_VENEZUELA.map((b) => (
                  <option key={b.codigo} value={b.codigo}>
                    {b.codigo} - {b.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Tipo Doc. *
                </label>
                <select
                  value={pagoMovilData.tipoDocumento}
                  onChange={(e) => setPagoMovilData({ ...pagoMovilData, tipoDocumento: e.target.value })}
                  className={inputCls("tipoDocumento")}
                >
                  <option value="V">V - Venezolano</option>
                  <option value="E">E - Extranjero</option>
                  <option value="J">J - Jurídico</option>
                  <option value="G">G - Gubernamental</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Cédula / RIF del Titular *
                </label>
                <input
                  type="text"
                  maxLength={9}
                  placeholder="12345678"
                  value={pagoMovilData.cedulaPagador}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setPagoMovilData({ ...pagoMovilData, cedulaPagador: val });
                    if (formErrors.cedulaPagador) setFormErrors((p) => ({ ...p, cedulaPagador: "" }));
                  }}
                  className={`${inputCls("cedulaPagador")} font-mono`}
                />
                {errorText("cedulaPagador")}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Prefijo *
                </label>
                <select
                  value={pagoMovilData.telefonoPrefijo}
                  onChange={(e) => setPagoMovilData({ ...pagoMovilData, telefonoPrefijo: e.target.value })}
                  className={inputCls("telefonoPrefijo")}
                >
                  <option value="0414">0414</option>
                  <option value="0424">0424</option>
                  <option value="0412">0412</option>
                  <option value="0416">0416</option>
                  <option value="0426">0426</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Número de Teléfono Celular *
                </label>
                <input
                  type="text"
                  maxLength={7}
                  placeholder="1234567"
                  value={pagoMovilData.telefonoNumero}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setPagoMovilData({ ...pagoMovilData, telefonoNumero: val });
                    if (formErrors.telefonoNumero) setFormErrors((p) => ({ ...p, telefonoNumero: "" }));
                  }}
                  className={`${inputCls("telefonoNumero")} font-mono`}
                />
                {errorText("telefonoNumero")}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Clave Dinámica C2P / Token SMS *
                </label>
                <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                  (Solicítala en tu App bancaria)
                </span>
              </div>
              <input
                type="password"
                maxLength={8}
                placeholder="Ingresa clave dinámica de 4 a 8 dígitos"
                value={pagoMovilData.claveDinamica}
                onChange={(e) => {
                  setPagoMovilData({ ...pagoMovilData, claveDinamica: e.target.value });
                  if (formErrors.claveDinamica) setFormErrors((p) => ({ ...p, claveDinamica: "" }));
                }}
                className={`${inputCls("claveDinamica")} font-mono tracking-widest`}
              />
              {errorText("claveDinamica")}
            </div>
          </div>
        )}

        {/* ── 3. MÉTODO: ZELLE EXPRESS ── */}
        {metodoPago === "zelle" && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-3.5 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200/80 dark:border-purple-800/40 text-xs text-purple-900 dark:text-purple-200">
              <strong className="font-extrabold block">Transferencia Directa por Zelle en Dólares (USD)</strong>
              Realiza el pago al correo oficial de arriendos: <strong className="font-mono text-purple-700 dark:text-purple-300">pagos@saphiroinmobiliaria.com</strong> y registra los datos a continuación.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Nombre del Titular de la Cuenta Zelle *
              </label>
              <input
                type="text"
                placeholder="Nombre y Apellido registrado en tu banco"
                value={zelleData.nombreTitular}
                onChange={(e) => {
                  setZelleData({ ...zelleData, nombreTitular: e.target.value });
                  if (formErrors.nombreTitular) setFormErrors((p) => ({ ...p, nombreTitular: "" }));
                }}
                className={inputCls("nombreTitular")}
              />
              {errorText("nombreTitular")}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Correo o Teléfono del Pagador en Zelle *
              </label>
              <input
                type="text"
                placeholder="tu-correo@banco.com o +1 (555) 000-0000"
                value={zelleData.contacto}
                onChange={(e) => {
                  setZelleData({ ...zelleData, contacto: e.target.value });
                  if (formErrors.contacto) setFormErrors((p) => ({ ...p, contacto: "" }));
                }}
                className={inputCls("contacto")}
              />
              {errorText("contacto")}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Número de Confirmación / Referencia Zelle *
              </label>
              <input
                type="text"
                placeholder="EJ. ZEL-99482012"
                value={zelleData.referenciaZelle}
                onChange={(e) => {
                  setZelleData({ ...zelleData, referenciaZelle: e.target.value.toUpperCase() });
                  if (formErrors.referenciaZelle) setFormErrors((p) => ({ ...p, referenciaZelle: "" }));
                }}
                className={`${inputCls("referenciaZelle")} font-mono`}
              />
              {errorText("referenciaZelle")}
            </div>
          </div>
        )}

        {/* ── 4. MÉTODO: BINANCE PAY (USDT) ── */}
        {metodoPago === "binance" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/80 dark:border-amber-800/40">
              <div className="p-2 bg-white rounded-xl shadow-sm shrink-0">
                <QRCodeSVG
                  value={`binance://pay?receiver=saphiro_inmobiliaria&amount=${importe}&currency=USDT`}
                  size={84}
                  level="H"
                />
              </div>
              <div className="space-y-1 text-xs text-amber-900 dark:text-amber-200 text-center sm:text-left">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 uppercase">
                  Binance Pay 0% Fees
                </span>
                <strong className="block font-black text-sm">Escanea con tu Binance App</strong>
                <p className="text-amber-800/80 dark:text-amber-300/80 text-[11px]">
                  Monto a transferir: <strong className="font-mono text-slate-900 dark:text-white font-black">{importe.toFixed(2)} USDT</strong>
                </p>
                <p className="text-[10px] text-slate-500">Merchant Pay ID: <span className="font-mono font-bold">294810291</span></p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Tu Binance Pay ID o Correo de Binance *
              </label>
              <input
                type="text"
                placeholder="ID de 8 o 9 dígitos o correo"
                value={binanceData.binanceId}
                onChange={(e) => {
                  setBinanceData({ ...binanceData, binanceId: e.target.value });
                  if (formErrors.binanceId) setFormErrors((p) => ({ ...p, binanceId: "" }));
                }}
                className={inputCls("binanceId")}
              />
              {errorText("binanceId")}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Binance Pay PIN (6 dígitos) *
              </label>
              <input
                type="password"
                maxLength={6}
                placeholder="••••••"
                value={binanceData.payPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setBinanceData({ ...binanceData, payPin: val });
                  if (formErrors.payPin) setFormErrors((p) => ({ ...p, payPin: "" }));
                }}
                className={`${inputCls("payPin")} font-mono text-center tracking-widest`}
              />
              {errorText("payPin")}
            </div>
          </div>
        )}

        {/* ── 5. MÉTODO: PAYPAL ── */}
        {metodoPago === "paypal" && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-3.5 bg-sky-50 dark:bg-sky-950/30 rounded-2xl border border-sky-200/80 dark:border-sky-800/40 text-xs text-sky-900 dark:text-sky-200">
              <strong className="font-extrabold block">PayPal Express Checkout Internacional</strong>
              Paga tu mensualidad con protección de compras y tarjeta vinculada a tu cuenta de PayPal.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Correo Electrónico de PayPal *
              </label>
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={paypalData.emailPaypal}
                onChange={(e) => {
                  setPaypalData({ ...paypalData, emailPaypal: e.target.value });
                  if (formErrors.emailPaypal) setFormErrors((p) => ({ ...p, emailPaypal: "" }));
                }}
                className={inputCls("emailPaypal")}
              />
              {errorText("emailPaypal")}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Nombre Completo del Titular *
              </label>
              <input
                type="text"
                placeholder="Como figura en tu cuenta de PayPal"
                value={paypalData.nombrePaypal}
                onChange={(e) => {
                  setPaypalData({ ...paypalData, nombrePaypal: e.target.value });
                  if (formErrors.nombrePaypal) setFormErrors((p) => ({ ...p, nombrePaypal: "" }));
                }}
                className={inputCls("nombrePaypal")}
              />
              {errorText("nombrePaypal")}
            </div>
          </div>
        )}

        {/* ── STEPPER VISUAL DE PROCESAMIENTO (DURANTE LA CARGA) ── */}
        {isProcessing && (
          <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800/50 space-y-3 animate-pulse">
            <div className="flex items-center justify-between text-xs font-bold text-purple-700 dark:text-purple-300">
              <span>Procesando pago seguro...</span>
              <span>Paso {processingStep} de 3</span>
            </div>
            {/* Barra de progreso */}
            <div className="w-full bg-purple-200 dark:bg-purple-900 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#470A68] h-full transition-all duration-500 ease-out"
                style={{ width: `${(processingStep / 3) * 100}%` }}
              />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-[#470A68]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>{processingText}</span>
            </p>
          </div>
        )}

        {/* ── BOTÓN DE ACCIÓN PRINCIPAL ── */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isProcessing}
            className={`w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-xl cursor-pointer ${
              isProcessing
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-[#470A68] via-purple-700 to-[#470A68] hover:shadow-purple-900/40 hover:scale-[1.01] active:scale-[0.99]"
            }`}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Procesando Transacción Bancaria...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>
                  Confirmar y Pagar Mensualidad (${importe.toLocaleString("en-US", { minimumFractionDigits: 2 })} {moneda})
                </span>
              </>
            )}
          </button>
        </div>

        {/* Sellos de Seguridad al pie */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-[11px] font-bold text-slate-400 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v4a1 1 0 102 0V7z" clipRule="evenodd" />
            </svg>
            <span>Encriptación SSL 256-Bit</span>
          </div>
          <span>•</span>
          <span>Acreditación Automática en Línea</span>
          <span>•</span>
          <span>Normativa C2P Sucre / Sudeban</span>
        </div>
      </form>
    </div>
  );
}
