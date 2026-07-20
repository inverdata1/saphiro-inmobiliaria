import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api";
import DataTable from "../components/DataTable";
import InmuebleZonaPicker from "../components/InmuebleZonaPicker";
import UsuarioPicker from "../components/UsuarioPicker";
import CorredorPicker from "../components/CorredorPicker";
import { formatDateTime } from "../utils/date";
import ErrorBanner from "../components/ErrorBanner";

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

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const r = await apiGet("/transacciones", {
        desde: desde || undefined,
        hasta: hasta || undefined,
        tipo_operacion: tipoOperacionFiltro || undefined,
        corredor_id: corredorId || undefined,
        limit: 100,
      });

      const data = r?.data ?? r; // soporta {data: []} o []
      setRows(Array.isArray(data) ? data : []);
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
      if (String(inmueble.estatus || "").toLowerCase() !== "disponible") {
        throw new Error(
          `El inmueble está en estatus "${inmueble.estatus}". Debe estar "disponible" para transaccionar.`
        );
      }

      await apiPost("/transacciones", {
        inmueble_id: inmueble_id_num,
        cliente_id: cliente_id_num,
        estatus_pago: estatusPago,
      });

      // reset + recarga
      setInmuebleId(null);
      setInmuebleSel(null);
      setClienteId("");
      setClienteSel(null);
      setEstatusPago("pagado");

      await load();
    } catch (e) {
      setErr(e.message || "Error creando transacción");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canCreate = Boolean(inmuebleId && clienteId) && !saving;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div>
          <div className="text-2xl font-extrabold dark:text-slate-100">Transacciones</div>
        </div>

        <button
          onClick={load}
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
                Corredor: <b>{inmuebleSel.corredor_id ?? "—"}</b> · Estatus:{" "}
                <b>{inmuebleSel.estatus ?? "—"}</b>
              </div>
            ) : null}
          </div>

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
            onClick={load}
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
            { key: "corredor_id", header: "ID Corredor", render: (r) => r.corredor_id || "—" },
            { key: "corredor_nombre", header: "Corredor", render: (r) => r.corredor_nombre || "—" },
            { key: "cliente_nombre", header: "Cliente" },
            { key: "cliente_id", header: "ID Cliente", render: (r) => r.cliente_id || "—" },
            { key: "monto_comision", header: "Comisión", render: (r) => money(r.monto_comision, r.moneda) },
            { key: "empresa_ganancia", header: "Empresa", render: (r) => money(r.empresa_ganancia, r.moneda) },
            { key: "estatus_pago", header: "Pago" },
          ]}
          rows={rows}
        />
      </div>
    </div>
  );
}