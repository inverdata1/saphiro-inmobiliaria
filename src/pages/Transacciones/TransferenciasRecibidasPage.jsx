import { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";

// Datos de ejemplo realistas de transferencias recibidas por el corredor inmobiliario
const MOCK_TRANSFERENCIAS = [
  {
    id: "TRF-2026-0412",
    referenciaBancaria: "74839201",
    inmueble: "Apartamento de Lujo en Altamira",
    inmuebleUbicacion: "Altamira, Caracas",
    inmuebleImagen: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80",
    clienteNombre: "Sofía Rodríguez",
    clienteEmail: "sofia.rodriguez@email.com",
    clienteTelefono: "+58 414-1234567",
    concepto: "Reserva Vacacional (15 Sep - 18 Sep 2026)",
    fecha: "2026-09-05 14:32",
    montoBrutoUsd: 450.00,
    montoBrutoBs: 16425.00,
    comisionPlataformaUsd: 45.00, // 10%
    montoNetoUsd: 405.00,
    montoNetoBs: 14782.50,
    metodo: "Pago Móvil",
    bancoEmisor: "Banesco",
    bancoReceptor: "Mercantil (Cuenta Corredor)",
    estado: "Aprobada",
  },
  {
    id: "TRF-2026-0398",
    referenciaBancaria: "ZEL-9921048",
    inmueble: "Villa Sol & Playa Chichiriviche",
    inmuebleUbicacion: "Chichiriviche, Falcón",
    inmuebleImagen: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80",
    clienteNombre: "Alejandro Gómez",
    clienteEmail: "gomez.alejandro@gmail.com",
    clienteTelefono: "+58 412-9876543",
    concepto: "Alquiler temporal semana completa + Depósito",
    fecha: "2026-08-28 10:15",
    montoBrutoUsd: 680.00,
    montoBrutoBs: 24820.00,
    comisionPlataformaUsd: 68.00,
    montoNetoUsd: 612.00,
    montoNetoBs: 22338.00,
    metodo: "Zelle",
    bancoEmisor: "Bank of America",
    bancoReceptor: "Chase Bank (Corredor)",
    estado: "Aprobada",
  },
  {
    id: "TRF-2026-0355",
    referenciaBancaria: "0091238471",
    inmueble: "Townhouse Moderno Las Mercedes",
    inmuebleUbicacion: "Las Mercedes, Caracas",
    inmuebleImagen: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80",
    clienteNombre: "María Fernanda López",
    clienteEmail: "mflopez@empresa.com",
    clienteTelefono: "+58 424-5551234",
    concepto: "Canon mensual de arrendamiento (Septiembre 2026)",
    fecha: "2026-09-01 09:00",
    montoBrutoUsd: 1200.00,
    montoBrutoBs: 43800.00,
    comisionPlataformaUsd: 60.00,
    montoNetoUsd: 1140.00,
    montoNetoBs: 41610.00,
    metodo: "Transferencia",
    bancoEmisor: "Mercantil",
    bancoReceptor: "Banesco (Cuenta Corredor)",
    estado: "Aprobada",
  },
  {
    id: "TRF-2026-0420",
    referenciaBancaria: "88392019",
    inmueble: "Penthouse Vista al Ávila",
    inmuebleUbicacion: "Los Palos Grandes, Caracas",
    inmuebleImagen: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=400&q=80",
    clienteNombre: "Roberto Martínez",
    clienteEmail: "roberto.martinez@email.com",
    clienteTelefono: "+58 416-3332211",
    concepto: "Abono inicial apartado de venta",
    fecha: "2026-09-06 16:45",
    montoBrutoUsd: 2500.00,
    montoBrutoBs: 91250.00,
    comisionPlataformaUsd: 125.00,
    montoNetoUsd: 2375.00,
    montoNetoBs: 86687.50,
    metodo: "Pago Móvil",
    bancoEmisor: "BBVA Provincial",
    bancoReceptor: "Mercantil (Cuenta Corredor)",
    estado: "En Verificación",
  },
];

export default function TransferenciasRecibidasPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  // Filtrado dinámico
  const transferenciasFiltradas = useMemo(() => {
    return MOCK_TRANSFERENCIAS.filter((t) => {
      const matchSearch =
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.inmueble.toLowerCase().includes(search.toLowerCase()) ||
        t.referenciaBancaria.toLowerCase().includes(search.toLowerCase()) ||
        t.clienteNombre.toLowerCase().includes(search.toLowerCase()) ||
        t.concepto.toLowerCase().includes(search.toLowerCase());

      return matchSearch;
    });
  }, [search]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Encabezado Principal (Directo sin KPIs superiores por solicitud) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              Transferencias Recibidas
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Consulta y verifica los pagos y transferencias abonadas por los clientes de tus inmuebles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSearch("");
              }}
              className="inline-flex items-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#18181c] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Buscador y Controles de Filtro */}
        <div className="bg-white dark:bg-[#151518] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
            {/* Campo de búsqueda */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar por referencia bancaria, cliente o nombre de inmueble..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#1d1d22] border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-400 transition"
              />
              <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
        </div>

        {/* Lista de Transferencias Recibidas (Propuesta 1) */}
        <div className="space-y-3">
          {transferenciasFiltradas.length === 0 ? (
            <div className="bg-white dark:bg-[#151518] rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
              <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-200">No se encontraron transferencias</p>
              <p className="text-xs text-slate-400">Intenta ajustar el término de búsqueda o cambiar los filtros.</p>
            </div>
          ) : (
            transferenciasFiltradas.map((trf) => (
              <div
                key={trf.id}
                onClick={() => setSelectedTransfer(trf)}
                className="group bg-white dark:bg-[#151518] hover:bg-purple-50/50 dark:hover:bg-purple-950/20 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 hover:border-purple-300 dark:hover:border-purple-800 shadow-sm transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Lado Izquierdo: Info Inmueble y Cliente */}
                <div className="flex items-center gap-4">
                  <img
                    src={trf.inmuebleImagen}
                    alt={trf.inmueble}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md">
                        {trf.id}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Cliente: <strong className="text-slate-900 dark:text-white">{trf.clienteNombre}</strong>
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-base mt-0.5 group-hover:text-purple-800 dark:group-hover:text-purple-300 transition-colors">
                      {trf.inmueble}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                      <span>Ref Bancaria: <strong className="font-mono text-slate-800 dark:text-slate-200">{trf.referenciaBancaria}</strong></span>
                      <span>•</span>
                      <span>{trf.metodo} ({trf.bancoEmisor})</span>
                      <span>•</span>
                      <span>{trf.fecha}</span>
                    </div>
                  </div>
                </div>

                {/* Lado Derecho: Desglose Financiero (Bruto -> Neto) y Estado */}
                <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800/80">
                  <div className="text-left md:text-right">
                    <div className="text-xs text-slate-400">
                      Monto abonado: <span className="line-through font-mono">${trf.montoBrutoUsd.toFixed(2)} USD</span>
                    </div>
                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      ${trf.montoNetoUsd.toFixed(2)}{" "}
                      <span className="text-xs font-bold text-slate-400">USD NETO</span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Bs. {trf.montoNetoBs.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                        trf.estado === "Aprobada"
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${trf.estado === "Aprobada" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                      {trf.estado}
                    </span>

                    <button
                      type="button"
                      className="hidden sm:inline-flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-[#470A68] group-hover:text-white transition"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal / Comprobante de Transferencia del Corredor */}
      {selectedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-white dark:bg-[#121215] text-slate-900 dark:text-slate-100 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#18181c]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Comprobante de Transferencia Recibida
                </h2>
              </div>
              <button
                onClick={() => setSelectedTransfer(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido Imprimible */}
            <div id="transfer-printable" className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Encabezado del Comprobante */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-dashed border-slate-300 dark:border-slate-700">
                <div>
                  <h3 className="text-xl font-black text-[#470A68] dark:text-purple-400 tracking-tight">
                    INVERDATA C.A.
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Liquidación a Corredor Inmobiliario</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Caracas, Venezuela</p>
                </div>
                <div className="text-left sm:text-right bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800/60">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">Transferencia N°</p>
                  <p className="text-lg font-mono font-black text-slate-900 dark:text-white">{selectedTransfer.id}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Fecha: {selectedTransfer.fecha}</p>
                </div>
              </div>

              {/* Info Cliente & Inmueble */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-[#18181c] p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-400 uppercase">Inmueble Asociado</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-1">{selectedTransfer.inmueble}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedTransfer.inmuebleUbicacion}</p>
                  <p className="text-xs text-purple-700 dark:text-purple-400 font-semibold mt-2">{selectedTransfer.concepto}</p>
                </div>

                <div className="bg-slate-50 dark:bg-[#18181c] p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-400 uppercase">Datos del Cliente Pagador</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-1">{selectedTransfer.clienteNombre}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedTransfer.clienteEmail}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{selectedTransfer.clienteTelefono}</p>
                </div>
              </div>

              {/* Tabla de Liquidación de Comisiones */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Detalle de Liquidación
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-[#1a1a20] text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">Detalle</th>
                        <th className="p-3 text-right">Monto USD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">Monto total pagado por el cliente</td>
                        <td className="p-3 text-right font-mono">${selectedTransfer.montoBrutoUsd.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-slate-500">Deducción de comisión de gestión plataforma (10%)</td>
                        <td className="p-3 text-right font-mono text-red-500">-${selectedTransfer.comisionPlataformaUsd.toFixed(2)}</td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-emerald-50/60 dark:bg-emerald-950/30 font-bold text-slate-900 dark:text-white border-t border-emerald-200 dark:border-emerald-800">
                      <tr>
                        <td className="p-3 text-sm font-extrabold text-emerald-800 dark:text-emerald-300">Monto Neto Acreditado al Corredor</td>
                        <td className="p-3 text-right text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          ${selectedTransfer.montoNetoUsd.toFixed(2)} USD
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Bancos y Referencia */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#18181c] border border-slate-200 dark:border-slate-800 text-xs">
                <div className="space-y-1">
                  <p><span className="text-slate-400">Método de Pago:</span> <strong>{selectedTransfer.metodo}</strong></p>
                  <p><span className="text-slate-400">Banco Emisor (Cliente):</span> <strong>{selectedTransfer.bancoEmisor}</strong></p>
                  <p><span className="text-slate-400">Cuenta Destino (Corredor):</span> <strong>{selectedTransfer.bancoReceptor}</strong></p>
                  <p><span className="text-slate-400">N° Referencia Bancaria:</span> <strong className="font-mono text-purple-700 dark:text-purple-400">{selectedTransfer.referenciaBancaria}</strong></p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
                  <div className="w-10 h-10 bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center rounded text-center leading-tight p-1 font-mono">
                    [QR VERIFIED]
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    <p className="font-bold text-slate-700 dark:text-slate-300">Liquidación Validada</p>
                    <p>Firma digital Inverdata</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Acciones del Modal */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-[#18181c] border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedTransfer(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={handlePrint}
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
      )}
    </div>
  );
}
