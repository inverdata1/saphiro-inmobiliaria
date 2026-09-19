import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PasarelaPago from "../../components/pagos/PasarelaPago";
import { apiGet, apiPost } from "../../api";
import { useAuth } from "../../context/useAuth";

export default function PasarelaPagoPage() {
  const { inmuebleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

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

  const submitPago = async ({ metodoPago, cardBrand, formData, detallePago }) => {
    if (!user?.id) {
      throw new Error("Debes iniciar sesión para completar el pago.");
    }
    if (!inmuebleId) {
      throw new Error("No se identificó el inmueble a pagar.");
    }

    const res = await apiPost(
      "/transacciones/pago",
      {
        inmueble_id: Number(inmuebleId),
        cliente_id: Number(user.id),
        metodo_pago: metodoPago,
        codigo_seguridad: formData?.cvv || "",
        numero_tarjeta: formData?.numeroTarjeta || "",
        marca_tarjeta: cardBrand || "",
        detalle_pago: detallePago || {},
      }
    );

    const data = res?.data;
    // Precio y moneda los define el servidor en base al inmueble
    const montoFinal = Number(data?.monto ?? montoPrincipal);
    const monedaFinal = String(data?.moneda || moneda).toUpperCase();

    return {
      numAprobacion: `AUTH-${String(data?.transaccion_id || Math.floor(100000 + Math.random() * 900000)).padStart(6, "0")}`,
      referencia: String(data?.transaccion_id || Math.floor(10000000 + Math.random() * 90000000)),
      metodo: metodoPago,
      brand: cardBrand,
      ultimosDigitos: formData?.numeroTarjeta ? formData.numeroTarjeta.slice(-4) : "N/A",
      montoPrincipal: montoFinal,
      moneda: monedaFinal,
      montoBs: monedaFinal === "BS" ? montoFinal : montoFinal * (tasaCambio || 1),
      tasa: tasaCambio,
    };
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ──────── LEFT COLUMN: Instructions & Transaction Summary ──────── */}
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

          {/* ──────── RIGHT COLUMN: Payment Form ──────── */}
          <div className="lg:col-span-7">
            <PasarelaPago
              titulo="Datos de la Tarjeta"
              subtitulo="Acepta tarjetas de crédito y débito, pago movil, Paypal, Binance y Zelle"
              montoLabel={montoPrincipalLabel}
              inmueble={inmueble}
              onSubmit={submitPago}
              onComprobanteClose={() => navigate("/inmuebles")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}