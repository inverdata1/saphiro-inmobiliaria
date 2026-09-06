import React from "react";
import { createPortal } from "react-dom";

export default function ComprobantePagoModal({
  isOpen,
  onClose,
  pagoData,
  inmueble,
}) {
  if (!isOpen || !pagoData) return null;

  const moneda = String(pagoData?.moneda || "USD").toUpperCase();
  const esBs = moneda === "BS";
  const montoPrincipal = Number(
    pagoData.montoPrincipal ?? pagoData.montoUsd ?? 0
  );
  const montoPrincipalLabel = esBs
    ? `Bs. ${montoPrincipal.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`
    : moneda === "EUR"
      ? `${montoPrincipal.toLocaleString("en-US", { minimumFractionDigits: 2 })} €`
      : `$${montoPrincipal.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD`;

  const fechaActual = new Date().toLocaleString("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const cardBrand = (pagoData.brand || "visa").toLowerCase();

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <>
      <style>{`
        @media print {
          #root { display: none !important; }
          body > div:not(#root) {
            position: static !important;
            inset: auto !important;
            display: block !important;
            padding: 0 !important;
            background: transparent !important;
            backdrop-filter: none !important;
          }
          #comprobante-print {
            position: static !important;
            max-width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .comprobante-no-print { display: none !important; }
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-fade-in">
        <div
          id="comprobante-print"
          className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full max-h-[92dvh] overflow-y-auto p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-x-hidden text-slate-900 dark:text-white"
        >
          {/* Top Decorative Gradient Accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500" />

          {/* Network Badges Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black italic tracking-wider text-blue-700 dark:text-blue-400">
                VISA
              </span>
              <span className="text-slate-300 dark:text-slate-700 font-light">|</span>
              <div className="flex items-center -space-x-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B]" />
                <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B]" />
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Secure Pay
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Aprobado
            </span>
          </div>

          {/* Success Icon */}
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-100 dark:ring-emerald-950/50">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <div className="text-center mb-5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Pago Exitoso
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Transacción autorizada por la red {cardBrand === "visa" ? "Visa" : cardBrand === "mastercard" ? "Mastercard" : "Visa / Mastercard"}
            </p>
          </div>

          {/* Receipt Details Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Código de Autorización:
              </span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {pagoData.numAprobacion || "AUTH-894210"}
              </span>
            </div>

            <div className="flex justify-between items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Referencia:
              </span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {pagoData.referencia || "008492014"}
              </span>
            </div>

            <div className="flex justify-between items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Método de Pago:
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                {cardBrand === "visa" ? (
                  <span className="italic font-black text-blue-600 dark:text-blue-400">VISA</span>
                ) : cardBrand === "mastercard" ? (
                  <span className="font-bold text-amber-500">Mastercard</span>
                ) : (
                  <span>Tarjeta</span>
                )}
                <span>({pagoData.metodo === "debito" ? "Débito" : "Crédito"})</span>
              </span>
            </div>

            <div className="flex justify-between items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Tarjeta:
              </span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                •••• •••• •••• {pagoData.ultimosDigitos || "4589"}
              </span>
            </div>

            <div className="flex justify-between items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Concepto:
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200 text-right truncate max-w-[200px]" title={inmueble?.titulo || "Reserva Inmobiliaria"}>
                {inmueble?.titulo || "Reserva Inmobiliaria"}
              </span>
            </div>

            <div className="flex justify-between items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Fecha y Hora:
              </span>
              <span className="text-slate-700 dark:text-slate-300 text-xs">
                {fechaActual}
              </span>
            </div>

            {/* Total Amount Box */}
            <div className="pt-2 flex justify-between items-center gap-3">
              <span className="text-sm font-black text-slate-900 dark:text-white">
                Total Pagado:
              </span>
              <div className="text-right">
                <span className="block text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {montoPrincipalLabel}
                </span>
                {!esBs && (
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    Bs. {Number(pagoData.montoBs || 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                    {pagoData.tasa ? ` (Tasa: ${Number(pagoData.tasa).toFixed(2)})` : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Security & Transaction Stamp */}
          <div className="mt-4 flex items-center justify-between px-1 text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="flex items-center gap-1.5 font-medium">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>PCI-DSS 256-bit SSL</span>
            </div>
            <span className="font-mono text-[10px] tracking-wider uppercase font-bold text-slate-500">
              3D SECURE 2.0
            </span>
          </div>

          {/* Action Buttons */}
          <div className="comprobante-no-print mt-5 flex gap-3">
            <button
              onClick={handlePrint}
              type="button"
              className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-sm transition-colors shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir
            </button>

            <button
              onClick={onClose}
              type="button"
              className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              Finalizar
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
