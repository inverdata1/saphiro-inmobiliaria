import { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";

// Datos de ejemplo realistas de recibos
const MOCK_RECIBOS = [
  {
    id: "REC-2026-0089",
    referencia: "PAY-984210",
    inmueble: "Apartamento de Lujo en Altamira",
    inmuebleUbicacion: "Altamira, Caracas",
    inmuebleImagen: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80",
    tipo: "Reserva Vacacional",
    fecha: "2026-09-02",
    montoUsd: 450.00,
    montoBs: 16425.00,
    bancoEmisor: "Banesco",
    referenciaBancaria: "74839201",
    estado: "Verificado",
    cliente: "Carlos Mendoza",
    emailCliente: "carlos.mendoza@email.com",
    concepto: "Pago de reserva 3 noches (15 Sep - 18 Sep 2026)",
    subtotal: 400.00,
    comisionServicio: 50.00,
    iva: 0.00,
  },
  {
    id: "REC-2026-0074",
    referencia: "PAY-872314",
    inmueble: "Villa Sol & Playa Chichiriviche",
    inmuebleUbicacion: "Chichiriviche, Falcón",
    inmuebleImagen: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80",
    tipo: "Reserva Vacacional",
    fecha: "2026-08-20",
    montoUsd: 680.00,
    montoBs: 24820.00,
    bancoEmisor: "Bank of America",
    referenciaBancaria: "ZEL-9921048",
    estado: "Verificado",
    cliente: "Carlos Mendoza",
    emailCliente: "carlos.mendoza@email.com",
    concepto: "Depósito de garantía + alquiler semana completa",
    subtotal: 600.00,
    comisionServicio: 80.00,
    iva: 0.00,
  },
  {
    id: "REC-2026-0061",
    referencia: "PAY-651209",
    inmueble: "Townhouse Moderno Las Mercedes",
    inmuebleUbicacion: "Las Mercedes, Caracas",
    inmuebleImagen: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80",
    tipo: "Canon de Alquiler",
    fecha: "2026-08-01",
    montoUsd: 1200.00,
    montoBs: 43800.00,
    bancoEmisor: "Mercantil",
    referenciaBancaria: "0091238471",
    estado: "Verificado",
    cliente: "Carlos Mendoza",
    emailCliente: "carlos.mendoza@email.com",
    concepto: "Canon mensual de arrendamiento (Agosto 2026)",
    subtotal: 1200.00,
    comisionServicio: 0.00,
    iva: 0.00,
  },
  {
    id: "REC-2026-0045",
    referencia: "PAY-443901",
    inmueble: "Penthouse Vista al Ávila",
    inmuebleUbicacion: "Los Palos Grandes, Caracas",
    inmuebleImagen: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=400&q=80",
    tipo: "Inicial de Compra",
    fecha: "2026-09-06",
    montoUsd: 2500.00,
    montoBs: 91250.00,
    bancoEmisor: "BBVA Provincial",
    referenciaBancaria: "88392019",
    estado: "Pendiente",
    cliente: "Carlos Mendoza",
    emailCliente: "carlos.mendoza@email.com",
    concepto: "Abono inicial apartado de venta de inmueble",
    subtotal: 2500.00,
    comisionServicio: 0.00,
    iva: 0.00,
  },
];

export default function MisRecibosPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedRecibo, setSelectedRecibo] = useState(null);

  // Filtrado dinámico
  const recibosFiltrados = useMemo(() => {
    return MOCK_RECIBOS.filter((r) => {
      const matchSearch =
        r.inmueble.toLowerCase().includes(search.toLowerCase()) ||
        r.referencia.toLowerCase().includes(search.toLowerCase()) ||
        r.concepto.toLowerCase().includes(search.toLowerCase());

      return matchSearch;
    });
  }, [search]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 text-slate-800 dark:text-slate-100 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Encabezado Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              Mis Recibos
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Historial y comprobantes digitales de tus pagos realizados en la plataforma.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSearch("");
              }}
              className="inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#18181c] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refrescar
            </button>
          </div>
        </div>

        {/* Buscador y Controles de Filtro */}
        <div className="bg-white dark:bg-[#151518] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Buscador */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar por inmueble, referencia o concepto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#1d1d22] border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-400 transition"
              />
              <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

        </div>

        {/* Lista Principal de Recibos (Propuesta 1) */}
        <div className="space-y-3">
          {recibosFiltrados.length === 0 ? (
            <div className="bg-white dark:bg-[#151518] rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
              <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-200">No se encontraron recibos</p>
              <p className="text-xs text-slate-400">Intenta cambiar los filtros de búsqueda.</p>
            </div>
          ) : (
            recibosFiltrados.map((recibo) => (
              <div
                key={recibo.id}
                onClick={() => setSelectedRecibo(recibo)}
                className="group bg-white dark:bg-[#151518] hover:bg-purple-50/50 dark:hover:bg-purple-950/20 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 hover:border-purple-300 dark:hover:border-purple-800 shadow-sm transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Lado Izquierdo: Info Principal */}
                <div className="flex items-center gap-4">
                  {/* Foto o Icono */}
                  <img
                    src={recibo.inmuebleImagen}
                    alt={recibo.inmueble}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md">
                        {recibo.id}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {recibo.tipo}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-base mt-0.5 group-hover:text-purple-800 dark:group-hover:text-purple-300 transition-colors">
                      {recibo.inmueble}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span>Ref: <strong className="font-mono text-slate-700 dark:text-slate-300">{recibo.referenciaBancaria}</strong></span>
                      <span>•</span>
                      <span>{new Date(recibo.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>

                {/* Lado Derecho: Estado, Monto y Botón Ver */}
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800/80">
                  <div className="text-left sm:text-right">
                    <div className="text-lg font-black text-slate-900 dark:text-white">
                      ${recibo.montoUsd.toFixed(2)}{" "}
                      <span className="text-xs font-normal text-slate-400">USD</span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Bs. {recibo.montoBs.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                        recibo.estado === "Verificado"
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${recibo.estado === "Verificado" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                      {recibo.estado}
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

      {/* Modal / Visor del Recibo Digital (Propuesta 1) */}
      {selectedRecibo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-white dark:bg-[#121215] text-slate-900 dark:text-slate-100 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#18181c]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-600"></span>
                <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Comprobante Digital de Pago
                </h2>
              </div>
              <button
                onClick={() => setSelectedRecibo(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido Imprimible del Recibo */}
            <div id="recibo-printable" className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Encabezado del Recibo */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-dashed border-slate-300 dark:border-slate-700">
                <div>
                  <h3 className="text-xl font-black text-[#470A68] dark:text-purple-400 tracking-tight">
                    INVERDATA C.A.
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">RIF: J-50192841-0 • Inmobiliaria Digital</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Caracas, Venezuela</p>
                </div>
                <div className="text-left sm:text-right bg-purple-50 dark:bg-purple-950/40 p-3 rounded-2xl border border-purple-200 dark:border-purple-800/60">
                  <p className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase">Recibo N°</p>
                  <p className="text-lg font-mono font-black text-slate-900 dark:text-white">{selectedRecibo.id}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Fecha: {selectedRecibo.fecha}</p>
                </div>
              </div>

              {/* Inmueble y Cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-[#18181c] p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-400 uppercase">Emisor / Inmueble</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-1">{selectedRecibo.inmueble}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedRecibo.inmuebleUbicacion}</p>
                  <span className="inline-block mt-2 text-[11px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-2 py-0.5 rounded">
                    {selectedRecibo.tipo}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-[#18181c] p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-400 uppercase">Cliente / Pagador</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-1">
                    {user?.nombre || selectedRecibo.cliente}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user?.email || selectedRecibo.emailCliente}
                  </p>
                  <span className="inline-block mt-2 text-[11px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded">
                    Estatus: {selectedRecibo.estado}
                  </span>
                </div>
              </div>

              {/* Detalle de Pago */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Desglose del Pago
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-[#1a1a20] text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">Concepto</th>
                        <th className="p-3 text-right">Monto USD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{selectedRecibo.concepto}</td>
                        <td className="p-3 text-right font-mono">${selectedRecibo.subtotal.toFixed(2)}</td>
                      </tr>
                      {selectedRecibo.comisionServicio > 0 && (
                        <tr>
                          <td className="p-3 text-slate-500">Comisión por servicio de plataforma</td>
                          <td className="p-3 text-right font-mono text-slate-500">${selectedRecibo.comisionServicio.toFixed(2)}</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-purple-50/60 dark:bg-purple-950/30 font-bold text-slate-900 dark:text-white border-t border-purple-200 dark:border-purple-800">
                      <tr>
                        <td className="p-3 text-sm font-extrabold">Total Pagado</td>
                        <td className="p-3 text-right text-base font-black text-[#470A68] dark:text-purple-300 font-mono">
                          ${selectedRecibo.montoUsd.toFixed(2)} USD
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Datos Bancarios y QR */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#18181c] border border-slate-200 dark:border-slate-800">
                <div className="text-xs space-y-1 w-full sm:w-auto">
                  <p><span className="text-slate-400">Banco / Entidad:</span> <strong>{selectedRecibo.bancoEmisor}</strong></p>
                  <p><span className="text-slate-400">N° de Referencia:</span> <strong className="font-mono text-purple-700 dark:text-purple-400">{selectedRecibo.referenciaBancaria}</strong></p>
                </div>

                {/* Marcador de QR para verificación */}
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
                  <div className="w-12 h-12 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-[10px] flex items-center justify-center rounded text-center leading-tight p-1 font-mono">
                    [QR VERIFY]
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    <p className="font-bold text-slate-700 dark:text-slate-300">Verificación Segura</p>
                    <p>Firma digital Inverdata</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Acciones del Modal */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-[#18181c] border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedRecibo(null)}
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
