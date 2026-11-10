import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import PasarelaPago from "../../components/pagos/PasarelaPago";
import { apiGet, apiPost } from "../../api";
import { v4 as uuid } from "uuid";

// Mock data de contratos para fallback y pruebas
const MOCK_CONTRATOS = [
  {
    id: "R-002",
    titulo: "Penthouse Torre Bella Vista",
    codigo: "Renta R-002",
    propietario: "Inversiones Metropolitanas SRL",
    cliente: "Dra. Elena Ramos",
    propietarioEmail: "contacto@metropolitanas.do",
    clienteEmail: "elena.ramos@med.org",
    ubicacion: "Av. Anacaona, Bella Vista, Santo Domingo",
    imagen: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    precioMensual: 24000,
    moneda: "USD",
    duracionMeses: 12,
    fechaInicio: "01 ene 2024",
    fechaFin: "01 dic 2024",
    estadoContrato: "Vigente",
    mensualidades: [
      { id: 1, mes: "Enero 2024", numero: 1, vencimiento: "01 ene 2024", importe: 24000, estado: "Pagado", fechaPago: "01 ene 2024", factura: "FAC-2024-002", metodo: "Transferencia Bancaria" },
      { id: 2, mes: "Febrero 2024", numero: 2, vencimiento: "01 feb 2024", importe: 24000, estado: "Pagado", fechaPago: "01 feb 2024", factura: "FAC-2024-046", metodo: "Transferencia Bancaria" },
      { id: 3, mes: "Marzo 2024", numero: 3, vencimiento: "01 mar 2024", importe: 24000, estado: "Pagado", fechaPago: "01 mar 2024", factura: "FAC-2024-090", metodo: "Transferencia Bancaria" },
      { id: 4, mes: "Abril 2024", numero: 4, vencimiento: "01 abr 2024", importe: 24000, estado: "Pagado", fechaPago: "01 abr 2024", factura: "FAC-2024-124", metodo: "Transferencia Bancaria" },
      { id: 5, mes: "Mayo 2024", numero: 5, vencimiento: "01 may 2024", importe: 24000, estado: "Pagado", fechaPago: "01 may 2024", factura: "FAC-2024-168", metodo: "Transferencia Bancaria" },
      { id: 6, mes: "Junio 2024", numero: 6, vencimiento: "01 jun 2024", importe: 24000, estado: "Pagado", fechaPago: "01 jun 2024", factura: "FAC-2024-211", metodo: "Transferencia Bancaria" },
      { id: 7, mes: "Julio 2024", numero: 7, vencimiento: "01 jul 2024", importe: 24000, estado: "Pagado", fechaPago: "01 jul 2024", factura: "FAC-2024-256", metodo: "Transferencia Bancaria" },
      { id: 8, mes: "Agosto 2024", numero: 8, vencimiento: "01 ago 2024", importe: 24000, estado: "Pagado", fechaPago: "01 ago 2024", factura: "FAC-2024-302", metodo: "Transferencia Bancaria" },
      { id: 9, mes: "Septiembre 2024", numero: 9, vencimiento: "01 sep 2024", importe: 24000, estado: "Pagado", fechaPago: "01 sep 2024", factura: "FAC-2024-349", metodo: "Transferencia Bancaria" },
      { id: 10, mes: "Octubre 2024", numero: 10, vencimiento: "01 oct 2024", importe: 24000, estado: "Pendiente", fechaPago: null, factura: "FAC-2024-395", metodo: "-" },
      { id: 11, mes: "Noviembre 2024", numero: 11, vencimiento: "01 nov 2024", importe: 24000, estado: "Pendiente", fechaPago: null, factura: "FAC-2024-441", metodo: "-" },
      { id: 12, mes: "Diciembre 2024", numero: 12, vencimiento: "01 dic 2024", importe: 24000, estado: "Pendiente", fechaPago: null, factura: "FAC-2024-489", metodo: "-" },
    ],
  },
  {
    id: "R-001",
    titulo: "Departamento A",
    codigo: "Renta R-001",
    propietario: "Propietario de ejemplo A",
    cliente: "Cliente de ejemplo A",
    propietarioEmail: "propietario.a@ejemplo.com",
    clienteEmail: "cliente.a@ejemplo.com",
    ubicacion: "Av. Winston Churchill, Piantini, Santo Domingo",
    imagen: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
    precioMensual: 1850,
    moneda: "USD",
    duracionMeses: 12,
    fechaInicio: "05 ene 2024",
    fechaFin: "05 dic 2024",
    estadoContrato: "Vigente",
    mensualidades: [
      { id: 1, mes: "Enero 2024", numero: 1, vencimiento: "05 ene 2024", importe: 18500, estado: "Pagado", fechaPago: "04 ene 2024 10:25 AM", factura: "FAC-2024-001", metodo: "Transferencia Bancaria ACH" },
      { id: 2, mes: "Febrero 2024", numero: 2, vencimiento: "05 feb 2024", importe: 18500, estado: "Pendiente", fechaPago: null, factura: "FAC-2024-045", metodo: "-" },
    ],
  },
];

// Tasas de cambio de respaldo si la API de tasas no responde (igual que la
// pasarela anterior).
const TASA_FALLBACK_DOLAR = 54.5;
const TASA_FALLBACK_EURO = 58.32;

export default function PasarelaMensualidadPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const cuotaParam = searchParams.get("cuota") || searchParams.get("cuotaId");

  // Encontrar contrato correspondiente
  const [contrato, setContrato] = useState(() => {
    if (id) {
      const match = MOCK_CONTRATOS.find((c) => String(c.id).toLowerCase() === String(id).toLowerCase());
      if (match) return match;
    }
    return MOCK_CONTRATOS[0];
  });

  // Tasa BCV del día (para mostrar el equivalente en Bolívares).
  const [tasasData, setTasasData] = useState(null);

  useEffect(() => {
    apiGet("/tasas/actual")
      .then((res) => {
        if (res?.data) setTasasData(res.data);
      })
      .catch(() => {});
  }, []);

  // Intentar cargar datos reales si se proporciona un id o uuid de contrato.
  useEffect(() => {
    if (id && (/^\d+$/.test(id) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
      apiGet(`/contratos/${id}`)
        .then((res) => {
          if (res?.data) {
            const c = res.data;
            setContrato({
              id: c.contrato_id || id,
              uuid: c.contrato_uuid || id,
              titulo: c.inmueble_titulo || "Inmueble de Alquiler",
              codigo: `CON-${c.contrato_id || id}`,
              propietario: c.corredor_nombre || "Propietario",
              cliente: c.cliente_nombre || "Inquilino",
              ubicacion: `${c.inmueble_ciudad || ""}, ${c.inmueble_region || ""}`,
              imagen: c.inmueble_imagen_url || MOCK_CONTRATOS[0].imagen,
              precioMensual: Number(c.precio_mensualidad || 500),
              moneda: c.moneda || "USD",
              duracionMeses: c.cantidad_meses || 12,
              fechaInicio: c.fecha_inicio,
              estadoContrato: c.active ? "Vigente" : "Finalizado",
              mensualidades: Array.isArray(c.mensualidades) && c.mensualidades.length > 0
                ? c.mensualidades.map((m) => ({
                    id: m.id,
                    uuid: m.uuid || m.id,
                    numero: m.numero_cuota,
                    mes: `Cuota ${m.numero_cuota}`,
                    vencimiento: `${m.periodo_mes}/${m.periodo_anio}`,
                    importe: Number(m.monto_meta || c.precio_mensualidad),
                    estado: m.estado === "pagado" ? "Pagado" : "Pendiente",
                    fechaPago: m.estado === "pagado" ? "Acreditado" : null,
                    factura: `FAC-${m.id}`,
                    metodo: "Pago Digital",
                  }))
                : [
                    {
                      id: 1,
                      numero: 1,
                      mes: "Próxima Cuota",
                      vencimiento: "Al día",
                      importe: Number(c.precio_mensualidad || 500),
                      estado: "Pendiente",
                    },
                  ],
            });
          }
        })
        .catch(() => {});
    }
  }, [id]);

  // Encontrar la cuota inicial a pagar (la URL puede traer uuid o id numerico).
  const cuotaInicial =
    (cuotaParam && contrato?.mensualidades?.find((m) => String(m.uuid) === String(cuotaParam) || String(m.id) === String(cuotaParam) || String(m.numero) === String(cuotaParam))) ||
    contrato?.mensualidades?.find((m) => m.estado?.toLowerCase() === "pendiente") ||
    contrato?.mensualidades?.[0];

  // Cuota activa (la primera pendiente; sin selector manual).
  const cuotaActiva = cuotaInicial;

  // Redirigir al inicio si la mensualidad ya está pagada
  useEffect(() => {
    if (cuotaActiva?.estado === "Pagado") {
      navigate("/", { replace: true });
    }
  }, [cuotaActiva?.estado, navigate]);

  // Moneda, importe y equivalencia en Bolívares.
  const moneda = String(contrato?.moneda || "USD").toUpperCase();
  const esBs = moneda === "BS" || moneda === "VES";
  const tasaDiaRaw = tasasData
    ? moneda === "EUR"
      ? Number(tasasData.bcv_euro)
      : Number(tasasData.bcv_dolar)
    : NaN;
  const tasaCambio = esBs
    ? 1
    : Number.isFinite(tasaDiaRaw)
      ? tasaDiaRaw
      : moneda === "EUR"
        ? TASA_FALLBACK_EURO
        : TASA_FALLBACK_DOLAR;

  const importe = Number(cuotaActiva?.importe || contrato?.precioMensual || 0);
  const montoBs = esBs ? importe : importe * tasaCambio;
  const montoLabel = esBs
    ? `Bs. ${importe.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`
    : `$${importe.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${moneda}`;

  const handlePagoExitoso = (resultado) => {
    // Actualizar estado en el contrato en memoria
    if (contrato && resultado?.cuotaId) {
      setContrato((prev) => ({
        ...prev,
        mensualidades: prev.mensualidades.map((m) =>
          m.id === resultado.cuotaId
            ? {
                ...m,
                estado: "Pagado",
                fechaPago: resultado.fechaPago,
                factura: resultado.factura,
                metodo: resultado.metodo,
              }
            : m
        ),
      }));
    }
  };

  // `PasarelaPago` delega el cobro aquí. Conecta al endpoint real POST /transacciones/pago-mensualidad.
  const handleSubmitPago = async ({ metodoPago, cardBrand, formData }) => {
    const mensualidadId = cuotaActiva?.mensualidad_id ?? cuotaActiva?.id;

    if (!mensualidadId) {
      throw new Error("No se encontró la cuota a pagar");
    }

    const idempotencyKey = uuid();
    const res = await apiPost(
      "/transacciones/pago-mensualidad",
      { mensualidad_id: mensualidadId },
      idempotencyKey
    );

    const data = res?.data || res;
    const montoPagado = Number(data?.monto ?? importe);
    const monedaRes = String(data?.moneda || moneda).toUpperCase();
    const esBsRes = monedaRes === "BS" || monedaRes === "VES";
    const montoBsRes = esBsRes ? montoPagado : montoPagado * (esBs ? tasaCambio : tasaDiaRaw || tasaCambio);

    const resultado = {
      cuotaId: mensualidadId,
      cuotaNumero: data?.numero_cuota ?? cuotaActiva?.numero,
      cuotaMes: cuotaActiva?.mes,
      montoPrincipal: montoPagado,
      montoUsd: montoPagado,
      moneda: monedaRes,
      montoBs: montoBsRes,
      tasa: esBsRes ? null : (esBs ? tasaCambio : tasaDiaRaw || tasaCambio),
      brand: cardBrand || "visa",
      ultimosDigitos: formData?.numeroTarjeta ? formData.numeroTarjeta.slice(-4) : "",
      referencia: `AUTH-MENS-${data?.transaccion_id || Math.floor(100000 + Math.random() * 900000)}`,
      factura: data?.numero_factura || `FAC-${new Date().getFullYear()}-${String(data?.numero_cuota || cuotaActiva?.numero || 1).padStart(3, "0")}`,
      fechaPago: new Date().toLocaleString("es-VE", { dateStyle: "medium", timeStyle: "short" }),
      metodo: metodoPago,
      contratoTitulo: contrato?.titulo || "Inmueble de Alquiler",
      contratoCodigo: contrato?.codigo || `CON-${data?.contrato_id || contrato.id}`,
    };

    handlePagoExitoso(resultado);
    return resultado;
  };

  const cuotasPagadas = contrato?.mensualidades?.filter((m) => m.estado === "Pagado").length || 0;
  const totalCuotas = contrato?.mensualidades?.length || 12;

  // Bloque que `PasarelaPago` inserta dentro del formulario: resumen de la cuota
  // que se está pagando.
  const resumenCuota = (
    <div className="rounded-2xl border border-purple-100 dark:border-purple-900/30 bg-gradient-to-br from-slate-50 to-purple-50/40 dark:from-slate-800/40 dark:to-purple-950/20 p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 dark:bg-purple-950 text-[#470A68] dark:text-purple-300">
              Cuota #{cuotaActiva?.numero ?? "-"}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Vence: <strong className="text-slate-800 dark:text-slate-200">{cuotaActiva?.vencimiento || "—"}</strong>
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            {cuotaActiva?.mes || "Próxima cuota"} • {contrato?.titulo || "Alquiler Fijo"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Inquilino: <span className="font-semibold text-slate-700 dark:text-slate-300">{contrato?.cliente || "Cliente"}</span> | Propietario: <span className="font-semibold text-slate-700 dark:text-slate-300">{contrato?.propietario || "Arrendador"}</span>
          </p>
        </div>

        <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-purple-200/40 dark:border-purple-800/40">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Mensualidad
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block leading-tight">
            {montoLabel}
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
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navegación y Volver */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-[#470A68] dark:hover:text-purple-400 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Volver a mensualidades</span>
          </button>

          <Link
            to={`/mensualidades/${contrato.uuid || contrato.id}`}
            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
          >
            Ver historial completo del contrato
          </Link>
        </div>

        {/* Layout en 2 columnas: Detalles a la izquierda, Pasarela a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* COLUMNA IZQUIERDA: RESUMEN DEL CONTRATO DE ARRIENDO */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#470A68] dark:text-purple-300 text-xs font-black tracking-wider uppercase mb-2">
                Canon de Arrendamiento
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Pago de Mensualidad
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Realiza el abono de tu cuota de alquiler mensual con confirmación en línea y emisión de recibo digital validado.
              </p>
            </div>

            {/* Tarjeta del Inmueble y Contrato */}
            <div className="bg-white dark:bg-[#141417] rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={contrato.imagen}
                  alt={contrato.titulo}
                  className="w-20 h-20 rounded-2xl object-cover shadow-sm shrink-0 border border-slate-100 dark:border-slate-800"
                />
                <div className="space-y-1 min-w-0">
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-[#470A68] dark:text-purple-300 text-[10px] font-black uppercase tracking-wider">
                    {contrato.codigo}
                  </span>
                  <h3 className="font-black text-slate-900 dark:text-white text-base truncate">
                    {contrato.titulo}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {contrato.ubicacion}
                  </p>
                </div>
              </div>

              {/* Barra de Progreso del Arriendo */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-slate-400">Progreso del arriendo:</span>
                  <span className="text-purple-700 dark:text-purple-300 font-black">
                    {cuotasPagadas} de {totalCuotas} cuotas pagadas
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#470A68] to-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((cuotasPagadas / totalCuotas) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Fila Propietario / Inquilino */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-[#18181c] rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Arrendador</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                    {contrato.propietario}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#18181c] rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Inquilino</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                    {contrato.cliente}
                  </span>
                </div>
              </div>
            </div>

            {/* Redes y Garantías de Seguridad */}
            <div className="p-4 bg-white dark:bg-[#141417] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                Canales Bancarios Integrados
              </span>
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                <span className="text-blue-600 dark:text-blue-400 font-black italic">VISA</span>
                <span className="text-amber-600 dark:text-amber-400 font-black">Mastercard</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Pago Móvil C2P</span>
                <span className="text-purple-600 dark:text-purple-400 font-black">Zelle</span>
                <span className="text-yellow-500 font-black">Binance</span>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: PASARELA DE PAGO (mismo componente que PasarelaPagoPage) */}
          <div className="lg:col-span-7">
            <PasarelaPago
              titulo="Pasarela de Pago de Mensualidad"
              subtitulo="Cancela tu canon de arrendamiento mensual de forma segura con acreditación en línea."
              montoLabel={montoLabel}
              inmueble={{ titulo: contrato.titulo, ubicacion: contrato.ubicacion, imagen: contrato.imagen, moneda }}
              resumen={resumenCuota}
              onSubmit={handleSubmitPago}
              onComprobanteClose={() => navigate(`/mensualidades/${contrato.uuid || contrato.id}`)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
