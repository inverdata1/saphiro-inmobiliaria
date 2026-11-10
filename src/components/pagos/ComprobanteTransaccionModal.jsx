import { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { formatDate, formatDateTime } from "../../utils/date";
import { fmtTotal } from "../../utils/money";
import { buildDesglose } from "../../utils/desglose";

// Configuracion por variante. Cada comprobante es la misma cascara con distinto
// vocabulario, color de acento y filas de tabla.
const VARIANTES = {
  recibo: {
    titulo: "Comprobante Digital de Pago",
    emisor: "RIF: J-50192841-0 • Inmobiliaria Digital",
    folioLabel: "Recibo N°",
    inmuebleLabel: "Emisor / Inmueble",
    clienteLabel: "Cliente / Pagador",
    tablaLabel: "Desglose del Pago",
    tablaHeader: "Concepto",
    totalLabel: "Total Pagado",
    qrMarca: "Verificación Segura",
    mostrarEstatus: true,
    acento: "purple",
    qrProps: { size: 56, marginSize: 1 },
  },
  liquidacion: {
    titulo: "Comprobante de Transferencia Recibida",
    emisor: "Liquidación a Corredor Inmobiliario",
    folioLabel: "Transferencia N°",
    inmuebleLabel: "Inmueble Asociado",
    clienteLabel: "Datos del Cliente Pagador",
    tablaLabel: "Detalle de Liquidación",
    tablaHeader: "Detalle",
    totalLabel: "Monto Neto Acreditado al Corredor",
    qrMarca: "Liquidación Validada",
    mostrarEstatus: false,
    acento: "emerald",
    qrProps: { size: 72, level: "M" },
  },
  mensualidad: {
    titulo: "Comprobante de Mensualidad",
    emisor: "Recibo de Cuota de Arrendamiento",
    folioLabel: "Factura N°",
    inmuebleLabel: "Inmueble Arrendado",
    clienteLabel: "Inquilino / Pagador",
    tablaLabel: "Detalle de la Cuota",
    tablaHeader: "Concepto",
    totalLabel: "Total Cobrado",
    qrMarca: "Verificación Segura",
    mostrarEstatus: true,
    acento: "purple",
    qrProps: { size: 56, marginSize: 1 },
  },
};

// Clases completas (Tailwind no puede inferirlas desde plantillas con concatenacion).
const ACENTOS = {
  purple: {
    headerDot: "bg-purple-600",
    folio: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60",
    folioTexto: "text-purple-700 dark:text-purple-300",
    tfoot: "bg-purple-50/60 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800",
    totalTexto: "text-[#470A68] dark:text-purple-300",
  },
  emerald: {
    headerDot: "bg-emerald-500",
    folio: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60",
    folioTexto: "text-emerald-700 dark:text-emerald-300",
    tfoot: "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
    totalTexto: "text-emerald-600 dark:text-emerald-400",
  },
};

// Fila de la tabla de desglose. Compartida para que el estilo de las lineas
// "parciales" sea identico en las tres variantes.
function FilaDesglose({ linea, moneda }) {
  const { parcial } = linea;
  return (
    <tr className={parcial ? "bg-slate-50 dark:bg-slate-900/40" : ""}>
      <td
        className={
          parcial
            ? "p-3 italic text-slate-400 dark:text-slate-500"
            : "p-3 font-semibold text-slate-800 dark:text-slate-200"
        }
      >
        {linea.concepto}
      </td>
      <td
        className={
          parcial
            ? "p-3 text-right font-mono text-slate-400 dark:text-slate-500"
            : "p-3 text-right font-mono"
        }
      >
        {fmtTotal(moneda, linea.monto)}
      </td>
    </tr>
  );
}

/**
 * Comprobante imprimible. Una sola cascara (header, tabla, QR, acciones) con tres
 * variantes de contenido:
 *
 *   recibo      -> "Comprobante Digital de Pago" (cliente, MisRecibosPage).
 *   liquidacion -> "Comprobante de Transferencia Recibida" (corredor,
 *                  TransferenciasRecibidasPage): agrega bruto -> comision -> neto.
 *   mensualidad -> "Comprobante de Mensualidad" (inquilino, MensualidadesInmueblePage):
 *                  pago de una cuota del contrato de alquiler.
 *
 * Props:
 *   variant  "recibo" (default) | "liquidacion" | "mensualidad".
 *   data     Objeto ya mapeado. Null = no se renderiza nada.
 *   usuario  Fallback del pagador para variant="recibo" (nombre/email del contexto de auth).
 *   onClose  Cierra el modal (X del header y boton "Cerrar").
 *
 * Contrato de `data` por variant:
 *   recibo:      id, fecha, inmueble, inmuebleUbicacion, clienteNombre, clienteEmail,
 *                moneda, montoTotal, concepto, estado, bancoEmisor, referenciaBancaria,
 *                detalles[{concepto, monto}]
 *   liquidacion: id, fecha, inmueble, inmuebleUbicacion, clienteNombre, clienteEmail,
 *                moneda, montoBruto, comision, montoNeto, porcentajeAplicado,
 *                referenciaBancaria, detalles[{concepto, monto}]
 *   mensualidad: id/factura, fecha, inmueble, inmuebleUbicacion, clienteNombre,
 *                clienteEmail, moneda, montoTotal, montoPagado, concepto (ej. "Cuota #3
 *                • Marzo 2026"), estado, referenciaBancaria, comision, porcentajeAplicado.
 *                `montoTotal` = importe de la cuota; `montoPagado` = lo cobrado. Si hay
 *                saldo, se agrega la fila "Saldo pendiente de la cuota" y el footer muestra
 *                lo cobrado. Si hay `comision` > 0 (solo la recibe el propietario), se
 *                agrega la fila de comision y el footer pasa a "Neto Acreditado al
 *                Propietario" (= montoPagado - comision).
 */
export default function ComprobanteTransaccionModal({
  variant = "recibo",
  data,
  usuario,
  onClose,
}) {
  const cfg = VARIANTES[variant] || VARIANTES.recibo;
  const acento = ACENTOS[cfg.acento];
  const esRecibo = variant === "recibo";
  const esLiquidacion = variant === "liquidacion";

  // Lineas de transacciones_detalles. El backend manda [] (nunca null) cuando no hay.
  // El recibo rellena con una fila unica cuando no hay desglose; la liquidacion no,
  // porque ahi la fila "Monto total pagado por el cliente" se pinta aparte y siempre.
  const lineas = useMemo(
    () =>
      buildDesglose(
        data?.detalles,
        esRecibo ? data?.montoTotal : data?.montoBruto,
        esRecibo ? data?.concepto || "Monto total" : null
      ),
    [data, esRecibo]
  );

  if (!data) return null;

  const esMensualidad = variant === "mensualidad";
  // El monto de la fila/footer difiere por variante: el recibo cobra montoTotal, la
  // liquidacion liquida el bruto, y la mensualidad solo tiene cobrado su montoPagado
  // (la cuota puede estar a medias, y el footer no puede decir 0 si la fila dice 2).
  const total = Number((esMensualidad ? data.montoPagado : esRecibo ? data.montoTotal : data.montoBruto) || 0);
  const saldo = esMensualidad ? Number(data.montoTotal || 0) - total : 0;
  // Comision retenida al propietario. Solo la variante mensualidad la puede traer (y
  // solo si quien mira es el corredor, que es quien la paga); en las otras el campo no
  // existe y `comision` queda 0, sin dibujar la resta.
  const comision = esMensualidad ? Number(data.comision || 0) : 0;
  const neto = total - comision;
  const clienteNombre = esRecibo ? usuario?.nombre || data.clienteNombre : data.clienteNombre;
  const clienteEmail = esRecibo ? usuario?.email || data.clienteEmail : data.clienteEmail;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white dark:bg-[#121215] text-slate-900 dark:text-slate-100 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Modal */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#18181c]">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${acento.headerDot}`}></span>
            <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">{cfg.titulo}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido Imprimible del Comprobante */}
        <div id="comprobante-printable" className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Encabezado del Comprobante */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-dashed border-slate-300 dark:border-slate-700">
            <div>
              <h3 className="text-xl font-black text-[#470A68] dark:text-purple-400 tracking-tight">
                INVERDATA C.A.
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{cfg.emisor}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Caracas, Venezuela</p>
            </div>
            <div className={`text-left sm:text-right p-3 rounded-2xl border ${acento.folio}`}>
              <p className={`text-xs font-bold uppercase ${acento.folioTexto}`}>{cfg.folioLabel}</p>
              <p className="text-lg font-mono font-black text-slate-900 dark:text-white">{data.id}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Fecha: {variant === "liquidacion" ? formatDate(data.fecha) : formatDateTime(data.fecha)}
              </p>
            </div>
          </div>

          {/* Inmueble y Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-[#18181c] p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-400 uppercase">{cfg.inmuebleLabel}</p>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-1">{data.inmueble}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{data.inmuebleUbicacion}</p>
            </div>

            <div className="bg-slate-50 dark:bg-[#18181c] p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-400 uppercase">{cfg.clienteLabel}</p>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-1">{clienteNombre}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{clienteEmail}</p>
              {cfg.mostrarEstatus && (
                <span className="inline-block mt-2 text-[11px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded">
                  Estatus: {data.estado}
                </span>
              )}
            </div>
          </div>

          {/* Detalle de Pago / Liquidacion / Cuota */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              {cfg.tablaLabel}
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-[#1a1a20] text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">{cfg.tablaHeader}</th>
                    <th className="p-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Mensualidad: lo efectivamente cobrado y, si la cuota esta a
                      medias, el saldo pendiente. Al propietario ademas se le resta la
                      comision para mostrarle el neto, igual que en una liquidacion. */}
                  {esMensualidad ? (
                    <>
                      <tr>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                          {data.concepto || "Cuota de arrendamiento"}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {fmtTotal(data.moneda, total)}
                        </td>
                      </tr>
                      {saldo > 0 && (
                        <FilaDesglose
                          linea={{ concepto: "Saldo pendiente de la cuota", monto: saldo, parcial: true }}
                          moneda={data.moneda}
                        />
                      )}
                      {comision > 0 && (
                        <tr>
                          <td className="p-3 text-slate-500">
                            Comisión de la plataforma
                            {data.porcentajeAplicado ? `: (${data.porcentajeAplicado}%)` : ""}
                          </td>
                          <td className="p-3 text-right font-mono text-red-500">
                            -{fmtTotal(data.moneda, comision)}
                          </td>
                        </tr>
                      )}
                    </>
                  ) : (
                    lineas.map((l, i) => (
                      <FilaDesglose key={`${l.concepto}-${i}`} linea={l} moneda={data.moneda} />
                    ))
                  )}

                  {/* Liquidacion: el bruto se pinta siempre; el desglose (si lo hay)
                      va arriba y la comision cierra el neto del tfoot. */}
                  {esLiquidacion && (
                    <>
                      <tr
                        className={
                          lineas.length ? "border-t-2 border-slate-200 dark:border-slate-700" : ""
                        }
                      >
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                          Monto total pagado por el cliente
                        </td>
                        <td className="p-3 text-right font-mono">
                          {fmtTotal(data.moneda, data.montoBruto)}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 text-slate-500">
                          Comisión de la venta: ({data.porcentajeAplicado}%)
                        </td>
                        <td className="p-3 text-right font-mono text-red-500">
                          -{fmtTotal(data.moneda, data.comision)}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
                <tfoot className={`font-bold text-slate-900 dark:text-white border-t ${acento.tfoot}`}>
                  {/* Con comision (propietario) el footer deja de ser "lo cobrado" y pasa
                      a ser "lo que te queda": dos filas, bruto tachado y neto. */}
                  {comision > 0 && (
                    <tr>
                      <td className="p-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Comisión de la plataforma
                      </td>
                      <td className="p-3 text-right font-mono text-xs text-red-500">
                        -{fmtTotal(data.moneda, comision)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="p-3 text-sm font-extrabold">
                      {comision > 0 ? "Neto Acreditado al Propietario" : cfg.totalLabel}
                    </td>
                    <td className={`p-3 text-right text-base font-black font-mono ${acento.totalTexto}`}>
                      {fmtTotal(data.moneda, comision > 0 ? neto : total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Datos Bancarios y QR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#18181c] border border-slate-200 dark:border-slate-800 text-xs">
            <div className="space-y-1 w-full sm:w-auto">
              {variant !== "liquidacion" && (
                <p>
                  <span className="text-slate-400">Banco / Entidad:</span>{" "}
                  <strong>{data.bancoEmisor || "-"}</strong>
                </p>
              )}
              <p>
                <span className="text-slate-400">N° de Referencia:</span>{" "}
                <strong className="font-mono text-purple-700 dark:text-purple-400">
                  {data.referenciaBancaria}
                </strong>
              </p>
            </div>

            {/* Marcador de QR para verificacion */}
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
              <QRCodeSVG
                value={`TRANSFERENCIA:${data.id}|REF:${data.referenciaBancaria}`}
                fgColor="#475569"
                bgColor="#cbd5e1"
                {...cfg.qrProps}
              />
              <div className="text-[10px] text-slate-400 leading-tight">
                <p className="font-bold text-slate-700 dark:text-slate-300">{cfg.qrMarca}</p>
                <p>Firma digital Inverdata</p>
                {esLiquidacion && (
                  <p className="font-mono mt-0.5 text-slate-500 dark:text-slate-400 break-all">
                    {data.id}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Acciones del Modal */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#18181c] border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cerrar
          </button>
          <button
            onClick={() => window.print()}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#470A68] hover:bg-[#5a0e82] text-white shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir / PDF
          </button>
        </div>
      </div>
    </div>
  );
}
