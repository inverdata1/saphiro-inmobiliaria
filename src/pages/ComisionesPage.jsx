import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "../api";
import DataTable from "../components/DataTable";
import CorredorPicker from "../components/CorredorPicker";
import ErrorBanner from "../components/ErrorBanner";
import { formatDateTime } from "../utils/date";

function money(n, moneda) {
  const num = Number(n || 0).toLocaleString("en-US");
  const m = (moneda || "USD").toUpperCase();
  if (m === "EUR") return `${num}€`;
  if (m === "BS") return `${num} Bs.`;
  return `$${num}`;
}

export default function ComisionesPage() {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [corredorId, setCorredorId] = useState("");
  const [corredorSel, setCorredorSel] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [savingId, setSavingId] = useState(null);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const r = await apiGet("/comisiones", {
        corredor_id: corredorId || undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
        limit: 100,
      });
      setRows(r.data || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function setPago(id, estatus_pago) {
    setSavingId(id);

    // optimistic update
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, estatus_pago } : r))
    );

    try {
      await apiPatch(`/comisiones/${id}/estatus-pago`, { estatus_pago });
      // opcional: si quieres re-sincronizar por completo:
      // await load();
    } catch (e) {
      alert(e.message);
      await load(); // rollback
    } finally {
      setSavingId(null);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div>
          <div className="text-2xl font-extrabold dark:text-slate-100">Comisiones</div>
        </div>

        <div className="flex gap-2 items-end flex-wrap">

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
            className="btn-primary disabled:opacity-60"
          >
            {loading ? "Cargando…" : "Buscar"}
          </button>
        </div>
      </div>

      <ErrorBanner message={err} onClose={() => setErr("")} />

      <div className="mt-5 bg-white border rounded-2xl p-4 shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <DataTable
          columns={[
            { key: "id", header: "ID" },
            { key: "usuario_id", header: "ID Corredor" },
            { key: "corredor_nombre", header: "Corredor" },
            { key: "inmueble_titulo", header: "Inmueble" },
            { key: "inmueble_id", header: "ID Inmueble" },
            {
              key: "fecha_pago",
              header: "Fecha y Hora",
              render: (r) => formatDateTime(r.fecha_pago),
            },

            { key: "porcentaje_aplicado", header: "% Comisión", render: (r) => `${r.porcentaje_aplicado ?? "—"}%` },
            {
              key: "monto_comision",
              header: "Comisión",
              render: (r) => money(r.monto_comision, r.moneda),
            },
            {
              key: "empresa_ganancia",
              header: "Ganancia",
              render: (r) => money(r.empresa_ganancia, r.moneda),
            },
            


          ]}
          rows={rows}
        />
      </div>
    </div>
  );
}