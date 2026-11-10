import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ComprobanteTransaccionModal from "../../components/pagos/ComprobanteTransaccionModal";
import { apiGet } from "../../api";
import { useAuth } from "../../context/useAuth";
import { formatDateTime } from "../../utils/date";
import { calcularComision } from "../../utils/comision";

// Iniciales a partir del nombre (máximo 2).
function getInitials(nombre = "") {
  const parts = String(nombre)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "-";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

// Meses para el rotulo de cada cuota (periodo_mes: 1..12).
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// Selector de periodo (mes + año) para un extremo del rango. El valor viaja como
// "AAAA-MM"; "sin-mes" significa extremo abierto (sin limite por ese lado).
const MES_CORTO = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// Rango de años ofrecidos en el selector: cubre siempre el año actual y el siguiente, y
// ademas todo año que aparezca en el contrato (pasado o futuro), sin huecos intermedios.
function rangoDeAnios(anios, hoy = new Date()) {
  const anioActual = hoy.getFullYear();
  const validos = (anios || []).map(Number).filter((a) => a > 1900);
  const menor = Math.min(anioActual, ...validos);
  const mayor = Math.max(anioActual + 1, ...validos);
  const lista = [];
  for (let a = mayor; a >= menor; a--) lista.push(a);
  return lista;
}

// Solo se puede pagar el mes en curso y el siguiente (`hoy` es la fecha del navegador).
// Las cuotas de meses ya cerrados o mas lejanos quedan visibles en la tabla, pero sin
// boton de pagar: obliga a ponerse al dia por el cauce correcto y evita adelantar meses
// que todavia no corresponden.
//
// Ademas hay una regla de secuencia: la cuota del mes siguiente solo se habilita si la
// del mes actual ya esta PAGADA (una parcial no cuenta: sigue debiendo, y adelantar el
// mes siguiente dejaria huecos). Si el contrato no tiene cuota para el mes actual, no hay
// nada que saldar antes, asi que se permite la del siguiente.
//
// Compara por periodo (anio, mes), no por el texto del rotulo, para que funcione aunque
// el contrato venga de otro anio. Una cuota sin periodo valido no se puede situar en el
// calendario: se deja fuera del rango (no se habilita pagar a ciegas).
//
// Devuelve el motivo del bloqueo (para el aviso de la tabla) o null si se puede pagar.
const MESES_POR_ANIO = 12;

function bloqueoDePago(cuota, cuotaActual, hoy = new Date()) {
  const anio = Number(cuota?.periodoAnio);
  const mes = Number(cuota?.periodoMes);
  if (!anio || !mes) return "sin-periodo";

  const periodoActual = hoy.getFullYear() * MESES_POR_ANIO + hoy.getMonth();
  const periodoDeLaCuota = anio * MESES_POR_ANIO + (mes - 1);
  const diferencia = periodoDeLaCuota - periodoActual;

  // Fuera de la ventana (meses pasados o a partir del siguiente al proximo).
  if (diferencia < 0 || diferencia >= 2) return "fuera-de-rango";

  // Es la del mes siguiente: exige que la actual este saldada.
  if (diferencia === 1 && cuotaActual && cuotaActual.estado !== "Pagado") {
    return "requiere-cuota-actual";
  }

  return null;
}

// La cuota del mes en curso dentro del contrato (o null si no existe).
function cuotaDelMesActual(cuotas, hoy = new Date()) {
  const periodoActual = hoy.getFullYear() * MESES_POR_ANIO + hoy.getMonth();
  return (
    (cuotas || []).find(
      (c) => Number(c?.periodoAnio) * MESES_POR_ANIO + (Number(c?.periodoMes) - 1) === periodoActual
    ) || null
  );
}

const IMAGEN_FALLBACK =
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80";

// Cuotas por página en la tabla (fijo, sin selector).
const PAGE_SIZE = 12;

// Cuota de la API (/contratos/:id/mensualidades) -> fila de la tabla y del comprobante.
function mapCuota(m) {
  const raw = String(m.estado || "pendiente").toLowerCase();
  const pagos = Array.isArray(m.transacciones) ? m.transacciones : [];
  const pago = pagos.find((t) => t.estatus_pago === "pagado") || pagos[0] || null;
  const mes = MESES[(Number(m.periodo_mes) || 1) - 1] || "-";
  const anio = m.periodo_anio || "";
  // La comision no se toma del backend (que ya la calcula su trigger) sino que se
  // aplica aqui el porcentaje del corredor sobre lo cobrado de la cuota. El helper
  // documenta por que la base es lo cobrado y no el importe pactado.
  //
  // `monto_pagado` puede estar repartido en varios abonos, y cada abono puede haber
  // llevado un porcentaje distinto (el corredor cambio su % entre pagos). El reparto de
  // un abono concreto no lo expone la API, asi que se prorratea: cada pago aporta la
  // parte de `monto_pagado` que le toca segun su `monto_total` dentro de la cuota, y se
  // le aplica SU porcentaje. Con un solo pago (lo normal) esto es exactamente
  // monto_pagado x porcentaje.
  const porcentajeComision =
    Number(pagos.find((t) => t.porcentaje_aplicado != null)?.porcentaje_aplicado || 0) || 0;
  const totalTransaccionado = pagos.reduce((sum, t) => sum + Number(t.monto_total || 0), 0);
  const comision = calcularComision(
    pagos.map((t) => ({
      montoPagado:
        totalTransaccionado > 0
          ? (Number(m.monto_pagado || 0) * Number(t.monto_total || 0)) / totalTransaccionado
          : 0,
      porcentajeAplicado: t.porcentaje_aplicado,
    }))
  );
  return {
    id: m.id,
    uuid: m.uuid || m.id,
    numero: m.numero_cuota,
    // Periodo numerico, para situar la cuota en el calendario (ver bloqueoDePago).
    // El rotulo de `mes` es solo para mostrar.
    periodoMes: Number(m.periodo_mes) || null,
    periodoAnio: Number(m.periodo_anio) || null,
    mes: anio ? `${mes} ${anio}` : mes,
    vencimiento: anio ? `${mes} ${anio}` : mes,
    importe: Number(m.monto_meta || 0),
    montoPagado: Number(m.monto_pagado || 0),
    estado: raw === "pagado" ? "Pagado" : raw === "pagado_parcial" ? "Parcial" : "Pendiente",
    fechaPago: pago?.fecha_transaccion ? formatDateTime(pago.fecha_transaccion) : null,
    factura: pago?.numero_factura || `CUOTA-${m.id}`,
    metodo: pago
      ? `${(pago.moneda || "").toString().toUpperCase()} • ${pago.estatus_pago}`
      : "Pendiente de pago",
    comision,
    porcentajeComision,
    transacciones: pagos,
  };
}

// Contrato de la API -> shape que consumen la tarjeta, la tabla y la pasarela.
function mapContrato(c) {
  const ciudad = c.inmueble_ciudad || "";
  const region = c.inmueble_region || "";
  return {
    id: c.contrato_id,
    uuid: c.contrato_uuid || c.contrato_id,
    inmueble_id: c.inmueble_id,
    inmueble_uuid: c.inmueble_uuid,
    titulo: c.inmueble_titulo || "Inmueble de alquiler",
    codigo: `CON-${c.contrato_id}`,
    propietario: c.corredor_nombre || "-",
    propietarioEmail: c.corredor_email || "",
    cliente: c.cliente_nombre || "-",
    clienteEmail: c.cliente_email || "",
    clienteId: c.cliente_id ?? null,
    clienteFoto: c.cliente_foto_url || c.cliente_foto || c.cliente_foto_perfil || "",
    // Propietario del inmueble = corredor del contrato (usuarios.id del corredor).
    corredorUsuarioId: c.corredor_usuario_id ?? null,
    propietarioFoto: c.corredor_foto_url || c.corredor_foto || c.corredor_foto_cuadrada || "",
    ubicacion: [region, ciudad].filter(Boolean).join(", ") || "Santo Domingo",
    imagen: c.inmueble_imagen_url || IMAGEN_FALLBACK,
    precioMensual: Number(c.precio_mensualidad || 0),
    moneda: c.moneda || "USD",
    duracionMeses: c.cantidad_meses,
    fechaInicio: c.fecha_inicio,
    estadoContrato: c.active ? "Vigente" : "Finalizado",
    mensualidades: (Array.isArray(c.mensualidades) ? c.mensualidades : []).map(mapCuota),
  };
}

// Filas de GET /contratos/inmueble/:id/mensualidades agrupadas por contrato.
// Se usa cuando el :id de la URL es un inmueble y no hay contrato que listar.
function agruparPorContrato(rows, inmueble) {
  const porId = new Map();
  (rows || []).forEach((r) => {
    if (!porId.has(r.contrato_id)) {
      porId.set(r.contrato_id, {
        id: r.contrato_id,
        uuid: r.contrato_uuid || r.contrato_id,
        inmueble_id: r.inmueble_id,
        inmueble_uuid: r.inmueble_uuid || inmueble?.uuid,
        titulo: r.inmueble_titulo || inmueble?.titulo || "Inmueble de alquiler",
        codigo: `CON-${r.contrato_id}`,
        propietario: "-",
        propietarioIniciales: getInitials("-"),
        cliente: r.cliente_nombre || "-",
        clienteId: r.cliente_id ?? null,
        clienteFoto: r.cliente_foto_url || "",
        clienteIniciales: getInitials(r.cliente_nombre),
        // El listado por inmueble no trae el corredor; queda null y se resuelve por email.
        corredorUsuarioId: null,
        propietarioFoto: "",
        ubicacion: "",
        imagen: IMAGEN_FALLBACK,
        precioMensual: Number(r.precio_mensualidad || 0),
        moneda: r.moneda || "USD",
        duracionMeses: r.cantidad_meses,
        fechaInicio: r.fecha_inicio,
        estadoContrato: r.contrato_active ? "Vigente" : "Finalizado",
        mensualidades: [],
      });
    }
    porId.get(r.contrato_id).mensualidades.push(mapCuota(r));
  });
  return [...porId.values()];
}

export default function MensualidadesInmueblePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  // Metadata del contrato activo (título, imagen, cliente, moneda, etc.).
  const [contratosList, setContratosList] = useState([]);
  const [loadingContrato, setLoadingContrato] = useState(true);
  const [error, setError] = useState("");

  // Cuotas de la página actual + paginación, calculadas por la API.
  const [cuotas, setCuotas] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    offset: 0,
    total: 0,
    totalPages: 1,
    hasMore: false,
  });
  const [loadingCuotas, setLoadingCuotas] = useState(false);

  // Controles de la tabla (viajan a la API: page/estado/q). PAGE_SIZE es fijo.
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");

  // Rango por periodo (mes/año desde y hasta). Cadena vacía = extremo abierto.
  // Se guardan ya normalizados a "AAAA-MM" para que el filtro de la API sea directo.
  const [periodoDesde, setPeriodoDesde] = useState("");
  const [periodoHasta, setPeriodoHasta] = useState("");
  const [selDesdeMes, setSelDesdeMes] = useState("");
  const [selDesdeAnio, setSelDesdeAnio] = useState("");
  const [selHastaMes, setSelHastaMes] = useState("");
  const [selHastaAnio, setSelHastaAnio] = useState("");

  // 1) Metadata del contrato. El :id puede ser un contrato (links de
  // RentasContratadas / InmueblesAlquilados) o un inmueble; sin :id, el primero
  // del alcance del usuario.
  useEffect(() => {
    let cancelled = false;
    setLoadingContrato(true);
    setError("");

    (async () => {
      try {
        if (!id) {
          const res = await apiGet("/contratos", { limit: 200 });
          if (cancelled) return;
          setContratosList((res?.data || []).map(mapContrato));
          return;
        }

        // 1a) ¿Es un contrato? -> detalle directo.
        try {
          const det = await apiGet(`/contratos/${id}`);
          if (cancelled) return;
          if (det?.data?.contrato_id) {
            setContratosList([mapContrato(det.data)]);
            return;
          }
        } catch {
          // 404: no es un contrato -> se prueba como inmueble.
        }

        // 1b) Es un inmueble -> busca un contrato suyo para tener la metadata.
        let encontrado = null;
        try {
          const res = await apiGet("/contratos", { limit: 200 });
          encontrado =
            (res?.data || []).find(
              (c) =>
                String(c.inmueble_id) === String(id) ||
                String(c.inmueble_uuid || "") === String(id)
            ) || null;
        } catch {
          encontrado = null;
        }

        if (encontrado) {
          setContratosList([mapContrato(encontrado)]);
          return;
        }

        // 1c) Sin contrato en el listado: se arma con las cuotas del inmueble.
        const men = await apiGet(`/contratos/inmueble/${id}/mensualidades`, { limit: 1 });
        if (cancelled) return;
        const first = (men?.data || [])[0];
        if (first?.contrato_id) {
          try {
            const det = await apiGet(`/contratos/${first.contrato_id}`);
            if (det?.data?.contrato_id) {
              setContratosList([mapContrato(det.data)]);
              return;
            }
          } catch {
            // sin detalle: se usa lo mínimo que trae el listado de mensualidades
          }
        }
        setContratosList(agruparPorContrato(men?.data || [], men?.inmueble));
      } catch (e) {
        if (!cancelled) {
          setContratosList([]);
          setError(e?.message || "No se pudieron cargar las mensualidades");
        }
      } finally {
        if (!cancelled) setLoadingContrato(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Contrato activo (sin selector: primero del alcance / de la URL).
  const contrato = contratosList[0] || null;
  const contratoId = contrato?.id ?? null;

  // El inmueble le pertenece al usuario si este es el corredor/propietario del
  // contrato. En ese caso no debe ver la pasarela: él cobra, no paga. Se compara
  // por id (corredor_usuario_id) y, si el endpoint no lo trae, por email.
  const esPropietario = useMemo(() => {
    if (!user || !contrato) return false;
    const uid = Number(user.id);
    if (Number.isFinite(uid) && contrato.corredorUsuarioId != null) {
      return Number(contrato.corredorUsuarioId) === uid;
    }
    const email = String(user.email || "").trim().toLowerCase();
    return (
      !!email && email === String(contrato.propietarioEmail || "").trim().toLowerCase()
    );
  }, [user, contrato]);

  // Cuota cuyo comprobante se esta viendo. Se guarda la cuota (no un booleano)
  // porque el modal se alimenta de sus datos ya mapeados.
  const [cuotaComprobante, setCuotaComprobante] = useState(null);

  // Cuota mapeada -> contrato de data para <ComprobanteTransaccionModal variant="mensualidad">.
  // El desglose de la cuota no lo trae la API en este listado: se pinta la fila
  // unica (concepto = "Cuota #N • Mes").
  //
  // Al propietario (corredor) se le muestra la comision que la plataforma le retiene,
  // asi que el comprobante pasa a leer cobrado -> comision -> neto. El inquilino nunca
  // ve ese desglose: para el solo existe lo que pago.
  const comprobanteMensualidad = useMemo(() => {
    if (!cuotaComprobante || !contrato) return null;
    return {
      id: cuotaComprobante.factura,
      fecha: cuotaComprobante.fechaPago || null,
      inmueble: contrato.titulo,
      inmuebleUbicacion: contrato.ubicacion,
      clienteNombre: contrato.cliente,
      clienteEmail: contrato.clienteEmail,
      moneda: contrato.moneda,
      montoTotal: cuotaComprobante.importe,
      montoPagado: cuotaComprobante.montoPagado,
      concepto: `Cuota #${cuotaComprobante.numero} • ${cuotaComprobante.mes}`,
      estado: cuotaComprobante.estado,
      referenciaBancaria: cuotaComprobante.factura,
      // Solo el propietario recibe comision/porcentaje; al inquilino le queda 0/null
      // y el componente no dibuja la resta.
      comision: esPropietario ? cuotaComprobante.comision : 0,
      porcentajeAplicado: esPropietario ? cuotaComprobante.porcentajeComision : null,
    };
  }, [cuotaComprobante, contrato, esPropietario]);

  // 2) Cuotas paginadas del contrato activo: la paginación y los filtros los
  // resuelve la API (GET /contratos/:id/mensualidades).
  useEffect(() => {
    if (!contratoId) {
      setCuotas([]);
      setLoadingCuotas(false);
      return;
    }

    let cancelled = false;
    setLoadingCuotas(true);

    (async () => {
      try {
        const params = { page, limit: PAGE_SIZE };
        if (filterStatus !== "all") {
          // "Pendientes" agrupa pendiente + pago parcial en una sola petición.
          params.estado = filterStatus === "pendiente" ? "pendiente,pagado_parcial" : filterStatus;
        }
        if (periodoDesde) params.periodo_desde = periodoDesde;
        if (periodoHasta) params.periodo_hasta = periodoHasta;

        const res = await apiGet(`/contratos/${contratoId}/mensualidades`, params);
        if (cancelled) return;
        setCuotas((res?.data || []).map(mapCuota));
        if (res?.pagination) {
          setPagination(res.pagination);
          // Si la página activa quedó fuera de rango (p. ej. el filtro redujo el
          // total), vuelve a la última existente para no mostrar una página vacía.
          if (res.pagination.page > res.pagination.totalPages) {
            setPage(res.pagination.totalPages);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setCuotas([]);
          setError(e?.message || "No se pudieron cargar las cuotas");
        }
      } finally {
        if (!cancelled) setLoadingCuotas(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [contratoId, page, filterStatus, periodoDesde, periodoHasta]);

  // Estadísticas del contrato completo (a partir de las cuotas embebidas que ya
  // devuelve la API del contrato, así no dependen de la página visible).
  const cuotasContrato = useMemo(() => contrato?.mensualidades || [], [contrato]);

  // Cuota del mes en curso en el contrato: la secuencia de pago depende de que este
  // saldada (ver bloqueoDePago). Se toma del contrato completo, no de la página, porque
  // la cuota actual puede estar fuera de la página visible.
  const cuotaActual = useMemo(() => cuotaDelMesActual(cuotasContrato), [cuotasContrato]);

  // Años del selector de periodo: los que aparecen en el contrato (mas el actual y el
  // siguiente), para poder filtrar tambien por meses que aun no tienen cuota.
  const aniosDisponibles = useMemo(
    () => rangoDeAnios(cuotasContrato.map((c) => c.periodoAnio)),
    [cuotasContrato]
  );

  const totalCuotas = cuotasContrato.length;
  const pagadasCuotas = cuotasContrato.filter((m) => m.estado === "Pagado").length;
  const totalPagado = cuotasContrato.reduce((sum, m) => sum + (m.montoPagado || 0), 0);
  const porcentajeProgreso = totalCuotas ? Math.round((pagadasCuotas / totalCuotas) * 100) : 0;

  // Rango visible de la página ("Mostrando X-Y de N").
  const rangoDesde = pagination.total === 0 ? 0 : (pagination.offset || 0) + 1;
  const rangoHasta = (pagination.offset || 0) + cuotas.length;

  // Estados de carga / error / sin datos (antes de renderizar el detalle).
  if (loadingContrato) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-24 text-slate-500 dark:text-slate-400 text-sm font-bold gap-3">
          <span className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          Cargando mensualidades...
        </div>
      </div>
    );
  }

  if (error || !contrato) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141417] text-center space-y-3">
          <p className="font-black text-slate-900 dark:text-slate-100">
            {error || "No hay mensualidades para mostrar"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {error
              ? "Verifica tu sesión e intentalo de nuevo."
              : "No se encontraron contratos de alquiler en tu alcance."}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Volver
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-[#470A68] hover:bg-[#5a0e82] text-white text-xs font-bold transition cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Barra superior con navegación */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#141417] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </button>
          <span>/</span>
          <Link to="/rentas-contratadas" className="hover:underline text-slate-600 dark:text-slate-300">
            Rentas contratadas
          </Link>
          <span>/</span>
          <span className="text-purple-600 dark:text-purple-400 font-extrabold">{contrato.titulo}</span>
        </div>
      </div>

      {/* Encabezado Principal (Figma: Mensualidades del inmueble + subtítulo) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
            Mensualidades del inmueble
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Consulta el historial de pagos, vencimientos y estado actual de esta renta específica.
          </p>
        </div>
      </div>

      {/* Tarjeta de Resumen del Inmueble (Figma: <Imagen> | Departamento A | Renta R-001 | Propietario | Cliente) */}
      <div className="bg-white dark:bg-[#141417] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Lado izquierdo: Imagen + Datos descriptivos */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full md:w-auto">
            {/* Box de Imagen con proporción y estilo adaptado */}
            <div className="relative w-full sm:w-36 h-36 shrink-0 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group shadow-inner">
              <img
                src={contrato.imagen}
                alt={contrato.titulo}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Información del Inmueble */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                  {contrato.titulo}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                  {contrato.estadoContrato}
                </span>
              </div>

              {/* Propietario de ejemplo A */}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 pt-1">
                {contrato.propietarioFoto ? (
                  <img
                    src={contrato.propietarioFoto}
                    alt={contrato.propietario}
                    className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-blue-200 dark:ring-blue-800"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 text-[10px] font-bold">
                    {contrato.propietarioIniciales || "P"}
                  </div>
                )}
                <span>
                  Propietario: <strong className="text-slate-900 dark:text-slate-100 font-bold">{contrato.propietario}</strong>
                </span>
              </div>

              {/* Cliente de ejemplo A */}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {contrato.clienteFoto ? (
                  <img
                    src={contrato.clienteFoto}
                    alt={contrato.cliente}
                    className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-purple-200 dark:ring-purple-800"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 text-[10px] font-bold">
                    {contrato.clienteIniciales || "C"}
                  </div>
                )}
                <span>
                  Cliente / Inquilino: <strong className="text-slate-900 dark:text-slate-100 font-bold">{contrato.cliente}</strong>
                </span>
              </div>

              {/* Ubicación */}
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1.5 pt-0.5">
                <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {contrato.ubicacion}
              </p>
            </div>
          </div>

          {/* Lado derecho: Métricas clave adaptadas al sistema de diseño */}
          <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row md:flex-col justify-between md:items-end gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
            <div className="text-left md:text-right">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider">
                Monto Mensual
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                ${contrato.precioMensual.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                <span className="text-xs font-bold text-slate-400 ml-1">{contrato.moneda}</span>
              </span>
            </div>

            {/* Barra de progreso de pago */}
            <div className="space-y-1.5 w-full sm:w-56">
              <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                <span>Cuotas pagadas</span>
                <span className="text-[#470A68] dark:text-purple-400">
                  {pagadasCuotas} de {totalCuotas} ({porcentajeProgreso}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${porcentajeProgreso}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 flex justify-between font-medium">
                <span>Total pagado: ${totalPagado.toLocaleString()}</span>
                <span>Vigencia: {contrato.duracionMeses || "-"} meses</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección: Historial de mensualidades */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
            Historial de mensualidades
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {pagination.total} {pagination.total === 1 ? "registro" : "registros"}
          </span>
        </div>

        {/* Pestañas de filtrado rápido */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "all", label: "Todas las cuotas", count: totalCuotas },
            { id: "pagado", label: "Pagadas", count: pagadasCuotas },
            { id: "pendiente", label: "Pendientes", count: totalCuotas - pagadasCuotas },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setFilterStatus(tab.id); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                filterStatus === tab.id
                  ? "bg-[#470A68] text-white shadow-xs"
                  : "bg-white dark:bg-[#141417] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  filterStatus === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filtro por periodo: mes/año desde y hasta (ambos extremos inclusivos).
            Vacío = extremo abierto, así se puede filtrar solo "desde" o solo "hasta". */}
        <div className="flex flex-wrap items-end gap-3 p-3.5 bg-white dark:bg-[#141417] border border-slate-200/90 dark:border-slate-800 rounded-2xl">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[11px] font-black uppercase tracking-wider whitespace-nowrap">
              Periodo
            </span>
          </div>

          {[
            { id: "desde", label: "Desde", mes: selDesdeMes, anio: selDesdeAnio, setMes: setSelDesdeMes, setAnio: setSelDesdeAnio, setPeriodo: setPeriodoDesde },
            { id: "hasta", label: "Hasta", mes: selHastaMes, anio: selHastaAnio, setMes: setSelHastaMes, setAnio: setSelHastaAnio, setPeriodo: setPeriodoHasta },
          ].map(({ id, label, mes, anio, setMes, setAnio, setPeriodo }) => {
            const selectClass =
              "px-2.5 py-2 bg-white dark:bg-[#141417] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer";

            const onMes = (v) => {
              const nm = v === "" ? "" : String(v);
              setMes(nm);
              if (nm && anio) {
                setPeriodo(`${anio}-${nm.padStart(2, "0")}`);
                setPage(1);
              } else {
                setPeriodo("");
                setPage(1);
              }
            };
            const onAnio = (v) => {
              const na = v === "" ? "" : String(v);
              setAnio(na);
              if (mes && na) {
                setPeriodo(`${na}-${String(mes).padStart(2, "0")}`);
                setPage(1);
              } else {
                setPeriodo("");
                setPage(1);
              }
            };

            return (
              <div key={id} className="flex items-end gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    {label}
                  </span>
                  <select
                    value={mes}
                    onChange={(e) => onMes(e.target.value)}
                    className={selectClass}
                    aria-label={`Mes ${label}`}
                  >
                    <option value="">Mes</option>
                    {MES_CORTO.map((mNombre, i) => (
                      <option key={`${id}-mes-${mNombre}`} value={String(i + 1)}>
                        {mNombre}
                      </option>
                    ))}
                  </select>
                </label>
                <select
                  value={anio}
                  onChange={(e) => onAnio(e.target.value)}
                  className={selectClass}
                  aria-label={`Año ${label}`}
                >
                  <option value="">Año</option>
                  {aniosDisponibles.map((a) => (
                    <option key={`${id}-anio-${a}`} value={String(a)}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}

          {(periodoDesde || periodoHasta) && (
            <button
              type="button"
              onClick={() => {
                setPeriodoDesde("");
                setPeriodoHasta("");
                setSelDesdeMes("");
                setSelDesdeAnio("");
                setSelHastaMes("");
                setSelHastaAnio("");
                setPage(1);
              }}
              className="ml-auto px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Limpiar periodo
            </button>
          )}
        </div>

        {/* Tabla de Mensualidades (Figma: Mes | Vencimiento | Importe | Estado) */}
        <div className="bg-white dark:bg-[#141417] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
          {loadingCuotas ? (
            <div className="flex items-center justify-center py-16 text-slate-500 dark:text-slate-400 text-xs font-bold gap-3">
              <span className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              Cargando cuotas...
            </div>
          ) : cuotas.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="font-bold text-slate-700 dark:text-slate-200 text-base">
                No se encontraron mensualidades
              </p>
              <p className="text-xs text-slate-400">
                {periodoDesde || periodoHasta
                  ? "Ninguna cuota coincide con el periodo seleccionado. Prueba a ampliar el rango o cambiar los filtros."
                  : "Este contrato todavía no tiene cuotas registradas."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <th className="py-4 px-6">Mes</th>
                    <th className="py-4 px-6">Vencimiento</th>
                    <th className="py-4 px-6 text-left">Importe</th>
                    <th className="py-4 px-6 text-center">Estado</th>
                    <th className="py-4 px-6 text-right">Comprobante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs sm:text-sm">
                  {cuotas.map((cuota) => (
                    <tr
                      key={cuota.id}
                      className="group transition-colors duration-150"
                    >
                      {/* Columna: Mes */}
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-black shrink-0 group-hover:bg-[#470A68] group-hover:text-white transition-colors">
                            {cuota.numero}
                          </span>
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white block group-hover:text-[#470A68] dark:group-hover:text-purple-300 transition-colors">
                              {cuota.mes}
                            </span>
                            <span className="text-[11px] font-medium text-slate-400">
                              Cuota {cuota.numero} de {totalCuotas}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Columna: Vencimiento */}
                      <td className="py-4 px-6 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{cuota.vencimiento}</span>
                        </div>
                      </td>

                      {/* Columna: Importe. El propietario (corredor) ve ademas la comision
                          que se le retiene y el neto; el inquilino solo el importe. */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-black text-slate-900 dark:text-slate-100">
                          ${cuota.importe.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          <span className="text-[11px] font-semibold text-slate-400 ml-1">
                            {contrato.moneda}
                          </span>
                        </div>
                        {esPropietario && cuota.comision > 0 && (
                          <div className="mt-0.5 text-[11px] font-semibold leading-tight">
                            <span className="text-red-500">
                              −${cuota.comision.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              {cuota.porcentajeComision ? ` (${cuota.porcentajeComision}%)` : ""}
                            </span>
                            <span className="text-slate-400"> comisión</span>
                            <span className="block text-emerald-600 dark:text-emerald-400 font-bold">
                              Neto: ${(cuota.montoPagado - cuota.comision).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Columna: Estado (Pill verde como en Figma) */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                            cuota.estado === "Pagado"
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40"
                              : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cuota.estado === "Pagado" ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          {cuota.estado}
                        </span>
                      </td>

                      {/* Columna: Acción / Comprobante o Pagar */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        {cuota.estado === "Pagado" ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#470A68] hover:bg-[#5a0e82] text-white text-xs font-bold transition-all active:scale-95 shadow-md shadow-purple-950/20 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCuotaComprobante(cuota);
                            }}
                          >
                            Ver comprobante
                          </button>
                        ) : !esPropietario ? (
                          bloqueoDePago(cuota, cuotaActual) === null ? (
                            <Link
                              to={`/mensualidades/${contrato.uuid || contrato.id}/pagar?cuota=${cuota.uuid || cuota.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#470A68] to-purple-700 hover:from-[#5a0e82] hover:to-purple-800 text-white text-xs font-black transition-all active:scale-95 shadow-md shadow-purple-950/20 cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span>Pagar mensualidad</span>
                            </Link>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold cursor-not-allowed"
                              title={
                                bloqueoDePago(cuota, cuotaActual) === "requiere-cuota-actual"
                                  ? `Primero debes pagar la cuota de ${cuotaActual?.mes || "este mes"}.`
                                  : `Solo se pueden pagar las cuotas del mes actual y del siguiente. Disponible en ${cuota.mes}.`
                              }
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>
                                {bloqueoDePago(cuota, cuotaActual) === "requiere-cuota-actual"
                                  ? "Paga primero la cuota actual"
                                  : `Disponible en ${cuota.mes}`}
                              </span>
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            El comprobante todavía no está disponible
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Controles de paginación (server-side) */}
          {!loadingCuotas && pagination.total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30">
              <div className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
                Mostrando {rangoDesde}-{rangoHasta} de {pagination.total} {pagination.total === 1 ? "cuota" : "cuotas"}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#141417] border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Anterior
                </button>

                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  Página {pagination.page} de {pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={!pagination.hasMore}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#141417] border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comprobante de una cuota ya pagada (boton "Ver comprobante" de la tabla) */}
      <ComprobanteTransaccionModal
        variant="mensualidad"
        data={comprobanteMensualidad}
        onClose={() => setCuotaComprobante(null)}
      />

    </div>
  );
}

