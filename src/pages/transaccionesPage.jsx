import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { apiGet, apiPost } from "../api";
import DataTable from "../components/DataTable";
import InmuebleZonaPicker from "../components/InmuebleZonaPicker";
import UsuarioPicker from "../components/UsuarioPicker";
import CorredorPicker from "../components/CorredorPicker";
import { formatDateTime } from "../utils/date";
import ErrorBanner from "../components/ErrorBanner";

const DatePickerCalendarModal = lazy(() => import("../components/DatePickerCalendarModal"));

function money(n, moneda) {
  const num = Number(n || 0).toLocaleString("en-US");
  const m = (moneda || "USD").toUpperCase();
  if (m === "EUR") return `${num}€`;
  if (m === "BS") return `${num} Bs.`;
  return `$${num}`;
}

export default function TransaccionesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false); // para listar
  const [saving, setSaving] = useState(false);   // para crear
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // filtros
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [tipoOperacionFiltro, setTipoOperacionFiltro] = useState("");
  const [corredorId, setCorredorId] = useState("");
  const [corredorSel, setCorredorSel] = useState(null);

  // buscar inmueble
  const [busquedaModo, setBusquedaModo] = useState("zona");

  // crear
  const [inmuebleId, setInmuebleId] = useState(null);
  const [inmuebleSel, setInmuebleSel] = useState(null);
  const [clienteId, setClienteId] = useState("");
  const [clienteSel, setClienteSel] = useState(null);
  const [estatusPago, setEstatusPago] = useState("pagado");
  const [fechaEntrada, setFechaEntrada] = useState("");
  const [fechaSalida, setFechaSalida] = useState("");

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState(null);
  const [reservas, setReservas] = useState([]);

  // Clave de idempotencia: se crea al abrir la página y se regenera tras cada intento
  const idemKeyRef = useRef(uuid());

  const esVacacional = String(inmuebleSel?.estado_inmueble || "").toLowerCase() === "vacacional";

  const toYMD = (d) => {
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  };
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };
  const hoy = toYMD(new Date());
  const maxFecha = toYMD(new Date(new Date().getFullYear() + 2, new Date().getMonth(), new Date().getDate()));
  const checkInMin = hoy;
  const checkOutMin = fechaEntrada
    ? toYMD(new Date(new Date(fechaEntrada).getTime() + 86400000))
    : toYMD(new Date(new Date(hoy).getTime() + 86400000));

  useEffect(() => {
    if (!esVacacional || !inmuebleId) {
      setReservas([]);
      return;
    }
    (async () => {
      try {
        const r = await apiGet(`/inmuebles/${inmuebleId}/reservas`);
        setReservas(Array.isArray(r?.data) ? r.data : []);
      } catch {
        setReservas([]);
      }
    })();
  }, [esVacacional, inmuebleId]);

  const openCalendar = (target) => {
    setCalendarTarget(target);
    setCalendarOpen(true);
  };

  const handleCalendarSelect = (dateStr) => {
    if (calendarTarget === "checkIn") {
      setFechaEntrada(dateStr);
      if (fechaSalida && dateStr && fechaSalida <= dateStr) {
        setFechaSalida(toYMD(new Date(new Date(dateStr).getTime() + 86400000)));
      }
    } else {
      setFechaSalida(dateStr);
    }
  };

  async function load(p) {
    setLoading(true);
    setErr("");
    try {
      const offset = ((p || page) - 1) * limit;
      const r = await apiGet("/transacciones", {
        desde: desde || undefined,
        hasta: hasta || undefined,
        tipo_operacion: tipoOperacionFiltro || undefined,
        corredor_id: corredorId || undefined,
        limit,
        offset,
      });

      setRows(Array.isArray(r?.data) ? r.data : []);
      if (r?.pagination) setTotal(r.pagination.total ?? 0);
    } catch (e) {
      setErr(e.message || "Error cargando transacciones");
    } finally {
      setLoading(false);
    }
  }

  async function crear() {
    setSaving(true);
    setErr("");

    try {
      const inmueble_id_num = Number(inmuebleId);
      const cliente_id_num = Number(clienteId);

      if (!inmueble_id_num || Number.isNaN(inmueble_id_num)) {
        throw new Error("Selecciona un inmueble válido.");
      }
      if (!cliente_id_num || Number.isNaN(cliente_id_num)) {
        throw new Error("Indica un cliente_id válido (usuario).");
      }

      // Usa el inmueble seleccionado si ya lo tenemos; si no, lo buscamos
      let inmueble = inmuebleSel;
      if (!inmueble || inmueble.id !== inmueble_id_num) {
        const inmResp = await apiGet(`/inmuebles/${inmueble_id_num}`);
        inmueble = inmResp?.data ?? inmResp;
      }

      if (!inmueble) {
        throw new Error(`El inmueble ${inmueble_id_num} no existe.`);
      }

      // Regla esencial para tu modelo de comisiones
      if (!inmueble.corredor_id) {
        throw new Error(
          `No se puede crear la transacción: el inmueble ${inmueble_id_num} no tiene corredor asignado. Ve a Inmuebles y asígnale un corredor_id.`
        );
      }

      // El trigger igual validará disponibilidad; esto es solo un check UX
      if (!["disponible", "reservado"].includes(String(inmueble.estatus || "").toLowerCase())) {
        throw new Error(
          `El inmueble está en estatus "${inmueble.estatus}". Debe estar "disponible" para transaccionar.`
        );
      }

      const esVacInm = String(inmueble.estado_inmueble || "").toLowerCase() === "vacacional";

      let fechaEntradaOk = fechaEntrada;
      let fechaSalidaOk = fechaSalida;

      if (esVacInm) {
        if (!fechaEntrada) {
          throw new Error("Selecciona la fecha de entrada de la reserva.");
        }
        if (!fechaSalida) {
          throw new Error("Selecciona la fecha de salida de la reserva.");
        }
        if (fechaEntrada < hoy) {
          throw new Error("La fecha de entrada no puede ser anterior a hoy.");
        }
        if (fechaEntrada > maxFecha) {
          throw new Error("La fecha de entrada supera el máximo de 2 años.");
        }
        if (fechaSalida <= fechaEntrada) {
          throw new Error("La fecha de salida debe ser posterior a la fecha de entrada.");
        }
      }

      const inmueble_id_num2 = Number(inmueble_id_num);

      if (esVacInm) {
        await apiPost(
          "/transacciones/reserva",
          {
            inmueble_id: inmueble_id_num2,
            cliente_id: cliente_id_num,
            fecha_entrada: fechaEntradaOk,
            fecha_salida: fechaSalidaOk,
            moneda: inmueble.moneda || "USD",
            estatus_pago: estatusPago,
          },
          idemKeyRef.current
        );
      } else {
        await apiPost("/transacciones", {
          inmueble_id: inmueble_id_num2,
          cliente_id: cliente_id_num,
          estatus_pago: estatusPago,
        });
      }

      // reset + recarga
      setInmuebleId(null);
      setInmuebleSel(null);
      setClienteId("");
      setClienteSel(null);
      setEstatusPago("pagado");
      setFechaEntrada("");
      setFechaSalida("");

      await load();
    } catch (e) {
      setErr(e.message || "Error creando transacción");
    } finally {
      setSaving(false);
      idemKeyRef.current = uuid();
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canCreate =
    Boolean(inmuebleId && clienteId) && !saving && (!esVacacional || (fechaEntrada && fechaSalida));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div>
          <div className="text-2xl font-extrabold dark:text-slate-100">Transacciones</div>
        </div>

        <button
          onClick={() => load()}
          disabled={loading}
          className="btn-primary disabled:opacity-60"
        >
          {loading ? "..." : "Actualizar"}
        </button>
      </div>

      <ErrorBanner message={err} onClose={() => setErr("")} />

      {/* Crear */}
      <div className="mt-5 bg-white border rounded-2xl p-4 shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold dark:text-slate-100">Crear transacción</div>
          <select
            className="border rounded-xl px-3 py-1.5 text-sm bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600"
            value={busquedaModo}
            onChange={(e) => {
              setBusquedaModo(e.target.value);
              setInmuebleId(null);
              setInmuebleSel(null);
            }}
          >
            <option value="zona">Por zona</option>
            <option value="nombre">Por nombre</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div className="md:col-span-6">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              {busquedaModo === "zona" ? "Inmueble (por zona)" : "Inmueble (por nombre)"}
            </div>
            <InmuebleZonaPicker
              showZona={busquedaModo === "zona"}
              value={inmuebleId}
              selectedItem={inmuebleSel}
              onChange={(id, item) => {
                setInmuebleId(id);
                setInmuebleSel(item || null);
              }}
            />
            {inmuebleSel ? (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Corredor: <b>{inmuebleSel.corredor_id ?? "-"}</b> · Estatus:{" "}
                <b>{inmuebleSel.estatus ?? "-"}</b>
                {esVacacional ? " · Vacacional (reserva con fechas)" : null}
              </div>
            ) : null}
          </div>

          {esVacacional && (
            <>
              <div className="md:col-span-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Fecha de entrada de la reserva</div>
                <button
                  type="button"
                  onClick={() => openCalendar("checkIn")}
                  className="w-full text-left border rounded-xl px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 text-sm truncate cursor-pointer hover:border-slate-400 dark:hover:border-slate-500"
                >
                  {fechaEntrada ? formatDisplayDate(fechaEntrada) : "Seleccionar fecha"}
                </button>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Fecha de salida de la reserva</div>
                <button
                  type="button"
                  onClick={() => openCalendar("checkOut")}
                  className="w-full text-left border rounded-xl px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 text-sm truncate cursor-pointer hover:border-slate-400 dark:hover:border-slate-500"
                >
                  {fechaSalida ? formatDisplayDate(fechaSalida) : "Seleccionar fecha"}
                </button>
              </div>
            </>
          )}

          <div className="md:col-span-5">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Cliente (usuario)</div>
            <UsuarioPicker
              value={clienteId}
              selectedItem={clienteSel}
              onChange={(id, item) => {
                setClienteId(id);
                setClienteSel(item || null);
              }}
            />
          </div>

          <div className="md:col-span-1 flex items-end">
            <button
              onClick={crear}
              disabled={!canCreate}
              className="btn-primary disabled:opacity-60 w-full"
            >
              {saving ? "Creando..." : "Crear"}
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="mt-5 bg-white border rounded-2xl p-4 shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <div className="font-bold mb-3 dark:text-slate-100">Filtros</div>

        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Desde</div>
            <input
              className="border rounded-xl px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Hasta</div>
            <input
              className="border rounded-xl px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
            />
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tipo</div>
            <select
              className="border rounded-xl px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600"
              value={tipoOperacionFiltro}
              onChange={(e) => setTipoOperacionFiltro(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="venta">Venta</option>
              <option value="compra">Compra</option>
              <option value="alquiler">Alquiler</option>
            </select>
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Corredor</div>
            <CorredorPicker
              value={corredorId}
              selectedItem={corredorSel}
              onChange={(id, item) => {
                setCorredorId(id);
                setCorredorSel(item || null);
              }}
            />
          </div>

          <button
            onClick={() => { setPage(1); load(1); }}
            disabled={loading}
            className="btn-secondary disabled:opacity-60"
          >
            Aplicar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="mt-5 bg-white border rounded-2xl p-4 shadow-sm dark:bg-slate-800 dark:border-slate-700">

        <DataTable
          columns={[
            { key: "id", header: "ID" },
            {
              key: "fecha_transaccion",
              header: "Fecha",
              render: (r) => formatDateTime(r.fecha_transaccion),
            },
            { key: "tipo_operacion", header: "Tipo" },
            { key: "monto_total", header: "Monto", render: (r) => money(r.monto_total, r.moneda) },
            { key: "inmueble_titulo", header: "Inmueble" },
            { key: "corredor_id", header: "ID Corredor", render: (r) => r.corredor_id || "-" },
            { key: "corredor_nombre", header: "Corredor", render: (r) => r.corredor_nombre || "-" },
            { key: "cliente_nombre", header: "Cliente" },
            { key: "cliente_id", header: "ID Cliente", render: (r) => r.cliente_id || "-" },
            { key: "monto_comision", header: "Comisión", render: (r) => money(r.monto_comision, r.moneda) },
            { key: "empresa_ganancia", header: "Empresa", render: (r) => money(r.empresa_ganancia, r.moneda) },
            { key: "estatus_pago", header: "Pago" },
          ]}
          rows={rows}
        />

        <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>Página {page} de {Math.max(1, Math.ceil(total / limit))}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => { const p = page - 1; setPage(p); load(p); }}
              className="rounded-lg border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
            >
              ← Anterior
            </button>
            <button
              disabled={page >= Math.ceil(total / limit) || loading}
              onClick={() => { const p = page + 1; setPage(p); load(p); }}
              className="rounded-lg border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <DatePickerCalendarModal
          open={calendarOpen}
          onClose={() => {
            setCalendarOpen(false);
            setCalendarTarget(null);
          }}
          onSelect={handleCalendarSelect}
          selectedDate={calendarTarget === "checkIn" ? fechaEntrada : fechaSalida}
          minDate={calendarTarget === "checkIn" ? checkInMin : checkOutMin}
          maxDate={maxFecha}
          reservas={reservas}
          title={calendarTarget === "checkIn" ? "Fecha de entrada" : "Fecha de salida"}
          subtitle={calendarTarget === "checkIn" ? "Selecciona cuándo llega el cliente" : "Selecciona cuándo se va el cliente"}
        />
      </Suspense>
    </div>
  );
}